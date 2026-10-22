import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const DAY_NAMES = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
];

function sliceTime(t) {
  return t ? String(t).slice(0, 5) : '';
}

export default function HoursAdminPage() {
  const { token } = useAuth();
  const [hours, setHours] = useState([]);
  const [settings, setSettings] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [blockForm, setBlockForm] = useState({
    title: '',
    start_at: '',
    end_at: '',
    all_day: true,
  });

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/hours', token);
      setHours(
        (data.hours || []).map((h) => ({
          ...h,
          open_time: sliceTime(h.open_time),
          close_time: sliceTime(h.close_time),
        }))
      );
      setSettings(data.settings);
      setBlocked(data.blocked || []);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function updateHour(day, patch) {
    setHours((rows) =>
      rows.map((r) => (r.day_of_week === day ? { ...r, ...patch } : r))
    );
  }

  async function saveHours() {
    setMessage('');
    try {
      const payload = hours.map((h) => ({
        day_of_week: h.day_of_week,
        is_closed: h.is_closed,
        open_time: h.is_closed ? null : h.open_time || null,
        close_time: h.is_closed ? null : h.close_time || null,
      }));
      await api.put('/api/admin/hours', { hours: payload }, token);
      setMessage('Horaires enregistrés.');
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function saveSettings() {
    setMessage('');
    try {
      await api.patch(
        '/api/admin/settings',
        {
          slot_duration_minutes: Number(settings.slot_duration_minutes),
          min_notice_hours: Number(settings.min_notice_hours),
          max_advance_days: Number(settings.max_advance_days),
          timezone: settings.timezone,
        },
        token
      );
      setMessage('Paramètres enregistrés.');
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function addBlock(e) {
    e.preventDefault();
    try {
      const start = new Date(blockForm.start_at).toISOString();
      const end = new Date(blockForm.end_at).toISOString();
      await api.post(
        '/api/admin/blocked-slots',
        {
          title: blockForm.title,
          start_at: start,
          end_at: end,
          all_day: blockForm.all_day,
        },
        token
      );
      setBlockForm({ title: '', start_at: '', end_at: '', all_day: true });
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function removeBlock(id) {
    await api.delete(`/api/admin/blocked-slots/${id}`, token);
    await load();
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl">Horaires & disponibilités</h1>
      {message && <p className="text-sm text-gold">{message}</p>}

      <section>
        <h2 className="text-gold text-sm uppercase tracking-wider mb-4">Jours d&apos;ouverture</h2>
        <div className="space-y-3">
          {hours.map((h) => (
            <div
              key={h.day_of_week}
              className="grid gap-2 border border-white/10 p-3 bg-charcoal/40 sm:grid-cols-[1fr_1fr_1fr_1fr] sm:items-center"
            >
              <p className="text-sm font-medium">{DAY_NAMES[h.day_of_week]}</p>
              <label className="flex items-center gap-2 text-xs text-muted sm:justify-self-center sm:self-center">
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={(e) => updateHour(h.day_of_week, { is_closed: e.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                />
                Fermé
              </label>
              <label className="text-xs text-muted">
                Ouverture
                <input
                  type="time"
                  disabled={h.is_closed}
                  value={h.open_time || ''}
                  onChange={(e) => updateHour(h.day_of_week, { open_time: e.target.value })}
                  className="mt-1 w-full bg-ink border border-white/15 px-2 py-1 text-sm text-cream"
                />
              </label>
              <label className="text-xs text-muted">
                Fermeture
                <input
                  type="time"
                  disabled={h.is_closed}
                  value={h.close_time || ''}
                  onChange={(e) => updateHour(h.day_of_week, { close_time: e.target.value })}
                  className="mt-1 w-full bg-ink border border-white/15 px-2 py-1 text-sm text-cream"
                />
              </label>
            </div>
          ))}
        </div>
        <Button className="mt-4" onClick={saveHours}>
          Enregistrer les horaires
        </Button>
      </section>

      {settings && (
        <section>
          <h2 className="text-gold text-sm uppercase tracking-wider mb-4">Paramètres de réservation</h2>
          <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
            <label className="text-xs text-muted">
              Durée des créneaux (min)
              <input
                type="number"
                value={settings.slot_duration_minutes}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, slot_duration_minutes: e.target.value }))
                }
                className="mt-1 w-full bg-ink border border-white/15 px-3 py-2 text-sm text-cream"
              />
            </label>
            <label className="text-xs text-muted">
              Délai minimal (heures)
              <input
                type="number"
                value={settings.min_notice_hours}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, min_notice_hours: e.target.value }))
                }
                className="mt-1 w-full bg-ink border border-white/15 px-3 py-2 text-sm text-cream"
              />
            </label>
            <label className="text-xs text-muted">
              Réservation max (jours)
              <input
                type="number"
                value={settings.max_advance_days}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, max_advance_days: e.target.value }))
                }
                className="mt-1 w-full bg-ink border border-white/15 px-3 py-2 text-sm text-cream"
              />
            </label>
            <label className="text-xs text-muted">
              Fuseau horaire
              <input
                value={settings.timezone}
                onChange={(e) => setSettings((s) => ({ ...s, timezone: e.target.value }))}
                className="mt-1 w-full bg-ink border border-white/15 px-3 py-2 text-sm text-cream"
              />
            </label>
          </div>
          <Button className="mt-4" onClick={saveSettings}>
            Enregistrer les paramètres
          </Button>
        </section>
      )}

      <section>
        <h2 className="text-gold text-sm uppercase tracking-wider mb-4">Congés & blocages</h2>
        <form onSubmit={addBlock} className="grid sm:grid-cols-2 gap-3 max-w-xl mb-6">
          <input
            placeholder="Titre"
            value={blockForm.title}
            onChange={(e) => setBlockForm((f) => ({ ...f, title: e.target.value }))}
            className="sm:col-span-2 bg-ink border border-white/15 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            required
            value={blockForm.start_at}
            onChange={(e) => setBlockForm((f) => ({ ...f, start_at: e.target.value }))}
            className="bg-ink border border-white/15 px-3 py-2 text-sm"
          />
          <input
            type="datetime-local"
            required
            value={blockForm.end_at}
            onChange={(e) => setBlockForm((f) => ({ ...f, end_at: e.target.value }))}
            className="bg-ink border border-white/15 px-3 py-2 text-sm"
          />
          <Button type="submit">Ajouter un blocage</Button>
        </form>
        <ul className="space-y-2">
          {blocked.map((b) => (
            <li
              key={b.id}
              className="flex justify-between gap-3 border border-white/10 p-3 text-sm bg-charcoal/40"
            >
              <span>
                {b.title || 'Blocage'} — {new Date(b.start_at).toLocaleString('fr-FR')} →{' '}
                {new Date(b.end_at).toLocaleString('fr-FR')}
              </span>
              <Button variant="danger" className="!text-xs !px-2 !py-1" onClick={() => removeBlock(b.id)}>
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
