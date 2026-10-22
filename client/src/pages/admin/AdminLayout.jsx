import { useState } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Clock,
  Users,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { fr } from '../../i18n/fr';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';

const links = [
  { to: '/admin', end: true, label: fr.admin.dashboard, icon: LayoutDashboard },
  { to: '/admin/rendez-vous', label: fr.admin.appointments, icon: Calendar },
  { to: '/admin/services', label: fr.admin.services, icon: Scissors },
  { to: '/admin/horaires', label: fr.admin.hours, icon: Clock },
  { to: '/admin/clients', label: fr.admin.clients, icon: Users },
];

export default function AdminLayout() {
  const { loading, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-ink text-cream flex flex-col md:h-screen md:min-h-0 md:flex-row md:overflow-hidden">
      <aside className="md:w-56 md:h-screen md:overflow-y-auto md:sticky md:top-0 border-b md:border-b-0 md:border-r border-white/10 bg-charcoal shrink-0">
        <div className="flex items-center justify-between p-4 md:p-5">
          <div className="font-display text-xl text-gold">{fr.brand}</div>
          <button
            type="button"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            aria-controls="admin-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center justify-center p-2 text-cream hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:hidden"
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        <nav
          id="admin-navigation"
          className={`${menuOpen ? 'block' : 'hidden'} px-2 pb-4 space-y-1 md:block`}
        >
          {links.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-gold/15 text-gold' : 'text-cream/70 hover:text-cream'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              logout();
            }}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-cream/50 hover:text-cream w-full"
          >
            <LogOut className="w-4 h-4" />
            {fr.admin.logout}
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-4 sm:p-8 md:min-h-0 md:overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
