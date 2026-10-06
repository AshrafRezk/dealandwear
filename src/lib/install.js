import { useSyncExternalStore } from 'react';
import { EVENTS, track } from './analytics';

/**
 * Captures the browser's install prompt as early as possible (it can fire before React mounts)
 * and exposes install state to any component via useInstall().
 */

let deferred = null;
let installed = false;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

function standalone() {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)
  );
}

export function initInstall() {
  if (typeof window === 'undefined') return;
  installed = standalone();
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    track(EVENTS.INSTALL_ACCEPTED);
    emit();
  });
}

const isIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;

let snapshot = { canPrompt: false, installed: false, ios: false };
function getSnapshot() {
  const next = { canPrompt: Boolean(deferred), installed, ios: isIOS() && !installed };
  if (next.canPrompt !== snapshot.canPrompt || next.installed !== snapshot.installed || next.ios !== snapshot.ios) snapshot = next;
  return snapshot;
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Shows the native install dialog. Resolves to 'accepted', 'dismissed' or 'unavailable'. */
export async function promptInstall() {
  if (!deferred) return 'unavailable';
  const e = deferred;
  deferred = null;
  emit();
  e.prompt();
  const { outcome } = await e.userChoice;
  return outcome;
}

export function useInstall() {
  return useSyncExternalStore(subscribe, getSnapshot, () => snapshot);
}
