const PROD_API_BASE = import.meta.env.PROD ? 'https://french-portfolio-ppv5.vercel.app' : '';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || PROD_API_BASE).replace(/\/+$/, '');

function resolveApiUrl(url) {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
}

export async function apiRequest(url, { method = 'GET', body, token, isForm = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body !== undefined) {
    if (isForm) {
      payload = body;
    } else {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  let response;

  try {
    response = await fetch(resolveApiUrl(url), {
      method,
      headers,
      body: payload
    });
  } catch {
    throw new Error('Impossible de joindre le serveur. Vérifiez que l’API est lancée.');
  }

  let data = {};

  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(data.message || `Erreur (${response.status})`);
  }

  return data;
}

export function mediaUrl(value) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;

  const path = value.startsWith('/') ? value : `/${value}`;
  return `${API_BASE_URL}${path}`;
}

export function safeExternalUrl(value) {
  if (!value) return '';

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

// Returns the project copy for the active language, falling back field-by-field
// to French when the active locale was saved with empty values (empty strings
// are truthy objects, so a plain `content[language] || content.fr` would
// incorrectly hide the French text).
export function localizedContent(project, language) {
  const fr = project?.content?.fr || {};
  const loc = project?.content?.[language] || {};
  const hasValue = value => (typeof value === 'string' && value.trim()) || (Array.isArray(value) && value.length > 0);
  return { ...fr, ...Object.fromEntries(Object.entries(loc).filter(([, value]) => hasValue(value))) };
}
