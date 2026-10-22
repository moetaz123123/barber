const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BUSINESS_TIME_ZONE = 'Africa/Tunis';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
  }

  if (!res.ok) {
    const err = new Error(body?.error || `Erreur HTTP ${res.status}`);
    err.status = res.status;
    err.code = body?.code;
    err.body = body;
    throw err;
  }

  return body;
}

export const api = {
  get: (path, token) =>
    request(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  post: (path, data, token) =>
    request(path, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  patch: (path, data, token) =>
    request(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  put: (path, data, token) =>
    request(path, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  delete: (path, token) =>
    request(path, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
};

export function formatPrice(cents) {
  const value = Math.round((cents || 0) / 100);
  return `${value} DT`;
}

export function formatDateTime(iso) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date(iso));
}

export function getBusinessDate(dayOffset = 0) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map(({ type, value }) => [type, value])
  );
  return new Date(
    Date.UTC(
      Number(dateParts.year),
      Number(dateParts.month) - 1,
      Number(dateParts.day) + dayOffset
    )
  )
    .toISOString()
    .slice(0, 10);
}

export function getBusinessDateKey(iso) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const dateParts = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map(({ type, value }) => [type, value])
  );
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

export function formatBusinessTime(iso) {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date(iso));
}

export function formatBusinessDate(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}
