import * as appointmentService from '../services/appointmentService.js';
import * as serviceService from '../services/serviceService.js';
import * as hoursService from '../services/hoursService.js';

export async function dashboard(req, res, next) {
  try {
    const stats = await appointmentService.getDashboardStats(req.query.date);
    res.json({ stats });
  } catch (err) {
    next(err);
  }
}

export async function listAppointments(req, res, next) {
  try {
    const result = await appointmentService.listAppointments(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAppointment(req, res, next) {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    res.json({ appointment });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const appointment = await appointmentService.updateAppointmentStatus(
      req.params.id,
      req.body.status,
      req.body.adminNotes
    );
    res.json({ appointment });
  } catch (err) {
    next(err);
  }
}

export async function listServices(_req, res, next) {
  try {
    const services = await serviceService.listAllServices();
    res.json({ services });
  } catch (err) {
    next(err);
  }
}

export async function createService(req, res, next) {
  try {
    const service = await serviceService.createService(req.body);
    res.status(201).json({ service });
  } catch (err) {
    next(err);
  }
}

export async function updateService(req, res, next) {
  try {
    const service = await serviceService.updateService(req.params.id, req.body);
    res.json({ service });
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req, res, next) {
  try {
    const result = await serviceService.deleteService(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getHours(_req, res, next) {
  try {
    const [hours, settings, blocked] = await Promise.all([
      hoursService.listBusinessHours(),
      hoursService.getSettings(),
      hoursService.listBlockedSlots(),
    ]);
    res.json({ hours, settings, blocked });
  } catch (err) {
    next(err);
  }
}

export async function updateHours(req, res, next) {
  try {
    const hours = await hoursService.upsertBusinessHours(req.body.hours);
    res.json({ hours });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await hoursService.updateSettings(req.body);
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

export async function createBlocked(req, res, next) {
  try {
    const blocked = await hoursService.createBlockedSlot(req.body);
    res.status(201).json({ blocked });
  } catch (err) {
    next(err);
  }
}

export async function deleteBlocked(req, res, next) {
  try {
    const result = await hoursService.deleteBlockedSlot(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function listClients(req, res, next) {
  try {
    const result = await appointmentService.listClients(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
    },
    profile: req.profile,
  });
}
