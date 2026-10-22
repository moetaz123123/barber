import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(accessToken) {
    try {
      const data = await api.get('/api/admin/me', accessToken);
      setProfile(data.profile);
      return data.profile;
    } catch {
      setProfile(null);
      return null;
    }
  }

  useEffect(() => {
    if (!supabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.access_token) {
        await loadProfile(data.session.access_token);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.access_token) {
        await loadProfile(next.access_token);
      } else {
        setProfile(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function login(email, password) {
    if (!supabase) throw new Error('Supabase non configuré (VITE_SUPABASE_URL / ANON_KEY)');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data.session);
    const p = await loadProfile(data.session.access_token);
    if (!p || p.role !== 'admin') {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      throw new Error('Compte non autorisé (rôle administrateur requis).');
    }
    return data;
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  const token = session?.access_token || null;
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ session, profile, token, isAdmin, loading, login, logout, supabaseConfigured }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
