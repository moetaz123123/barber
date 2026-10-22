import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, formatPrice, formatDateTime } from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const ACTIONS = {
  pending: [
    { status: 'confirmed', label: 'Confirmer' },
    { status: 'rejected', label: 'Refuser' },
    { status: 'cancelled', label: 'Annuler' },
  ],
  confirmed: [
    { status: 'completed', label: 'Terminer' },
    { status: 'cancelled', label: 'Annuler' },
  ],
};

export default function AppointmentsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', dateFrom: '', search: '' });
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [view, setView] = useState('list');
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (filters.status) q.set('status', filters.status);
      if (filters.search) q.set('search', filters.search);
      if (view === 'calendar') {
        const [y, m] = monthCursor.split('-').map(Number);
        const last = new Date(y, m, 0).getDate();
        q.set('dateFrom', `${monthCursor}-01`);
        q.set('dateTo', `${monthCursor}-${String(last).padStart(2, '0')}`);
        q.set('limit', '100');
      } else if (filters.dateFrom) {
        q.set('dateFrom', filters.dateFrom);
        q.set('dateTo', filters.dateFrom);
      }
      const data = await api.get(`/api/admin/appointments?${q}`, token);
      setItems(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, filters, view, monthCursor]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id, status) {
    setBusyId(id);
    try {
      await api.patch(`/api/admin/appointments/${id}/status`, { status }, token);
      await load();
      if (selected?.id === id) {
        const detail = await api.get(`/api/admin/appointments/${id}`, token);
        setSelected(detail.appointment);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Rendez-vous</h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex border border-white/15">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-gold/20 text-gold' : 'text-cream/70'}`}
          >
            Liste
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`px-3 py-2 text-sm ${view === 'calendar' ? 'bg-gold/20 text-gold' : 'text-cream/70'}`}
          >
            Calendrier
          </button>
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          className="bg-charcoal border border-white/15 px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmé</option>
          <option value="rejected">Refusé</option>
          <option value="cancelled">Annulé</option>
          <option value="completed">Terminé</option>
        </select>
        {view === 'list' ? (
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            className="bg-charcoal border border-white/15 px-3 py-2 text-sm"
          />
        ) : (
          <input
            type="month"
            value={monthCursor}
            onChange={(e) => setMonthCursor(e.target.value)}
            className="bg-charcoal border border-white/15 px-3 py-2 text-sm"
          />
        )}
        <input
          type="search"
          placeholder="Nom ou téléphone"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="bg-charcoal border border-white/15 px-3 py-2 text-sm flex-1 min-w-[160px]"
        />
      </div>

      {error && <p className="text-red-300 mb-4">{error}</p>}
      {loading && <Spinner />}

      {!loading && items.length === 0 && (
        <EmptyState title="Aucun rendez-vous" description="Modifiez les filtres ou attendez de nouvelles demandes." />
      )}

      {view === 'calendar' && !loading && (
        <MonthCalendar
          month={monthCursor}
          items={items}
          selectedId={selected?.id}
          onSelect={setSelected}
        />
      )}

      <div className={`grid lg:grid-cols-2 gap-6 ${view === 'calendar' ? 'mt-6' : ''}`}>
        <ul className={`space-y-2 ${view === 'calendar' ? 'hidden lg:block' : ''}`}>
          {items.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setSelected(a)}
                className={`w-full text-left border p-4 transition-colors ${
                  selected?.id === a.id
                    ? 'border-gold bg-gold/10'
                    : 'border-white/10 bg-charcoal/40 hover:border-white/25'
                }`}
              >
                <div className="flex justify-between gap-2 mb-1">
                  <span className="font-medium">{a.customer_name}</span>
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-xs text-muted">{formatDateTime(a.starts_at)}</p>
                <p className="text-sm text-cream/80 mt-1">{a.service_name}</p>
              </button>
            </li>
          ))}
        </ul>

        {selected && (
          <div className="border border-white/10 bg-charcoal/60 p-5 h-fit space-y-3 text-sm sticky top-4">
            <h2 className="font-display text-2xl">{selected.service_name}</h2>
            <StatusBadge status={selected.status} />
            <p>{formatDateTime(selected.starts_at)}</p>
            <p>
              {formatPrice(selected.service_price_cents)} · {selected.service_duration_minutes} min
            </p>
            <p>
              {selected.customer_name} — {selected.customer_phone}
            </p>
            {selected.customer_email && <p>{selected.customer_email}</p>}
            {selected.notes && <p className="text-muted">Remarque : {selected.notes}</p>}
            <div className="flex flex-wrap gap-2 pt-3">
              {(ACTIONS[selected.status] || []).map((action) => (
                <Button
                  key={action.status}
                  variant={action.status === 'rejected' || action.status === 'cancelled' ? 'danger' : 'primary'}
                  disabled={busyId === selected.id}
                  onClick={() => updateStatus(selected.id, action.status)}
                  className="!text-xs !px-3 !py-2"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MonthCalendar({ month, items, selectedId, onSelect }) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const byDay = {};
  for (const a of items) {
    const key = new Date(a.starts_at).toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(a);
  }
  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  return (
    <div className="border border-white/10 bg-charcoal/40 p-3">
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted mb-2">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = `${month}-${String(day).padStart(2, '0')}`;
          const dayItems = byDay[key] || [];
          return (
            <div key={key} className="min-h-20 border border-white/8 p-1 text-left">
              <p className="text-xs text-muted mb-1">{day}</p>
              {dayItems.slice(0, 3).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelect(a)}
                  className={`block w-full truncate text-[10px] px-1 py-0.5 mb-0.5 ${
                    selectedId === a.id ? 'bg-gold text-ink' : 'bg-ink/60 text-cream'
                  }`}
                >
                  {new Date(a.starts_at).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  {a.customer_name}
                </button>
              ))}
              {dayItems.length > 3 && (
                <p className="text-[10px] text-gold">+{dayItems.length - 3}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
