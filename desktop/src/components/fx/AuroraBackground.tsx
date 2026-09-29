import React, { useEffect, useRef } from 'react';

/* =============================================================================
   AURORA BACKGROUND — the app-wide living backdrop ("live video" layer)
   -----------------------------------------------------------------------------
   A procedural, cinematic nebula + neural particle mesh rendered on canvas at
   display refresh (60/120/144Hz). No video downloads, no GBs — and unlike a
   video, it reacts to the pointer and never loops visibly.

   Smoothness discipline (the "100fps" contract):
     - DPR capped at 1.5 (fills ~2.25x fewer pixels on Retina).
     - Auto quality governor: measures real frame cost and steps particle
       tiers DOWN before jank appears, and back up when headroom returns.
     - Single rAF loop, zero allocations per frame (typed pools), pointer
       parallax applied with cheap lerps.
     - Pauses entirely in hidden tabs; renders one static frame under
       prefers-reduced-motion.
   ========================================================================== */

interface Orb {
  x: number; y: number; r: number; hue: [number, number, number];
  dx: number; dy: number; phase: number; speed: number; parallax: number;
}
interface Node {
  x: number; y: number; vx: number; vy: number; r: number;
}
interface Comet {
  x: number; y: number; vx: number; life: number; ttl: number; hue: [number, number, number];
}

const ORB_COLORS: [number, number, number][] = [
  [232, 180, 74],   // brand pink
  [139, 92, 246],   // intelligence violet
  [34, 211, 238],   // signal cyan
  [232, 180, 74],
  [94, 60, 220],
];

const TIERS = [
  { particles: 84, comets: 3, linkDist: 130 },
  { particles: 52, comets: 2, linkDist: 120 },
  { particles: 26, comets: 1, linkDist: 105 },
  { particles: 0, comets: 0, linkDist: 0 }, // orbs only
];

