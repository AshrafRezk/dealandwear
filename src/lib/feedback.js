import { useSyncExternalStore } from 'react';
import { read, write } from './session';

/**
 * Haptics and sound cues for key moments (swipes, saves, unlocking the Style DNA).
 * Sounds are synthesised with Web Audio, so there are no audio files to download or cache.
 * Both are on by default and can be switched off from the quiz header or Profile.
 */

const listeners = new Set();

export function isSoundOn() {
  return read('sound') !== 'off';
}

export function isHapticsOn() {
  return read('haptics') !== 'off';
}

export function setSound(on) {
  write('sound', on ? null : 'off');
  listeners.forEach((fn) => fn());
}

export function setHaptics(on) {
  write('haptics', on ? null : 'off');
  listeners.forEach((fn) => fn());
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const prefsKey = () => `${isSoundOn()}|${isHapticsOn()}`;

export function useFeedbackPrefs() {
  useSyncExternalStore(subscribe, prefsKey, prefsKey);
  return { sound: isSoundOn(), haptics: isHapticsOn() };
}

// ---------------------------------------------------------------- haptics

const PATTERNS = {
  tap: 8,
  like: [12, 40, 18],
  dislike: 14,
  skip: 6,
  undo: [6, 30, 6],
  save: [10, 30, 10],
  success: [14, 50, 14, 50, 28],
  error: [30, 40, 30],
};

let iosSwitch;

/** iOS Safari has no Vibration API, but toggling a native switch control gives a system haptic (iOS 18+). */
function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-9999px';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    label.appendChild(input);
    document.body.appendChild(label);
    iosSwitch = label;
  }
  iosSwitch.click();
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function haptic(kind = 'tap') {
  if (!isHapticsOn() || prefersReducedMotion() || typeof navigator === 'undefined') return;
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(PATTERNS[kind] ?? PATTERNS.tap);
    } else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      iosTick();
      if (kind === 'success' || kind === 'like' || kind === 'error') window.setTimeout(iosTick, 90);
    }
  } catch {
    // Haptics are best-effort.
  }
}

// ---------------------------------------------------------------- sound

let ctx;

function audio() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!ctx) ctx = new Ctx();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** One soft sine/triangle note with a quick attack and exponential release. */
function note(ac, { freq, start = 0, dur = 0.12, type = 'sine', gain = 0.06, slideTo }) {
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

const SOUNDS = {
  tap: (ac) => note(ac, { freq: 880, dur: 0.05, type: 'triangle', gain: 0.025 }),
  like: (ac) => {
    note(ac, { freq: 659.25, dur: 0.12 });
    note(ac, { freq: 987.77, start: 0.07, dur: 0.18 });
  },
  dislike: (ac) => note(ac, { freq: 330, slideTo: 247, dur: 0.14, type: 'triangle', gain: 0.045 }),
  skip: (ac) => note(ac, { freq: 520, slideTo: 780, dur: 0.09, type: 'sine', gain: 0.03 }),
  undo: (ac) => note(ac, { freq: 700, slideTo: 466, dur: 0.12, type: 'sine', gain: 0.035 }),
  save: (ac) => {
    note(ac, { freq: 784, dur: 0.08, type: 'triangle', gain: 0.04 });
    note(ac, { freq: 1175, start: 0.05, dur: 0.12, gain: 0.04 });
  },
  success: (ac) => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => note(ac, { freq, start: i * 0.09, dur: 0.28, gain: 0.05 }));
  },
  error: (ac) => {
    note(ac, { freq: 220, dur: 0.12, type: 'triangle', gain: 0.05 });
    note(ac, { freq: 196, start: 0.12, dur: 0.16, type: 'triangle', gain: 0.05 });
  },
};

export function sound(kind = 'tap') {
  if (!isSoundOn()) return;
  try {
    const ac = audio();
    if (ac) SOUNDS[kind]?.(ac);
  } catch {
    // Sound is best-effort.
  }
}

/** Haptic + sound together, the usual call site. */
export function feedback(kind = 'tap') {
  haptic(kind);
  sound(kind);
}
