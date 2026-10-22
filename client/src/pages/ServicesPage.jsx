import { useEffect, useState } from 'react';
import { fr } from '../i18n/fr';
import { api } from '../lib/api';
import ServiceCard from '../components/ServiceCard';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/services');
        if (!cancelled) setServices(data.services || []);
      } catch (e) {
        if (!cancelled) setError(e.message || fr.errors.generic);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pt-28 pb-20 mx-auto max-w-6xl px-4 sm:px-6">
      <p className="text-gold text-xs uppercase tracking-[0.25em] mb-3">Tarifs</p>
      <h1 className="font-display text-5xl text-cream mb-3">{fr.services.title}</h1>
      <p className="text-muted mb-12 max-w-xl">{fr.services.subtitle}</p>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {error && (
        <p className="text-red-300 text-sm border border-red-500/30 bg-red-950/40 px-4 py-3">
          {error}
        </p>
      )}

      {!loading && !error && services.length === 0 && (
        <EmptyState title={fr.services.empty} description="Revenez bientôt ou contactez le salon." />
      )}

      {!loading && services.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
