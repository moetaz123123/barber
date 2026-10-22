import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  api,
  formatPrice,
  formatDateTime,
  formatBusinessDate,
  formatBusinessTime,
  getBusinessDate,
  getBusinessDateKey,
} from '../../lib/api';
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

const statusDotColors = {
  pending: 'bg-amber-400',
  confirmed: 'bg-emerald-400',
  rejected: 'bg-red-400',
  cancelled: 'bg-zinc-400',
  completed: 'bg-gold',
};

export default function AppointmentsPage() {
  const { token } = useAuth();
  const today = getBusinessDate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [selected, setSelected] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
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
      } else {
        q.set('dateFrom', getBusinessDate(-1));
        q.set('dateTo', today);
        q.set('limit', '100');
      }
      const data = await api.get(`/api/admin/appointments?${q}`, token);
      setItems(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, filters, view, monthCursor, today]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !busyId) setSelected(null);
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selected, busyId]);

  async function updateStatus(id, status) {
    setBusyId(id);
    try {
      const result = await api.patch(`/api/admin/appointments/${id}/status`, { status }, token);
      await load();
      if (selected?.id === id) {
        const detail = await api.get(`/api/admin/appointments/${id}`, token);
        setSelected(detail.appointment);
      }
      if (result.notificationError) {
        alert(result.notificationError);
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const calendarItems = items.filter((appointment) => appointment.status !== 'rejected');
  const todayItems = items.filter(
    (appointment) => getBusinessDateKey(appointment.starts_at) === today
  );
  const visibleItems = view === 'list' ? todayItems : items;

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
            onClick={() => {
              setSelectedCalendarDate(null);
              setView('calendar');
            }}
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
        {view === 'calendar' && (
          <input
            type="month"
            value={monthCursor}
            onChange={(e) => {
              setMonthCursor(e.target.value);
              setSelectedCalendarDate(null);
            }}
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

      {!loading && visibleItems.length === 0 && (
        <EmptyState
          title="Aucun rendez-vous"
          description={view === 'list' ? "Aucun rendez-vous prévu aujourd'hui." : 'Modifiez les filtres ou attendez de nouvelles demandes.'}
        />
      )}

      {view === 'calendar' && !loading && (
        selectedCalendarDate ? (
          <DayTimeline
            date={selectedCalendarDate}
            items={calendarItems.filter(
              (appointment) => getBusinessDateKey(appointment.starts_at) === selectedCalendarDate
            )}
            onBack={() => setSelectedCalendarDate(null)}
            onSelect={setSelected}
          />
        ) : (
          <MonthCalendar
            month={monthCursor}
            items={calendarItems}
            onSelectDate={setSelectedCalendarDate}
          />
        )
      )}

      <div className={view === 'calendar' ? 'mt-6' : ''}>
        {view === 'list' && todayItems.length > 0 && (
          <section aria-label="Rendez-vous du jour" className="max-w-3xl">
            <h2 className="mb-5 font-display text-2xl text-cream">{formatBusinessDate(today)}</h2>
            <ol className="relative ml-3 border-l border-gold/35">
              {todayItems.map((a) => (
                <li key={a.id} className="relative pb-5 pl-7 last:pb-0">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-ink ${
                      statusDotColors[a.status] || 'bg-gold'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setSelected(a)}
                    className={`w-full text-left border p-4 transition-colors ${
                      selected?.id === a.id
                        ? 'border-gold bg-gold/10'
                        : 'border-white/10 bg-charcoal/40 hover:border-white/25'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-cream">
                          <span className="mr-3 text-gold">{formatBusinessTime(a.starts_at)}</span>
                          {a.customer_name}
                        </p>
                        <p className="mt-1 truncate text-xs text-muted">{a.service_name}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyId) setSelected(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="appointment-dialog-title"
            className="my-auto w-full max-w-lg border border-white/10 bg-charcoal p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 id="appointment-dialog-title" className="font-display text-2xl">
                  {selected.service_name}
                </h2>
                <p className="mt-1 text-sm text-muted">{selected.customer_name}</p>
              </div>
              <button
                type="button"
                autoFocus
                aria-label="Fermer les détails du rendez-vous"
                disabled={Boolean(busyId)}
                onClick={() => setSelected(null)}
                className="p-1 text-muted transition-colors hover:text-cream disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <StatusBadge status={selected.status} />
              <p>{formatDateTime(selected.starts_at)}</p>
              <p>
                {formatPrice(selected.service_price_cents)} · {selected.service_duration_minutes} min
              </p>
              <p>{selected.customer_phone}</p>
              {selected.customer_email && <p>{selected.customer_email}</p>}
              {selected.notes && <p className="text-muted">Remarque : {selected.notes}</p>}
            </div>
            {(ACTIONS[selected.status] || []).length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-white/10 mt-5 pt-4">
                {(ACTIONS[selected.status] || []).map((action) => (
                  <Button
                    key={action.status}
                    variant={action.status === 'rejected' || action.status === 'cancelled' ? 'danger' : 'primary'}
                    disabled={busyId === selected.id}
                    onClick={() => updateStatus(selected.id, action.status)}
                    className="!text-xs !px-3 !py-2"
                  >
                    {busyId === selected.id ? <Spinner className="w-4 h-4" /> : null}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function MonthCalendar({ month, items, onSelectDate }) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const byDay = {};
  for (const a of items) {
    const key = getBusinessDateKey(a.starts_at);
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
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              aria-label={`${day} — ${dayItems.length} rendez-vous`}
              className="min-h-20 border border-white/8 p-2 text-left transition-colors hover:border-gold/50"
            >
              <span className="text-xs text-muted">{day}</span>
              {dayItems.length > 0 && (
                <span className="mt-2 block text-xs text-gold">
                  {dayItems.length} rendez-vous
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayTimeline({ date, items, onBack, onSelect }) {
  const appointments = [...items].sort(
    (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
  );
  const appointmentTimes = appointments.map((appointment) => {
    const [hour, minute] = formatBusinessTime(appointment.starts_at).split(':').map(Number);
    const start = hour * 60 + minute;
    return {
      appointment,
      start,
      end: start + appointment.service_duration_minutes,
    };
  });
  const startMinute = appointmentTimes.length
    ? Math.min(9 * 60, Math.floor(Math.min(...appointmentTimes.map(({ start }) => start)) / 60) * 60)
    : 9 * 60;
  const endMinute = appointmentTimes.length
    ? Math.max(19 * 60, Math.ceil(Math.max(...appointmentTimes.map(({ end }) => end)) / 60) * 60)
    : 19 * 60;
  const totalMinutes = endMinute - startMinute;
  const hourTicks = Array.from(
    { length: Math.floor(totalMinutes / 30) + 1 },
    (_, index) => startMinute + index * 30
  );
  const statusColors = {
    pending: 'border-amber-400/50 bg-amber-500/25 text-amber-100 hover:bg-amber-500/35',
    confirmed: 'border-emerald-400/50 bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/35',
    rejected: 'border-red-400/50 bg-red-500/25 text-red-100 hover:bg-red-500/35',
    cancelled: 'border-zinc-400/50 bg-zinc-500/25 text-zinc-100 hover:bg-zinc-500/35',
    completed: 'border-gold/50 bg-gold/25 text-cream hover:bg-gold/35',
  };

  return (
    <section className="border border-white/10 bg-charcoal/40 p-4 sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-gold">Planning du jour</p>
          <h2 className="mt-1 font-display text-2xl text-cream">{formatBusinessDate(date)}</h2>
        </div>
        <Button variant="ghost" onClick={onBack} className="!text-sm">
          Retour au calendrier
        </Button>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          title="Aucun rendez-vous ce jour"
          description="Choisissez une autre date dans le calendrier."
        />
      ) : (
        <div className="w-full min-w-0">
          <div className="w-full min-w-0">
            <div className="relative h-8 border-b border-white/10">
              {hourTicks.map((tick) => {
                const position = ((tick - startMinute) / totalMinutes) * 100;
                return (
                  <span
                    key={tick}
                    className={`absolute -translate-x-1/2 whitespace-nowrap text-[9px] text-muted sm:text-xs ${
                      tick % 60 !== 0 && tick !== startMinute && tick !== endMinute
                        ? 'hidden sm:block'
                        : ''
                    }`}
                    style={{ left: `${position}%` }}
                  >
                    {`${String(Math.floor(tick / 60)).padStart(2, '0')}:${String(tick % 60).padStart(2, '0')}`}
                  </span>
                );
              })}
            </div>

            <div>
              {appointmentTimes.map(({ appointment, start, end }) => {
                const left = ((start - startMinute) / totalMinutes) * 100;
                const width = ((end - start) / totalMinutes) * 100;
                return (
                  <div
                    key={appointment.id}
                    className="relative h-[68px] border-b border-white/5"
                  >
                    {hourTicks.map((tick) => {
                      const position = ((tick - startMinute) / totalMinutes) * 100;
                      return (
                        <span
                          key={tick}
                          aria-hidden="true"
                          className="absolute inset-y-0 border-l border-white/5"
                          style={{ left: `${position}%` }}
                        />
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => onSelect(appointment)}
                      aria-label={`${appointment.customer_name}, ${formatBusinessTime(appointment.starts_at)}, ${appointment.service_name}, ${appointment.status}`}
                      title={`${appointment.customer_name} · ${formatBusinessTime(appointment.starts_at)} · ${appointment.service_name}`}
                      className={`absolute top-1/2 z-10 flex h-10 min-w-0 -translate-y-1/2 items-center overflow-hidden rounded border px-2 text-left transition-colors ${
                        statusColors[appointment.status] || statusColors.pending
                      }`}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                    >
                      <span className="truncate text-[9px] font-semibold leading-tight sm:text-xs">
                        {appointment.customer_name}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
