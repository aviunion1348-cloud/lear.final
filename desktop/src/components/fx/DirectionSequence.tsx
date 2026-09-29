import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  X, ArrowRight, Activity, Brain, Zap, Plug, MessageSquare,
  ShieldCheck, Radar, GitBranch, Cpu, Waves,
} from 'lucide-react';
import './DirectionSequence.css';
import { sfx, sfxAny, sfxFor, CUES } from '../../lib/soundEngine';
import SoundControl from './SoundControl';

/* =============================================================================
   LEAR — DIRECTION SEQUENCE
   -----------------------------------------------------------------------------
   The "crazier UI" surface: a full-screen cinematic overlay launched from the
   landing's DIRECTION control. It runs on the same rig philosophy as the
   cinematic landing (rAF-scrubbed, transform/opacity only) but pushes much
   further on VFX density.

   Backdrop strategy — high brightness, 4K, sci-fi AI/robotics:
     • Ships with a generated 4K robotics plate driven by a Ken-Burns +
       pointer-parallax camera so it reads as live motion out of the box.
     • AUTO-UPGRADES to a real looping <video> the moment an operator drops
       `robotics-hero.mp4` (or .webm) into desktop/public/media/. We probe with
       a HEAD request and only mount the <video> element on success, so there
       is never a broken/blank element and no wasted decode when it's absent.

   VFX stack, back → front:
     0  camera plate (video or Ken-Burns image) + brightness/contrast grade
     1  depth haze + gold god-ray sweep
     2  perspective floor grid travelling toward the viewer
     3  particle field (canvas, DPR-capped, frame-budgeted)
     4  horizontal light-sweep + vertical scan bars
     5  HUD: corner brackets, scanner ring, live telemetry readouts
     6  content: glitching gold title, vector cards, CTA
     7  film grain + chromatic vignette

   Performance contract (the 100fps requirement):
     • ONE rAF loop drives every JS-animated element; nothing else polls.
     • Canvas is DPR-capped at 2 and particle count auto-scales from measured
       frame time — it sheds particles before it sheds frames.
     • Pointer parallax writes CSS custom properties on a single root node;
       children read them, so a mouse move is one style write, not N.
     • Every animated property is transform/opacity/filter — zero layout.
   ========================================================================== */

interface Vector {
  id: string;
  kicker: string;
  title: string;
  body: string;
  metric: string;
  Icon: typeof Activity;
}

const VECTORS: Vector[] = [
  { id: 'observe', kicker: 'Vector 01', title: 'Observe', body: 'Persistent watchers hold live eyes on CI, Kubernetes, deploys and cloud health.', metric: '24/7', Icon: Radar },
  { id: 'correlate', kicker: 'Vector 02', title: 'Correlate', body: 'Signals from every connected tool fuse into one timeline instead of thirteen dashboards.', metric: '13 SRC', Icon: Waves },
  { id: 'diagnose', kicker: 'Vector 03', title: 'Diagnose', body: 'The root-cause brain reasons over logs, events and diffs to name the actual cause.', metric: 'ROOT', Icon: Brain },
  { id: 'decide', kicker: 'Vector 04', title: 'Decide', body: 'A ranked remediation plan with blast radius, confidence and rollback path attached.', metric: 'PLAN', Icon: Cpu },
  { id: 'act', kicker: 'Vector 05', title: 'Act', body: 'Opens PRs, restarts pods, rolls back deploys and scales services — on your approval.', metric: '29 ACT', Icon: Zap },
  { id: 'verify', kicker: 'Vector 06', title: 'Verify', body: 'Re-checks the signal that fired, confirms recovery, and writes the audit record.', metric: 'AUDIT', Icon: ShieldCheck },
  { id: 'connect', kicker: 'Vector 07', title: 'Connect', body: 'AWS, GCP, Azure, Kubernetes, GitHub, GitLab, Datadog, PagerDuty, Terraform, Vercel.', metric: 'x13', Icon: Plug },
  { id: 'converse', kicker: 'Vector 08', title: 'Converse', body: 'Talk to your infrastructure in plain language and drive real, audited actions.', metric: 'CHAT', Icon: MessageSquare },
  { id: 'evolve', kicker: 'Vector 09', title: 'Evolve', body: 'Repo memory keeps what worked, so the next incident resolves faster than the last.', metric: 'MEM', Icon: GitBranch },
];

const TELEMETRY = [
  { label: 'CORE', unit: '%', min: 88, max: 99 },
  { label: 'NEURAL', unit: 'Hz', min: 240, max: 320 },
  { label: 'WATCH', unit: '', min: 11, max: 13 },
  { label: 'LATENCY', unit: 'ms', min: 4, max: 28 },
  { label: 'CONF', unit: '%', min: 91, max: 99 },
];

export interface DirectionSequenceProps {
  /** Close the overlay and return to wherever it was launched from. */
  onClose: () => void;
  /** Hand off into the real application console. */
  onEnter?: () => void;
}

