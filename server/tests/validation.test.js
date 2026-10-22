import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAppointmentSchema,
  availabilityQuerySchema,
  statusUpdateSchema,
  appointmentEmailLookupSchema,
} from '../src/validators/schemas.js';
import {
  rangesOverlap,
  parseTimeToMinutes,
  getTimezoneOffsetMinutes,
  localDateMinutesToUtc,
} from '../src/utils/time.js';

describe('validation rendez-vous', () => {
  it('accepte une charge utile valide', () => {
    const result = createAppointmentSchema.safeParse({
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
      startsAt: '2026-11-01T10:00:00.000Z',
      customerName: 'Jean Dupont',
      customerPhone: '+212612345678',
      customerEmail: 'jean@example.com',
      notes: 'Première visite',
    });
    assert.equal(result.success, true);
  });

  it('refuse un téléphone invalide', () => {
    const result = createAppointmentSchema.safeParse({
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
      startsAt: '2026-11-01T10:00:00.000Z',
      customerName: 'Jean',
      customerPhone: 'abc',
    });
    assert.equal(result.success, false);
  });

  it('exige une adresse e-mail pour une nouvelle réservation', () => {
    const result = createAppointmentSchema.safeParse({
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
      startsAt: '2026-11-01T10:00:00.000Z',
      customerName: 'Jean Dupont',
      customerPhone: '+212612345678',
    });
    assert.equal(result.success, false);
  });

  it('valide la requête de disponibilité', () => {
    const ok = availabilityQuerySchema.safeParse({
      date: '2026-11-01',
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    assert.equal(ok.success, true);

    const bad = availabilityQuerySchema.safeParse({ date: '01/11/2026', serviceId: 'x' });
    assert.equal(bad.success, false);
  });

  it('n\'accepte que des statuts admin autorisés', () => {
    assert.equal(statusUpdateSchema.safeParse({ status: 'confirmed' }).success, true);
    assert.equal(statusUpdateSchema.safeParse({ status: 'pending' }).success, false);
  });

  it('valide une adresse e-mail pour le suivi', () => {
    assert.equal(appointmentEmailLookupSchema.safeParse({ email: 'client@example.com' }).success, true);
    assert.equal(appointmentEmailLookupSchema.safeParse({ email: 'invalid' }).success, false);
  });
});

describe('utilitaires horaires', () => {
  it('détecte les chevauchements', () => {
    const a0 = new Date('2026-11-01T10:00:00Z');
    const a1 = new Date('2026-11-01T10:30:00Z');
    const b0 = new Date('2026-11-01T10:15:00Z');
    const b1 = new Date('2026-11-01T10:45:00Z');
    assert.equal(rangesOverlap(a0, a1, b0, b1), true);
    assert.equal(rangesOverlap(a0, a1, a1, b1), false);
  });

  it('parse les heures TIME', () => {
    assert.equal(parseTimeToMinutes('09:00:00'), 540);
    assert.equal(parseTimeToMinutes('13:30'), 810);
  });

  it('convertit l’heure du salon en UTC sans décalage pour Tunis', () => {
    const localNoon = new Date('2026-10-22T12:00:00.000Z');
    const offset = getTimezoneOffsetMinutes('Africa/Tunis', localNoon);
    const appointment = localDateMinutesToUtc('2026-10-22', 11 * 60 + 30, offset);

    assert.equal(offset, 60);
    assert.equal(appointment.toISOString(), '2026-10-22T10:30:00.000Z');
    assert.equal(
      new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Africa/Tunis',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(appointment),
      '11:30'
    );
  });
});
