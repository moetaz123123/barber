import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  statusUpdateSchema,
  serviceSchema,
  serviceUpdateSchema,
  hoursBulkSchema,
  settingsSchema,
  blockedSlotSchema,
  listAppointmentsQuerySchema,
} from '../validators/schemas.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/me', adminController.me);
router.get('/dashboard', adminController.dashboard);

router.get(
  '/appointments',
  validateQuery(listAppointmentsQuerySchema),
  adminController.listAppointments
);
router.get('/appointments/:id', adminController.getAppointment);
router.patch(
  '/appointments/:id/status',
  validateBody(statusUpdateSchema),
  adminController.updateStatus
);

router.get('/services', adminController.listServices);
router.post('/services', validateBody(serviceSchema), adminController.createService);
router.patch('/services/:id', validateBody(serviceUpdateSchema), adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

router.get('/hours', adminController.getHours);
router.put('/hours', validateBody(hoursBulkSchema), adminController.updateHours);
router.patch('/settings', validateBody(settingsSchema), adminController.updateSettings);
router.post('/blocked-slots', validateBody(blockedSlotSchema), adminController.createBlocked);
router.delete('/blocked-slots/:id', adminController.deleteBlocked);

router.get('/clients', adminController.listClients);

export default router;
