import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAppointmentNotification,
  buildClientStatusNotification,
} from '../src/services/notificationService.js';

describe('notification e-mail des rendez-vous', () => {
  it('inclut le détail du rendez-vous et le lien admin', () => {
    const message = buildAppointmentNotification(
      {
        customer_name: 'Client',
        customer_phone: '12345678',
        customer_email: 'client@example.com',
        service_name: 'Coupe',
        service_price_cents: 1000,
        starts_at: '2026-10-22T09:30:00.000Z',
        status: 'pending',
        notes: 'Aucune',
      },
      'http://localhost:5173/admin/rendez-vous'
    );

    assert.match(message.subject, /Client/);
    assert.match(message.text, /client@example\.com/);
    assert.match(message.text, /http:\/\/localhost:5173\/admin\/rendez-vous/);
    assert.match(message.text, /En attente de validation/);
    assert.match(message.html, /Vérifier la demande/);
  });

  it('échappe les valeurs utilisateur dans le HTML', () => {
    const message = buildAppointmentNotification(
      {
        customer_name: '<script>alert(1)</script>',
        customer_phone: '12345678',
        customer_email: 'client@example.com',
        service_name: 'Coupe & barbe',
        service_price_cents: 1000,
        starts_at: '2026-10-22T09:30:00.000Z',
        status: 'pending',
        notes: '',
      },
      'http://localhost:5173/admin/rendez-vous'
    );

    assert.doesNotMatch(message.html, /<script>/);
    assert.match(message.html, /&lt;script&gt;/);
    assert.match(message.html, /Coupe &amp; barbe/);
  });

  it('prépare un message de confirmation au client avec les détails du rendez-vous', () => {
    const message = buildClientStatusNotification({
      customer_name: 'Client',
      customer_email: 'client@example.com',
      service_name: 'Coupe',
      service_price_cents: 1000,
      service_duration_minutes: 30,
      starts_at: '2026-10-22T09:30:00.000Z',
      status: 'confirmed',
    });

    assert.match(message.subject, /confirmé/);
    assert.match(message.text, /jeudi 22 octobre 2026 à 10:30/);
    assert.match(message.html, /Votre rendez-vous est confirmé/);
  });

  it('prépare un message de refus au client', () => {
    const message = buildClientStatusNotification({
      customer_name: 'Client',
      service_name: 'Coupe',
      service_price_cents: 1000,
      service_duration_minutes: 30,
      starts_at: '2026-10-22T09:30:00.000Z',
      status: 'rejected',
    });

    assert.match(message.subject, /refusée/);
    assert.match(message.text, /effectuer une nouvelle réservation/);
  });
});
