/* =============================================================================
   PARAMETRIC MOTION ENGINE  —  TIER 4
   -----------------------------------------------------------------------------
   READ THIS BEFORE QUOTING THE BIG NUMBER.

   This module exposes a motion space of 138,240 addressable animations. That is
   a real, verifiable figure: every id in the space resolves to a valid Web
   Animations API keyframe array, and a test samples hundreds of them at random
   and plays each one to prove it.

   It is NOT 138,240 hand-authored animations, and this file will never claim it
   is. It is six orthogonal axes composed together:

       shape (40) x ease (12) x distance (4) x duration (6) x origin (6) x accent (4)

   The honest hand-authored/generated count stays what animationRegistry.ts has
   always reported: 2,183 distinct named animations. What TIER 4 adds is the
   ability to ask for an exact motion — "rise, from far, slow, from the top-left,
   with a gold bloom" — and get it, without anyone writing that keyframe.

   Why build it this way instead of generating 80,000 @keyframes blocks:

     · 80,000 keyframes is roughly 40-60 MB of CSS. The browser parses ALL of it
       before first paint and keeps the whole rule set in memory. It would take
       the console from "loads instantly" to "hangs for several seconds", which
       is the exact opposite of the 100fps goal every other part of this UI is
       built around.
     · The CSSOM cost is paid by every user on every load, including the ~99.9%
       of those animations nobody ever triggers.
     · Composition costs nothing until you call it. A motion is built on demand,
       as a small array of objects, and thrown away when it finishes.

   So the space is large AND the runtime stays small. Those are usually in
   tension; composition is how you get both.

   Everything composed here animates transform / opacity / filter ONLY, so every
   one of the 138,240 runs on the compositor.
   ========================================================================== */

/* -- AXIS 1: shape — what the motion actually does (40) -------------------- */
export const SHAPES = [
  'rise', 'fall', 'slide-left', 'slide-right', 'zoom-in', 'zoom-out',
  'fade', 'blur-in', 'blur-out', 'tilt-in', 'tilt-out', 'swing',
  'flip-x', 'flip-y', 'iris-in', 'iris-out', 'unfold', 'collapse',
  'spring-in', 'spring-out', 'drift', 'settle', 'snap', 'glide',
  'pop', 'deflate', 'shear', 'skew-in', 'roll-in', 'roll-out',
  'arc-in', 'arc-out', 'orbit-in', 'recede', 'approach', 'wobble',
  'pulse', 'flicker', 'sheen', 'warp',
] as const;
export type Shape = (typeof SHAPES)[number];

/* -- AXIS 2: easing (12) ---------------------------------------------------- */
export const EASES: Record<string, string> = {
  standard: 'cubic-bezier(0.2, 0, 0, 1)',
  decelerate: 'cubic-bezier(0.16, 1, 0.3, 1)',
  accelerate: 'cubic-bezier(0.7, 0, 0.84, 0)',
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'spring-soft': 'cubic-bezier(0.22, 1.2, 0.36, 1)',
  swift: 'cubic-bezier(0.22, 1, 0.36, 1)',
  anticipate: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
  linear: 'linear',
  'ease-in-out': 'ease-in-out',
  gentle: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.9, 0, 0.1, 1)',
};
export const EASE_KEYS = Object.keys(EASES);

/* -- AXIS 3: distance / intensity (4) -------------------------------------- */
export const DISTANCES: Record<string, number> = {
  near: 6,
  mid: 14,
  far: 28,
  epic: 56,
};
export const DISTANCE_KEYS = Object.keys(DISTANCES);

/* -- AXIS 4: duration tier (6) ---------------------------------------------
   Capped at 900ms on purpose. This is a console people work in; anything
   longer stops reading as polish and starts reading as latency.             */
export const DURATIONS: Record<string, number> = {
  instant: 90,
  quick: 160,
  brisk: 240,
  normal: 340,
  slow: 520,
  cinematic: 900,
};
export const DURATION_KEYS = Object.keys(DURATIONS);

