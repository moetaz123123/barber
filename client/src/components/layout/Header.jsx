import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Scissors } from 'lucide-react';
import { fr } from '../../i18n/fr';
import Button from '../ui/Button';

const links = [
  { to: '/', label: fr.nav.home },
  { to: '/services', label: fr.nav.services },
  { to: '/reservation', label: fr.nav.booking },
  { to: '/suivi', label: fr.nav.track },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => setScrolled(window.scrollY > 10);

    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
    return () => window.removeEventListener('scroll', updateScrolled);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-colors duration-300 ${
        scrolled ? 'bg-charcoal/95 backdrop-blur border-b border-white/5' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Scissors className="w-5 h-5 text-gold transition-transform group-hover:rotate-12" />
          <span className="font-display text-2xl tracking-wide text-cream">{fr.brand}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm tracking-wide transition-colors ${
                  isActive ? 'text-gold' : 'text-cream/70 hover:text-cream'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/reservation">
            <Button>{fr.nav.bookNow}</Button>
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden text-cream p-2"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-charcoal/95 backdrop-blur border-t border-white/5 px-4 py-6 space-y-4 animate-fade-in">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block text-cream/90 py-2"
            >
              {l.label}
            </NavLink>
          ))}
          <Link to="/reservation" onClick={() => setOpen(false)}>
            <Button className="w-full">{fr.nav.bookNow}</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