export const DirectionSequence: React.FC<DirectionSequenceProps> = ({ onClose, onEnter }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [phase, setPhase] = useState<'boot' | 'live'>('boot');
  const [active, setActive] = useState(0);
  const closedRef = useRef(false);

  /* ---- Optional real-video upgrade -------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    const candidates = ['/media/robotics-hero.mp4', '/media/robotics-hero.webm'];
    (async () => {
      for (const url of candidates) {
        try {
          const res = await fetch(url, { method: 'HEAD' });
          const type = res.headers.get('content-type') ?? '';
          if (res.ok && type.startsWith('video')) {
            if (!cancelled) setVideoSrc(url);
            return;
          }
        } catch { /* absent — keep the generated plate */ }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---- Boot choreography + audio ---------------------------------------- */
  useEffect(() => {
    CUES.sequenceOpen();
    const t = window.setTimeout(() => setPhase('live'), 1850);
    return () => window.clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    CUES.sequenceClose();
    onClose();
  }, [onClose]);

  const enter = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    CUES.enterConsole();
    (onEnter ?? onClose)();
  }, [onEnter, onClose]);

  /* ---- Keyboard: ESC closes, arrows move the vector focus ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); enter(); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => { sfx('nav.next'); return (i + 1) % VECTORS.length; });
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => { sfx('nav.prev'); return (i - 1 + VECTORS.length) % VECTORS.length; });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, enter]);

  /* ---- Lock body scroll while the sequence owns the screen -------------- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ---- THE SINGLE rAF LOOP: parallax, telemetry, particles -------------- */
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    const resize = () => {
      w = root.clientWidth; h = root.clientHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();

    /* Particle field — count auto-scales with measured frame time. */
    type P = { x: number; y: number; z: number; vy: number; r: number; a: number };
    const MAX_P = reduce ? 0 : 260;
    let count = reduce ? 0 : 180;
    const parts: P[] = Array.from({ length: MAX_P }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.3 + Math.random() * 0.7,
      vy: 0.12 + Math.random() * 0.5,
      r: 0.5 + Math.random() * 1.9,
      a: 0.12 + Math.random() * 0.5,
    }));

    /* Pointer parallax → CSS custom properties (one write per frame). */
    let px = 0, py = 0, tx = 0, ty = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    /* Telemetry values drift smoothly rather than jumping. */
    const vals = TELEMETRY.map((t) => (t.min + t.max) / 2);
    const targets = vals.slice();
    const readouts = Array.from(root.querySelectorAll<HTMLElement>('[data-telemetry]'));

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let frameAvg = 8;
    let nextTelemetry = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(now - last, 48);
      last = now;
      frameAvg += (dt - frameAvg) * 0.05;

      /* Adaptive quality: shed particles before we shed frames. 10ms ≈ 100fps */
      if (frameAvg > 11 && count > 40) count -= 2;
      else if (frameAvg < 8.5 && count < MAX_P) count += 1;

      /* Smoothed pointer parallax */
      px += (tx - px) * 0.055;
      py += (ty - py) * 0.055;
      root.style.setProperty('--px', px.toFixed(4));
      root.style.setProperty('--py', py.toFixed(4));

      /* Telemetry every ~450ms, eased every frame */
      if (now > nextTelemetry) {
        nextTelemetry = now + 450;
        TELEMETRY.forEach((t, i) => {
          targets[i] = t.min + Math.random() * (t.max - t.min);
        });
        sfx('hud.telemetry', { minGapMs: 400 });
      }
      acc += dt;
      if (acc > 33) {
        acc = 0;
        vals.forEach((v, i) => {
          vals[i] = v + (targets[i] - v) * 0.18;
          const el = readouts[i];
          if (el) {
            const t = TELEMETRY[i];
            el.textContent = (t.unit === 'ms' || t.unit === '' ? Math.round(vals[i]) : vals[i].toFixed(1)) + t.unit;
          }
        });
      }

      /* Particles */
      if (count > 0) {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < count; i++) {
          const p = parts[i];
          p.y -= p.vy * p.z * (dt / 16.67);
          if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
          const dx = px * 26 * p.z;
          const dy = py * 18 * p.z;
          ctx.globalAlpha = p.a * (phase === 'boot' ? 0.35 : 1);
          ctx.fillStyle = i % 7 === 0 ? 'rgba(247,231,195,1)' : 'rgba(232,180,74,1)';
          ctx.beginPath();
          ctx.arc(p.x + dx, p.y + dy, p.r * p.z, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', resize);
    };
  }, [phase]);

  const activeVector = VECTORS[active];

  /* Split the title so each glyph can be choreographed independently. */
  const titleGlyphs = useMemo(() => 'DIRECTION'.split(''), []);

  return (
    <div
      className={`dseq ${phase === 'boot' ? 'dseq-boot' : 'dseq-live'}`}
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Lear direction sequence"
    >
      {/* ---- 0. camera plate -------------------------------------------- */}
      <div className="dseq-plate">
        {videoSrc ? (
          <video
            ref={videoRef}
            className="dseq-video"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        ) : (
          <img className="dseq-plate-img" src="/media/robotics-hero.png" alt="" aria-hidden="true" />
        )}
        <img className="dseq-plate-img dseq-plate-far" src="/media/backdrop-gold.png" alt="" aria-hidden="true" />
      </div>

      {/* ---- 1. depth haze + god rays ------------------------------------ */}
      <div className="dseq-haze" aria-hidden="true" />
      <div className="dseq-rays" aria-hidden="true" />

      {/* ---- 2. perspective floor grid ----------------------------------- */}
      <div className="dseq-grid" aria-hidden="true"><div className="dseq-grid-inner" /></div>

      {/* ---- 3. particle field ------------------------------------------- */}
      <canvas className="dseq-canvas" ref={canvasRef} aria-hidden="true" />

      {/* ---- 4. sweeps + scan bars --------------------------------------- */}
      <div className="dseq-sweep" aria-hidden="true" />
      <div className="dseq-scan dseq-scan-a" aria-hidden="true" />
      <div className="dseq-scan dseq-scan-b" aria-hidden="true" />

      {/* ---- 5. HUD chrome ------------------------------------------------ */}
      <div className="dseq-hud" aria-hidden="true">
        <span className="dseq-bracket dseq-bracket-tl" />
        <span className="dseq-bracket dseq-bracket-tr" />
        <span className="dseq-bracket dseq-bracket-bl" />
        <span className="dseq-bracket dseq-bracket-br" />
        <div className="dseq-scanner"><span /><span /><span /></div>
      </div>

      <div className="dseq-telemetry" aria-hidden="true">
        {TELEMETRY.map((t) => (
          <div className="dseq-readout" key={t.label}>
            <span className="dseq-readout-label">{t.label}</span>
            <span className="dseq-readout-value" data-telemetry={t.label}>—</span>
          </div>
        ))}
      </div>

      {/* ---- 6. content --------------------------------------------------- */}
      <button
        className="dseq-close"
        onClick={close}
        onMouseEnter={() => sfx('ui.hover.03', { minGapMs: 90 })}
        aria-label="Close the direction sequence"
      >
        <X size={18} />
        <span>ESC</span>
      </button>

      <SoundControl className="dseq-sound" />

      <div className="dseq-content">
        <p className="dseq-eyebrow">
          <span className="dseq-dot" /> LEAR · AUTONOMOUS DEVOPS INTELLIGENCE
        </p>

        <h1 className="dseq-title" aria-label="Direction">
          {titleGlyphs.map((g, i) => (
            <span
              key={i}
              className="dseq-glyph"
              style={{ ['--i' as string]: String(i) }}
              aria-hidden="true"
            >
              {g}
            </span>
          ))}
        </h1>

        <p className="dseq-lede">
          Nine vectors turn raw infrastructure signal into a verified fix.
          Every one of them runs on your machine, with your credentials, under your approval.
        </p>

        <div className="dseq-vectors" role="tablist" aria-label="Lear operating vectors">
          {VECTORS.map((v, i) => {
            const { Icon } = v;
            return (
              <button
                key={v.id}
                role="tab"
                aria-selected={i === active}
                className={`dseq-vector ${i === active ? 'is-active' : ''}`}
                style={{ ['--i' as string]: String(i) }}
                onClick={() => { setActive(i); sfxFor('gold.chime', v.id); CUES.lockOn(); }}
                onMouseEnter={() => { sfxAny('ui.hover', { minGapMs: 80 }); }}
              >
                <span className="dseq-vector-kicker">{v.kicker}</span>
                <span className="dseq-vector-icon"><Icon size={22} /></span>
                <span className="dseq-vector-title">{v.title}</span>
                <span className="dseq-vector-metric">{v.metric}</span>
              </button>
            );
          })}
        </div>

        <div className="dseq-detail" key={activeVector.id}>
          <h2>{activeVector.title}</h2>
          <p>{activeVector.body}</p>
        </div>

        <div className="dseq-actions">
          <button
            className="dseq-cta"
            onClick={enter}
            onMouseEnter={() => sfx('ui.hover.06', { minGapMs: 90 })}
          >
            Enter the console <ArrowRight size={16} />
          </button>
          <button
            className="dseq-ghost"
            onClick={close}
            onMouseEnter={() => sfx('ui.hover.02', { minGapMs: 90 })}
          >
            Return
          </button>
        </div>
      </div>

      {/* ---- 7. grain + vignette ------------------------------------------ */}
      <div className="dseq-grain" aria-hidden="true" />
      <div className="dseq-vignette" aria-hidden="true" />
      <div className="dseq-boot-wipe" aria-hidden="true" />
    </div>
  );
};

export default DirectionSequence;
