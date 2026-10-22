import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { assertSlotAvailable, getAvailableSlots } from './availabilityService.js';
import { getTimezoneOffsetMinutes, localDateMinutesToUtc } from '../utils/time.js';

const PUBLIC_SAFE_FIELDS =
  'id, tracking_token, service_name, service_price_cents, service_duration_minutes, starts_at, ends_at, status, customer_name, customer_phone, customer_email, notes, created_at';
const BUSINESS_TIME_ZONE = 'Africa/Tunis';

function getBusinessDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map(({ type, value }) => [type, value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function getBusinessDayBounds(date) {
  const [year, month, day] = date.split('-').map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  const toUtc = (localDate) => {
    const offset = getTimezoneOffsetMinutes(
      BUSINESS_TIME_ZONE,
      new Date(`${localDate}T12:00:00.000Z`)
    );
    return localDateMinutesToUtc(localDate, 0, offset).toISOString();
  };
  return { start: toUtc(date), end: toUtc(nextDate) };
}

export async function createAppointment({
  serviceId,
  startsAt,
  customerName,
  customerPhone,
  customerEmail,
  notes,
}) {
  const { data: service, error: serviceError } = await supabaseAdmin
    .from('services')
    .select('id, name, price_cents, duration_minutes, is_active')
    .eq('id', serviceId)
    .maybeSingle();

  if (serviceError) throw new AppError('Erreur lors du chargement du service', 500);
  if (!service || !service.is_active) {
    throw new AppError('Service introuvable ou inactif', 404, 'SERVICE_NOT_FOUND');
  }

  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    throw new AppError('Date/heure de début invalide', 400);
  }

  const end = new Date(start.getTime() + service.duration_minutes * 60_000);

  // Vérifier que le créneau figure bien parmi les disponibilités du jour
  const dateStr = startsAt.slice(0, 10);
  const availability = await getAvailableSlots(dateStr, service.duration_minutes);
  const match = availability.slots.find((s) => s.start === start.toISOString());
  if (!match) {
    throw new AppError(
      'Ce créneau n\'est pas disponible. Actualisez la page et choisissez un autre horaire.',
      409,
      'SLOT_UNAVAILABLE'
    );
  }

  await assertSlotAvailable(start, end);

  const payload = {
    service_id: service.id,
    service_name: service.name,
    service_price_cents: service.price_cents,
    service_duration_minutes: service.duration_minutes,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    status: 'pending',
    customer_name: customerName.trim(),
    customer_phone: customerPhone.trim(),
    customer_email: customerEmail?.trim() || null,
    notes: notes?.trim() || null,
  };

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .insert(payload)
    .select(PUBLIC_SAFE_FIELDS)
    .single();

  if (error) {
    // Contrainte d'exclusion (double réservation concurrente)
    if (error.code === '23P01' || error.message?.includes('appointments_no_overlap')) {
      throw new AppError(
        'Ce créneau vient d\'être réservé. Choisissez un autre horaire.',
        409,
        'SLOT_TAKEN'
      );
    }
    console.error('createAppointment', error);
    throw new AppError('Impossible de créer le rendez-vous', 500);
  }

  return data;
}

/**
 * Consultation sécurisée : id + tracking_token obligatoires.
 */
export async function getAppointmentSecure(id, token) {
  if (!id || !token) {
    throw new AppError('Identifiant et jeton requis', 400);
  }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(PUBLIC_SAFE_FIELDS)
    .eq('id', id)
    .eq('tracking_token', token)
    .maybeSingle();

  if (error) throw new AppError('Erreur lors de la consultation', 500);
  if (!data) throw new AppError('Réservation introuvable', 404, 'NOT_FOUND');

  return data;
}

export async function listAppointmentsByEmail(email) {
  const escapedEmail = email.trim().replace(/[\\%_]/g, '\\$&');
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('service_name, starts_at, status')
    .ilike('customer_email', escapedEmail)
    .order('starts_at', { ascending: false });

  if (error) throw new AppError('Erreur lors de la consultation', 500);
  return data || [];
}

export async function listAppointments({
  status,
  dateFrom,
  dateTo,
  search,
  page = 1,
  limit = 50,
}) {
  let query = supabaseAdmin
    .from('appointments')
    .select('*', { count: 'exact' })
    .order('starts_at', { ascending: true });

  if (status) query = query.eq('status', status);
  if (dateFrom) query = query.gte('starts_at', `${dateFrom}T00:00:00.000Z`);
  if (dateTo) query = query.lte('starts_at', `${dateTo}T23:59:59.999Z`);
  if (search) {
    const term = `%${search}%`;
    query = query.or(`customer_name.ilike.${term},customer_phone.ilike.${term}`);
  }

  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error(error);
    throw new AppError('Impossible de lister les rendez-vous', 500);
  }

  return { items: data || [], total: count ?? 0, page, limit };
}

