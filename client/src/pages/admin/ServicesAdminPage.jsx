import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api, formatPrice } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const IMAGE_BUCKET = 'service-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const emptyForm = {
  name: '',
  description: '',
  price_dt: '',
  duration_minutes: '',
  image_url: '',
  is_active: true,
};

export default function ServicesAdminPage() {
  const { token } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return undefined;
    }

    const preview = URL.createObjectURL(imageFile);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

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
    setSaving(true);
    let uploadedPath = null;
    try {
      let imageUrl = form.image_url;
      if (imageFile) {
        if (!supabase) {
          throw new Error('Supabase n’est pas configuré. Vérifiez les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.');
        }

        const extension = imageFile.type === 'image/jpeg' ? 'jpg' : imageFile.type.split('/')[1];
        uploadedPath = `${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(uploadedPath, imageFile, {
            contentType: imageFile.type,
            cacheControl: '3600',
            upsert: false,
          });
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(uploadedPath);
        imageUrl = data.publicUrl;
      }

      const payload = {
        ...form,
        price_cents: Math.round(Number(form.price_dt) * 100),
        duration_minutes: Number(form.duration_minutes),
        image_url: imageUrl || null,
      };
      if (editingId) {
        await api.patch(`/api/admin/services/${editingId}`, payload, token);
      } else {
        await api.post('/api/admin/services', payload, token);
      }
      setForm(emptyForm);
      setImageFile(null);
      setEditingId(null);
      await load();
    } catch (err) {
      if (uploadedPath && supabase) {
        const { error: cleanupError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .remove([uploadedPath]);
        if (cleanupError) {
          console.error('Impossible de supprimer l’image téléversée après l’échec de la sauvegarde:', cleanupError);
        }
      }
      setError(err.message || 'Impossible de sauvegarder le service.');
    } finally {
      setSaving(false);
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
    setImageFile(null);
    setForm({
      name: s.name,
      description: s.description || '',
      price_dt: (s.price_cents / 100).toFixed(2),
      duration_minutes: s.duration_minutes,
      image_url: s.image_url || '',
      is_active: s.is_active,
    });
  }

  return (
    <div>
      <h1 className="font-display text-3xl mb-6">Services</h1>
      {error && <p className="text-red-300 mb-4 text-sm">{error}</p>}

      <form onSubmit={save} className="border border-white/10 bg-charcoal/50 p-5 mb-8 grid sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 font-medium text-gold text-sm uppercase tracking-wider">
          {editingId ? 'Modifier' : 'Ajouter'} un service
        </h2>
        <div>
          <label htmlFor="service-name" className="block text-sm text-muted mb-2">Nom du service</label>
          <input
            id="service-name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-ink border border-white/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="service-price" className="block text-sm text-muted mb-2">Prix (DT)</label>
          <input
            id="service-price"
            type="number"
            required
            min={0}
            step="0.01"
            value={form.price_dt}
            onChange={(e) => setForm((f) => ({ ...f, price_dt: e.target.value }))}
            className="w-full bg-ink border border-white/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="service-duration" className="block text-sm text-muted mb-2">Durée (minutes)</label>
          <input
            id="service-duration"
            type="number"
            required
            min={5}
            value={form.duration_minutes}
            onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
            className="w-full bg-ink border border-white/15 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="service-image" className="block text-sm text-muted mb-2">Image du service (optionnel, JPEG/PNG/WebP, max. 5 Mo)</label>
          <input
            id="service-image"
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                setImageFile(null);
                setError('Format d’image non accepté. Choisissez un fichier JPEG, PNG ou WebP.');
                e.target.value = '';
                return;
              }
              if (file.size > MAX_IMAGE_SIZE) {
                setImageFile(null);
                setError('L’image dépasse la taille maximale de 5 Mo.');
                e.target.value = '';
                return;
              }
              setError('');
              setImageFile(file);
            }}
            className="w-full bg-ink border border-white/15 px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-gold file:px-3 file:py-1 file:text-ink"
          />
          {(imagePreview || form.image_url) && (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={imagePreview || form.image_url}
                alt="Aperçu du service"
                className="h-20 w-24 border border-white/10 object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setImageFile(null);
                  setForm((current) => ({ ...current, image_url: '' }));
                  const input = document.getElementById('service-image');
                  if (input) input.value = '';
                }}
              >
                Retirer l’image
              </Button>
            </div>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="service-description" className="block text-sm text-muted mb-2">Description</label>
          <textarea
            id="service-description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full bg-ink border border-white/15 px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        <div className="sm:col-span-2 flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner className="w-4 h-4" /> : null}
            {editingId ? 'Enregistrer' : 'Ajouter'}
          </Button>
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
                  {formatPrice(s.price_cents)} · {s.duration_minutes} min
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
