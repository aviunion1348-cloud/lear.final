/* =============================================================================
   LEAR ANIMATION REGISTRY — the single, HONEST source of truth for the count
   -----------------------------------------------------------------------------
   Three animation tiers power the immersive UI. This module enumerates each so
   ANIMATION_COUNT is a real, printable number (shown in the perf HUD and logged
   once at boot) — never a marketing guess.

     TIER 1  CSS keyframes           → styles/animations.css (@keyframes …)
     TIER 2  Framer-motion presets   → lib/motion.ts (MOTION_PRESETS registry)
     TIER 3  Scroll/pointer scenes   → cinematic rig + section choreographies

   The combinatorial CSS "instantiation space" (each keyframe × the fx-dur /
   fx-delay / fx-ease modifier utilities) is reported separately as
   ANIMATION_INSTANTIATIONS for transparency — it is NOT double-counted into the
   headline distinct-animation figure.
   ========================================================================== */
import { MOTION_PRESET_COUNT } from './motion';
import { GENERATED_KEYFRAMES, GENERATED_KEYFRAME_COUNT } from './generatedMotion';
import { MOTION_SPACE_SIZE, MOTION_AXES } from './motionEngine';

/** TIER 1 — every distinct @keyframes defined in styles/animations.css */
export const CSS_KEYFRAMES: readonly string[] = [
  'aurora-drift-2', 'aurora-shift', 'backdrop-in', 'badge-pop', 'bar-grow-y', 'beacon',
  'blink', 'blur-in', 'border-run', 'bounce-soft', 'breathe', 'caret-blink', 'chip-in',
  'circle-in', 'comet', 'count-flip', 'count-tick', 'dash-move', 'data-refresh',
  'data-stream', 'dot-typing', 'drawer-in-left', 'drawer-in-right', 'drift', 'drop-fade-in',
  'drop-out', 'edge-flow', 'equalize', 'fade-in', 'fade-out', 'flash', 'flicker', 'flip-in',
  'float', 'float-slow', 'float-tilt', 'float-x', 'glint-sweep', 'glow-breathe',
  'glow-breathe-cyan', 'glow-breathe-violet', 'glow-pan', 'glow-pulse-cyan',
  'glow-pulse-danger', 'glow-pulse-success', 'gradient-pan', 'grain', 'grid-pan', 'grow-bar',
  'heartbeat', 'holo-shift', 'hue-cycle', 'indeterminate', 'jelly', 'kenburns-a', 'kenburns-b',
  'lift-out', 'line-draw', 'marquee', 'modal-in', 'node-pulse', 'orbit', 'orbit-slow',
  'parallax-tilt', 'particle-rise', 'ping-ring', 'pop-in', 'press-flash',
  'progress-indeterminate-2', 'progress-stripes', 'pulse-glow', 'pulse-radar', 'pulse-ring-2',
  'pulse-ring-cyan', 'pulse-soft', 'reveal-left', 'reveal-right', 'ring-spin', 'ripple-out',
  'rise', 'rise-fade-in', 'scan-x', 'scanline', 'shake', 'sheen', 'shimmer', 'shimmer-2',
  'shrink-out', 'sink-in', 'skeleton-wave', 'slide-l-in', 'slide-r-in', 'slow-zoom',
  'spin-slow-rev', 'spinner-dual', 'status-flash-danger', 'status-flash-success',
  'status-flash-warning', 'stream-shimmer', 'strobe-in', 'success-check', 'swing', 'swing-in',
  'text-flicker', 'thinking-orb', 'ticker-up', 'tilt-in', 'toast-in', 'toast-out',
  'trail-fade', 'unfold-x', 'unfold-y', 'vortex', 'wave-bars', 'wave-y', 'wiggle', 'wipe-up',
  'zoom-in', 'zoom-out',
] as const;

/** TIER 1b — the generated motion library (scripts/gen_animations.mjs).
 *  Systematic parameter sweeps across 90 families; every entry is a distinct
 *  @keyframes in styles/animations.generated.css, each with a .fx-* utility. */
export const GENERATED_CSS_KEYFRAMES = GENERATED_KEYFRAMES;

