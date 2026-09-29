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
  /** Detected display refresh rate (Hz), measured from the fastest frames we
      actually observe. Reporting "58/120" on a 60Hz panel would be a bug in
      the meter, not in the app, so the HUD grades against this instead. */
  refresh: number;
}

export function usePerf(enabled: boolean): PerfSample {
  const [sample, setSample] = useState<PerfSample>({ fps: 0, low: 0, frames: 0, refresh: 0 });
  const raf = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    let maxDelta = 0;
    let minDelta = Infinity;
    let smoothed = 0;
    let refresh = 0;

    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      acc += dt;
      frames += 1;
      if (dt > maxDelta) maxDelta = dt;
      // Ignore sub-millisecond deltas: those are coalesced callbacks, not
      // real frames, and would report a fictional 2000Hz display.
      if (dt > 1 && dt < minDelta) minDelta = dt;
      const inst = 1000 / Math.max(dt, 0.0001);
      smoothed = smoothed ? smoothed * 0.9 + inst * 0.1 : inst;

      if (acc >= 500) {
        // The fastest real frame we have seen is the best evidence of what
        // this display can do; keep the highest estimate across windows.
        if (minDelta !== Infinity) {
          refresh = Math.max(refresh, Math.round(1000 / minDelta));
        }
        setSample({
          fps: Math.round(smoothed),
          low: Math.round(1000 / Math.max(maxDelta, 0.0001)),
          frames,
          refresh,
        });
        acc = 0;
        frames = 0;
        maxDelta = 0;
        minDelta = Infinity;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [enabled]);

  return sample;
}
