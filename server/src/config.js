import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

const isTest = process.env.NODE_ENV === 'test';

export const config = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  businessTimezone: process.env.BUSINESS_TIMEZONE || 'Africa/Tunis',
  supabaseUrl: isTest ? (process.env.SUPABASE_URL || 'http://localhost') : required('SUPABASE_URL'),
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: isTest
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key')
    : required('SUPABASE_SERVICE_ROLE_KEY'),
};