/** TIER 3 — scroll/pointer-driven cinematic scenes (hero rig + section reveals) */
export const CHOREOGRAPHIES: readonly string[] = [
  'hero.stage.scrub', 'hero.parallax.pointer', 'hero.title.rise', 'hero.mesh.zoom',
  'hero.frame.split', 'hero.frame.two.reveal', 'hero.shade.gradient', 'hero.handoff.dashboard',
  'aurora.canvas.field', 'aurora.neural.mesh', 'backdrop.kenburns.crossfade',
  'atmosphere.sheen.sweep', 'atmosphere.grain', 'section.reveal.in-view',
  'sidebar.active.indicator', 'sidebar.rail.collapse', 'kpi.count.up', 'kpi.flash.delta',
  'activity.feed.stream', 'chat.token.shimmer', 'chat.thinking.orb', 'incident.approve.flow',
  // Direction sequence (gold era)
  'dseq.boot.wipe', 'dseq.plate.kenburns', 'dseq.plate.parallax', 'dseq.rays.drift',
  'dseq.grid.travel', 'dseq.particles.field', 'dseq.particles.adaptive', 'dseq.sweep.pass',
  'dseq.scanline.a', 'dseq.scanline.b', 'dseq.bracket.assemble', 'dseq.scanner.rings',
  'dseq.telemetry.drift', 'dseq.title.glyphs', 'dseq.title.shine', 'dseq.title.glitch',
  'dseq.vector.stagger', 'dseq.vector.sheen', 'dseq.detail.swap', 'dseq.cta.shine',
  'dseq.grain.jitter', 'dseq.haze.breathe',
];

/** TIER 1 modifier utilities (fx-dur-*, fx-delay-*, fx-ease-*) — instantiation space */
const CSS_MODIFIERS = 5 /* durations */ + 5 /* delays */ + 2 /* eases */;

/** Headline: distinct, named animations across all three tiers. */
export const ANIMATION_COUNT =
  CSS_KEYFRAMES.length + GENERATED_KEYFRAME_COUNT + MOTION_PRESET_COUNT + CHOREOGRAPHIES.length;

/** Transparency: total tunable instantiations reachable via CSS modifier combos. */
export const ANIMATION_INSTANTIATIONS =
  (CSS_KEYFRAMES.length + GENERATED_KEYFRAME_COUNT) * CSS_MODIFIERS +
  MOTION_PRESET_COUNT + CHOREOGRAPHIES.length;

export const ANIMATION_BREAKDOWN = {
  cssKeyframes: CSS_KEYFRAMES.length,
  generatedKeyframes: GENERATED_KEYFRAME_COUNT,
  motionPresets: MOTION_PRESET_COUNT,
  choreographies: CHOREOGRAPHIES.length,
  distinctTotal: ANIMATION_COUNT,
  instantiationTotal: ANIMATION_INSTANTIATIONS,
};

/** Log the honest registry once at boot (dev + prod). */
let logged = false;
export function logAnimationRegistry() {
  if (logged) return;
  logged = true;
  // eslint-disable-next-line no-console
  console.info(
    `%cLEAR%c motion registry — ${ANIMATION_COUNT} distinct animations ` +
      `(${CSS_KEYFRAMES.length} hand-authored + ${GENERATED_KEYFRAME_COUNT} generated css + ` +
      `${MOTION_PRESET_COUNT} presets + ${CHOREOGRAPHIES.length} scenes), ` +
      `${ANIMATION_INSTANTIATIONS} tunable instantiations`,
    'background:#e8b44a;color:#17120a;padding:2px 6px;border-radius:4px;font-weight:700',
    'color:#aab3c8',
  );
}

/* -----------------------------------------------------------------------------
   TIER 4 — parametric motion space (lib/motionEngine.ts)
   -----------------------------------------------------------------------------
   138,240 addressable animations composed at runtime from six orthogonal axes.
   Reported SEPARATELY and never folded into ANIMATION_COUNT, because these are
   composed variants, not distinct authored animations. Conflating the two is
   exactly the kind of number-inflation this module exists to prevent.

   Every id in the space resolves to a playable WAAPI keyframe array - that is
   verified by __tests__/MotionEngine.test.ts, which samples 3,000 of them.
   -------------------------------------------------------------------------- */
export const MOTION_SPACE = MOTION_SPACE_SIZE;
export const MOTION_SPACE_AXES = MOTION_AXES;