export async function getAppointmentById(id) {
  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new AppError('Erreur chargement rendez-vous', 500);
  if (!data) throw new AppError('Rendez-vous introuvable', 404);
  return data;
}

const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['cancelled', 'completed'],
  rejected: [],
  cancelled: [],
  completed: [],
};

export async function updateAppointmentStatus(id, status, adminNotes) {
  const current = await getAppointmentById(id);
  const allowed = ALLOWED_TRANSITIONS[current.status] || [];

  if (!allowed.includes(status)) {
    throw new AppError(
      `Transition interdite : ${current.status} → ${status}`,
      400,
      'INVALID_TRANSITION'
    );
  }

  const updates = { status };
  if (adminNotes !== undefined) updates.admin_notes = adminNotes;

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError('Impossible de mettre à jour le statut', 500);
  return data;
}

export async function getDashboardStats(dayDateStr) {
  const day = dayDateStr || getBusinessDate();
  const { start: dayStart, end: dayEnd } = getBusinessDayBounds(day);

  const { data: todayAppts, error: e1 } = await supabaseAdmin
    .from('appointments')
    .select('id, status, service_price_cents')
    .gte('starts_at', dayStart)
    .lt('starts_at', dayEnd);

  if (e1) throw new AppError('Erreur statistiques', 500);

  const { count: pendingCount } = await supabaseAdmin
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: confirmedCount } = await supabaseAdmin
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  const { data: completed } = await supabaseAdmin
    .from('appointments')
    .select('service_price_cents')
    .eq('status', 'completed');

  const estimatedRevenueCents = (completed || []).reduce(
    (sum, a) => sum + (a.service_price_cents || 0),
    0
  );

  const today = todayAppts || [];
  return {
    today_total: today.length,
    today_by_status: {
      pending: today.filter((a) => a.status === 'pending').length,
      confirmed: today.filter((a) => a.status === 'confirmed').length,
      completed: today.filter((a) => a.status === 'completed').length,
      rejected: today.filter((a) => a.status === 'rejected').length,
      cancelled: today.filter((a) => a.status === 'cancelled').length,
    },
    pending_total: pendingCount ?? 0,
    confirmed_total: confirmedCount ?? 0,
    completed_total: (completed || []).length,
    estimated_revenue_cents: estimatedRevenueCents,
    today_revenue_cents: today
      .filter((appointment) => appointment.status === 'completed')
      .reduce((sum, appointment) => sum + (appointment.service_price_cents || 0), 0),
    note: 'Les revenus estimés sont basés sur les prestations marquées terminées, pas sur des paiements encaissés.',
  };
}

export async function listClients({ search, page = 1, limit = 50 }) {
  let query = supabaseAdmin
    .from('appointments')
    .select('customer_name, customer_phone, customer_email, starts_at, status, service_name, id')
    .order('starts_at', { ascending: false });

  if (search) {
    const term = `%${search}%`;
    query = query.or(`customer_name.ilike.${term},customer_phone.ilike.${term}`);
  }

  const { data, error } = await query.limit(500);
  if (error) throw new AppError('Impossible de charger les clients', 500);

  const map = new Map();
  for (const row of data || []) {
    const key = `${row.customer_phone}|${row.customer_name}`.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        customer_name: row.customer_name,
        customer_phone: row.customer_phone,
        customer_email: row.customer_email,
        appointments: [],
      });
    }
    map.get(key).appointments.push({
      id: row.id,
      starts_at: row.starts_at,
      status: row.status,
      service_name: row.service_name,
    });
  }

  const all = Array.from(map.values());
  const from = (page - 1) * limit;
  return {
    items: all.slice(from, from + limit),
    total: all.length,
    page,
    limit,
  };
}
