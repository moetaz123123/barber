ALTER TABLE public.business_hours
  DROP CONSTRAINT IF EXISTS business_hours_check;

ALTER TABLE public.business_hours
  DROP COLUMN IF EXISTS break_start,
  DROP COLUMN IF EXISTS break_end;
