import { useEffect, useState } from 'react';

/* =============================================================================
   ATMOSPHERE OVERLAY — the "film" that makes flat black look like $1M glass
   -----------------------------------------------------------------------------
   A single always-on, pointer-events:none layer stacked above the app chrome
   (below modals/toasts) that adds four cinema-grade textures the eye reads as
   "expensive": film grain, a soft vignette, a faint HUD scanline field, and a
   slow diagonal light sweep. All GPU-cheap (SVG noise data-URI + CSS gradients
   animated on transform/opacity only) and disabled under reduced-motion.
   ========================================================================== */

// Tiny fractal-noise SVG, encoded once — no network, no image asset.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export const AtmosphereOverlay: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0" style={{ zIndex: 90 }}>
      {/* Film grain */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: GRAIN,
          backgroundSize: '140px 140px',
          opacity: 0.05 * intensity,
          mixBlendMode: 'overlay',
          animation: reduce ? undefined : 'grain 0.6s steps(3) infinite',
        }}
      />
      {/* Vignette — pulls focus to the centre, deepens the edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)',
        }}
      />
      {/* HUD scanlines — barely-there horizontal ruling */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 3px)',
          opacity: 0.6 * intensity,
        }}
      />
      {/* Slow diagonal light sweep — the "living glass" glint */}
      {!reduce && (
        <div
          className="absolute -inset-[40%]"
          style={{
            background:
              'linear-gradient(115deg, transparent 40%, rgba(232, 180, 74,0.05) 48%, rgba(255,240,205,0.05) 52%, transparent 60%)',
            animation: 'sheen 14s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
};

export default AtmosphereOverlay;
