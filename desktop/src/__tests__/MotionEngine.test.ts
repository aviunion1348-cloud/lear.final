/* =============================================================================
   PARAMETRIC MOTION ENGINE CONTRACT
   -----------------------------------------------------------------------------
   The engine advertises a six-figure motion space. A number that large is only
   worth anything if every id in it actually resolves to a playable animation,
   so these tests walk and sample the space rather than trusting the arithmetic.

   They also enforce the rules that keep 138,240 animations from becoming
   138,240 ways to drop frames or strand an element invisible.
   ========================================================================== */
import { describe, it, expect } from 'vitest';
import {
  MOTION_SPACE_SIZE, MOTION_AXES, SHAPES, EASE_KEYS, DISTANCE_KEYS,
  DURATION_KEYS, ORIGIN_KEYS, ACCENTS, DURATIONS,
  composeMotion, parseMotionId, specToId, specAtIndex, enumerateMotions,
} from '../lib/motionEngine';

describe('motion space', () => {
  it('advertises a space of 80,000+ addressable animations', () => {
    expect(MOTION_SPACE_SIZE).toBeGreaterThanOrEqual(80_000);
  });

  it('the advertised size is the actual product of the axes, not a claim', () => {
    const product = Object.values(MOTION_AXES).reduce((a, b) => a * b, 1);
    expect(MOTION_SPACE_SIZE).toBe(product);
    expect(MOTION_AXES.shape).toBe(SHAPES.length);
    expect(MOTION_AXES.ease).toBe(EASE_KEYS.length);
    expect(MOTION_AXES.distance).toBe(DISTANCE_KEYS.length);
    expect(MOTION_AXES.duration).toBe(DURATION_KEYS.length);
    expect(MOTION_AXES.origin).toBe(ORIGIN_KEYS.length);
    expect(MOTION_AXES.accent).toBe(ACCENTS.length);
  });

  it('indexes the whole space without collision (10k sample)', () => {
    const seen = new Set<string>();
    const step = Math.floor(MOTION_SPACE_SIZE / 10_000);
    for (let i = 0; i < MOTION_SPACE_SIZE; i += step) seen.add(specToId(specAtIndex(i)));
    expect(seen.size).toBe(Math.ceil(MOTION_SPACE_SIZE / step));
  });

  it('round-trips every id it generates', () => {
    for (const id of enumerateMotions(0, 2_000)) {
      const spec = parseMotionId(id);
      expect(spec, `failed to parse ${id}`).not.toBeNull();
      expect(specToId(spec!)).toBe(id);
    }
  });

  it('rejects ids outside the space instead of silently guessing', () => {
    for (const bad of ['', 'rise', 'nope.swift.far.normal.top.gold',
                       'rise.nope.far.normal.top.gold', 'rise.swift.far.normal.top.neon']) {
      expect(parseMotionId(bad)).toBeNull();
      expect(composeMotion(bad)).toBeNull();
    }
  });
});

describe('every composed motion is playable and cheap', () => {
  // Spread the sample across the whole space rather than the first N.
  const SAMPLE = 3_000;
  const stride = Math.max(1, Math.floor(MOTION_SPACE_SIZE / SAMPLE));
  const sample = Array.from({ length: SAMPLE }, (_, k) => specAtIndex(k * stride));

  it('composes without returning null', () => {
    for (const spec of sample) {
      expect(composeMotion(spec), `${specToId(spec)} failed to compose`).not.toBeNull();
    }
  });

  it('only ever animates compositor-safe properties', () => {
    const ALLOWED = new Set(['transform', 'opacity', 'filter', 'transformOrigin', 'offset']);
    for (const spec of sample) {
      const m = composeMotion(spec)!;
      for (const kf of m.keyframes) {
        for (const key of Object.keys(kf)) {
          expect(ALLOWED.has(key), `${m.id} animates "${key}"`).toBe(true);
        }
      }
    }
  });

  it('never produces NaN or undefined inside a transform', () => {
    for (const spec of sample) {
      const m = composeMotion(spec)!;
      for (const kf of m.keyframes) {
        const t = String((kf as any).transform ?? '');
        expect(t.includes('NaN'), `${m.id} -> ${t}`).toBe(false);
        expect(t.includes('undefined'), `${m.id} -> ${t}`).toBe(false);
      }
    }
  });

  it('always ends fully visible, so nothing can be stranded invisible', () => {
    for (const spec of sample) {
      const m = composeMotion(spec)!;
      const last = m.keyframes[m.keyframes.length - 1];
      expect(last.opacity).toBe(1);
      expect(last.offset).toBe(1);
    }
  });

  it('uses fill:both so an interrupted motion holds a defined state', () => {
    for (const spec of sample.slice(0, 200)) {
      expect(composeMotion(spec)!.options.fill).toBe('both');
    }
  });

  it('caps duration at 900ms — this is a console, not a title sequence', () => {
    for (const d of Object.values(DURATIONS)) {
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThanOrEqual(900);
    }
    for (const spec of sample.slice(0, 500)) {
      expect(composeMotion(spec)!.options.duration as number).toBeLessThanOrEqual(900);
    }
  });
});

describe('the big number stays honest', () => {
  it('does not inflate the hand-authored registry count', async () => {
    // TIER 4 is a composition space. The distinct named-animation figure that
    // animationRegistry.ts publishes must NOT absorb it.
    const reg = await import('../lib/animationRegistry');
    expect(reg.ANIMATION_COUNT).toBeLessThan(MOTION_SPACE_SIZE);
    expect(reg.ANIMATION_COUNT).toBeGreaterThanOrEqual(900);
  });

  it('ships no giant generated stylesheet to back the space', async () => {
    // The whole point: the space costs nothing until composed. If someone ever
    // "helpfully" generates 138k keyframes into CSS, this fails.
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const css = readFileSync(
      resolve(__dirname, '../styles/animations.generated.css'),
      'utf8',
    );
    const blocks = (css.match(/@keyframes/g) ?? []).length;
    expect(blocks).toBeLessThan(5_000);
  });
});
