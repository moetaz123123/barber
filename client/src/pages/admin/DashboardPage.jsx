import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, formatPrice } from '../../lib/api';
import Spinner from '../../components/ui/Spinner';

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/admin/dashboard', token);
        if (!cancelled) setStats(data.stats);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-300">{error}</p>;
  if (!stats) return null;

  const cards = [
    { label: 'RDV du jour', value: stats.today_total },
    { label: 'En attente', value: stats.pending_total },
    { label: 'Confirmés', value: stats.confirmed_total },
    { label: 'Terminés', value: stats.completed_total },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl mb-8">Tableau de bord</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="border border-white/10 bg-charcoal/60 p-5">
            <p className="text-xs text-muted uppercase tracking-wider">{c.label}</p>
            <p className="font-display text-4xl text-gold mt-2">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="border border-white/10 bg-charcoal/60 p-5 max-w-md">
        <p className="text-xs text-muted uppercase tracking-wider mb-2">
          Revenus estimés (prestations terminées)
        </p>
        <p className="font-display text-3xl text-cream">
          {formatPrice(stats.estimated_revenue_cents)}
        </p>
        <p className="text-xs text-muted mt-3">{stats.note}</p>
      </div>
    </div>
  );
}
