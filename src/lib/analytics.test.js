import { afterEach, beforeEach, vi } from 'vitest';
import { __test, EVENTS, track } from './analytics';
import { saveConsent } from './consent';
import { migrateLegacyKeys, read } from './session';

describe('analytics', () => {
  beforeEach(() => __test.reset());
  afterEach(() => __test.reset());

  it('records nothing without analytics consent', () => {
    track(EVENTS.SEARCH);
    expect(__test.queued()).toEqual([]);
    saveConsent(false);
    track(EVENTS.SEARCH);
    expect(__test.queued()).toEqual([]);
  });

  it('queues known events once consent is given', () => {
    saveConsent(true);
    track(EVENTS.SEARCH);
    track('made_up_event');
    expect(__test.queued()).toEqual([{ name: 'search' }]);
  });

  it('flushes a full batch immediately', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, data: {} }) })));
    saveConsent(true);
    for (let i = 0; i < 50; i += 1) track(EVENTS.PDP_VIEW);
    expect(__test.queued()).toEqual([]);
    expect(fetch).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});

describe('session migration', () => {
  it('moves legacy Deal & Wear keys to Find Your Fit keys', () => {
    localStorage.setItem('X-DW-Token', 'legacy-token');
    localStorage.setItem('pwa-install-dismissed', '123');
    migrateLegacyKeys();
    expect(read('token')).toBe('legacy-token');
    expect(read('installDismissed')).toBe('123');
    expect(localStorage.getItem('X-DW-Token')).toBeNull();
  });
});
