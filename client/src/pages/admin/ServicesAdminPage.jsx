import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, formatPrice } from '../../lib/api';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const emptyForm = {
  name: '',
  description: '',
  price_dt: '80',
  duration_minutes: 30,
  category: 'general',
  image_url: '',
  is_active: true,
};

export default function ServicesAdminPage() {
  const { token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/api/admin/services', token);
      setServices(data.services || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function save(e) {
    e.preventDefault();
    setError('');
    const payload = {
      ...form,
      price_cents: Math.round(Number(form.price_dt) * 100),
      duration_minutes: Number(form.duration_minutes),
      image_url: form.image_url || null,
    };
    try {
      if (editingId) {
        await api.patch(`/api/admin/services/${editingId}`, payload, token);
      } else {
        await api.post('/api/admin/services', payload, token);
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(s) {
    await api.patch(`/api/admin/services/${s.id}`, { is_active: !s.is_active }, token);
    await load();
  }

  async function remove(id) {
    if (!confirm('Supprimer ou désactiver ce service ?')) return;
    await api.delete(`/api/admin/services/${id}`, token);
    await load();
  }

  function startEdit(s) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      description: s.description || '',
      price_dt: (s.price_cents / 100).toFixed(2),
      duration_minutes: s.duration_minutes,
      category: s.category || 'general',
      image_url: s.image_url || '',
      is_active: s.is_active,
    });
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Services</h1>
      {error && <p className="text-red-300 mb-4 text-sm">{error}</p>}

      <form onSubmit={save} className="border border-white/10 bg-charcoal/50 p-5 mb-8 grid sm:grid-cols-2 gap-3">
        <h2 className="sm:col-span-2 font-medium text-gold text-sm uppercase tracking-wider">
          {editingId ? 'Modifier' : 'Ajouter'} un service
        </h2>
        <input
          required
          placeholder="Nom"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="bg-ink border border-white/15 px-3 py-2 text-sm"
        />
        <input
          placeholder="Catégorie"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="bg-ink border border-white/15 px-3 py-2 text-sm"
        />
        <input
          type="number"
          required
          min={0}
          step="0.01"
          placeholder="Prix (DT)"
          value={form.price_dt}
          onChange={(e) => setForm((f) => ({ ...f, price_dt: e.target.value }))}
          className="bg-ink border border-white/15 px-3 py-2 text-sm"
        />
        <input
          type="number"
          required
          min={5}
          placeholder="Durée (min)"
          value={form.duration_minutes}
          onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
          className="bg-ink border border-white/15 px-3 py-2 text-sm"
        />
        <input
          placeholder="URL image"
          value={form.image_url}
          onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
          className="sm:col-span-2 bg-ink border border-white/15 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="sm:col-span-2 bg-ink border border-white/15 px-3 py-2 text-sm"
          rows={2}
        />
        <div className="sm:col-span-2 flex gap-2">
          <Button type="submit">{editingId ? 'Enregistrer' : 'Ajouter'}</Button>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Annuler
            </Button>
          )}
        </div>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <ul className="space-y-2">
          {services.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-charcoal/40 p-4"
            >
              <div>
                <p className="font-medium">
                  {s.name}{' '}
                  {!s.is_active && <span className="text-xs text-muted">(inactif)</span>}
                </p>
                <p className="text-xs text-muted">
                  {formatPrice(s.price_cents)} · {s.duration_minutes} min · {s.category}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="!text-xs !px-3 !py-1.5" onClick={() => startEdit(s)}>
                  Modifier
                </Button>
                <Button variant="ghost" className="!text-xs !px-3 !py-1.5" onClick={() => toggleActive(s)}>
                  {s.is_active ? 'Désactiver' : 'Activer'}
                </Button>
                <Button variant="danger" className="!text-xs !px-3 !py-1.5" onClick={() => remove(s.id)}>
                  Supprimer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
