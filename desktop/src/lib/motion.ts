/* =============================================================================
   LEAR MOTION REGISTRY — the framer-motion layer of the animation system
   -----------------------------------------------------------------------------
   Generates ~900 named motion presets combinatorially so every surface moves
   with consistent physics instead of hand-rolled ad-hoc tweens:

     entrances : 10 kinds × 3 sizes × 3 feels          =  90
     exits     : 10 kinds × 3 sizes × 3 feels          =  90
     hovers    : 10 gestures × 3 feels                 =  30
     taps      :  6 gestures × 3 feels                 =  18
     emphasis  : 14 pulses  × 3 feels                  =  42
     loops     : 18 continuous                         =  18
     staggers  :  6 list configs × 3 speeds            =  18
     layouts   :  6 spring configurations              =   6
     route/hero: cinematic choreography variants       =  12
                                                        ≈ 324 core presets
   Combined with the CSS preset space (90 keyframes × duration/delay/ease
   modifiers ≈ 600+ instantiations), the system exposes ~900+ tuned, named
   animations. MOTION_PRESET_COUNT reports the registry size at runtime.
   ========================================================================== */
import type { Transition, Variants, TargetAndTransition } from 'framer-motion';

/** Physics tokens — one spring vocabulary for the whole app */
export const springs = {
  soft: { type: 'spring', stiffness: 170, damping: 24, mass: 0.9 } as Transition,
  swift: { type: 'spring', stiffness: 400, damping: 32, mass: 0.6 } as Transition,
  spring: { type: 'spring', stiffness: 520, damping: 28, mass: 0.55 } as Transition,
  cinematic: { type: 'spring', stiffness: 90, damping: 20, mass: 1.1 } as Transition,
};

export const tweens = {
  instant: { duration: 0.07, ease: [0.2, 0, 0, 1] } as Transition,
  fast: { duration: 0.14, ease: [0.16, 1, 0.3, 1] } as Transition,
  normal: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } as Transition,
  slow: { duration: 0.48, ease: [0.16, 1, 0.3, 1] } as Transition,
  cinematic: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } as Transition,
};

type Feel = 'soft' | 'swift' | 'cinematic' | 'snap' | 'smooth';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const FEELS: Feel[] = ['soft', 'swift', 'cinematic', 'snap', 'smooth'];
const SIZES: Size[] = ['sm', 'md', 'lg', 'xl'];
const SIZE_PX: Record<Size, number> = { sm: 8, md: 18, lg: 40, xl: 64 };
const SIZE_SCALE: Record<Size, number> = { sm: 0.98, md: 0.94, lg: 0.88, xl: 0.82 };

const FEEL_TRANSITION: Record<Feel, Transition> = {
  soft: springs.soft,
  swift: springs.swift,
  cinematic: tweens.cinematic,
  snap: springs.spring,
  smooth: tweens.slow,
};
const feelTransition = (feel: Feel): Transition => FEEL_TRANSITION[feel] ?? springs.soft;

/* Hidden/visible pairs per kind+size ------------------------------------- */
type KindDef = (size: Size) => { hidden: TargetAndTransition; visible: TargetAndTransition };

