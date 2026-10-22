import nodemailer from 'nodemailer';
import { config } from '../config.js';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

export function buildAppointmentNotification(appointment, adminUrl) {
  const dateTime = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: config.businessTimezone,
  }).format(new Date(appointment.starts_at));
  const price = `${(appointment.service_price_cents / 100).toFixed(2)} DT`;
  const notes = appointment.notes || 'Aucune';
  const status = appointment.status === 'pending' ? 'En attente de validation' : appointment.status;
  const safeAdminUrl = escapeHtml(adminUrl);

  return {
    subject: `Nouvelle demande de rendez-vous — ${appointment.customer_name}`,
    text: [
      'Nouvelle demande de rendez-vous',
      `Client : ${appointment.customer_name}`,
      `Téléphone : ${appointment.customer_phone}`,
      `E-mail : ${appointment.customer_email}`,
      `Service : ${appointment.service_name}`,
      `Date et heure : ${dateTime}`,
      `Prix : ${price}`,
      `Statut : ${status}`,
      `Remarque : ${notes}`,
      '',
      `Consulter et traiter la demande : ${adminUrl}`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;color:#222;line-height:1.6">
        <h1 style="font-size:22px">Nouvelle demande de rendez-vous</h1>
        <p><strong>Client :</strong> ${escapeHtml(appointment.customer_name)}</p>
        <p><strong>Téléphone :</strong> ${escapeHtml(appointment.customer_phone)}</p>
        <p><strong>E-mail :</strong> ${escapeHtml(appointment.customer_email)}</p>
        <p><strong>Service :</strong> ${escapeHtml(appointment.service_name)}</p>
        <p><strong>Date et heure :</strong> ${escapeHtml(dateTime)}</p>
        <p><strong>Prix :</strong> ${escapeHtml(price)}</p>
        <p><strong>Statut :</strong> ${escapeHtml(status)}</p>
        <p><strong>Remarque :</strong> ${escapeHtml(notes)}</p>
        <p style="margin:28px 0">
          <a href="${safeAdminUrl}" style="background:#c9a45c;color:#111;padding:12px 20px;text-decoration:none;font-weight:bold">
            Vérifier la demande
          </a>
        </p>
        <p style="font-size:13px;color:#666">
          Connectez-vous à l’espace administrateur pour confirmer ou refuser le rendez-vous.
        </p>
      </div>
    `,
  };
}

export function buildClientStatusNotification(appointment) {
  const confirmed = appointment.status === 'confirmed';
  const dateTime = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: config.businessTimezone,
  }).format(new Date(appointment.starts_at));
  const statusTitle = confirmed ? 'Votre rendez-vous est confirmé' : 'Votre demande de rendez-vous a été refusée';
  const statusMessage = confirmed
    ? 'Nous vous attendons au salon à la date et à l’heure indiquées ci-dessous.'
    : 'Nous ne pouvons malheureusement pas accepter ce rendez-vous. Vous pouvez choisir un autre créneau et effectuer une nouvelle réservation.';
  const price = `${(appointment.service_price_cents / 100).toFixed(2)} DT`;

  return {
    subject: `${statusTitle} — Balha Barber`,
    text: [
      `Bonjour ${appointment.customer_name},`,
      '',
      statusTitle + '.',
      statusMessage,
      '',
      `Service : ${appointment.service_name}`,
      `Date et heure : ${dateTime}`,
      `Durée : ${appointment.service_duration_minutes} min`,
      `Prix : ${price}`,
      '',
      'Balha Barber',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;color:#222;line-height:1.6">
        <h1 style="font-size:22px">${escapeHtml(statusTitle)}</h1>
        <p>Bonjour ${escapeHtml(appointment.customer_name)},</p>
        <p>${escapeHtml(statusMessage)}</p>
        <div style="padding:16px;background:#f5f5f0">
          <p><strong>Service :</strong> ${escapeHtml(appointment.service_name)}</p>
          <p><strong>Date et heure :</strong> ${escapeHtml(dateTime)}</p>
          <p><strong>Durée :</strong> ${appointment.service_duration_minutes} min</p>
          <p><strong>Prix :</strong> ${escapeHtml(price)}</p>
        </div>
        <p>Balha Barber</p>
      </div>
    `,
  };
}

function createTransporter() {
  if (!config.smtpUser || !config.smtpPassword) {
    throw new Error(
      'Notification non configurée : définissez SMTP_USER et SMTP_PASSWORD dans server/.env.'
    );
  }

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  });
}

export async function sendAppointmentNotification(appointment) {
  const transporter = createTransporter();
  const message = buildAppointmentNotification(appointment, config.adminAppointmentsUrl);
  await transporter.sendMail({
    from: `"Balha Barber" <${config.smtpUser}>`,
    to: config.notificationEmail,
    replyTo: appointment.customer_email || undefined,
    ...message,
  });
}

export async function sendClientStatusNotification(appointment) {
  if (!appointment.customer_email) {
    throw new Error('Aucune adresse e-mail client n’est enregistrée pour ce rendez-vous.');
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Balha Barber" <${config.smtpUser}>`,
    to: appointment.customer_email,
    ...buildClientStatusNotification(appointment),
  });
}
