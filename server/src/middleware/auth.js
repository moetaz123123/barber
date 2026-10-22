import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from './errorHandler.js';

/**
 * Vérifie le JWT Supabase et charge le profil (rôle serveur uniquement).
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentification requise', 401, 'UNAUTHORIZED');
    }

    const token = header.slice(7);
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !userData?.user) {
      throw new AppError('Jeton invalide ou expiré', 401, 'UNAUTHORIZED');
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (profileError) {
      throw new AppError('Impossible de charger le profil', 500, 'PROFILE_ERROR');
    }

    req.user = userData.user;
    req.profile = profile || { id: userData.user.id, role: 'staff', full_name: null };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req, _res, next) {
  if (!req.profile || req.profile.role !== 'admin') {
    return next(new AppError('Accès réservé aux administrateurs', 403, 'FORBIDDEN'));
  }
  next();
}
