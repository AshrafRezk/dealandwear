import { clearShopper, read, write } from './session';

const BASE = '/api/dw';
const TIMEOUT_MS = 15000;

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = code || 'UNKNOWN';
  }
}

let onSignedOut = () => {};

/** Called by AuthProvider so an expired shopper session drops back to guest mode everywhere. */
export function setSignedOutHandler(fn) {
  onSignedOut = fn;
}

function buildUrl(path, params) {
  const url = new URL(`${BASE}/${path.replace(/^\//, '')}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)) {
        url.searchParams.set(k, Array.isArray(v) ? v.join(',') : String(v));
      }
    }
  }
  return url.toString();
}

function isExpired(isoOrMs) {
  if (!isoOrMs) return false;
  const t = Number.isFinite(Number(isoOrMs)) ? Number(isoOrMs) : Date.parse(isoOrMs);
  return Number.isFinite(t) && t - 30_000 < Date.now();
}

function authHeaders({ guest = true } = {}) {
  const headers = {};
  const token = read('token');
  if (token && !isExpired(read('tokenExpiresAt'))) {
    headers['X-DW-Token'] = token;
  } else if (guest) {
    const g = read('guest');
    if (g && !isExpired(read('guestExpiresAt'))) headers['X-DW-Guest'] = g;
  }
  return headers;
}

async function raw(method, path, { params, body, signal, headers: extra } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });
  try {
    const res = await fetch(buildUrl(path, params), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(),
        ...extra,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'same-origin',
    });
    let payload = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    if (!res.ok || payload?.ok === false) {
      const err = payload?.error || {};
      throw new ApiError(res.status, err.code, err.message);
    }
    return payload?.data ?? payload;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e.name === 'AbortError') throw new ApiError(0, 'TIMEOUT', 'The request took too long. Check your connection.');
    throw new ApiError(0, 'NETWORK', 'You appear to be offline.');
  } finally {
    clearTimeout(timer);
  }
}

async function request(method, path, opts) {
  try {
    return await raw(method, path, opts);
  } catch (e) {
    if (e.status === 401 && read('token') && !path.startsWith('auth/')) {
      clearShopper();
      onSignedOut();
    }
    throw e;
  }
}

export const api = {
  get: (path, params, opts) => request('GET', path, { ...opts, params }),
  post: (path, body, opts) => request('POST', path, { ...opts, body: body ?? {} }),
  patch: (path, body, opts) => request('PATCH', path, { ...opts, body: body ?? {} }),
  del: (path, body, opts) => request('DELETE', path, { ...opts, body }),
};

let guestPromise = null;

/** Makes sure an anonymous guest token exists so the quiz, feed and Fit Match work before sign-up. */
export async function ensureGuest() {
  if (read('token') && !isExpired(read('tokenExpiresAt'))) return null;
  const existing = read('guest');
  if (existing && !isExpired(read('guestExpiresAt'))) return existing;
  if (!guestPromise) {
    guestPromise = raw('POST', 'guest/start', { body: {} })
      .then((data) => {
        write('guest', data.guestToken);
        write('guestExpiresAt', Date.now() + (data.expiresInMinutes || 60 * 24 * 30) * 60_000);
        return data.guestToken;
      })
      .finally(() => {
        guestPromise = null;
      });
  }
  return guestPromise;
}

export function storeShopperToken(data) {
  write('token', data.accessToken);
  write('tokenExpiresAt', data.expiresAt);
  write('contactId', data.contactId);
}

export const __test = { buildUrl, isExpired };
