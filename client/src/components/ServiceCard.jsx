import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fr } from '../i18n/fr';
import { formatPrice } from '../lib/api';
import Button from './ui/Button';

const FALLBACK_IMAGE = '/images/coupe.jpg';

export default function ServiceCard({ service, featured = false }) {
  const [src, setSrc] = useState(service.image_url || FALLBACK_IMAGE);

  return (
    <article
      className={`group overflow-hidden border border-white/8 bg-charcoal/60 transition-transform duration-300 hover:-translate-y-1 ${
        featured ? '' : ''
      }`}
    >
      <div className="aspect-[4/3] overflow-hidden relative">
        {src ? (
          <img
            src={src}
            alt={service.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={() => {
              if (src !== FALLBACK_IMAGE) setSrc(FALLBACK_IMAGE);
            }}
          />
        ) : (
          <div className="h-full w-full bg-ink flex items-center justify-center text-muted">
            —
          </div>
        )}
        <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest bg-ink/80 text-gold px-2 py-1 border border-gold/30">
          {fr.services.demoBadge}
        </span>
      </div>
      <div className="p-5 space-y-3">
        <h3 className="font-display text-xl text-cream leading-tight">{service.name}</h3>
        <p className="text-sm text-muted line-clamp-2">{service.description}</p>
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-gold font-medium">{formatPrice(service.price_cents)}</p>
            <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {service.duration_minutes} {fr.services.duration}
            </p>
          </div>
          <Link to={`/reservation?service=${service.id}`}>
            <Button variant="secondary" className="!px-3 !py-2 text-xs">
              {fr.services.book}
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
