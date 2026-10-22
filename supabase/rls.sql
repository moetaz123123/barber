-- =============================================================================
-- Row Level Security — Barber Booking
-- Le backend Express utilise la clé service_role (bypass RLS).
-- RLS protège l'accès direct depuis le client Supabase (anon / authenticated).
-- =============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Helper : est-ce un admin ?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON profiles;
CREATE POLICY "profiles_select_own_or_admin" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- services : lecture publique des actifs ; écriture admin uniquement
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "services_public_read_active" ON services;
CREATE POLICY "services_public_read_active" ON services
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "services_admin_write" ON services;
CREATE POLICY "services_admin_write" ON services
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- appointments : pas d'accès public direct (suivi via API + token)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "appointments_admin_all" ON appointments;
CREATE POLICY "appointments_admin_all" ON appointments
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- business_hours / settings / blocked_slots
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "hours_public_read" ON business_hours;
CREATE POLICY "hours_public_read" ON business_hours
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "hours_admin_write" ON business_hours;
CREATE POLICY "hours_admin_write" ON business_hours
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "settings_public_read" ON booking_settings;
CREATE POLICY "settings_public_read" ON booking_settings
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "settings_admin_write" ON booking_settings;
CREATE POLICY "settings_admin_write" ON booking_settings
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "blocked_public_read" ON blocked_slots;
CREATE POLICY "blocked_public_read" ON blocked_slots
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "blocked_admin_write" ON blocked_slots;
CREATE POLICY "blocked_admin_write" ON blocked_slots
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage : images publiques des services, téléversement admin uniquement
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "service_images_admin_insert" ON storage.objects;
CREATE POLICY "service_images_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'service-images' AND public.is_admin());

DROP POLICY IF EXISTS "service_images_admin_update" ON storage.objects;
CREATE POLICY "service_images_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'service-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'service-images' AND public.is_admin());

DROP POLICY IF EXISTS "service_images_admin_delete" ON storage.objects;
CREATE POLICY "service_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'service-images' AND public.is_admin());
