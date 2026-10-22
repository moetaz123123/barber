import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listActiveServices() {
  const { data, error } = await supabaseAdmin
    .from('services')
    .select(
      'id, name, description, price_cents, duration_minutes, category, image_url, sort_order'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw new AppError('Impossible de charger les services', 500);
  return data || [];
}

export async function listAllServices() {
  const { data, error } = await supabaseAdmin
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new AppError('Impossible de charger les services', 500);
  return data || [];
}

export async function createService(payload) {
  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({
      name: payload.name,
      description: payload.description || '',
      price_cents: payload.price_cents,
      duration_minutes: payload.duration_minutes,
      category: payload.category || 'general',
      image_url: payload.image_url || null,
      is_active: payload.is_active ?? true,
      sort_order: payload.sort_order ?? 0,
    })
    .select('*')
    .single();

  if (error) throw new AppError('Impossible de créer le service', 500);
  return data;
}

export async function updateService(id, payload) {
  const updates = {};
  const fields = [
    'name',
    'description',
    'price_cents',
    'duration_minutes',
    'category',
    'image_url',
    'is_active',
    'sort_order',
  ];
  for (const f of fields) {
    if (payload[f] !== undefined) updates[f] = payload[f];
  }

  const { data, error } = await supabaseAdmin
    .from('services')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new AppError('Impossible de modifier le service', 500);
  return data;
}

/**
 * Soft-delete préféré : désactivation.
 * Hard-delete autorisé seulement si aucun RDV ne référence le service
 * (sinon on désactive pour préserver l'historique via ON DELETE SET NULL + snapshots).
 */
export async function deleteService(id) {
  const { count } = await supabaseAdmin
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('service_id', id);

  if (count && count > 0) {
    const { data, error } = await supabaseAdmin
      .from('services')
      .update({ is_active: false })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw new AppError('Impossible de désactiver le service', 500);
    return { service: data, deactivated: true };
  }

  const { error } = await supabaseAdmin.from('services').delete().eq('id', id);
  if (error) throw new AppError('Impossible de supprimer le service', 500);
  return { deleted: true };
}
