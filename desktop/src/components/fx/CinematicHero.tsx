import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Radar,
  Brain,
  Zap,
  Database,
  Network,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { sfx } from '../../lib/soundEngine';

/* =============================================================================
   CINEMATIC HERO — Lear's scroll-driven opening act
   -----------------------------------------------------------------------------
   A sticky-stage, scrub-controlled composition (Mostar-style rig) adapted to
   the Lear identity: aurora sky → glowing nebula → neural mesh → data-center
   horizon, while "LEAR" exits, two story panels cross-fade, and the capability
   carousel flies in. All motion is transform/opacity on GPU layers, driven
   from a single rAF loop writing CSS custom properties — no React re-renders
   per frame, so it stays smooth at high refresh rates.
   ========================================================================== */

const SECTION_HEIGHT = 2900;

interface Capability {
  kicker: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  tone: string;
}

const CAPABILITIES: Capability[] = [
  {
    kicker: 'Sentry',
    title: 'Watch',
    body: 'Live state streams from 13 providers — pods, pipelines, clouds, monitors — normalized into one timeline.',
    icon: <Radar size={30} />,
    tone: 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10',
  },
  {
    kicker: 'Cortex',
    title: 'Diagnose',
    body: 'The brain reads real logs and proposes exact file edits with confidence scores — not guesses, evidence.',
    icon: <Brain size={30} />,
    tone: 'text-accent-light border-accent/30 bg-accent/10',
  },
  {
    kicker: 'Hands',
    title: 'Act',
    body: '30 permissioned actions: restart, scale, rollback, open the fix PR — gated by your rules, not ours.',
    icon: <Zap size={30} />,
    tone: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
  },
  {
    kicker: 'Recall',
    title: 'Remember',
    body: 'Every verified fix becomes episodic memory on your machine. Lear gets smarter per incident, locally.',
    icon: <Database size={30} />,
    tone: 'text-violet-300 border-violet-400/30 bg-violet-400/10',
  },
  {
    kicker: 'Fusion',
    title: 'Correlate',
    body: 'A two-minute sliding window joins signals across connectors — the deploy that broke the pod, named.',
    icon: <Network size={30} />,
    tone: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  },
];

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const smoothstep = (e0: number, e1: number, v: number) => {
  const x = clamp((v - e0) / (e1 - e0));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const segmentInOut = (s: number, a: number, b: number, c: number, d: number) => {
  const enter = smoothstep(a, b, s);
  const exit = smoothstep(c, d, s);
  return { enter, exit, active: enter * (1 - exit) };
};

export interface CinematicHeroProps {
  onEnter?: () => void;
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({ onEnter }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(CAPABILITIES.length);
  const [jumping, setJumping] = useState(false);
  const firedRef = useRef({ a: false, b: false, cards: false });

  /* ---- Infinite slider: 3 cloned sets, normalize on transition end -------- */
  const sets = [0, 1, 2];
  const allCards = sets.flatMap((setIdx) =>
    CAPABILITIES.map((cap, i) => ({ ...cap, key: `${setIdx}-${i}` }))
  );

  const applyShift = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const card = track.querySelector<HTMLElement>('[data-cap-card]');
      const cw = card ? card.offsetWidth : 340;
      const gap = 20;
      track.style.setProperty('--cap-shift', `${-(cw + gap) * index}px`);
      track.querySelectorAll('[data-cap-card]').forEach((el, i) => {
        el.classList.toggle('is-active', i === index);
      });
    },
    []
  );

  useEffect(() => {
    applyShift(activeCard);
  }, [activeCard, applyShift]);

  const normalize = useCallback(() => {
    setActiveCard((idx) => {
      let next = idx;
      if (idx >= CAPABILITIES.length * 2) next = idx - CAPABILITIES.length;
      else if (idx < CAPABILITIES.length) next = idx + CAPABILITIES.length;
      if (next !== idx) {
        setJumping(true);
        applyShift(next);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setJumping(false))
        );
      }
      return next;
    });
  }, [applyShift]);

  const moveSlider = (dir: number) => {
    sfx(dir > 0 ? 'nav.next' : 'nav.prev');
    setActiveCard((i) => i + dir);
  };

  /* ------------------------- Scroll choreography rAF ----------------------- */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let smooth = 0;
    let initialized = false;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;

    const set = (k: string, v: string | number) =>
      section.style.setProperty(k, typeof v === 'number' ? String(v) : v);

    const update = () => {
      raf = requestAnimationFrame(update);
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.top > vh * 1.25 || rect.bottom < -vh * 0.25) return; // offscreen: skip work

      const scrollable = Math.max(1, section.offsetHeight - vh);
      const target = clamp(-rect.top, 0, scrollable);
      if (!initialized || reduceMotion) {
        smooth = target;
        initialized = true;
        tx = mx = reduceMotion ? 0 : tx;
        ty = my = reduceMotion ? 0 : ty;
      } else {
        smooth = lerp(smooth, target, 0.16);
        if (Math.abs(smooth - target) < 0.05) smooth = target;
        tx = lerp(tx, mx, 0.1);
        ty = lerp(ty, my, 0.1);
      }
      const s = smooth;

      const titleExit = smoothstep(40, 460, s);
      const progress = clamp(s / scrollable);
      const pA = segmentInOut(s, 380, 660, 980, 1200);
      const pB = segmentInOut(s, 1300, 1580, 1920, 2080);
      const cardsRaw = smoothstep(2120, 2540, s);
      const cardsEnter = Math.pow(cardsRaw, 1.5);
      const controlsEnter = smoothstep(2480, 2700, s);
      const blurActive = clamp(pA.active + pB.active);

      // fire-and-forget sound cues (no-ops until audio unlocked)
      const fired = firedRef.current;
      if (pA.enter > 0.5 && !fired.a) { fired.a = true; sfx('hero.whoosh.01', { minGapMs: 400 }); }
      if (pA.enter < 0.2) fired.a = false;
      if (pB.enter > 0.5 && !fired.b) { fired.b = true; sfx('hero.whoosh.02', { minGapMs: 400 }); }
      if (pB.enter < 0.2) fired.b = false;
      if (cardsEnter > 0.5 && !fired.cards) { fired.cards = true; sfx('hero.whoosh.03', { minGapMs: 400 }); }
      if (cardsEnter < 0.2) fired.cards = false;

      // ---- variable writes (GPU-only properties) ---------------------------
      set('--hero-title-y', `${(titleExit * -200).toFixed(1)}px`);
      set('--hero-title-scale', (1 - titleExit * 0.14).toFixed(4));
      set('--hero-title-op', (1 - titleExit).toFixed(4));
      set('--hero-sub-y', `${(titleExit * 110).toFixed(1)}px`);
      set('--hero-sub-op', (1 - titleExit).toFixed(4));

      set('--hero-sky-scale', (1.05 + progress * 0.12).toFixed(4));
      set('--hero-sky-y', `${(progress * -3.5 + ty * 1.2).toFixed(3)}vh`);
      set('--hero-sky-x', `${(tx * 1.6).toFixed(3)}vw`);

      set('--hero-grid-y', `${((1 - smoothstep(0, 420, s)) * 16 - progress * 5 + ty * 2.2).toFixed(3)}vh`);
      set('--hero-grid-x', `${(tx * 3.4).toFixed(3)}vw`);
      set('--hero-grid-scale', (1 + progress * 0.06).toFixed(4));

      set('--hero-glow-op', (0.3 + pA.active * 0.35 + pB.active * 0.35).toFixed(4));
      set('--hero-glow-x', `${(tx * 46).toFixed(1)}px`);
      set('--hero-glow-y', `${(ty * 30).toFixed(1)}px`);

      set('--hero-mesh-op', (pA.enter * (1 - pB.exit * 0.4)).toFixed(4));
      set('--hero-mesh-x', `${(tx * -34).toFixed(1)}px`);
      set('--hero-mesh-y', `${(ty * -22).toFixed(1)}px`);
      set('--hero-mesh-scale', (1.02 + pA.active * 0.1).toFixed(4));

      set('--hero-shade-op', (blurActive * 0.55).toFixed(4));

      set('--panel-a-op', (pA.active * (1 - pA.exit)).toFixed(4));
      set('--panel-a-y', `${(-pA.exit * 84 + (1 - pA.enter) * 58).toFixed(1)}px`);
      set('--panel-b-op', (pB.active * (1 - pB.exit)).toFixed(4));
      set('--panel-b-y', `${(-pB.exit * 84 + (1 - pB.enter) * 58).toFixed(1)}px`);

      set('--cards-x', `${((1 - cardsEnter) * 108).toFixed(2)}vw`);
      set('--cards-op', cardsEnter.toFixed(4));
      set('--cards-vis', cardsEnter > 0.01 ? 'visible' : 'hidden');
      set('--controls-op', controlsEnter.toFixed(4));

      set('--cue-op', (1 - smoothstep(0, 140, s)).toFixed(4));

      const controls = section.querySelector<HTMLElement>('[data-hero-controls]');
      if (controls) controls.style.pointerEvents = controlsEnter > 0.9 ? 'auto' : 'none';
    };

    const onPointer = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };

    window.addEventListener('pointermove', onPointer, { passive: true });
    raf = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);

  const amountVisible = useRef(0);
  useEffect(() => {
    // Pause hero canvas work when the section leaves the viewport
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      (entries) => {
        amountVisible.current = entries[0]?.intersectionRatio ?? 1;
      },
      { threshold: [0, 0.1] }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Lear cinematic introduction"
      className="relative -mx-8 -mt-8 mb-4"
      style={{ height: SECTION_HEIGHT }}
    >
      <div className="sticky top-0 h-screen overflow-hidden" style={{ isolation: 'isolate' }}>
        {/* 0 · aurora sky */}
        <img
          src="/fx/hero-sky.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
          style={{
            transform:
              'translate3d(var(--hero-sky-x, 0vw), var(--hero-sky-y, 0vh), 0) scale(var(--hero-sky-scale, 1.05))',
            willChange: 'transform',
          }}
        />
        {/* deep-space contrast floor */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(5,6,10,0.15) 0%, rgba(5,6,10,0) 30%, rgba(5,6,10,0.22) 62%, rgba(5,6,10,0.9) 100%)',
            zIndex: 1,
          }}
        />

        {/* 1 · header inside hero */}
        <header className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-8 py-6">
          <a href="#lear-hero" className="flex items-center gap-2.5 group">
            <span className="relative grid place-items-center w-9 h-9">
              <span className="absolute inset-0 rounded-xl bg-brand-gradient opacity-90 group-hover:opacity-100 transition-opacity" />
              <Sparkles size={16} className="relative text-white" />
            </span>
            <span className="font-display font-bold text-white tracking-tight text-lg">Lear</span>
            <span className="text-[10px] font-mono text-white/50 border border-white/15 rounded-md px-1.5 py-0.5 mt-0.5">
              v2.4
            </span>
          </a>
          <div className="hidden md:flex items-center gap-6 text-[13px] font-semibold text-white/70">
            <span className="hover:text-white transition-colors">13 Providers</span>
            <span className="hover:text-white transition-colors">30 Actions</span>
            <span className="hover:text-white transition-colors">Local-First</span>
            <span className="flex items-center gap-1.5 text-emerald-300/90">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Agent Online
            </span>
          </div>
        </header>

        {/* 2 · magenta nebula glow (screen blend) */}
        <img
          src="/fx/hero-glow.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          draggable={false}
          className="absolute left-1/2 top-[38%] w-[120vw] max-w-none select-none pointer-events-none"
          style={{
            zIndex: 2,
            mixBlendMode: 'screen',
            opacity: 'var(--hero-glow-op, 0.3)',
            transform:
              'translate3d(calc(-50% + var(--hero-glow-x, 0px)), calc(-50% + var(--hero-glow-y, 0px)), 0)',
            willChange: 'transform, opacity',
          }}
        />

        {/* 3 · neural mesh layer */}
        <img
          src="/fx/hero-mesh.png"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute left-1/2 top-[42%] w-[110vw] max-w-none select-none pointer-events-none"
          style={{
            zIndex: 3,
            mixBlendMode: 'screen',
            opacity: 'var(--hero-mesh-op, 0)',
            transform:
              'translate3d(calc(-50% + var(--hero-mesh-x, 0px)), calc(-50% + var(--hero-mesh-y, 0px)), 0) scale(var(--hero-mesh-scale, 1.02))',
            willChange: 'transform, opacity',
          }}
        />

        {/* 4 · LEAR title */}
        <h1
          className="absolute left-1/2 font-display font-extrabold text-center select-none pointer-events-none"
          style={{
            zIndex: 5,
            top: 'clamp(120px, 19vh, 200px)',
            width: 'min(94vw, 1600px)',
            fontSize: 'clamp(72px, 15vw, 200px)',
            lineHeight: 0.82,
            letterSpacing: '-0.03em',
            color: '#fff',
            textShadow: '0 8px 60px rgba(232, 180, 74,0.35), 0 2px 24px rgba(139,92,246,0.4)',
            transform:
              'translate3d(-50%, var(--hero-title-y, 0px), 0) scale(var(--hero-title-scale, 1))',
            opacity: 'var(--hero-title-op, 1)',
            willChange: 'transform, opacity',
          }}
        >
          LEAR
        </h1>

        {/* 5 · intro copy + highlight pills */}
        <div
          className="absolute left-1/2 text-center pointer-events-none"
          style={{
            zIndex: 6,
            bottom: 'clamp(120px, 26vh, 320px)',
            width: 'min(620px, calc(100vw - 40px))',
            transform: 'translate3d(-50%, var(--hero-sub-y, 0px), 0)',
            opacity: 'var(--hero-sub-op, 1)',
            willChange: 'transform, opacity',
          }}
        >
          <p
            className="mx-auto text-white/95 font-medium"
            style={{ fontSize: 'clamp(15px, 1.4vw, 19px)', lineHeight: 1.5, textShadow: '0 2px 22px rgba(0,0,0,0.6)' }}
          >
            The AI DevOps agent that watches your stack — and <span className="text-accent-light font-bold">acts</span>.
            Credentials stay on your machine. Judgment stays yours.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 mt-6">
            {['13 Provider Connectors', '30 Permissioned Actions', 'Local-First by Design'].map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 rounded-full text-[12.5px] font-semibold text-[#0b0e14] bg-white/95 shadow-xl shadow-black/30"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 6 · data-center horizon (the "bridge" layer) */}
        <img
          src="/fx/hero-grid.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          draggable={false}
          className="absolute left-1/2 bottom-0 w-[130vw] max-w-none select-none pointer-events-none"
          style={{
            zIndex: 4,
            transform:
              'translate3d(calc(-50% + var(--hero-grid-x, 0vw)), var(--hero-grid-y, 16vh), 0) scale(var(--hero-grid-scale, 1))',
            willChange: 'transform',
          }}
        />

        {/* 7 · stage shade during story panels */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 7,
            opacity: 'var(--hero-shade-op, 0)',
            background:
              'linear-gradient(180deg, rgba(10,6,20,0.7) 0%, rgba(8,8,18,0.62) 48%, rgba(10,6,20,0.78) 100%)',
          }}
        />

        {/* 8 · story panel A */}
        <div
          className="absolute left-1/2 text-center pointer-events-none px-4"
          style={{
            zIndex: 8,
            top: '56%',
            width: 'min(780px, calc(100vw - 42px))',
            transform: 'translate3d(-50%, calc(-50% + var(--panel-a-y, 58px)), 0)',
            opacity: 'var(--panel-a-op, 0)',
            willChange: 'transform, opacity',
          }}
        >
          <h2
            className="font-display font-bold text-white text-balance"
            style={{ fontSize: 'clamp(34px, 5.4vw, 66px)', lineHeight: 0.98, letterSpacing: '-0.02em', textShadow: '0 18px 44px rgba(0,0,0,0.5)' }}
          >
            Your infrastructure, narrated live.
          </h2>
          <p className="mx-auto mt-5 text-white/85 max-w-[540px] text-[15px] leading-relaxed" style={{ textShadow: '0 2px 18px rgba(0,0,0,0.55)' }}>
            CI, clusters, clouds and monitors stream into one normalized timeline —
            Lear reads it like an SRE who never sleeps and never guesses.
          </p>
          <dl className="grid grid-cols-2 gap-12 max-w-[470px] mx-auto mt-14">
            <div>
              <dt className="font-display font-bold text-white" style={{ fontSize: 'clamp(40px, 4.6vw, 60px)', lineHeight: 0.9, textShadow: '0 14px 34px rgba(0,0,0,0.5)' }}>
                13
              </dt>
              <dd className="mt-2.5 text-white/75 text-[13px] font-medium">Provider connectors, one contract</dd>
            </div>
            <div>
              <dt className="font-display font-bold text-white" style={{ fontSize: 'clamp(40px, 4.6vw, 60px)', lineHeight: 0.9, textShadow: '0 14px 34px rgba(0,0,0,0.5)' }}>
                30
              </dt>
              <dd className="mt-2.5 text-white/75 text-[13px] font-medium">Permissioned, audited actions</dd>
            </div>
          </dl>
        </div>

        {/* 9 · story panel B */}
        <div
          className="absolute left-1/2 text-center px-4"
          style={{
            zIndex: 8,
            top: '34%',
            width: 'min(780px, calc(100vw - 42px))',
            transform: 'translate3d(-50%, calc(-50% + var(--panel-b-y, 58px)), 0)',
            opacity: 'var(--panel-b-op, 0)',
            willChange: 'transform, opacity',
          }}
        >
          <h2
            className="font-display font-bold text-white text-balance"
            style={{ fontSize: 'clamp(34px, 5.4vw, 66px)', lineHeight: 0.98, letterSpacing: '-0.02em', textShadow: '0 18px 44px rgba(0,0,0,0.5)' }}
          >
            It doesn&apos;t just alert. It fixes.
          </h2>
          <p className="mx-auto mt-5 text-white/85 max-w-[540px] text-[15px] leading-relaxed" style={{ textShadow: '0 2px 18px rgba(0,0,0,0.55)' }}>
            Diagnosis → plan → permission → action → verification. Every move gated
            by your risk budget, every step written to an append-only audit log.
          </p>
          <button
            onClick={() => {
              sfx('hero.impact', { minGapMs: 300 });
              onEnter?.();
            }}
            onMouseEnter={() => sfx('ui.hover.05')}
            className="pointer-events-auto mt-7 inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-white text-[#0b0e14] font-bold text-sm shadow-2xl shadow-black/40 hover:shadow-glow-brand hover:scale-[1.03] transition-all cursor-pointer"
          >
            <span aria-hidden="true">➤</span>
            <span>Enter Mission Control</span>
          </button>
        </div>

        {/* 10 · capability carousel */}
        <div
          className="absolute inset-x-0"
          style={{
            zIndex: 9,
            top: 'clamp(150px, 24vh, 250px)',
            transform: 'translate3d(var(--cards-x, 108vw), 0, 0)',
            opacity: 'var(--cards-op, 0)',
            visibility: 'var(--cards-vis, hidden)' as never,
            willChange: 'transform, opacity',
          }}
        >
          <p className="text-center text-[11px] font-mono font-bold uppercase tracking-[0.3em] text-white/45 mb-5">
            Capability Matrix
          </p>
          <div
            ref={trackRef}
            className="flex items-stretch gap-5 pl-[8vw]"
            style={{
              transform: 'translate3d(var(--cap-shift, -1800px), 0, 0)',
              transition: jumping ? 'none' : 'transform 640ms cubic-bezier(0.22, 1, 0.36, 1)',
              willChange: 'transform',
            }}
            onTransitionEnd={normalize}
          >
            {allCards.map((cap, idx) => (
              <article
                key={cap.key}
                data-cap-card
                tabIndex={0}
                role="button"
                aria-label={`Open ${cap.title} capability`}
                onClick={() => {
                  sfx('ui.select.03');
                  setActiveCard(idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    sfx('ui.select.03');
                    setActiveCard(idx);
                  }
                }}
                className={[
                  'relative shrink-0 w-[320px] md:w-[340px] h-[210px] rounded-3xl p-6 overflow-hidden cursor-pointer select-none',
                  'glass-heavy border transition-all duration-300 group',
                  'hover:-translate-y-1.5 focus-visible:-translate-y-1.5',
                ].join(' ')}
                style={{
                  borderColor: 'rgba(255,255,255,0.12)',
                  boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                  transform: `scale(${idx === activeCard ? 1 : 0.94})`,
                  opacity: idx === activeCard ? 1 : 0.72,
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'radial-gradient(80% 120% at 50% -20%, rgba(232, 180, 74,0.14), transparent 70%)' }}
                />
                <span className="block text-[10.5px] font-mono font-bold uppercase tracking-[0.22em] text-white/50 mb-8">
                  {cap.kicker}
                </span>
                <span className={`absolute top-5 right-5 p-2.5 rounded-xl border ${cap.tone}`}>{cap.icon}</span>
                <h3 className="font-display font-extrabold text-white text-2xl tracking-tight mb-2">{cap.title}</h3>
                <p className="text-[12.5px] leading-relaxed text-white/70 line-clamp-3">{cap.body}</p>
              </article>
            ))}
          </div>
        </div>

        {/* 11 · carousel controls */}
        <div
          data-hero-controls
          className="absolute flex gap-3.5"
          style={{
            zIndex: 10,
            left: 48,
            top: 'clamp(150px, 24vh, 250px)',
            marginTop: 234,
            opacity: 'var(--controls-op, 0)',
            pointerEvents: 'none',
          }}
          aria-label="Capability slider controls"
        >
          {[
            { dir: -1, label: 'Previous capability', icon: <ArrowLeft size={20} /> },
            { dir: 1, label: 'Next capability', icon: <ArrowRight size={20} /> },
          ].map((c) => (
            <button
              key={c.label}
              aria-label={c.label}
              onClick={() => moveSlider(c.dir)}
              onMouseEnter={() => sfx('ui.hover.06')}
              className="w-[54px] h-[54px] rounded-full grid place-items-center bg-white text-[#10131a] shadow-2xl shadow-black/40 hover:shadow-glow-brand hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {c.icon}
            </button>
          ))}
        </div>

        {/* 12 · scroll cue */}
        <button
          onClick={() => {
            sfx('nav.next');
            onEnter?.();
          }}
          className="absolute left-1/2 -translate-x-1/2 bottom-7 flex flex-col items-center gap-1.5 text-white/60 hover:text-white transition-colors cursor-pointer"
          style={{ zIndex: 10, opacity: 'var(--cue-op, 1)' }}
          aria-label="Scroll into the dashboard"
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em]">Initialize</span>
          <ChevronDown size={18} className="fx-bounce-soft" />
        </button>

        {/* 13 · scanlines + vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 11,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 4px)',
            mixBlendMode: 'overlay',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 12,
            background: 'radial-gradient(130% 100% at 50% 45%, transparent 55%, rgba(4,5,9,0.5) 100%)',
          }}
        />
      </div>
    </section>
  );
};

export default CinematicHero;