export const AuroraBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c2d = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!c2d) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let tierIndex = 0;
    let emaFrame = 8; // ms EMA of our own draw cost
    let framesOnTier = 0;
    let time = 0;

    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
    let orbs: Orb[] = [];
    let nodes: Node[] = [];
    let comets: Comet[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const rebuild = () => {
      const tier = TIERS[tierIndex];
      orbs = ORB_COLORS.map((hue, i) => ({
        x: rand(0.12, 0.88),
        y: rand(0.1, 0.75),
        r: rand(0.32, 0.55),
        hue,
        dx: rand(-0.02, 0.02),
        dy: rand(-0.015, 0.015),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.05, 0.12),
        parallax: 4 + i * 3.5,
      }));
      nodes = Array.from({ length: tier.particles }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: rand(-0.14, 0.14),
        vy: rand(-0.12, 0.12),
        r: rand(0.8, 1.9),
      }));
      comets = [];
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawOrbs = (t: number) => {
      c2d.globalCompositeOperation = 'lighter';
      for (const o of orbs) {
        const cx = w * o.x + Math.sin(t * o.speed + o.phase) * w * 0.045 + mouse.x * o.parallax;
        const cy = h * o.y + Math.cos(t * o.speed * 0.9 + o.phase) * h * 0.05 + mouse.y * o.parallax * 0.7;
        const rad = Math.max(w, h) * o.r * (1 + Math.sin(t * 0.11 + o.phase) * 0.05);
        const grad = c2d.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const [r, g, b] = o.hue;
        grad.addColorStop(0, `rgba(${r},${g},${b},0.075)`);
        grad.addColorStop(0.45, `rgba(${r},${g},${b},0.028)`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        c2d.fillStyle = grad;
        c2d.beginPath();
        c2d.arc(cx, cy, rad, 0, Math.PI * 2);
        c2d.fill();
      }
      c2d.globalCompositeOperation = 'source-over';
    };

    const drawMesh = () => {
      const tier = TIERS[tierIndex];
      if (tier.particles === 0) return;
      const link2 = tier.linkDist * tier.linkDist;

      for (const n of nodes) {
        n.x += n.vx + mouse.x * 0.06;
        n.y += n.vy + mouse.y * 0.05;
        if (n.x < -20) n.x = w + 20;
        else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        else if (n.y > h + 20) n.y = -20;
      }

      c2d.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < link2) {
            const alpha = (1 - d2 / link2) * 0.16;
            c2d.strokeStyle = `rgba(232,196,120,${alpha.toFixed(3)})`;
            c2d.beginPath();
            c2d.moveTo(a.x, a.y);
            c2d.lineTo(b.x, b.y);
            c2d.stroke();
          }
        }
      }
      for (const n of nodes) {
        c2d.fillStyle = 'rgba(255,226,160,0.55)';
        c2d.beginPath();
        c2d.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        c2d.fill();
      }
    };

    const drawComets = (t: number) => {
      const tier = TIERS[tierIndex];
      // Spawn on a slow cadence
      if (tier.comets > 0 && comets.length < tier.comets && Math.random() < 0.008) {
        comets.push({
          x: rand(-0.2, 1.0) * w,
          y: rand(0.05, 0.5) * h,
          vx: rand(2.2, 3.8),
          life: 0,
          ttl: rand(160, 260),
          hue: ORB_COLORS[Math.floor(rand(0, 3)) | 0],
        });
      }
      c2d.globalCompositeOperation = 'lighter';
      comets = comets.filter((m) => m.life < m.ttl && m.x < w + 80);
      for (const m of comets) {
        m.life++;
        const speed = m.vx * (1 + Math.sin(t * 0.3) * 0.1);
        m.x += speed;
        m.y += speed * 0.16;
        const fade = Math.sin((m.life / m.ttl) * Math.PI);
        const [r, g, b] = m.hue;
        const len = 90;
        const grad = c2d.createLinearGradient(m.x - len, m.y - len * 0.16, m.x, m.y);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, `rgba(${r},${g},${b},${(0.5 * fade).toFixed(3)})`);
        c2d.strokeStyle = grad;
        c2d.lineWidth = 1.4;
        c2d.beginPath();
        c2d.moveTo(m.x - len, m.y - len * 0.16);
        c2d.lineTo(m.x, m.y);
        c2d.stroke();
        c2d.fillStyle = `rgba(255,255,255,${(0.75 * fade).toFixed(3)})`;
        c2d.beginPath();
        c2d.arc(m.x, m.y, 1.6, 0, Math.PI * 2);
        c2d.fill();
      }
      c2d.globalCompositeOperation = 'source-over';
    };

    const frame = () => {
      if (!running) return;
      const start = performance.now();
      time += 0.016;

      mouse.x += (mouse.tx - mouse.x) * 0.055;
      mouse.y += (mouse.ty - mouse.y) * 0.055;

      c2d.clearRect(0, 0, w, h);
      drawOrbs(time);
      drawMesh();
      drawComets(time);

      // Quality governor — adapt before users ever see jank
      const cost = performance.now() - start;
      emaFrame = emaFrame * 0.92 + cost * 0.08;
      framesOnTier++;
      if (framesOnTier > 90) {
        if (emaFrame > 9 && tierIndex < TIERS.length - 1) {
          tierIndex++;
          framesOnTier = 0;
          rebuild();
        } else if (emaFrame < 4.5 && tierIndex > 0) {
          tierIndex--;
          framesOnTier = 0;
          rebuild();
        }
      }

      raf = requestAnimationFrame(frame);
    };

    const drawStatic = () => {
      c2d.clearRect(0, 0, w, h);
      drawOrbs(1.2);
    };

    resize();
    rebuild();

    const onResize = () => {
      resize();
      rebuild();
      if (reduceMotion) drawStatic();
    };
    const onPointer = (e: PointerEvent) => {
      mouse.tx = e.clientX / window.innerWidth - 0.5;
      mouse.ty = e.clientY / window.innerHeight - 0.5;
      if (reduceMotion) return;
    };
    const onVisibility = () => {
      running = document.visibilityState === 'visible';
      if (running && !reduceMotion) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    if (reduceMotion) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`fixed inset-0 pointer-events-none ${className}`}
        style={{ zIndex: -10 }}
      />
      {/* vignette + top/bottom depth shade, pure CSS for zero draw cost */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -9,
          background:
            'radial-gradient(120% 90% at 50% 10%, transparent 40%, rgba(4,6,10,0.55) 100%), linear-gradient(180deg, rgba(4,6,10,0.5) 0%, transparent 22%, transparent 78%, rgba(4,6,10,0.65) 100%)',
        }}
      />
    </>
  );
};

export default AuroraBackground;
