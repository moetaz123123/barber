import { z } from 'zod';

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date au format YYYY-MM-DD'),
  serviceId: z.string().uuid('serviceId invalide'),
});

export const createAppointmentSchema = z.object({
  serviceId: z.string().uuid(),
  startsAt: z.string().datetime({ offset: true }),
  customerName: z.string().min(2, 'Nom trop court').max(120),
  customerPhone: z
    .string()
    .min(8, 'Téléphone invalide')
    .max(30)
    .regex(/^[+\d\s().-]+$/, 'Téléphone invalide'),
  customerEmail: z.string().email(),
  notes: z.string().max(1000).optional(),
});

export const appointmentLookupSchema = z.object({
  token: z.string().min(16, 'Jeton requis'),
});

export const appointmentEmailLookupSchema = z.object({
  email: z.string().trim().email().max(254),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['confirmed', 'rejected', 'cancelled', 'completed']),
  adminNotes: z.string().max(1000).optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  price_cents: z.number().int().min(0),
  duration_minutes: z.number().int().min(5).max(480),
  image_url: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(''))
    .refine(
      (v) => !v || v.startsWith('/') || /^https?:\/\//.test(v),
      'URL ou chemin d’image invalide'
    ),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const serviceUpdateSchema = serviceSchema.partial();

export const hoursRowSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  is_closed: z.boolean(),
  open_time: z.string().nullable().optional(),
  close_time: z.string().nullable().optional(),
});

export const hoursBulkSchema = z.object({
  hours: z.array(hoursRowSchema).min(1).max(7),
});

export const settingsSchema = z.object({
  slot_duration_minutes: z.number().int().min(5).max(120).optional(),
  min_notice_hours: z.number().int().min(0).max(168).optional(),
  max_advance_days: z.number().int().min(1).max(365).optional(),
  timezone: z.string().min(1).max(80).optional(),
});

export const blockedSlotSchema = z.object({
  title: z.string().max(200).optional(),
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }),
  all_day: z.boolean().optional(),
});

export const listAppointmentsQuerySchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'rejected', 'cancelled', 'completed'])
    .optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
