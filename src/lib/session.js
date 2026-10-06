const KEYS = {
  token: 'fyf.token',
  tokenExpiresAt: 'fyf.tokenExpiresAt',
  contactId: 'fyf.contactId',
  guest: 'fyf.guestToken',
  guestExpiresAt: 'fyf.guestExpiresAt',
  consent: 'fyf.consent',
  installDismissed: 'fyf.installDismissed',
  sessionId: 'fyf.sessionId',
  shopFor: 'fyf.shopFor',
  sound: 'fyf.sound',
  haptics: 'fyf.haptics',
};

const LEGACY = {
  'X-DW-Token': KEYS.token,
  'pwa-install-dismissed': KEYS.installDismissed,
};

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Moves values saved under the old Deal & Wear keys to the Find Your Fit keys (runs once per browser). */
export function migrateLegacyKeys() {
  const s = storage();
  if (!s) return;
  for (const [oldKey, newKey] of Object.entries(LEGACY)) {
    const value = s.getItem(oldKey);
    if (value !== null) {
      if (s.getItem(newKey) === null) s.setItem(newKey, value);
      s.removeItem(oldKey);
    }
  }
}

export function read(name) {
  return storage()?.getItem(KEYS[name]) ?? null;
}

export function write(name, value) {
  const s = storage();
  if (!s) return;
  if (value === null || value === undefined || value === '') s.removeItem(KEYS[name]);
  else s.setItem(KEYS[name], String(value));
}

export function clearShopper() {
  write('token', null);
  write('tokenExpiresAt', null);
  write('contactId', null);
}

/** A per-tab session id used to group quiz swipes and click-outs (not a tracking identifier). */
export function sessionId() {
  let id = null;
  try {
    id = window.sessionStorage.getItem(KEYS.sessionId);
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
      window.sessionStorage.setItem(KEYS.sessionId, id);
    }
  } catch {
    id = Math.random().toString(36).slice(2, 14);
  }
  return id;
}

/** Who the shopper is browsing for ('Women' | 'Men'), remembered from the quiz or profile. */
export function shopFor() {
  const v = read('shopFor');
  return v === 'Women' || v === 'Men' ? v : null;
}

export function setShopFor(value) {
  write('shopFor', value === 'Women' || value === 'Men' ? value : null);
}
