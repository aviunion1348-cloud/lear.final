import { useEffect, useRef, useState } from 'react';
import './ConsoleIgnition.css';
import { sfxCue, sfx } from '../../lib/soundEngine';

/* =============================================================================
   CONSOLE IGNITION
   -----------------------------------------------------------------------------
   The handoff moment. Plays once when the user crosses from the cinematic
   landing into the real application, so the console doesn't just "appear" —
   it powers on.

   Timeline (1,900ms total, then it unmounts itself):
     0ms     black + a single horizontal filament of light
     180ms   filament blooms outward (CRT power-on)
     420ms   HUD boot log types in, four systems report online
     900ms   gold iris opens from the centre
     1250ms  shockwave ring + title flare "LEAR CONSOLE"
     1600ms  the whole veil dissolves, revealing the live app beneath
     1900ms  unmount — zero residual cost

   Performance:
     · Pure CSS keyframes on transform/opacity/filter/clip-path. No rAF, no
       canvas, no layout. The entire sequence is compositor work.
     · Unmounts completely when finished, so nothing lingers in the tree.
     · Skippable: click, any key, or prefers-reduced-motion jumps to the end.
   ========================================================================== */

const BOOT_LINES = [
  { at: 420, text: 'CORE ................ ONLINE' },
  { at: 560, text: 'WATCHERS ............ 13 ACTIVE' },
  { at: 700, text: 'ROOT-CAUSE BRAIN .... READY' },
  { at: 840, text: 'CREDENTIALS ......... LOCAL ONLY' },
];

export interface ConsoleIgnitionProps {
  onDone: () => void;
}

export const ConsoleIgnition: React.FC<ConsoleIgnitionProps> = ({ onDone }) => {
  const [lines, setLines] = useState<string[]>([]);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { finish(); return; }

    const timers: number[] = [];

    sfxCue([
      { name: 'hud.boot' },
      { name: 'robot.charge', at: 280 },
      { name: 'seq.riser', at: 380 },
      { name: 'seq.impact', at: 1240 },
      { name: 'gold.shimmer.04', at: 1320 },
      { name: 'seq.enter.console', at: 1420 },
    ]);

    BOOT_LINES.forEach(({ at, text }) => {
      timers.push(window.setTimeout(() => {
        setLines((l) => [...l, text]);
        sfx('data.packet.03', { minGapMs: 0 });
      }, at));
    });

    timers.push(window.setTimeout(finish, 1900));

    const skip = () => { timers.forEach(clearTimeout); finish(); };
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, []);

  return (
    <div className="ignition" role="presentation" aria-hidden="true">
      <div className="ignition-veil" />
      <div className="ignition-filament" />
      <div className="ignition-iris" />
      <div className="ignition-ring" />
      <div className="ignition-ring ignition-ring-2" />

      <div className="ignition-grid" />
      <div className="ignition-rays" />

      <div className="ignition-boot">
        {lines.map((l) => (
          <span className="ignition-boot-line" key={l}>{l}</span>
        ))}
      </div>

      <div className="ignition-title">
        <span>LEAR</span>
        <em>CONSOLE</em>
      </div>

      <div className="ignition-scan" />
      <div className="ignition-grain" />
    </div>
  );
};

export default ConsoleIgnition;
