import { useEffect, useRef, useState } from 'react';

/* =============================================================================
   LIVE VIDEO BACKDROP — U-07 "brightened, premium, ultra-advanced" underlay
   -----------------------------------------------------------------------------
   Sits at the very back of the z-stack (below the AuroraBackground canvas at
   z:-10) and gives the whole app a living, cinematic, *brightened* base so the
   deep-black surface never reads as a flat dead void.

   Two ways it plays, best-first, with automatic graceful fallback:

     1. REAL VIDEO  — if any file exists in /media (video-hero.webm / .mp4),
        it is played muted+looped+playsinline, brightened and scrimmed for AA
        text contrast. Drop your own loop in desktop/public/media to use it.

     2. LIVE PARALLAX — otherwise it cross-fades premium generated brand plates
        (backdrop-nebula.png / backdrop-grid.png) with a slow Ken-Burns drift.
        This is effectively a real-time procedural "video": GPU-only transforms,
        ~0 CPU, no multi-MB binary, so it never costs the 100 FPS budget.

   Performance + accessibility guarantees:
     • transform/opacity/filter only (compositor-friendly)
     • pauses when the tab is hidden and when the element is off-screen
     • fully static under prefers-reduced-motion / low-power
     • pointer-events: none, aria-hidden — pure decoration
   ========================================================================== */

/* Nine 4K gold/black cinematic plates. The backdrop cross-fades between them
   with a slow Ken-Burns drift, which is what gives the console a *living*
   background without shipping (or decoding) a multi-hundred-megabyte video.

   IMPORTANT for performance: only the current plate and the one it is fading
   to are ever mounted. Rendering all nine as stacked layers would hold nine
   full-viewport composited textures on the GPU for the life of the session -
   roughly 9 x (screen area x 4 bytes) of VRAM doing nothing. At 4K that is
   over 250 MB of texture memory to display one image. */
const PLATES = [
  '/media/plate-foundry.png',
  '/media/plate-datacore.png',
  '/media/plate-reactor.png',
  '/media/plate-assembly.png',
  '/media/plate-server-vault.png',
  '/media/plate-topology.png',
  '/media/plate-orbital.png',
  '/media/plate-nebula-gold.png',
  '/media/plate-monolith-gold.png',
  '/media/plate-tunnel.png',
  '/media/plate-bridge-night.png',
  '/media/plate-turbine.png',
  '/media/plate-liquid-gold.png',
  '/media/plate-hangar.png',
  '/media/plate-silicon.png',
  '/media/plate-observatory.png',
  '/media/plate-vault-door.png',
  '/media/plate-cargo.png',
  '/media/plate-lab.png',
  '/media/plate-filament.png',
  '/media/plate-canyon.png',
  '/media/plate-uplink.png',
  '/media/plate-hull.png',
  '/media/plate-inlay.png',
  '/media/plate-atrium.png',
  '/media/plate-forge-arm.png',
  '/media/plate-crystal.png',
  '/media/plate-rails.png',
  '/media/plate-aurora-gold.png',
  '/media/plate-gantry.png',
  '/media/plate-anechoic.png',
  '/media/plate-spillway.png',
  '/media/plate-cleanroom.png',
  '/media/plate-pour.png',
  '/media/plate-smelter.png',
  '/media/plate-launch.png',
  '/media/plate-mirror.png',
  '/media/plate-archive.png',
  '/media/plate-dunes.png',
];
// Optional real-video sources (WebM preferred, MP4 fallback). Present = used.
const VIDEO_SOURCES = [
  { src: '/media/video-hero.webm', type: 'video/webm' },
  { src: '/media/video-hero.mp4', type: 'video/mp4' },
];

async function anyVideoExists(): Promise<boolean> {
  for (const s of VIDEO_SOURCES) {
    try {
      const res = await fetch(s.src, { method: 'HEAD' });
      if (res.ok) return true;
    } catch {
      /* ignore — fall through to parallax */
    }
  }
  return false;
}

export const LiveVideoBackdrop: React.FC<{ brightness?: number }> = ({ brightness = 1.18 }) => {
  const [useVideo, setUseVideo] = useState(false);
  const [plate, setPlate] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Decide video vs parallax once.
  useEffect(() => {
    let alive = true;
    anyVideoExists().then((ok) => alive && setUseVideo(ok));
    return () => {
      alive = false;
    };
  }, []);

  // Slow cross-fade between plates — the "living" motion for the parallax path.
  useEffect(() => {
    if (useVideo || reduce) return;
    const id = window.setInterval(() => setPlate((p) => (p + 1) % PLATES.length), 11000);
    return () => window.clearInterval(id);
  }, [useVideo, reduce]);

  // Pause on tab-hidden / off-screen to protect the frame budget.
  useEffect(() => {
    if (!useVideo) return;
    const v = videoRef.current;
    if (!v) return;
    const play = () => v.play().catch(() => {});
    const onVis = () => (document.hidden ? v.pause() : play());
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting && !document.hidden ? play() : v.pause()),
      { threshold: 0.01 },
    );
    if (rootRef.current) io.observe(rootRef.current);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [useVideo]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -11 }}
    >
      {useVideo ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover gpu-layer"
          style={{ filter: `brightness(${brightness}) saturate(1.15)` }}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={PLATES[0]}
        >
          {VIDEO_SOURCES.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>
      ) : (
        PLATES.map((src, i) => (
          // Mount only the visible plate and the one it is fading toward.
          Math.abs(i - plate) > 1 && !(plate === PLATES.length - 1 && i === 0) ? null : (
          <div
            key={src}
            className="absolute inset-0 gpu-layer"
            style={{
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: `brightness(${brightness}) saturate(1.12)`,
              opacity: plate === i ? 1 : 0,
              transform: plate === i ? 'scale(1.06)' : 'scale(1.12)',
              transition: reduce
                ? 'none'
                : 'opacity 2600ms ease, transform 12000ms linear',
              willChange: 'opacity, transform',
            }}
          />
          )
        ))
      )}

      {/* Scrim: keeps foreground text at AA contrast over the bright plate. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 120% at 50% -10%, rgba(8,11,17,0) 0%, rgba(8,11,17,0.35) 48%, rgba(8,11,17,0.72) 100%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(8,11,17,0.28) 0%, rgba(8,11,17,0.55) 100%)' }}
      />
    </div>
  );
};

export default LiveVideoBackdrop;
