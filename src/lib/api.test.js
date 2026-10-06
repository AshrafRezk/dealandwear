import { afterEach, beforeEach, vi } from 'vitest';
import { __test, api, ApiError, ensureGuest, setSignedOutHandler } from './api';
import { read, write } from './session';

function respond(status, body) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
}

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    setSignedOutHandler(() => {});
  });

  it('builds proxy URLs and skips empty params', () => {
    const url = new URL(__test.buildUrl('catalog/search', { q: 'linen', category: '', sizes: ['S', 'M'], offset: 0 }));
    expect(url.pathname).toBe('/api/dw/catalog/search');
    expect(url.searchParams.get('q')).toBe('linen');
    expect(url.searchParams.has('category')).toBe(false);
    expect(url.searchParams.get('sizes')).toBe('S,M');
    expect(url.searchParams.get('offset')).toBe('0');
  });

  it('unwraps the success envelope', async () => {
    fetch.mockReturnValue(respond(200, { ok: true, data: { items: [1, 2] } }));
    await expect(api.get('feed')).resolves.toEqual({ items: [1, 2] });
  });

  it('throws ApiError with the server code and message', async () => {
    fetch.mockReturnValue(respond(409, { ok: false, error: { code: 'EMAIL_IN_USE', message: 'An account with this email already exists' } }));
    const err = await api.post('auth/register', {}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(409);
    expect(err.code).toBe('EMAIL_IN_USE');
    expect(err.message).toMatch(/already exists/);
  });

  it('sends the shopper token, else the guest token', async () => {
    fetch.mockReturnValue(respond(200, { ok: true, data: {} }));
    write('guest', 'g-1');
    write('guestExpiresAt', Date.now() + 60_000);
    await api.get('dna');
    expect(fetch.mock.calls[0][1].headers['X-DW-Guest']).toBe('g-1');

    write('token', 't-1');
    write('tokenExpiresAt', new Date(Date.now() + 3_600_000).toISOString());
    await api.get('dna');
    expect(fetch.mock.calls[1][1].headers['X-DW-Token']).toBe('t-1');
    expect(fetch.mock.calls[1][1].headers['X-DW-Guest']).toBeUndefined();
  });

  it('clears an expired shopper session on 401 and notifies the app', async () => {
    const handler = vi.fn();
    setSignedOutHandler(handler);
    write('token', 't-1');
    write('tokenExpiresAt', new Date(Date.now() + 3_600_000).toISOString());
    fetch.mockReturnValue(respond(401, { ok: false, error: { code: 'UNAUTHORIZED', message: 'Sign in to continue' } }));
    await api.get('me').catch(() => {});
    expect(read('token')).toBeNull();
    expect(handler).toHaveBeenCalledOnce();
  });

  it('reports network failures in plain language', async () => {
    fetch.mockReturnValue(Promise.reject(new TypeError('Failed to fetch')));
    const err = await api.get('feed').catch((e) => e);
    expect(err.code).toBe('NETWORK');
  });

  it('starts one guest session for concurrent callers', async () => {
    fetch.mockReturnValue(respond(200, { ok: true, data: { guestToken: 'g-new', expiresInMinutes: 60 } }));
    const [a, b] = await Promise.all([ensureGuest(), ensureGuest()]);
    expect(a).toBe('g-new');
    expect(b).toBe('g-new');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(read('guest')).toBe('g-new');
  });
});
