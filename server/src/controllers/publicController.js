import * as serviceService from '../services/serviceService.js';
import * as appointmentService from '../services/appointmentService.js';
import * as hoursService from '../services/hoursService.js';
import { getAvailableSlots } from '../services/availabilityService.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendAppointmentNotification } from '../services/notificationService.js';

export async function health(_req, res) {
  res.json({ status: 'ok', service: 'barber-booking-api', time: new Date().toISOString() });
}

export async function getServices(_req, res, next) {
  try {
    const services = await serviceService.listActiveServices();
    res.json({ services });
  } catch (err) {
    next(err);
  }
}

export async function getAvailability(req, res, next) {
  try {
    const { date, serviceId } = req.query;
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .select('id, duration_minutes, is_active')
      .eq('id', serviceId)
      .maybeSingle();

    if (error) throw new AppError('Erreur service', 500);
    if (!service || !service.is_active) {
      throw new AppError('Service introuvable', 404);
    }

    const result = await getAvailableSlots(date, service.duration_minutes);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createAppointment(req, res, next) {
  try {
    const appointment = await appointmentService.createAppointment({
      serviceId: req.body.serviceId,
      startsAt: req.body.startsAt,
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerEmail: req.body.customerEmail,
      notes: req.body.notes,
    });

    try {
      await sendAppointmentNotification(appointment);
    } catch (error) {
      console.error(`Notification e-mail non envoyée pour le rendez-vous ${appointment.id}:`, error);
    }

    res.status(201).json({
      message: 'Demande de réservation enregistrée. Statut : en attente de validation.',
      appointment: {
        id: appointment.id,
        serviceName: appointment.service_name,
        priceCents: appointment.service_price_cents,
        durationMinutes: appointment.service_duration_minutes,
        startsAt: appointment.starts_at,
        endsAt: appointment.ends_at,
        status: appointment.status,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listAppointmentsByEmail(req, res, next) {
  try {
    const appointments = await appointmentService.listAppointmentsByEmail(req.body.email);
    res
      .set('Cache-Control', 'no-store')
      .json({
        appointments: appointments.map((appointment) => ({
          serviceName: appointment.service_name,
          startsAt: appointment.starts_at,
          status: appointment.status,
        })),
      });
  } catch (err) {
    next(err);
  }
}

export async function getAppointment(req, res, next) {
  try {
    const appointment = await appointmentService.getAppointmentSecure(
      req.params.id,
      req.query.token
    );

    res.json({
      appointment: {
        id: appointment.id,
        serviceName: appointment.service_name,
        priceCents: appointment.service_price_cents,
        durationMinutes: appointment.service_duration_minutes,
        startsAt: appointment.starts_at,
        endsAt: appointment.ends_at,
        status: appointment.status,
        customerName: appointment.customer_name,
        notes: appointment.notes,
        createdAt: appointment.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPublicHours(_req, res, next) {
  try {
    const [hours, settings] = await Promise.all([
      hoursService.listBusinessHours(),
      hoursService.getSettings(),
    ]);
    res.json({ hours, settings });
  } catch (err) {
    next(err);
  }
}