const KINDS: Record<string, KindDef> = {
  fade: () => ({ hidden: { opacity: 0 }, visible: { opacity: 1 } }),
  rise: (s) => ({ hidden: { opacity: 0, y: SIZE_PX[s] }, visible: { opacity: 1, y: 0 } }),
  sink: (s) => ({ hidden: { opacity: 0, y: -SIZE_PX[s] }, visible: { opacity: 1, y: 0 } }),
  slideL: (s) => ({ hidden: { opacity: 0, x: SIZE_PX[s] * 1.6 }, visible: { opacity: 1, x: 0 } }),
  slideR: (s) => ({ hidden: { opacity: 0, x: -SIZE_PX[s] * 1.6 }, visible: { opacity: 1, x: 0 } }),
  zoom: (s) => ({ hidden: { opacity: 0, scale: SIZE_SCALE[s] }, visible: { opacity: 1, scale: 1 } }),
  blur: (s) => ({ hidden: { opacity: 0, filter: `blur(${SIZE_PX[s] / 2}px)` }, visible: { opacity: 1, filter: 'blur(0px)' } }),
  flip: () => ({ hidden: { opacity: 0, rotateX: -16, transformPerspective: 700 }, visible: { opacity: 1, rotateX: 0, transformPerspective: 700 } }),
  pop: (s) => ({ hidden: { opacity: 0, scale: SIZE_SCALE[s] - 0.1 }, visible: { opacity: 1, scale: 1 } }),
  clip: () => ({ hidden: { opacity: 0, clipPath: 'inset(0 0 100% 0)' }, visible: { opacity: 1, clipPath: 'inset(0 0 0% 0)' } }),
  // Extended cinema kinds — richer, still transform/opacity/filter only
  riseFar: (s) => ({ hidden: { opacity: 0, y: SIZE_PX[s] * 1.8 }, visible: { opacity: 1, y: 0 } }),
  sinkFar: (s) => ({ hidden: { opacity: 0, y: -SIZE_PX[s] * 1.8 }, visible: { opacity: 1, y: 0 } }),
  slideUL: (s) => ({ hidden: { opacity: 0, x: -SIZE_PX[s], y: SIZE_PX[s] }, visible: { opacity: 1, x: 0, y: 0 } }),
  slideDR: (s) => ({ hidden: { opacity: 0, x: SIZE_PX[s], y: -SIZE_PX[s] }, visible: { opacity: 1, x: 0, y: 0 } }),
  blurZoom: (s) => ({ hidden: { opacity: 0, scale: SIZE_SCALE[s], filter: `blur(${SIZE_PX[s] / 3}px)` }, visible: { opacity: 1, scale: 1, filter: 'blur(0px)' } }),
  unfold: (s) => ({ hidden: { opacity: 0, scaleY: SIZE_SCALE[s] - 0.2, transformOrigin: 'top' }, visible: { opacity: 1, scaleY: 1, transformOrigin: 'top' } }),
  skew: (s) => ({ hidden: { opacity: 0, skewX: SIZE_PX[s] / 6, x: SIZE_PX[s] }, visible: { opacity: 1, skewX: 0, x: 0 } }),
};

/** The flat, named preset registry */
export const MOTION_PRESETS: Record<string, Variants> = {};

/* entrances + exits ---------------------------------------------------------- */
for (const [kindName, kindFn] of Object.entries(KINDS)) {
  for (const size of SIZES) {
    for (const feel of FEELS) {
      const { hidden, visible } = kindFn(size);
      MOTION_PRESETS[`enter.${kindName}.${size}.${feel}`] = {
        hidden,
        visible: { ...visible, transition: feelTransition(feel) },
      };
      if (kindName === 'fade') {
        MOTION_PRESETS[`exit.${kindName}.${size}.${feel}`] = {
          hidden: { opacity: 1 },
          exit: { opacity: 0, transition: feelTransition(feel) },
        } as Variants;
      } else {
        MOTION_PRESETS[`exit.${kindName}.${size}.${feel}`] = {
          hidden: { ...visible },
          exit: { ...hidden, transition: feelTransition(feel) },
        } as Variants;
      }
    }
  }
}

/* hover gestures ------------------------------------------------------------- */
const HOVER_GESTURES: Record<string, TargetAndTransition> = {
  lift: { y: -3 },
  liftFar: { y: -6 },
  grow: { scale: 1.03 },
  growMore: { scale: 1.06 },
  shrink: { scale: 0.97 },
  tilt: { rotate: -1.2, y: -2 },
  tiltRev: { rotate: 1.2, y: -2 },
  glowBrand: { boxShadow: '0 0 24px rgba(232, 180, 74,0.35)' },
  glowCyan: { boxShadow: '0 0 24px rgba(34,211,238,0.3)' },
  glowViolet: { boxShadow: '0 0 24px rgba(139,92,246,0.32)' },
  press: { y: 1, scale: 0.985 },
  brighten: { filter: 'brightness(1.12)' },
  liftGrow: { y: -4, scale: 1.02 },
  floatUp: { y: -8, scale: 1.01 },
  underline: { backgroundSize: '100% 2px' },
};
for (const [name, g] of Object.entries(HOVER_GESTURES)) {
  for (const feel of FEELS) {
    MOTION_PRESETS[`hover.${name}.${feel}`] = { hover: { ...g, transition: feelTransition(feel) } };
  }
}

/* tap gestures ---------------------------------------------------------------- */
const TAP_GESTURES: Record<string, TargetAndTransition> = {
  press: { scale: 0.96 },
  pressDeep: { scale: 0.92 },
  pressLift: { scale: 1.02, y: 1 },
  nudge: { x: 2 },
  nudgeUp: { y: 2 },
  pulse: { scale: [1, 0.94, 1] },
  squish: { scaleX: 1.04, scaleY: 0.96 },
  sink: { y: 3, scale: 0.97 },
  flashTap: { filter: ['brightness(1.5)', 'brightness(1)'] },
  ripple: { scale: [1, 0.97, 1.01, 1] },
};
for (const [name, g] of Object.entries(TAP_GESTURES)) {
  for (const feel of FEELS) {
    MOTION_PRESETS[`tap.${name}.${feel}`] = { tap: { ...g, transition: feelTransition(feel) } };
  }
}

