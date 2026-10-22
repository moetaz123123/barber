import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { getBookingSettings } from './availabilityService.js';

export async function listBusinessHours() {
  const { data, error } = await supabaseAdmin
    .from('business_hours')
    .select('*')
    .order('day_of_week', { ascending: true });

  if (error) throw new AppError('Impossible de charger les horaires', 500);
  return data || [];
}

export async function upsertBusinessHours(rows) {
  const { data, error } = await supabaseAdmin
    .from('business_hours')
    .upsert(rows, { onConflict: 'day_of_week' })
    .select('*');

  if (error) {
    console.error(error);
    throw new AppError('Impossible d\'enregistrer les horaires', 500);
  }
  return data;
}

export async function getSettings() {
  return getBookingSettings();
}

export async function updateSettings(payload) {
  const updates = {};
  const fields = [
    'slot_duration_minutes',
    'min_notice_hours',
    'max_advance_days',
    'timezone',
  ];
  for (const f of fields) {
    if (payload[f] !== undefined) updates[f] = payload[f];
  }
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('booking_settings')
    .upsert({ id: 1, ...updates })
    .select('*')
    .single();

  if (error) throw new AppError('Impossible de mettre à jour les paramètres', 500);
  return data;
}

export async function listBlockedSlots() {
  const { data, error } = await supabaseAdmin
    .from('blocked_slots')
    .select('*')
    .order('start_at', { ascending: true });

  if (error) throw new AppError('Impossible de charger les créneaux bloqués', 500);
  return data || [];
}

export async function createBlockedSlot(payload) {
  const { data, error } = await supabaseAdmin
    .from('blocked_slots')
    .insert({
      title: payload.title || '',
      start_at: payload.start_at,
      end_at: payload.end_at,
      all_day: payload.all_day ?? false,
    })
    .select('*')
    .single();

  if (error) throw new AppError('Impossible de créer le blocage', 500);
  return data;
}

export async function deleteBlockedSlot(id) {
  const { error } = await supabaseAdmin.from('blocked_slots').delete().eq('id', id);
  if (error) throw new AppError('Impossible de supprimer le blocage', 500);
  return { deleted: true };
}
