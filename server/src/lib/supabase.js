import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';

/** Client privilégié — utilisé uniquement côté serveur (bypass RLS). */
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