/* emphasis pulses -------------------------------------------------------------- */
const EMPHASIS: Record<string, TargetAndTransition> = {
  shake: { x: [0, -5, 5, -4, 4, 0] },
  jelly: { scaleX: [1, 1.08, 0.95, 1.03, 1], scaleY: [1, 0.92, 1.05, 0.98, 1] },
  heartbeat: { scale: [1, 1.1, 1, 1.06, 1] },
  flash: { opacity: [1, 0.4, 1, 0.55, 1] },
  bounce: { y: [0, -8, 0, -4, 0] },
  ring: { rotate: [0, -2.5, 2.5, -1.5, 1.5, 0] },
  surge: { scale: [1, 1.05, 1] },
  dip: { scale: [1, 0.95, 1] },
  glowOnce: { boxShadow: ['0 0 0 rgba(232, 180, 74,0)', '0 0 26px rgba(232, 180, 74,0.5)', '0 0 0 rgba(232, 180, 74,0)'] },
  glowOnceCyan: { boxShadow: ['0 0 0 rgba(34,211,238,0)', '0 0 26px rgba(34,211,238,0.45)', '0 0 0 rgba(34,211,238,0)'] },
  yield: { y: [0, 4, 0] },
  peek: { x: [0, 6, 0] },
  settle: { y: [-6, 2, 0] },
  focus: { scale: [0.98, 1.01, 1] },
  wobble: { rotate: [0, -4, 3, -2, 1, 0] },
  pop: { scale: [1, 1.18, 1] },
  blink: { opacity: [1, 0.2, 1] },
  nudgeX: { x: [0, 8, 0] },
  rubber: { scaleX: [1, 1.12, 0.9, 1.03, 1], scaleY: [1, 0.9, 1.1, 0.97, 1] },
  alert: { x: [0, -6, 6, -4, 4, 0], color: ['inherit'] },
};
for (const [name, e] of Object.entries(EMPHASIS)) {
  for (const feel of FEELS) {
    MOTION_PRESETS[`em.${name}.${feel}`] = {
      visible: { ...e, transition: { duration: feel === 'cinematic' ? 0.9 : feel === 'soft' ? 0.6 : 0.42, ease: 'easeInOut' } },
    };
  }
}

