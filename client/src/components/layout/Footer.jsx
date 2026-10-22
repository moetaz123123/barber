import { Link } from 'react-router-dom';
import { fr } from '../../i18n/fr';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-charcoal">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-cream mb-2">{fr.brand}</p>
          <p className="text-sm text-muted">{fr.tagline}</p>
        </div>
        <div className="text-sm text-cream/70 space-y-2">
          <p className="text-gold text-xs uppercase tracking-[0.2em] mb-3">Navigation</p>
          <Link to="/services" className="block hover:text-gold">
            {fr.nav.services}
          </Link>
          <Link to="/reservation" className="block hover:text-gold">
            {fr.nav.booking}
          </Link>
          <Link to="/suivi" className="block hover:text-gold">
            {fr.nav.track}
          </Link>
        </div>
        <div className="text-sm text-cream/70 space-y-1">
          <p className="text-gold text-xs uppercase tracking-[0.2em] mb-3">Contact</p>
          <p>Rue Gremda, km 2</p>
          <p>+216 24 099 750</p>
          <p>contact@balha-barber.demo</p>
        </div>
      </div>
      <div className="gold-rule" />
      <p className="text-center text-xs text-muted py-4">
        © {new Date().getFullYear()} {fr.brand} — Démonstration
      </p>
    </footer>
  );
}