/* -- AXIS 5: transform origin (6) ------------------------------------------ */
export const ORIGINS: Record<string, string> = {
  center: '50% 50%',
  top: '50% 0%',
  bottom: '50% 100%',
  left: '0% 50%',
  right: '100% 50%',
  'top-left': '0% 0%',
};
export const ORIGIN_KEYS = Object.keys(ORIGINS);

/* -- AXIS 6: accent treatment (4) ------------------------------------------ */
export const ACCENTS = ['none', 'gold', 'bloom', 'contrast'] as const;
export type Accent = (typeof ACCENTS)[number];

/** The full addressable space. 40 x 12 x 4 x 6 x 6 x 4 = 138,240. */
export const MOTION_SPACE_SIZE =
  SHAPES.length *
  EASE_KEYS.length *
  DISTANCE_KEYS.length *
  DURATION_KEYS.length *
  ORIGIN_KEYS.length *
  ACCENTS.length;

export interface MotionSpec {
  shape: Shape;
  ease: string;
  distance: string;
  duration: string;
  origin: string;
  accent: Accent;
}

/** Canonical id: "rise.swift.far.normal.top.gold" */
export const specToId = (s: MotionSpec) =>
  `${s.shape}.${s.ease}.${s.distance}.${s.duration}.${s.origin}.${s.accent}`;

export function parseMotionId(id: string): MotionSpec | null {
  const [shape, ease, distance, duration, origin, accent] = id.split('.');
  if (
    !SHAPES.includes(shape as Shape) ||
    !(ease in EASES) ||
    !(distance in DISTANCES) ||
    !(duration in DURATIONS) ||
    !(origin in ORIGINS) ||
    !ACCENTS.includes(accent as Accent)
  ) {
    return null;
  }
  return { shape: shape as Shape, ease, distance, duration, origin, accent: accent as Accent };
}

/** Deterministic index -> spec, so the whole space is enumerable. */
export function specAtIndex(i: number): MotionSpec {
  const n = ((i % MOTION_SPACE_SIZE) + MOTION_SPACE_SIZE) % MOTION_SPACE_SIZE;
  let r = n;
  const accent = ACCENTS[r % ACCENTS.length]; r = Math.floor(r / ACCENTS.length);
  const origin = ORIGIN_KEYS[r % ORIGIN_KEYS.length]; r = Math.floor(r / ORIGIN_KEYS.length);
  const duration = DURATION_KEYS[r % DURATION_KEYS.length]; r = Math.floor(r / DURATION_KEYS.length);
  const distance = DISTANCE_KEYS[r % DISTANCE_KEYS.length]; r = Math.floor(r / DISTANCE_KEYS.length);
  const ease = EASE_KEYS[r % EASE_KEYS.length]; r = Math.floor(r / EASE_KEYS.length);
  const shape = SHAPES[r % SHAPES.length];
  return { shape, ease, distance, duration, origin, accent };
}

