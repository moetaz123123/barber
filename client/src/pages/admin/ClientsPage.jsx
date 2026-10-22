import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Mail, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, formatDateTime } from '../../lib/api';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

export default function ClientsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const q = search ? `?search=${encodeURIComponent(search)}` : '';
        const data = await api.get(`/api/admin/clients${q}`, token);
        if (!cancelled) setItems(data.items || []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Impossible de charger les clients.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [token, search]);

  if (selectedClient) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelectedClient(null)}
          className="inline-flex items-center gap-2 text-sm text-gold hover:text-cream mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux clients
        </button>

        <div className="border border-white/10 bg-charcoal/50 p-5 sm:p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gold/15 text-gold flex items-center justify-center">
              <UserRound className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl">{selectedClient.customer_name}</h1>
              <p className="text-sm text-muted">
                {selectedClient.appointments.length} rendez-vous
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/70">
            <span className="inline-flex items-center gap-2">
              <Phone className="w-4 h-4 text-gold" />
              {selectedClient.customer_phone}
            </span>
            {selectedClient.customer_email && (
              <span className="inline-flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                {selectedClient.customer_email}
              </span>
            )}
          </div>
        </div>

        <h2 className="font-display text-2xl mb-4">Historique des rendez-vous</h2>
        {selectedClient.appointments.length === 0 ? (
          <EmptyState title="Aucun rendez-vous" description="L’historique de ce client est vide." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {selectedClient.appointments.map((appointment) => (
              <li
                key={appointment.id}
                className="border border-white/10 bg-charcoal/40 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{appointment.service_name}</p>
                  <StatusBadge status={appointment.status} />
                </div>
                <p className="inline-flex items-center gap-2 text-sm text-muted">
                  <CalendarDays className="w-4 h-4 text-gold" />
                  {formatDateTime(appointment.starts_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Clients</h1>
      <input
        type="search"
        placeholder="Rechercher par nom ou téléphone"
        value={search}
        onChange={(e) => {
          setSelectedClient(null);
          setSearch(e.target.value);
        }}
        className="mb-6 w-full max-w-md bg-charcoal border border-white/15 px-4 py-2 text-sm"
      />
      {loading && <Spinner />}
      {error && <p className="text-sm text-red-300 mb-4">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="Aucun client" description="Les clients apparaissent après une réservation." />
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((c) => (
          <li key={`${c.customer_phone}-${c.customer_name}`}>
            <button
              type="button"
              onClick={() => setSelectedClient(c)}
              className="flex min-h-32 w-full flex-col justify-between gap-3 text-left border border-white/10 bg-charcoal/50 p-3 transition-colors hover:border-gold/50 hover:bg-charcoal"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">
                  <UserRound className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.customer_name}</p>
                  <p className="text-xs text-muted">
                    {(c.appointments || []).length} rendez-vous
                  </p>
                </div>
                <span aria-hidden="true" className="text-sm text-gold">→</span>
              </div>
              <div className="min-w-0 border-t border-white/5 pt-2 text-xs text-muted">
                <p className="truncate">{c.customer_phone}</p>
                {c.customer_email && (
                  <p className="truncate mt-1">{c.customer_email}</p>
                )}
                {c.appointments?.[0] && (
                  <p className="truncate mt-1 text-cream/60">
                    Dernier : {formatDateTime(c.appointments[0].starts_at)}
                  </p>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
