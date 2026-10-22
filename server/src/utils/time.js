/**
 * Utilitaires horaires — les créneaux sont calculés en UTC à partir
 * d'une date locale (YYYY-MM-DD) et d'heures TIME PostgreSQL.
 */

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = String(timeStr).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Construit un Date UTC à partir d'une date locale et de son offset (UTC - heure locale). */
export function localDateMinutesToUtc(dateStr, minutesFromMidnight, timezoneOffsetMinutes) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const utcMs =
    Date.UTC(y, mo - 1, d, 0, 0, 0) +
    minutesFromMidnight * 60_000 +
    -timezoneOffsetMinutes * 60_000;
  return new Date(utcMs);
}

/**
 * Offset en minutes (heure locale - UTC) pour un fuseau IANA à une date donnée.
 * Positif pour les fuseaux à l'est de UTC et négatif pour ceux à l'ouest.
 */
export function getTimezoneOffsetMinutes(timeZone, date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUtc - date.getTime()) / 60_000;
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function formatPriceCents(cents) {
  return (cents / 100).toFixed(2);
}
