import { useEffect, useRef } from 'react';
import './PointerSpotlight.css';

/* =============================================================================
   POINTER SPOTLIGHT
   -----------------------------------------------------------------------------
   A soft gold key-light that follows the cursor across the console, plus two
   CSS custom properties published on <html> so any surface can react to the
   pointer without its own listener:

       --lear-px / --lear-py   pointer position in %, viewport relative

   glass-gold.css uses those to slide a specular sheen across whichever panel
   the cursor is over, which is what sells the glass as glass.

   Performance rules this obeys
     · ONE passive pointermove listener for the entire app. Components read the
       CSS variables instead of subscribing, so cost does not scale with panels.
     · The listener only stores coordinates. All DOM writes happen inside a
       single rAF, so we never write style mid-input and never thrash layout.
     · The rAF loop is self-cancelling: it stops as soon as the light has caught
       up with the cursor, so an idle app runs zero animation frames.
     · Movement is eased (12% per frame) — the light trails the cursor slightly,
       which reads as weight rather than lag.
     · transform + opacity only. No layout, no paint of app content.

   When it does not run at all
     · prefers-reduced-motion
     · coarse pointers (touch) — there is no hover to light
   ========================================================================== */

/** How much of the remaining distance the light covers each frame. */
const EASE = 0.12;
/** Below this px delta we call it arrived and park the loop. */
const EPSILON = 0.4;

export const PointerSpotlight: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const el = ref.current;
    if (!el) return;

    const root = document.documentElement;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let raf = 0;
    let running = false;

    const frame = () => {
      x += (tx - x) * EASE;
      y += (ty - y) * EASE;

      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      root.style.setProperty('--lear-px', `${((x / window.innerWidth) * 100).toFixed(2)}%`);
      root.style.setProperty('--lear-py', `${((y / window.innerHeight) * 100).toFixed(2)}%`);

      if (Math.abs(tx - x) < EPSILON && Math.abs(ty - y) < EPSILON) {
        running = false; // arrived — stop burning frames until the next move
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.dataset.live = '1';
      kick();
    };

    const onLeave = () => {
      el.dataset.live = '0';
    };

    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        running = false;
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVis);
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
      root.style.removeProperty('--lear-px');
      root.style.removeProperty('--lear-py');
    };
  }, []);

  return <div ref={ref} className="pointer-spotlight" data-live="0" aria-hidden="true" />;
};

export default PointerSpotlight;
