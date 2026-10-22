import { useState } from 'react';
import { fr } from '../i18n/fr';
import { api, formatDateTime } from '../lib/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import StatusBadge from '../components/ui/StatusBadge';

export default function TrackPage() {
  const [email, setEmail] = useState('');
  const [appointments, setAppointments] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function lookup() {
    setLoading(true);
    setError('');
    setAppointments(null);
    try {
      const data = await api.post('/api/appointments/lookup', { email: email.trim() });
      setAppointments(data.appointments || []);
    } catch (e) {
      setError(e.message || fr.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-28 pb-20 mx-auto max-w-lg px-4 sm:px-6">
      <h1 className="font-display text-5xl text-cream mb-3">{fr.track.title}</h1>
      <p className="text-muted text-sm mb-8">{fr.track.subtitle}</p>

      <form
        className="space-y-4 mb-8"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup();
        }}
      >
        <div>
          <label className="block text-sm text-muted mb-2">Adresse e-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-charcoal border border-white/15 px-4 py-3 text-cream text-sm focus:border-gold outline-none"
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Spinner className="w-4 h-4" /> : null}
          {fr.track.submit}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-300 border border-red-500/30 bg-red-950/40 px-4 py-3 mb-6">
          {error}
        </p>
      )}

      {appointments?.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          {appointments.map((appointment, index) => (
            <div
              key={appointment.startsAt}
              className="border border-white/10 bg-charcoal/60 p-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="font-display text-2xl text-cream">{appointment.serviceName}</p>
                <StatusBadge status={appointment.status} />
              </div>
              <p className="text-sm text-muted">{formatDateTime(appointment.startsAt)}</p>
            </div>
          ))}
        </div>
      )}

      {appointments?.length === 0 && (
        <p className="text-sm text-muted border border-white/10 bg-charcoal/60 px-4 py-3">
          Aucun rendez-vous trouvé pour cette adresse e-mail.
        </p>
      )}
    </div>
  );
}
