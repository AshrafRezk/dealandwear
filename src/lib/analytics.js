import { api } from './api';
import { read } from './session';

/**
 * Event dictionary (must match FyfShopperService.TRACKED_EVENTS). Events are aggregate daily counters in Salesforce:
 * no ids, no properties, nothing personal. They are only sent when the shopper accepted analytics.
 */
export const EVENTS = Object.freeze({
  APP_OPEN: 'app_open',
  QUIZ_START: 'quiz_start',
  QUIZ_COMPLETE: 'quiz_complete',
  DNA_VIEW: 'dna_view',
  DNA_SHARE: 'dna_share',
  SEARCH: 'search',
  SEARCH_ZERO: 'search_zero',
  PDP_VIEW: 'pdp_view',
  SAVE: 'save',
  CLICK_OUT: 'click_out',
  BRAND_VIEW: 'brand_view',
  BRAND_FOLLOW: 'brand_follow',
  SIGNUP_START: 'signup_start',
  SIGNUP_COMPLETE: 'signup_complete',
  LOGIN: 'login',
  INSTALL_PROMPT: 'install_prompt',
  INSTALL_ACCEPTED: 'install_accepted',
  FEED_VIEW: 'feed_view',
  FILTER_APPLY: 'filter_apply',
  SHARE_PRODUCT: 'share_product',
});

const ALLOWED = new Set(Object.values(EVENTS));
const FLUSH_MS = 8000;
const MAX_BATCH = 50;
let queue = [];
let timer = null;

export function analyticsAllowed() {
  try {
    return JSON.parse(read('consent') || '{}').analytics === true;
  } catch {
    return false;
  }
}

export function track(name) {
  if (!ALLOWED.has(name) || !analyticsAllowed()) return;
  queue.push({ name });
  if (queue.length >= MAX_BATCH) {
    flush();
  } else if (!timer) {
    timer = setTimeout(flush, FLUSH_MS);
  }
}

export function flush({ beacon = false } = {}) {
  clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const events = queue.splice(0, MAX_BATCH);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/dw/events', new Blob([JSON.stringify({ events })], { type: 'application/json' }));
    return;
  }
  api.post('events', { events }).catch(() => {});
}

export function installAnalyticsFlush() {
  const onHide = () => {
    if (document.visibilityState === 'hidden') flush({ beacon: true });
  };
  document.addEventListener('visibilitychange', onHide);
  return () => document.removeEventListener('visibilitychange', onHide);
}

export const __test = {
  reset() {
    queue = [];
    clearTimeout(timer);
    timer = null;
  },
  queued: () => queue.slice(),
};