/* -- shape -> the transform pair it interpolates between ------------------- */
function shapeFrames(shape: Shape, d: number): [string, string] {
  const half = d / 2;
  switch (shape) {
    case 'rise':        return [`translate3d(0,${d}px,0)`, 'translate3d(0,0,0)'];
    case 'fall':        return [`translate3d(0,${-d}px,0)`, 'translate3d(0,0,0)'];
    case 'slide-left':  return [`translate3d(${d}px,0,0)`, 'translate3d(0,0,0)'];
    case 'slide-right': return [`translate3d(${-d}px,0,0)`, 'translate3d(0,0,0)'];
    case 'zoom-in':     return [`scale(${1 - d / 200})`, 'scale(1)'];
    case 'zoom-out':    return [`scale(${1 + d / 200})`, 'scale(1)'];
    case 'fade':        return ['translate3d(0,0,0)', 'translate3d(0,0,0)'];
    case 'blur-in':     return [`scale(${1 - d / 400})`, 'scale(1)'];
    case 'blur-out':    return [`scale(${1 + d / 400})`, 'scale(1)'];
    case 'tilt-in':     return [`perspective(800px) rotateX(${d / 3}deg)`, 'perspective(800px) rotateX(0deg)'];
    case 'tilt-out':    return [`perspective(800px) rotateX(${-d / 3}deg)`, 'perspective(800px) rotateX(0deg)'];
    case 'swing':       return [`rotate(${d / 5}deg)`, 'rotate(0deg)'];
    case 'flip-x':      return [`perspective(900px) rotateX(${d * 2}deg)`, 'perspective(900px) rotateX(0deg)'];
    case 'flip-y':      return [`perspective(900px) rotateY(${d * 2}deg)`, 'perspective(900px) rotateY(0deg)'];
    case 'iris-in':     return [`scale(${1 - d / 120})`, 'scale(1)'];
    case 'iris-out':    return [`scale(${1 + d / 120})`, 'scale(1)'];
    case 'unfold':      return [`scaleY(${Math.max(0.1, 1 - d / 80)})`, 'scaleY(1)'];
    case 'collapse':    return [`scaleY(${1 + d / 160})`, 'scaleY(1)'];
    case 'spring-in':   return [`translate3d(0,${d}px,0) scale(0.96)`, 'translate3d(0,0,0) scale(1)'];
    case 'spring-out':  return [`translate3d(0,${-half}px,0) scale(1.04)`, 'translate3d(0,0,0) scale(1)'];
    case 'drift':       return [`translate3d(${half}px,${half}px,0)`, 'translate3d(0,0,0)'];
    case 'settle':      return [`translate3d(0,${-half}px,0) scale(1.02)`, 'translate3d(0,0,0) scale(1)'];
    case 'snap':        return [`scale(${1 + d / 300})`, 'scale(1)'];
    case 'glide':       return [`translate3d(${-d}px,${half}px,0)`, 'translate3d(0,0,0)'];
    case 'pop':         return [`scale(${1 - d / 100})`, 'scale(1)'];
    case 'deflate':     return [`scale(${1 + d / 100})`, 'scale(1)'];
    case 'shear':       return [`skewX(${d / 4}deg)`, 'skewX(0deg)'];
    case 'skew-in':     return [`skewY(${d / 6}deg) translate3d(0,${half}px,0)`, 'skewY(0deg) translate3d(0,0,0)'];
    case 'roll-in':     return [`translate3d(${-d}px,0,0) rotate(${-d / 3}deg)`, 'translate3d(0,0,0) rotate(0deg)'];
    case 'roll-out':    return [`translate3d(${d}px,0,0) rotate(${d / 3}deg)`, 'translate3d(0,0,0) rotate(0deg)'];
    case 'arc-in':      return [`translate3d(${-half}px,${d}px,0) rotate(${-d / 8}deg)`, 'translate3d(0,0,0) rotate(0deg)'];
    case 'arc-out':     return [`translate3d(${half}px,${-d}px,0) rotate(${d / 8}deg)`, 'translate3d(0,0,0) rotate(0deg)'];
    case 'orbit-in':    return [`rotate(${-d}deg) scale(0.9)`, 'rotate(0deg) scale(1)'];
    case 'recede':      return [`perspective(900px) translateZ(${d}px)`, 'perspective(900px) translateZ(0)'];
    case 'approach':    return [`perspective(900px) translateZ(${-d}px)`, 'perspective(900px) translateZ(0)'];
    case 'wobble':      return [`rotate(${d / 6}deg) scale(1.02)`, 'rotate(0deg) scale(1)'];
    case 'pulse':       return [`scale(${1 + d / 500})`, 'scale(1)'];
    case 'flicker':     return ['scale(1)', 'scale(1)'];
    case 'sheen':       return [`translate3d(${-d}px,0,0)`, 'translate3d(0,0,0)'];
    case 'warp':        return [`perspective(700px) rotateY(${d / 2}deg) scale(0.97)`, 'perspective(700px) rotateY(0deg) scale(1)'];
    default:            return ['translate3d(0,0,0)', 'translate3d(0,0,0)'];
  }
}

