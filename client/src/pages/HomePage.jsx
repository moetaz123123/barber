import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import { fr } from '../i18n/fr';
import { api } from '../lib/api';
import Button from '../components/ui/Button';
import ServiceCard from '../components/ServiceCard';
import Spinner from '../components/ui/Spinner';

const HERO_IMAGE = '/images/hero.jpg';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function HomePage() {
  const [services, setServices] = useState([]);
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, h] = await Promise.all([api.get('/api/services'), api.get('/api/hours')]);
        if (!cancelled) {
          setServices((s.services || []).slice(0, 3));
          setHours(h.hours || []);
        }
      } catch {
        /* API peut être hors ligne pendant le setup */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {/* Hero — full-bleed, brand first */}
      <section className="relative min-h-[100svh] flex items-end">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative z-10 mx-auto max-w-6xl w-full px-4 sm:px-6 pb-20 pt-32">
          <p className="font-display text-5xl sm:text-7xl md:text-8xl text-cream animate-fade-up leading-[0.95]">
            {fr.brand}
          </p>
          <p className="mt-4 max-w-lg text-cream/80 text-base sm:text-lg animate-fade-up delay-1">
            {fr.home.sub}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-fade-up delay-2">
            <Link to="/reservation">
              <Button className="!px-7 !py-3">
                {fr.nav.bookNow}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="secondary">{fr.nav.services}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Savoir-faire */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-gold text-xs uppercase tracking-[0.25em] mb-3">Salon</p>
            <h2 className="font-display text-4xl md:text-5xl text-cream mb-6">
              {fr.home.aboutTitle}
            </h2>
            <p className="text-muted leading-relaxed">{fr.home.aboutBody}</p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src="/images/about.jpg"
              alt="Coupe de cheveux en salon"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-gold/20" />
          </div>
        </div>
      </section>

      <div className="gold-rule mx-auto max-w-xs" />

      {/* Services populaires */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-display text-4xl text-cream">{fr.home.popularTitle}</h2>
          <Link to="/services" className="text-sm text-gold hover:underline hidden sm:inline">
            Tout voir
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} featured />
            ))}
          </div>
        )}
      </section>

      {/* Pourquoi nous */}
      <section className="bg-charcoal/80 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-4xl text-cream text-center mb-14">
            {fr.home.whyTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {fr.home.why.map((item, i) => (
              <div key={item.title} className={`animate-fade-up delay-${i + 1}`}>
                <p className="text-gold font-display text-3xl mb-3">0{i + 1}</p>
                <h3 className="text-cream text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / horaires */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
        <h2 className="font-display text-4xl text-cream mb-10">{fr.home.contactTitle}</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-4 text-cream/80">
            <p className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              Rue Gremda, km 2
            </p>
            <p className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gold shrink-0" />
              +216 24 099 750
            </p>
            <p className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <span>
                {hours.length
                  ? hours
                      .filter((h) => !h.is_closed)
                      .map(
                        (h) =>
                          `${DAY_LABELS[h.day_of_week]} ${String(h.open_time).slice(0, 5)}–${String(h.close_time).slice(0, 5)}`
                      )
                      .join(' · ')
                  : 'Lun–Sam 09:00–19:00 (démo)'}
              </span>
            </p>
          </div>
          <div className="border border-gold/25 bg-ink/50 p-8">
            <h3 className="font-display text-2xl text-cream mb-2">{fr.home.ctaTitle}</h3>
            <p className="text-sm text-muted mb-6">{fr.home.ctaBody}</p>
            <Link to="/reservation">
              <Button>
                {fr.nav.bookNow}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