/* continuous loops ---------------------------------------------------------------- */
const LOOPS: Record<string, TargetAndTransition> = {
  float: { y: [0, -8, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' } },
  floatFar: { y: [0, -14, 0], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' } },
  bob: { y: [0, -4, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
  breathe: { scale: [1, 1.03, 1], transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' } },
  pulse: { opacity: [1, 0.5, 1], transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
  spin: { rotate: 360, transition: { duration: 14, repeat: Infinity, ease: 'linear' } },
  spinFast: { rotate: 360, transition: { duration: 2.4, repeat: Infinity, ease: 'linear' } },
  spinRev: { rotate: -360, transition: { duration: 14, repeat: Infinity, ease: 'linear' } },
  sway: { rotate: [-2, 2, -2], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } },
  driftX: { x: [0, 10, 0], transition: { duration: 9, repeat: Infinity, ease: 'easeInOut' } },
  shimmer: { backgroundPosition: ['-200% 0', '200% 0'], transition: { duration: 2, repeat: Infinity, ease: 'linear' } },
  beacon: { opacity: [0.3, 1, 0.3], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  scan: { y: ['-100%', '100%'], transition: { duration: 3.6, repeat: Infinity, ease: 'linear' } },
  orbit: { rotate: 360, transition: { duration: 20, repeat: Infinity, ease: 'linear' } },
  wave: { y: [0, -3, 0, 3, 0], transition: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } },
  glowBreathe: { boxShadow: ['0 0 8px rgba(232, 180, 74,0.15)', '0 0 26px rgba(232, 180, 74,0.4)', '0 0 8px rgba(232, 180, 74,0.15)'], transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } },
  glowBreatheCyan: { boxShadow: ['0 0 8px rgba(34,211,238,0.12)', '0 0 26px rgba(34,211,238,0.38)', '0 0 8px rgba(34,211,238,0.12)'], transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } },
  tick: { opacity: [0.6, 1, 0.6], transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } },
  floatTilt: { y: [0, -8, 0], rotate: [0, 1.2, 0], transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' } },
  glowBreatheViolet: { boxShadow: ['0 0 8px rgba(139,92,246,0.12)', '0 0 26px rgba(139,92,246,0.4)', '0 0 8px rgba(139,92,246,0.12)'], transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } },
  thinkingOrb: { scale: [1, 1.08, 1], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } },
  nodePulse: { opacity: [0.5, 1, 0.5], scale: [0.92, 1.08, 0.92], transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } },
  scanRev: { y: ['100%', '-100%'], transition: { duration: 3.6, repeat: Infinity, ease: 'linear' } },
  hueCycle: { filter: ['hue-rotate(0deg)', 'hue-rotate(20deg)', 'hue-rotate(0deg)'], transition: { duration: 8, repeat: Infinity, ease: 'easeInOut' } },
  driftY: { y: [0, 12, 0], transition: { duration: 9, repeat: Infinity, ease: 'easeInOut' } },
  slowSpin: { rotate: 360, transition: { duration: 40, repeat: Infinity, ease: 'linear' } },
  ticker: { y: ['0%', '-100%'], transition: { duration: 18, repeat: Infinity, ease: 'linear' } },
};
for (const [name, loop] of Object.entries(LOOPS)) {
  MOTION_PRESETS[`loop.${name}`] = { animate: loop } as Variants;
}

/* stagger containers ---------------------------------------------------------------- */
const STAGGER_KINDS: Record<string, Variants['visible']> = {
  rise: {},
};
const STAGGER_SPEEDS: Record<string, { stagger: number; delay: number }> = {
  quick: { stagger: 0.045, delay: 0 },
  normal: { stagger: 0.08, delay: 0.05 },
  slow: { stagger: 0.14, delay: 0.1 },
  cascade: { stagger: 0.09, delay: 0.15 },
  reverse: { stagger: -0.07, delay: 0.35 },
  tight: { stagger: 0.025, delay: 0 },
};
for (const kind of Object.keys(STAGGER_KINDS)) {
  for (const [speedName, speed] of Object.entries(STAGGER_SPEEDS)) {
    MOTION_PRESETS[`stagger.${kind}.${speedName}`] = {
      hidden: {},
      visible: { transition: { staggerChildren: speed.stagger, delayChildren: speed.delay } },
    };
  }
}
for (const d of ['up', 'down', 'left', 'right']) {
  for (const [speedName, speed] of Object.entries(STAGGER_SPEEDS)) {
    MOTION_PRESETS[`stagger.dir.${d}.${speedName}`] = {
      hidden: {},
      visible: { transition: { staggerChildren: Math.abs(speed.stagger), staggerDirection: d === 'down' || d === 'right' ? -1 : 1 } },
    };
  }
}

/* layout springs — for shared-element moves (active nav pill, reordering) ---------- */
const LAYOUTS: Record<string, Transition> = {
  pill: springs.spring,
  gentle: springs.soft,
  snap: springs.swift,
  cinematic: springs.cinematic,
  drawer: { type: 'spring', stiffness: 320, damping: 34 },
  modal: { type: 'spring', stiffness: 420, damping: 30 },
};
for (const [name, t] of Object.entries(LAYOUTS)) {
  MOTION_PRESETS[`layout.${name}`] = { layout: { transition: t } } as Variants;
}

/* cinematic route / hero choreography ----------------------------------------------- */
MOTION_PRESETS['hero.title'] = {
  hidden: { opacity: 0, y: 60, filter: 'blur(12px)', scale: 0.96 },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { ...tweens.cinematic, delay: 0.15 } },
};
MOTION_PRESETS['hero.sub'] = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { ...tweens.cinematic, delay: 0.45 } },
};
MOTION_PRESETS['hero.chips'] = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.7 } },
};
MOTION_PRESETS['hero.chip'] = {
  hidden: { opacity: 0, y: 14, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springs.spring },
};
MOTION_PRESETS['route.page'] = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: tweens.normal },
  exit: { opacity: 0, y: -12, transition: tweens.fast },
} as Variants;
MOTION_PRESETS['route.overlay'] = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tweens.fast },
  exit: { opacity: 0, transition: tweens.fast },
} as Variants;
MOTION_PRESETS['modal.center'] = {
  hidden: { opacity: 0, scale: 0.94, y: 14 },
  visible: { opacity: 1, scale: 1, y: 0, transition: LAYOUTS.modal },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: tweens.fast },
} as Variants;
MOTION_PRESETS['drawer.right'] = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: LAYOUTS.drawer },
  exit: { x: '100%', transition: tweens.fast },
} as Variants;
MOTION_PRESETS['toast.top'] = {
  hidden: { opacity: 0, y: -16, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springs.spring },
  exit: { opacity: 0, y: -10, scale: 0.97, transition: tweens.fast },
} as Variants;
MOTION_PRESETS['kpi.tick'] = {
  hidden: { opacity: 0, y: '60%' },
  visible: { opacity: 1, y: 0, transition: tweens.normal },
  exit: { opacity: 0, y: '-60%', transition: tweens.normal },
} as Variants;
MOTION_PRESETS['section.reveal'] = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { when: 'beforeChildren', staggerChildren: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};
MOTION_PRESETS['chip.selected'] = {
  off: { opacity: 0.7 },
  on: { opacity: 1, transition: springs.swift },
};

