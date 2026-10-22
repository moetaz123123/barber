import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const q = search ? `?search=${encodeURIComponent(search)}` : '';
        const data = await api.get(`/api/admin/clients${q}`, token);
        if (!cancelled) setItems(data.items || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [token, search]);

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Clients</h1>
      <input
        type="search"
        placeholder="Rechercher par nom ou téléphone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full max-w-md bg-charcoal border border-white/15 px-4 py-2 text-sm"
      />
      {loading && <Spinner />}
      {!loading && items.length === 0 && (
        <EmptyState title="Aucun client" description="Les clients apparaissent après une réservation." />
      )}
      <ul className="space-y-4">
        {items.map((c) => (
          <li key={`${c.customer_phone}-${c.customer_name}`} className="border border-white/10 bg-charcoal/50 p-4">
            <p className="font-medium">{c.customer_name}</p>
            <p className="text-sm text-muted">
              {c.customer_phone}
              {c.customer_email ? ` · ${c.customer_email}` : ''}
            </p>
            <ul className="mt-3 space-y-1 text-xs text-cream/70">
              {(c.appointments || []).slice(0, 5).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={a.status} />
                  <span>{a.service_name}</span>
                  <span className="text-muted">{formatDateTime(a.starts_at)}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
