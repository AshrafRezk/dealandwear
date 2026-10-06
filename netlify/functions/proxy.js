/* eslint-env node */
/**
 * Find Your Fit API gateway: /api/dw/* -> Salesforce Apex REST /services/apexrest/dw/v1/*.
 * Holds the Salesforce credentials server-side; the browser only ever sees shopper/guest tokens.
 */
import { Buffer } from 'node:buffer';
import { clearSalesforceToken, getSalesforceToken, instanceUrl } from '../lib/salesforce.js';

const ALLOWED_PATHS = [
  /^version$/,
  /^auth\/(register|login|password|refresh|reset|reset\/confirm)$/,
  /^guest\/start$/,
  /^me(\/export)?$/,
  /^swipe(\/deck|\/finalize|\/undo)?$/,
  /^dna$/,
  /^feed$/,
  /^catalog\/search$/,
  /^products\/[a-zA-Z0-9]{15,18}(\/similar)?$/,
  /^brands(\/[a-zA-Z0-9]{15,18}(\/follow)?)?$/,
  /^saves(\/[a-zA-Z0-9]{15,18})?$/,
  /^clickout$/,
  /^events$/,
  /^contact$/,
];
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH', 'DELETE']);
const MAX_BODY_BYTES = 64 * 1024;
const FORWARD_HEADERS = ['x-dw-token', 'x-dw-guest'];

const RATE_WINDOW_MS = 60_000;
const RATE_LIMITS = { auth: 20, default: 240 };
const buckets = new Map();

function allowedOrigins() {
  const list = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const v of [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL]) {
    if (v) list.push(v.replace(/\/$/, ''));
  }
  return list;
}

function json(statusCode, payload, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  };
}

function rateLimited(ip, path) {
  const kind = path.startsWith('auth/') ? 'auth' : 'default';
  const key = `${kind}:${ip}`;
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    if (buckets.size > 5000) buckets.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMITS[kind];
}

async function forward(url, init, retry = true) {
  const token = await getSalesforceToken();
  const res = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
  if (res.status === 401 && retry) {
    clearSalesforceToken();
    return forward(url, init, false);
  }
  return res;
}

export const handler = async (event) => {
  const requestUrl = new URL(event.rawUrl);
  const path = requestUrl.pathname.replace(/^\/api\/dw\//, '').replace(/\/$/, '');
  const method = (event.httpMethod || 'GET').toUpperCase();

  if (!ALLOWED_METHODS.has(method) || !ALLOWED_PATHS.some((re) => re.test(path))) {
    return json(404, { ok: false, error: { code: 'NOT_FOUND', message: 'Unknown endpoint' } });
  }

  const origin = event.headers.origin;
  const origins = allowedOrigins();
  if (origin && origins.length && !origins.includes(origin) && !origin.startsWith('http://localhost')) {
    return json(403, { ok: false, error: { code: 'FORBIDDEN_ORIGIN', message: 'Origin not allowed' } });
  }

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  if (rateLimited(ip, path)) {
    return json(429, { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please slow down' } }, { 'Retry-After': '60' });
  }

  let body;
  if (event.body) {
    body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf-8') : event.body;
    if (Buffer.byteLength(body, 'utf-8') > MAX_BODY_BYTES) {
      return json(413, { ok: false, error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } });
    }
  }

  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  for (const h of FORWARD_HEADERS) {
    if (event.headers[h]) headers[h] = event.headers[h];
  }

  try {
    const target = new URL(`${instanceUrl()}/services/apexrest/dw/v1/${path}`);
    for (const [k, v] of Object.entries(event.queryStringParameters || {})) {
      if (v != null) target.searchParams.set(k, v);
    }
    const res = await forward(target.toString(), { method, headers, body: method === 'GET' ? undefined : body });
    const text = await res.text();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      body: text || JSON.stringify({ ok: res.ok }),
    };
  } catch (error) {
    console.error('Proxy error', path, error.message);
    return json(502, { ok: false, error: { code: 'UPSTREAM_UNAVAILABLE', message: 'Service temporarily unavailable' } });
  }
};
