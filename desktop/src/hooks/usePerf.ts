import { useEffect, useRef, useState } from 'react';

/* =============================================================================
   usePerf — a tiny, honest frame-rate meter
   -----------------------------------------------------------------------------
   Samples requestAnimationFrame deltas and reports a smoothed FPS plus the
   worst frame in the last second, so the "100 FPS / no lag" claim is verifiable
   rather than vibes. Zero deps, self-cleaning, and cheap enough to leave on.
   ========================================================================== */

export interface PerfSample {
  fps: number; // smoothed
  low: number; // worst (1% low-ish) fps over the window
  frames: number; // frames counted this window
}

export function usePerf(enabled: boolean): PerfSample {
  const [sample, setSample] = useState<PerfSample>({ fps: 0, low: 0, frames: 0 });
  const raf = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    let maxDelta = 0;
    let smoothed = 0;

    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      acc += dt;
      frames += 1;
      if (dt > maxDelta) maxDelta = dt;
      const inst = 1000 / Math.max(dt, 0.0001);
      smoothed = smoothed ? smoothed * 0.9 + inst * 0.1 : inst;

      if (acc >= 500) {
        setSample({
          fps: Math.round(smoothed),
          low: Math.round(1000 / Math.max(maxDelta, 0.0001)),
          frames,
        });
        acc = 0;
        frames = 0;
        maxDelta = 0;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [enabled]);

  return sample;
}
