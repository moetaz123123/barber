-- =============================================================================
-- Données de démonstration — Barber Booking
-- Prix clairement marqués comme démo (à modifier depuis l'admin).
-- =============================================================================

-- Paramètres de réservation
INSERT INTO booking_settings (id, slot_duration_minutes, min_notice_hours, max_advance_days, timezone)
VALUES (1, 30, 2, 30, 'Africa/Tunis')
ON CONFLICT (id) DO UPDATE SET
  slot_duration_minutes = EXCLUDED.slot_duration_minutes,
  min_notice_hours = EXCLUDED.min_notice_hours,
  max_advance_days = EXCLUDED.max_advance_days,
  timezone = EXCLUDED.timezone,
  updated_at = NOW();

-- Horaires : Lun–Sam 09:00–19:00, pause 13:00–14:00 ; Dimanche fermé
INSERT INTO business_hours (day_of_week, is_closed, open_time, close_time, break_start, break_end)
VALUES
  (0, TRUE,  NULL, NULL, NULL, NULL),
  (1, FALSE, '09:00', '19:00', '13:00', '14:00'),
  (2, FALSE, '09:00', '19:00', '13:00', '14:00'),
  (3, FALSE, '09:00', '19:00', '13:00', '14:00'),
  (4, FALSE, '09:00', '19:00', '13:00', '14:00'),
  (5, FALSE, '09:00', '19:00', '13:00', '14:00'),
  (6, FALSE, '09:00', '19:00', '13:00', '14:00')
ON CONFLICT (day_of_week) DO UPDATE SET
  is_closed = EXCLUDED.is_closed,
  open_time = EXCLUDED.open_time,
  close_time = EXCLUDED.close_time,
  break_start = EXCLUDED.break_start,
  break_end = EXCLUDED.break_end;

-- Services (prix démo en millimes / centimes DT — ex. 8000 = 80 DT)
DELETE FROM services WHERE name LIKE '%(démo)%' OR category IN (
  'coupe', 'barbe', 'combo', 'soins', 'lissage', 'autre'
);

INSERT INTO services (name, description, price_cents, duration_minutes, category, image_url, is_active, sort_order)
VALUES
  (
    'Coupe de cheveux (démo)',
    'Coupe classique adaptée à votre morphologie et style.',
    8000, 30, 'coupe',
    '/images/coupe.jpg',
    TRUE, 1
  ),
  (
    'Coupe dégradée / fade (démo)',
    'Dégradé précis, fade bas, moyen ou haut selon votre préférence.',
    10000, 45, 'coupe',
    '/images/fade.jpg',
    TRUE, 2
  ),
  (
    'Taille de barbe (démo)',
    'Taille, contour et finition pour une barbe nette et soignée.',
    5000, 20, 'barbe',
    '/images/barbe.jpg',
    TRUE, 3
  ),
  (
    'Coupe + barbe (démo)',
    'Prestation complète : coupe de cheveux et taille de barbe.',
    13000, 50, 'combo',
    '/images/combo.jpg',
    TRUE, 4
  ),
  (
    'Soins capillaires (démo)',
    'Shampooing, soin hydratant et styling pour cheveux en pleine forme.',
    7000, 30, 'soins',
    '/images/soins.jpg',
    TRUE, 5
  ),
  (
    'Protéine / lissage capillaire (démo)',
    'Traitement protéiné ou lissage pour cheveux plus lisses et disciplinés.',
    25000, 90, 'lissage',
    '/images/lissage.jpg',
    TRUE, 6
  ),
  (
    'Prestation personnalisée (démo)',
    'Service sur mesure — décrivez votre besoin dans les remarques.',
    15000, 60, 'autre',
    '/images/autre.jpg',
    TRUE, 7
  );

-- Exemple de créneau bloqué (optionnel — congé fictif dans 60 jours)
INSERT INTO blocked_slots (title, start_at, end_at, all_day)
SELECT
  'Congé exceptionnel (démo)',
  (CURRENT_DATE + INTERVAL '60 days')::timestamptz,
  (CURRENT_DATE + INTERVAL '61 days')::timestamptz,
  TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM blocked_slots WHERE title = 'Congé exceptionnel (démo)'
);

-- -----------------------------------------------------------------------------
-- Compte admin : à créer manuellement via Authentication > Users dans Supabase,
-- puis exécuter (remplacer l'UUID) :
--
-- UPDATE profiles SET role = 'admin', full_name = 'Propriétaire'
-- WHERE id = '<uuid-de-votre-utilisateur>';
--
-- Ou lors de la création via Admin API avec raw_user_meta_data: { "role": "admin" }
-- (le trigger handle_new_user lit ce champ — à réserver aux comptes staff).
-- -----------------------------------------------------------------------------