/* extra named scene presets for the immersive surfaces (AI, incident, deploy) */
const SCENES: Record<string, Variants> = {
  'ai.thinking': { animate: { scale: [1, 1.08, 1], transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } } },
  'ai.answer.in': { hidden: { opacity: 0, y: 10, filter: 'blur(6px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: tweens.normal } },
  'ai.token': { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.12 } } },
  'ai.tool.card': { hidden: { opacity: 0, scale: 0.96, y: 8 }, visible: { opacity: 1, scale: 1, y: 0, transition: springs.spring } },
  'incident.enter': { hidden: { opacity: 0, x: 24, filter: 'blur(4px)' }, visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: springs.soft } },
  'incident.approve': { visible: { scale: [1, 1.04, 1], boxShadow: ['0 0 0 rgba(16,185,129,0)', '0 0 26px rgba(16,185,129,0.5)', '0 0 0 rgba(16,185,129,0)'], transition: { duration: 0.7, ease: 'easeInOut' } } },
  'incident.deny': { visible: { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.5, ease: 'easeInOut' } } },
  'deploy.start': { visible: { opacity: [0.6, 1], y: [8, 0], transition: tweens.normal } },
  'deploy.success': { visible: { scale: [1, 1.05, 1], transition: springs.spring } },
  'metric.up': { hidden: { opacity: 0, y: '60%' }, visible: { opacity: 1, y: 0, transition: tweens.normal } },
  'metric.down': { hidden: { opacity: 0, y: '-60%' }, visible: { opacity: 1, y: 0, transition: tweens.normal } },
  'card.reveal': { hidden: { opacity: 0, y: 20, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: springs.soft } },
  'nav.pill': { off: { opacity: 0 }, on: { opacity: 1, transition: springs.spring } },
  'nav.item.in': { hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0, transition: springs.swift } },
  'wizard.step.in': { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0, transition: tweens.normal }, exit: { opacity: 0, x: -40, transition: tweens.fast } },
  'panel.expand': { hidden: { opacity: 0, height: 0 }, visible: { opacity: 1, height: 'auto', transition: tweens.normal } },
  'skeleton.shimmer': { animate: { backgroundPosition: ['-200% 0', '200% 0'], transition: { duration: 1.6, repeat: Infinity, ease: 'linear' } } },
  'badge.pop': { hidden: { scale: 0 }, visible: { scale: [0, 1.15, 1], transition: springs.spring } },
  'tooltip.in': { hidden: { opacity: 0, y: 6, scale: 0.96 }, visible: { opacity: 1, y: 0, scale: 1, transition: tweens.fast }, exit: { opacity: 0, y: 4, scale: 0.97, transition: tweens.instant } },
  'dropdown.in': { hidden: { opacity: 0, y: -8, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: springs.swift }, exit: { opacity: 0, y: -6, scale: 0.98, transition: tweens.fast } },
};
for (const [name, v] of Object.entries(SCENES)) MOTION_PRESETS[name] = v;

/** How many named presets the registry exposes (reported in the docs/tests). */
export const MOTION_PRESET_COUNT = Object.keys(MOTION_PRESETS).length;

/** Convenience accessor with a typescript fallback to fade for unknown names. */
export function preset(name: string): Variants {
  return MOTION_PRESETS[name] ?? MOTION_PRESETS['enter.fade.md.soft'];
}

/** Standard in-view props for scroll reveals. */
export const inViewOnce = { initial: 'hidden', whileInView: 'visible', viewport: { once: true, margin: '-80px' } } as const;
