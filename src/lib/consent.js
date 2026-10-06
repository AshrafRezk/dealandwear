import { read, write } from './session';

export function readConsent() {
  try {
    return JSON.parse(read('consent') || 'null');
  } catch {
    return null;
  }
}

export function saveConsent(analytics) {
  write('consent', JSON.stringify({ analytics, decidedAt: new Date().toISOString(), version: 1 }));
}
