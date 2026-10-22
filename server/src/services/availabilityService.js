import { supabaseAdmin } from '../lib/supabase.js';
import { config } from '../config.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  parseTimeToMinutes,
  minutesToTime,
  localDateMinutesToUtc,
  getTimezoneOffsetMinutes,
  rangesOverlap,
} from '../utils/time.js';

const ACTIVE_STATUSES = ['pending', 'confirmed'];

export async function getBookingSettings() {
  const { data, error } = await supabaseAdmin
    .from('booking_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw new AppError('Impossible de charger les paramètres', 500);
  if (!data) {
    return {
      slot_duration_minutes: 30,
      min_notice_hours: 2,
      max_advance_days: 30,
      timezone: config.businessTimezone,
    };
  }
  return data;
}

export async function getBusinessHoursForDay(dayOfWeek) {
  const { data, error } = await supabaseAdmin
    .from('business_hours')
    .select('*')
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (error) throw new AppError('Impossible de charger les horaires', 500);
  return data;
}

async function getBlockedOverlapping(dayStart, dayEnd) {
  const { data, error } = await supabaseAdmin
    .from('blocked_slots')
    .select('id, title, start_at, end_at')
    .lt('start_at', dayEnd.toISOString())
    .gt('end_at', dayStart.toISOString());

  if (error) throw new AppError('Impossible de charger les créneaux bloqués', 500);
  return data || [];
}

async function getAppointmentsOverlapping(dayStart, dayEnd) {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('id, starts_at, ends_at, status')
    .in('status', ACTIVE_STATUSES)
    .lt('starts_at', dayEnd.toISOString())
    .gt('ends_at', dayStart.toISOString());

  if (error) throw new AppError('Impossible de charger les rendez-vous', 500);
  return data || [];
}

/**
 * Calcule les créneaux disponibles pour une date (YYYY-MM-DD) et une durée de service.
 */
export async function getAvailableSlots(dateStr, durationMinutes) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new AppError('Format de date invalide (attendu YYYY-MM-DD)', 400);
  }

  const settings = await getBookingSettings();
  const tz = settings.timezone || config.businessTimezone;
  const slotStep = settings.slot_duration_minutes || 30;

  // Jour de la semaine dans le fuseau métier
  const noonUtc = new Date(`${dateStr}T12:00:00Z`);
  const weekdayFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' });
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = weekdayMap[weekdayFmt.format(noonUtc)];

  const hours = await getBusinessHoursForDay(dayOfWeek);
  if (!hours || hours.is_closed) {
    return { date: dateStr, slots: [], reason: 'closed' };
  }

  const openM = parseTimeToMinutes(hours.open_time);
  const closeM = parseTimeToMinutes(hours.close_time);

  const offset = getTimezoneOffsetMinutes(tz, noonUtc);
  const dayStart = localDateMinutesToUtc(dateStr, 0, offset);
  const dayEnd = localDateMinutesToUtc(dateStr, 24 * 60, offset);

  const [blocked, appointments] = await Promise.all([
    getBlockedOverlapping(dayStart, dayEnd),
    getAppointmentsOverlapping(dayStart, dayEnd),
  ]);

  const now = new Date();
  const minStart = new Date(now.getTime() + settings.min_notice_hours * 3600_000);
  const maxDate = new Date(now.getTime() + settings.max_advance_days * 86400_000);
  const requestedDay = localDateMinutesToUtc(dateStr, 12 * 60, offset);

  if (requestedDay > maxDate) {
    return { date: dateStr, slots: [], reason: 'too_far' };
  }

  const slots = [];

  for (let startM = openM; startM + durationMinutes <= closeM; startM += slotStep) {
    const endM = startM + durationMinutes;

    const slotStart = localDateMinutesToUtc(dateStr, startM, offset);
    const slotEnd = localDateMinutesToUtc(dateStr, endM, offset);

    if (slotStart < minStart) continue;

    const blockedHit = blocked.some((b) =>
      rangesOverlap(slotStart, slotEnd, new Date(b.start_at), new Date(b.end_at))
    );
    if (blockedHit) continue;

    const bookedHit = appointments.some((a) =>
      rangesOverlap(slotStart, slotEnd, new Date(a.starts_at), new Date(a.ends_at))
    );
    if (bookedHit) continue;

    slots.push({
      start: slotStart.toISOString(),
      end: slotEnd.toISOString(),
      label: minutesToTime(startM),
    });
  }

  return { date: dateStr, slots, reason: slots.length ? null : 'no_slots' };
}

/**
 * Vérifie qu'un créneau précis est encore libre (avant insert).
 */
export async function assertSlotAvailable(startsAt, endsAt, excludeAppointmentId = null) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (!(start < end)) {
    throw new AppError('Créneau invalide', 400);
  }

  const settings = await getBookingSettings();
  const now = new Date();
  const minStart = new Date(now.getTime() + settings.min_notice_hours * 3600_000);
  if (start < minStart) {
    throw new AppError('Ce créneau est trop proche. Choisissez un horaire plus tard.', 409, 'TOO_SOON');
  }

  const { data: blocked } = await supabaseAdmin
    .from('blocked_slots')
    .select('id')
    .lt('start_at', end.toISOString())
    .gt('end_at', start.toISOString())
    .limit(1);

  if (blocked?.length) {
    throw new AppError('Ce créneau est bloqué (fermeture ou congé).', 409, 'BLOCKED');
  }

  let query = supabaseAdmin
    .from('appointments')
    .select('id')
    .in('status', ACTIVE_STATUSES)
    .lt('starts_at', end.toISOString())
    .gt('ends_at', start.toISOString())
    .limit(1);

  if (excludeAppointmentId) {
    query = query.neq('id', excludeAppointmentId);
  }

  const { data: conflicts } = await query;
  if (conflicts?.length) {
    throw new AppError('Ce créneau vient d\'être réservé. Choisissez un autre horaire.', 409, 'SLOT_TAKEN');
  }

  return true;
}
