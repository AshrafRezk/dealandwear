import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { feedback, haptic, isHapticsOn, isSoundOn, setHaptics, setSound } from './feedback';

describe('feedback', () => {
  beforeEach(() => {
    localStorage.clear();
    navigator.vibrate = vi.fn();
  });
  afterEach(() => {
    delete navigator.vibrate;
  });

  it('is on by default and remembers when switched off', () => {
    expect(isSoundOn()).toBe(true);
    expect(isHapticsOn()).toBe(true);
    setSound(false);
    setHaptics(false);
    expect(localStorage.getItem('fyf.sound')).toBe('off');
    expect(isSoundOn()).toBe(false);
    expect(isHapticsOn()).toBe(false);
    setSound(true);
    expect(localStorage.getItem('fyf.sound')).toBeNull();
  });

  it('vibrates with the pattern for the moment', () => {
    haptic('like');
    expect(navigator.vibrate).toHaveBeenCalledWith([12, 40, 18]);
  });

  it('stays silent and still when switched off', () => {
    setHaptics(false);
    setSound(false);
    expect(() => feedback('success')).not.toThrow();
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });
});
