import { useEffect, useRef, useState } from 'react';
import './SectionTransition.css';
import { sfx, sfxCue } from '../../lib/soundEngine';

/* =============================================================================
   SECTION TRANSITION
   -----------------------------------------------------------------------------
   Wraps whichever console subsection is active and gives EVERY one of them the
   same cinematic entrance, without touching the seven section components
   themselves.

   What it does on each tab change:
     1. Sweeps a gold light-bar across the content area (the "wipe").
     2. Fades + rises + un-blurs the incoming section.
     3. Staggers the section's own top-level children in behind it, so tables,
       cards and panels cascade rather than snapping in as one block.
     4. Fires a layered transition cue on the sound engine.
     5. Paints a per-section accent (each tab gets its own gold temperature),
       exposed as --sec-accent for the section's own styles to pick up.

   Usability guardrails — this is the part that keeps it *workable*:
     · The whole entrance completes in 420ms. Content is readable at ~180ms.
     · Stagger is capped at 10 children and 28ms apart, so a long list never
       waits on a cascade. Item 11+ appears immediately with the rest.
     · Nothing blocks input: the wipe layer is pointer-events:none and the
       content is interactive from frame one.
     · `will-change` is dropped the moment the animation ends, so we don't hold
       a compositor layer per section for the life of the app.
     · Full prefers-reduced-motion bypass.
   ========================================================================== */

/** Each tab gets its own gold temperature, warm → cool across the ramp. */
const ACCENTS: Record<string, string> = {
  dashboard: '232, 180, 74',      // signature gold
  chat: '247, 231, 195',          // champagne
  projects: '201, 162, 39',       // brass
  integrations: '242, 205, 124',  // light gold
  activity: '210, 154, 46',       // deep gold
  notifications: '237, 192, 99',  // amber gold
  settings: '156, 107, 60',       // bronze
};

export interface SectionTransitionProps {
  /** Changing this key replays the entrance. */
  sectionKey: string;
  children: React.ReactNode;
}

export const SectionTransition: React.FC<SectionTransitionProps> = ({ sectionKey, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    // Replay the entrance by bumping a phase counter used in the CSS key.
    setPhase((p) => p + 1);

    // Sound: the very first mount is the console arrival, later ones are moves.
    if (first.current) {
      first.current = false;
      sfxCue([{ name: 'ui.page.01' }, { name: 'gold.chime.05', at: 120 }]);
    } else {
      sfxCue([
        { name: 'ui.page.02' },
        { name: 'hud.bracket.in', at: 60 },
        { name: 'data.stream.start', at: 90 },
      ]);
    }

    // Release the compositor layer once the entrance is finished.
    const t = window.setTimeout(() => {
      el.classList.add('sec-settled');
    }, 520);

    return () => {
      window.clearTimeout(t);
      el.classList.remove('sec-settled');
    };
  }, [sectionKey]);

  return (
    <div
      ref={ref}
      className="sec"
      key={`${sectionKey}-${phase}`}
      style={{ ['--sec-accent' as string]: ACCENTS[sectionKey] ?? ACCENTS.dashboard }}
      onMouseEnter={() => sfx('ui.hover.01', { minGapMs: 600 })}
    >
      <span className="sec-wipe" aria-hidden="true" />
      <span className="sec-edge" aria-hidden="true" />
      <div className="sec-body">{children}</div>
    </div>
  );
};

export default SectionTransition;
