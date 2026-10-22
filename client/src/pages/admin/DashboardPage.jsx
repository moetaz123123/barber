import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarCheck,
  CalendarDays,
  Clock3,
  Scissors,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, formatBusinessDate, formatBusinessTime, formatPrice, getBusinessDate, getBusinessDateKey } from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const statusDotColors = {
  pending: 'bg-amber-400',
  confirmed: 'bg-emerald-400',
  completed: 'bg-gold',
};

const shortcuts = [
  { to: '/admin/rendez-vous', label: 'Gérer les rendez-vous', icon: CalendarDays },
  { to: '/admin/services', label: 'Modifier les prestations', icon: Scissors },
  { to: '/admin/horaires', label: 'Gérer les horaires', icon: Clock3 },
  { to: '/admin/clients', label: 'Voir les clients', icon: Users },
];

export default function DashboardPage() {
  const { token } = useAuth();
  const today = getBusinessDate();
  const [appointments, setAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const todayQuery = new URLSearchParams({
        dateFrom: getBusinessDate(-1),
        dateTo: getBusinessDate(1),
        limit: '100',
      });
      const pendingQuery = new URLSearchParams({ status: 'pending', limit: '100' });
      const [todayResult, pendingResult, statsResult] = await Promise.all([
        api.get(`/api/admin/appointments?${todayQuery}`, token),
        api.get(`/api/admin/appointments?${pendingQuery}`, token),
        api.get(`/api/admin/dashboard?date=${today}`, token),
      ]);

      setAppointments(
        (todayResult.items || []).filter(
          (appointment) => getBusinessDateKey(appointment.starts_at) === today
        )
      );
      setPendingAppointments(pendingResult.items || []);
      setPendingCount(statsResult.stats.pending_total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, today]);

  useEffect(() => {
    load();
  }, [load]);

  const activeAppointments = useMemo(
    () => appointments.filter((appointment) => !['rejected', 'cancelled'].includes(appointment.status)),
    [appointments]
  );
  const nextAppointment = activeAppointments.find(
    (appointment) => new Date(appointment.starts_at).getTime() >= Date.now()
  );
  const completedRevenue = appointments
    .filter((appointment) => appointment.status === 'completed')
    .reduce((total, appointment) => total + (appointment.service_price_cents || 0), 0);

  async function updateStatus(id, status) {
    setBusyId(id);
    setNotice('');
    try {
      const result = await api.patch(`/api/admin/appointments/${id}/status`, { status }, token);
      await load();
      if (result.notificationError) setNotice(result.notificationError);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const summaryCards = [
    { label: 'Rendez-vous actifs', value: activeAppointments.length, icon: CalendarCheck },
    { label: 'À confirmer', value: pendingCount, icon: Bell, highlight: pendingCount > 0 },
    {
      label: 'Confirmés',
      value: appointments.filter((appointment) => appointment.status === 'confirmed').length,
      icon: Clock3,
    },
    { label: 'Prestations terminées', value: formatPrice(completedRevenue), icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-7">
      <header className="relative isolate overflow-hidden bg-gradient-to-br from-[#29251d] via-charcoal to-charcoal px-5 py-6 sm:px-8 sm:py-8">
        <div aria-hidden="true" className="absolute -right-10 -top-20 -z-10 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
              <Scissors className="h-3.5 w-3.5" /> Espace professionnel
            </p>
            <h1 className="mt-3 font-display text-4xl text-cream sm:text-5xl">Bonjour, bienvenue</h1>
            <p className="mt-2 text-sm capitalize text-cream/60">{formatBusinessDate(today)}</p>
          </div>
          <Link to="/admin/rendez-vous">
            <Button className="!text-sm">
              Ouvrir les rendez-vous <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {error && <p role="alert" className="border border-red-500/30 bg-red-950/30 p-3 text-sm text-red-300">{error}</p>}
      {notice && <p role="status" className="border border-amber-500/30 bg-amber-950/30 p-3 text-sm text-amber-200">{notice}</p>}

      <section aria-label="Résumé du jour" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className={`group flex min-h-28 items-center justify-between gap-4 rounded-sm p-4 shadow-lg shadow-black/10 transition-colors sm:p-5 ${
              card.highlight
                ? 'bg-gradient-to-br from-gold/10 to-charcoal/70'
                : 'bg-charcoal/60 hover:bg-charcoal/90'
            }`}
          >
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{card.label}</p>
              <p className={`mt-2 font-display text-3xl sm:text-4xl ${card.highlight ? 'text-gold' : 'text-cream'}`}>
                {card.value}
              </p>
            </div>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center ${
              card.highlight ? 'bg-gold/10 text-gold' : 'bg-white/[0.03] text-cream/60'
            }`}>
              <card.icon className="h-5 w-5" />
            </span>
          </div>
        ))}
      </section>

      {nextAppointment && (
        <section className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-gold/10 via-gold/[0.04] to-transparent p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold text-ink">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-gold">Prochain rendez-vous</p>
              <p className="mt-1 text-lg font-medium text-cream">
                {formatBusinessTime(nextAppointment.starts_at)} <span className="text-cream/40">·</span> {nextAppointment.customer_name}
              </p>
              <p className="text-sm text-muted">{nextAppointment.service_name}</p>
            </div>
          </div>
          <StatusBadge status={nextAppointment.status} />
        </section>
      )}

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
        <section className="p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-gold/15 pb-4">
            <div>
              <h2 className="font-display text-2xl">Planning du jour</h2>
              <p className="mt-1 text-xs text-muted">Rendez-vous confirmés et en attente</p>
            </div>
            <span className="bg-white/[0.04] px-2.5 py-1 text-xs text-cream/70">
              {activeAppointments.length} au total
            </span>
          </div>
          {loading ? (
            <Spinner />
          ) : activeAppointments.length === 0 ? (
            <EmptyState title="Journée libre" description="Aucun rendez-vous actif n’est prévu aujourd’hui." />
          ) : (
            <ol className="relative ml-3 border-l border-gold/25">
              {activeAppointments.map((appointment) => (
                <li key={appointment.id} className="relative pb-3 pl-7 last:pb-0">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[7px] top-5 h-3 w-3 rounded-full border-2 border-ink ring-4 ring-charcoal ${
                      statusDotColors[appointment.status] || 'bg-zinc-400'
                    }`}
                  />
                  <Link
                    to="/admin/rendez-vous"
                    className="block p-3.5 transition-colors hover:text-gold sm:p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-x-4">
                        <span className="font-semibold tabular-nums text-gold">
                            {formatBusinessTime(appointment.starts_at)}
                        </span>
                        <p className="truncate text-sm font-medium text-cream">
                          {appointment.customer_name}
                        </p>
                        <p className="col-start-2 mt-1 truncate text-xs text-muted">
                          {appointment.service_name} · {appointment.service_duration_minutes} min
                        </p>
                      </div>
                      <StatusBadge status={appointment.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="bg-charcoal/30 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3 border-b border-gold/15 pb-4">
            <div>
              <h2 className="font-display text-2xl">À confirmer</h2>
              <p className="mt-1 text-xs text-muted">Demandes nécessitant votre attention</p>
            </div>
            <span className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs font-semibold ${
              pendingCount > 0 ? 'bg-gold text-ink' : 'bg-white/10 text-cream/70'
            }`}>
              {pendingCount}
            </span>
          </div>
          {loading ? (
            <Spinner />
          ) : pendingAppointments.length === 0 ? (
            <EmptyState title="Tout est à jour" description="Aucune demande n’attend votre confirmation." />
          ) : (
            <div className="space-y-3">
              {pendingAppointments.slice(0, 6).map((appointment) => (
                <article key={appointment.id} className="bg-charcoal/60 p-3.5 shadow-md shadow-black/10 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{appointment.customer_name}</p>
                      <p className="mt-1 text-xs font-medium text-gold">
                        {formatBusinessDate(getBusinessDateKey(appointment.starts_at))} · {formatBusinessTime(appointment.starts_at)}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted">{appointment.service_name}</p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      disabled={Boolean(busyId)}
                      onClick={() => updateStatus(appointment.id, 'confirmed')}
                      className="!w-full !px-3 !py-2 !text-xs"
                    >
                      {busyId === appointment.id ? <Spinner className="h-4 w-4" /> : 'Confirmer'}
                    </Button>
                    <Button
                      variant="danger"
                      disabled={Boolean(busyId)}
                      onClick={() => updateStatus(appointment.id, 'rejected')}
                      className="!w-full !px-3 !py-2 !text-xs"
                    >
                      Refuser
                    </Button>
                  </div>
                </article>
              ))}
              {pendingCount > 6 && (
                <Link to="/admin/rendez-vous" className="inline-flex items-center gap-2 text-sm text-gold hover:text-cream">
                  Voir toutes les demandes <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      <nav aria-label="Accès rapides" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <div className="sm:col-span-2 2xl:col-span-4">
          <h2 className="font-display text-2xl">Accès rapides</h2>
          <p className="mt-1 text-xs text-muted">Les outils essentiels pour gérer votre salon</p>
        </div>
        {shortcuts.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center justify-between gap-3 bg-charcoal/40 p-4 text-sm transition-all hover:bg-charcoal/80"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center bg-gold/5">
                <Icon className="h-4 w-4 text-gold" />
              </span>
              {label}
            </span>
            <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-gold" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
