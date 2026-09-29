import { useEffect } from 'react';
import './DepthField.css';

/* =============================================================================
   DEPTH FIELD — pointer-tracked 3D parallax for every panel in the console
   -----------------------------------------------------------------------------
   Gives the console real depth: panels tilt a degree or two toward the cursor
   and lift on approach, so the glass reads as a physical stack of plates rather
   than a flat page.

   The engineering problem this solves, and why it is a global module instead of
   a per-card hook:

     A console view can hold 40+ panels. The obvious implementation puts a
     mousemove handler and a piece of React state on each one, which means 40
     listeners, 40 state updates and 40 re-renders per pointer frame. That is
     how a "premium" effect turns a 120fps view into a 30fps one.

     Instead: ONE passive pointermove listener for the whole document. It finds
     the panel under the cursor via elementFromPoint, writes two CSS custom
     properties on that single element, and lets CSS do the transform. React is
     never involved after mount. No component re-renders. No per-card state.

   Cost control:
     · Work is throttled to one rAF, and the rAF is only scheduled when the
       pointer actually moved.
     · Only the hovered panel carries a transform; the previous one is reset
       and released, so at most one element has `will-change` at any moment.
     · Disabled entirely under prefers-reduced-motion and on coarse pointers
       (a tilt that tracks a finger you cannot see is pointless and costs
       battery).
     · Nothing here can hide content: the only properties written are rotate,
       translate and a shadow. An element with no values set renders flat and
       normal.
   ========================================================================== */

/** Panels that participate. Matches the same surfaces the rest of the fx use. */
const SELECTOR = '.glass-panel, .glass-card, [data-depth]';

/** Max tilt in degrees. Above ~2.5 the text starts to visibly shear. */
const MAX_TILT = 1.8;
/** Max lift in px when the pointer is over the centre of a panel. */
const MAX_LIFT = 3;

export const DepthField: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let raf = 0;
    let px = 0;
    let py = 0;
    let dirty = false;
    let current: HTMLElement | null = null;

    const release = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.removeProperty('--dp-rx');
      el.style.removeProperty('--dp-ry');
      el.style.removeProperty('--dp-lift');
      el.removeAttribute('data-depth-active');
      el.style.willChange = 'auto';
    };

    const apply = () => {
      raf = 0;
      if (!dirty) return;
      dirty = false;

      const hit = document.elementFromPoint(px, py);
      const panel = hit ? (hit.closest(SELECTOR) as HTMLElement | null) : null;

      if (panel !== current) {
        release(current);
        current = panel;
        if (current) {
          current.style.willChange = 'transform';
          current.setAttribute('data-depth-active', 'true');
        }
      }
      if (!current) return;

      const r = current.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) return; // ignore slivers

      // -1..1 from the panel's centre.
      const nx = ((px - r.left) / r.width) * 2 - 1;
      const ny = ((py - r.top) / r.height) * 2 - 1;
      // Falls off toward the edges so neighbouring panels don't fight.
      const falloff = 1 - Math.min(1, Math.hypot(nx, ny) / 1.6);

      current.style.setProperty('--dp-ry', `${(nx * MAX_TILT).toFixed(3)}deg`);
      current.style.setProperty('--dp-rx', `${(-ny * MAX_TILT).toFixed(3)}deg`);
      current.style.setProperty('--dp-lift', `${(falloff * MAX_LIFT).toFixed(2)}px`);
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      dirty = true;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      release(current);
      current = null;
    };

    // One listener. Passive: this never calls preventDefault, and saying so
    // lets the browser keep scrolling off the main thread.
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      if (raf) cancelAnimationFrame(raf);
      release(current);
    };
  }, []);

  return null;
};

export default DepthField;