function accentFilter(accent: Accent, shape: Shape, d: number): [string, string] {
  const blur = shape === 'blur-in' || shape === 'blur-out' ? Math.min(12, d / 3) : 0;
  const base: [string, string] = blur ? [`blur(${blur}px)`, 'blur(0px)'] : ['none', 'none'];
  switch (accent) {
    case 'gold':
      return [
        `${blur ? `blur(${blur}px) ` : ''}drop-shadow(0 0 0 rgba(232,180,74,0))`,
        `${blur ? 'blur(0px) ' : ''}drop-shadow(0 0 10px rgba(232,180,74,0.35))`,
      ];
    case 'bloom':
      return [
        `${blur ? `blur(${blur}px) ` : ''}brightness(1.35) saturate(1.2)`,
        `${blur ? 'blur(0px) ' : ''}brightness(1) saturate(1)`,
      ];
    case 'contrast':
      return [
        `${blur ? `blur(${blur}px) ` : ''}contrast(1.25)`,
        `${blur ? 'blur(0px) ' : ''}contrast(1)`,
      ];
    default:
      return base;
  }
}

export interface ComposedMotion {
  id: string;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

/**
 * Compose a motion id into something the Web Animations API can play.
 * Pure: no DOM access, safe to call in tests and on the server.
 */
export function composeMotion(idOrSpec: string | MotionSpec): ComposedMotion | null {
  const spec = typeof idOrSpec === 'string' ? parseMotionId(idOrSpec) : idOrSpec;
  if (!spec) return null;

  const d = DISTANCES[spec.distance];
  const [fromT, toT] = shapeFrames(spec.shape, d);
  const [fromF, toF] = accentFilter(spec.accent, spec.shape, d);
  const fadeless = spec.shape === 'pulse' || spec.shape === 'wobble' || spec.shape === 'snap';

  const keyframes: Keyframe[] = [
    {
      transform: fromT,
      opacity: fadeless ? 1 : 0,
      filter: fromF,
      transformOrigin: ORIGINS[spec.origin],
      offset: 0,
    },
    ...(spec.shape === 'flicker'
      ? [{ opacity: 0.35, offset: 0.4 }, { opacity: 0.85, offset: 0.7 }]
      : []),
    {
      transform: toT,
      opacity: 1,
      filter: toF,
      transformOrigin: ORIGINS[spec.origin],
      offset: 1,
    },
  ];

  return {
    id: specToId(spec),
    keyframes,
    options: {
      duration: DURATIONS[spec.duration],
      easing: EASES[spec.ease],
      fill: 'both',
      // 'both' matters: if the animation is interrupted or never started, the
      // element holds a defined state instead of being stranded invisible.
    },
  };
}

/**
 * Play a composed motion on an element.
 * Returns the Animation, or null if the motion id was invalid, the platform
 * has no WAAPI, or the user asked for reduced motion — in every one of those
 * cases the element is simply left in its natural, visible state.
 */
export function playMotion(el: Element, id: string): Animation | null {
  if (typeof window === 'undefined') return null;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  if (typeof (el as HTMLElement).animate !== 'function') return null;

  const m = composeMotion(id);
  if (!m) return null;

  const anim = (el as HTMLElement).animate(m.keyframes, m.options);
  // Hand the compositor layer back as soon as the motion is done.
  anim.finished
    .then(() => {
      (el as HTMLElement).style.willChange = 'auto';
    })
    .catch(() => { /* cancelled — nothing to clean up */ });
  return anim;
}

/** Enumerate a slice of the space. Used by the perf HUD and by tests. */
export function enumerateMotions(start: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) out.push(specToId(specAtIndex(start + i)));
  return out;
}

export const MOTION_AXES = {
  shape: SHAPES.length,
  ease: EASE_KEYS.length,
  distance: DISTANCE_KEYS.length,
  duration: DURATION_KEYS.length,
  origin: ORIGIN_KEYS.length,
  accent: ACCENTS.length,
} as const;
