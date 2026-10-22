import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { fr } from '../../i18n/fr';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

export default function AdminLogin() {
  const { login, isAdmin, loading, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && isAdmin) return <Navigate to="/admin" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Connexion impossible');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-grain flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-white/10 bg-charcoal/80 p-8 space-y-5"
      >
        <h1 className="font-display text-3xl text-cream text-center">{fr.admin.loginTitle}</h1>
        {!supabaseConfigured && (
          <p className="text-xs text-amber-300 border border-amber-500/30 bg-amber-950/40 px-3 py-2">
            Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans client/.env
          </p>
        )}
        {error && (
          <p className="text-sm text-red-300 border border-red-500/30 px-3 py-2">{error}</p>
        )}
        <div>
          <label className="block text-sm text-muted mb-2">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-ink border border-white/15 px-4 py-3 text-cream outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-sm text-muted mb-2">Mot de passe</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-ink border border-white/15 px-4 py-3 text-cream outline-none focus:border-gold"
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy || !supabaseConfigured}>
          {busy ? <Spinner className="w-4 h-4" /> : null}
          Se connecter
        </Button>
      </form>
    </div>
  );
}
