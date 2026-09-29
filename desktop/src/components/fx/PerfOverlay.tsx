import { useEffect, useState } from 'react';
import { usePerf } from '../../hooks/usePerf';
import { ANIMATION_COUNT } from '../../lib/animationRegistry';
import { SFX_COUNT } from '../../lib/soundEngine';

/* =============================================================================
   PERF OVERLAY — dev-facing proof of smoothness (toggle: Ctrl/Cmd + Shift + F)
   -----------------------------------------------------------------------------
   A compact glass HUD showing live FPS, the worst frame in the window, and the
   real registry sizes (animations + sounds). Off by default; never in the way.
   ========================================================================== */

export const PerfOverlay: React.FC = () => {
  const [on, setOn] = useState(false);
  const s = usePerf(on);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'F' || e.key === 'f')) {
        e.preventDefault();
        setOn((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!on) return null;

  const color = s.fps >= 90 ? '#10b981' : s.fps >= 55 ? '#f59e0b' : '#f43f5e';

  return (
    <div
      className="glass-heavy fixed bottom-4 left-4 rounded-xl px-3 py-2 font-mono text-[11px] leading-tight"
      style={{ zIndex: 95, minWidth: 148 }}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-neutral-400">FPS</span>
        <span style={{ color, fontWeight: 700 }}>{s.fps}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-neutral-400">low</span>
        <span className="text-neutral-200">{s.low}</span>
      </div>
      <div className="mt-1 border-t border-white/10 pt-1 text-neutral-500">
        <div className="flex justify-between gap-4">
          <span>anim</span>
          <span className="text-neutral-300">{ANIMATION_COUNT}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>sfx</span>
          <span className="text-neutral-300">{SFX_COUNT}</span>
        </div>
      </div>
    </div>
  );
};

export default PerfOverlay;
