import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { fr } from '../i18n/fr';
import { api, formatPrice, formatDateTime, getBusinessDate } from '../lib/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const STEPS = ['service', 'date', 'slot', 'details', 'review'];

export default function BookingPage() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [slots, setSlots] = useState([]);
  const [slotsReason, setSlotsReason] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [serviceId, setServiceId] = useState(params.get('service') || '');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
  });

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const minDate = useMemo(() => getBusinessDate(), []);
  const maxDate = useMemo(() => getBusinessDate(30), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get('/api/services');
        if (!cancelled) setServices(data.services || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoadingServices(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!serviceId || !date) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlot(null);
    setError('');
    (async () => {
      try {
        const data = await api.get(
          `/api/availability?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`
        );
        if (!cancelled) {
          setSlots(data.slots || []);
          setSlotsReason(data.reason);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  function canNext() {
    if (step === 0) return Boolean(serviceId);
    if (step === 1) return Boolean(date);
    if (step === 2) return Boolean(slot);
    if (step === 3) {
      return (
        form.customerName.trim().length >= 2 &&
        form.customerPhone.trim().length >= 8 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())
      );
    }
    return true;
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const data = await api.post('/api/appointments', {
        serviceId,
        startsAt: slot.start,
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim(),
        notes: form.notes.trim() || undefined,
      });
      setResult(data);
    } catch (e) {
      if (['SLOT_TAKEN', 'SLOT_UNAVAILABLE', 'BLOCKED'].includes(e.code)) {
        setSlot(null);
        setSlots((currentSlots) =>
          currentSlots.filter((availableSlot) => availableSlot.start !== slot.start)
        );
        setStep(2);
        setError('Ce créneau n’est plus disponible. Veuillez choisir un autre horaire.');
      } else {
        setError(e.message || fr.errors.generic);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const a = result.appointment;
    return (
      <div className="pt-28 pb-20 mx-auto max-w-lg px-4 text-center animate-fade-up">
        <div className="mx-auto w-14 h-14 rounded-full border border-gold/40 flex items-center justify-center mb-6">
          <Check className="w-7 h-7 text-gold" />
        </div>
        <h1 className="font-display text-4xl text-cream mb-3">{fr.booking.successTitle}</h1>
        <p className="text-muted mb-8">{fr.booking.successBody}</p>
        <div className="text-left border border-white/10 bg-charcoal/60 p-6 space-y-3 text-sm mb-8">
          <p>
            <span className="text-muted">Service</span>
            <br />
            {a.serviceName} — {formatPrice(a.priceCents)} — {a.durationMinutes} min
          </p>
          <p>
            <span className="text-muted">Date</span>
            <br />
            {formatDateTime(a.startsAt)}
          </p>
          <p>
            <span className="text-muted">Statut</span>
            <br />
            {fr.status[a.status]}
          </p>
        </div>
        <p className="text-xs text-muted mb-4">{fr.booking.trackingHint}</p>
        <Link to="/suivi">
          <Button className="w-full mb-3">Suivre mon rendez-vous</Button>
        </Link>
        <Link to="/">
          <Button variant="ghost" className="w-full">
            Retour à l&apos;accueil
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 mx-auto max-w-2xl px-4 sm:px-6">
      <h1 className="font-display text-5xl text-cream mb-8">{fr.booking.title}</h1>

      <ol className="flex flex-wrap gap-2 mb-10 text-xs uppercase tracking-wider">
        {STEPS.map((key, i) => (
          <li
            key={key}
            className={`px-2.5 py-1 border ${
              i === step
                ? 'border-gold text-gold'
                : i < step
                  ? 'border-gold/30 text-cream/60'
                  : 'border-white/10 text-muted'
            }`}
          >
            {fr.booking.steps[key]}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-6 text-sm text-red-300 border border-red-500/30 bg-red-950/40 px-4 py-3">
          {error}
        </p>
      )}

      {step === 0 && (
        <div className="space-y-3">
          {loadingServices ? (
            <Spinner />
          ) : (
            services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={`w-full text-left p-4 border transition-colors ${
                  serviceId === s.id
                    ? 'border-gold bg-gold/10'
                    : 'border-white/10 hover:border-white/25 bg-charcoal/40'
                }`}
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="text-cream font-medium">{s.name}</p>
                    <p className="text-xs text-muted mt-1">
                      {s.duration_minutes} min · {fr.services.demoBadge}
                    </p>
                  </div>
                  <p className="text-gold shrink-0">{formatPrice(s.price_cents)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {step === 1 && (
        <div>
          <label className="block text-sm text-muted mb-2">Date souhaitée</label>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-charcoal border border-white/15 px-4 py-3 text-cream focus:border-gold outline-none"
          />
        </div>
      )}

      {step === 2 && (
        <div>
          {loadingSlots ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-muted text-sm py-6">
              {fr.booking.noSlots}
              {slotsReason === 'closed' && ' (salon fermé ce jour)'}
              {slotsReason === 'too_far' && ' (date trop éloignée)'}
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => {
                    setSlot(s);
                    setError('');
                  }}
                  className={`py-3 text-sm border transition-colors ${
                    slot?.start === s.start
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-white/10 text-cream hover:border-gold/40'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <Field
            label="Nom complet *"
            value={form.customerName}
            onChange={(v) => setForm((f) => ({ ...f, customerName: v }))}
          />
          <Field
            label="Téléphone *"
            value={form.customerPhone}
            onChange={(v) => setForm((f) => ({ ...f, customerPhone: v }))}
            type="tel"
          />
          <Field
            label="E-mail *"
            value={form.customerEmail}
            onChange={(v) => setForm((f) => ({ ...f, customerEmail: v }))}
            type="email"
            required
          />
          <div>
            <label className="block text-sm text-muted mb-2">Remarque (optionnel)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full bg-charcoal border border-white/15 px-4 py-3 text-cream focus:border-gold outline-none resize-y"
            />
          </div>
        </div>
      )}

      {step === 4 && selectedService && slot && (
        <div className="border border-white/10 bg-charcoal/50 p-6 space-y-3 text-sm">
          <Row label="Service" value={selectedService.name} />
          <Row
            label="Durée / prix"
            value={`${selectedService.duration_minutes} min · ${formatPrice(selectedService.price_cents)} (démo)`}
          />
          <Row label="Date & heure" value={formatDateTime(slot.start)} />
          <Row label="Nom" value={form.customerName} />
          <Row label="Téléphone" value={form.customerPhone} />
          {form.customerEmail && <Row label="E-mail" value={form.customerEmail} />}
          {form.notes && <Row label="Remarque" value={form.notes} />}
          <p className="text-xs text-muted pt-2">
            Après confirmation, le statut sera « En attente » jusqu&apos;à validation par le salon.
          </p>
        </div>
      )}

      <div className="flex justify-between mt-10 gap-3">
        <Button
          variant="ghost"
          disabled={step === 0 || submitting}
          onClick={() => {
            setError('');
            setStep((s) => s - 1);
          }}
        >
          <ChevronLeft className="w-4 h-4" />
          {fr.booking.back}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            disabled={!canNext()}
            onClick={() => {
              setError('');
              setStep((s) => s + 1);
            }}
          >
            {fr.booking.next}
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button disabled={submitting} onClick={submit}>
            {submitting ? <Spinner className="w-4 h-4" /> : null}
            {fr.booking.confirm}
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-sm text-muted mb-2">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-charcoal border border-white/15 px-4 py-3 text-cream focus:border-gold outline-none"
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2">
      <span className="text-muted">{label}</span>
      <span className="text-cream text-right">{value}</span>
    </div>
  );
}
