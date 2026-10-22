import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as publicController from '../controllers/publicController.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  availabilityQuerySchema,
  createAppointmentSchema,
  appointmentLookupSchema,
  appointmentEmailLookupSchema,
} from '../validators/schemas.js';

const router = Router();

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives. Réessayez plus tard.', code: 'RATE_LIMIT' },
});

const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de consultations. Réessayez plus tard.', code: 'RATE_LIMIT' },
});

const emailLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de consultations. Réessayez plus tard.', code: 'RATE_LIMIT' },
});

router.get('/health', publicController.health);
router.get('/services', publicController.getServices);
router.get('/hours', publicController.getPublicHours);
router.get(
  '/availability',
  validateQuery(availabilityQuerySchema),
  publicController.getAvailability
);
router.post(
  '/appointments',
  bookingLimiter,
  validateBody(createAppointmentSchema),
  publicController.createAppointment
);
router.post(
  '/appointments/lookup',
  emailLookupLimiter,
  validateBody(appointmentEmailLookupSchema),
  publicController.listAppointmentsByEmail
);
router.get(
  '/appointments/:id',
  lookupLimiter,
  validateQuery(appointmentLookupSchema),
  publicController.getAppointment
);

export default router;
