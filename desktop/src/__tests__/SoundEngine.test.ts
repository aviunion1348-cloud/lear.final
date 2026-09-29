import { describe, expect, it, beforeEach } from 'vitest';
import {
  SFX_COUNT,
  SFX_NAMES,
  sfx,
  isSfxEnabled,
  setSfxEnabled,
  setSfxVolume,
  getSfxVolume,
} from '../lib/soundEngine';

describe('soundEngine registry (U-fx: 200+ sound effects)', () => {
  it('exposes at least 200 distinct named sound recipes', () => {
    expect(SFX_COUNT).toBeGreaterThanOrEqual(200);
  });

  it('names are unique, sorted, and namespaced', () => {
    expect(new Set(SFX_NAMES).size).toBe(SFX_NAMES.length);
    const sorted = [...SFX_NAMES].sort();
    expect(SFX_NAMES).toEqual(sorted);
    expect(SFX_NAMES.every((n) => n.includes('.'))).toBe(true);
  });

  it('covers the required UI surface namespaces', () => {
    const ns = new Set(SFX_NAMES.map((n) => n.split('.')[0]));
    for (const required of ['ui', 'nav', 'toast', 'hero', 'chat', 'watch', 'incident', 'system']) {
      expect(ns.has(required), `missing namespace ${required}`).toBe(true);
    }
  });

  it('sfx() is a safe no-op when there is no AudioContext (jsdom)', () => {
    expect(() => sfx('ui.click.01')).not.toThrow();
    expect(() => sfx('does.not.exist')).not.toThrow();
  });
});

describe('soundEngine preferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to enabled with a high volume', () => {
    expect(isSfxEnabled()).toBe(true);
    expect(getSfxVolume()).toBeCloseTo(0.9, 5);
  });

  it('persists enable/disable', () => {
    setSfxEnabled(false);
    expect(isSfxEnabled()).toBe(false);
    setSfxEnabled(true);
    expect(isSfxEnabled()).toBe(true);
  });

  it('clamps volume into [0, MAX_VOLUME]', () => {
    setSfxVolume(2);
    expect(getSfxVolume()).toBe(1.6);
    setSfxVolume(-1);
    expect(getSfxVolume()).toBe(0);
    setSfxVolume(0.25);
    expect(getSfxVolume()).toBeCloseTo(0.25, 5);
  });
});
