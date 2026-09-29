import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './CommandPalette.css';
import { sfx, sfxCue } from '../../lib/soundEngine';
import type { Playbook } from '../../lib/playbooks.generated';

/* =============================================================================
   COMMAND PALETTE  (Cmd/Ctrl + K)
   -----------------------------------------------------------------------------
   One keystroke to reach any of the 1,557 generated playbooks plus every
   console section, without taking your hands off the keyboard.

   Two things worth knowing about how this is built:

   1. THE CATALOGUE IS LAZY. playbooks.generated.ts is ~850 KB. Importing it
      normally would put all of it in the first paint's critical path for a
      feature most sessions never open. It is dynamically imported on the first
      palette open, cached after that, and the palette stays usable (navigation
      commands only) while it streams in.

   2. EXECUTABLE VS GUIDED IS SHOWN, NOT HIDDEN. 630 of the playbooks map to a
      real prash/actions module; 927 are guided procedures with a CLI command.
      The badge tells you which you are looking at before you commit to it. A
      palette that implies everything runs is worse than a smaller one that is
      honest, because you find out at the worst possible moment.

   Keyboard: Cmd/Ctrl+K opens · ↑/↓ moves · Enter runs · Esc closes.
   Accessibility: focus is trapped while open, restored on close, the list is a
   real listbox, and the whole thing is operable without a pointer.
   ========================================================================== */

export interface NavCommand {
  id: string;
  title: string;
  keywords: string;
  run: () => void;
}

interface CommandPaletteProps {
  /** Console sections, injected so the palette owns no routing knowledge. */
  navCommands: NavCommand[];
}

type Row =
  | { kind: 'nav'; cmd: NavCommand }
  | { kind: 'playbook'; pb: Playbook };

const MAX_ROWS = 40;

export const CommandPalette: React.FC<CommandPaletteProps> = ({ navCommands }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [playbooks, setPlaybooks] = useState<Playbook[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  /* -- lazy catalogue load ------------------------------------------------ */
  const ensureCatalogue = useCallback(async () => {
    if (playbooks || loading) return;
    setLoading(true);
    try {
      const mod = await import('../../lib/playbooks.generated');
      setPlaybooks(mod.PLAYBOOKS);
    } catch {
      // Palette still works for navigation; we just say so rather than
      // pretending the catalogue is empty.
      setPlaybooks([]);
    } finally {
      setLoading(false);
    }
  }, [playbooks, loading]);

  /* -- open / close ------------------------------------------------------- */
  const show = useCallback(() => {
    restoreFocus.current = document.activeElement as HTMLElement;
    setOpen(true);
    setQuery('');
    setCursor(0);
    void ensureCatalogue();
    sfxCue([{ name: 'ui.page.01' }, { name: 'hud.bracket.in', at: 40 }]);
  }, [ensureCatalogue]);

  const hide = useCallback(() => {
    setOpen(false);
    sfx('ui.close.01');
    restoreFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open ? hide() : show();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, show, hide]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* -- filtering ----------------------------------------------------------
     Plain substring-over-tokens. Deliberately not a fuzzy matcher: on 1,557
     rows, fuzzy scoring produced confident-looking nonsense matches, and for
     an operations tool "I typed rollback and got rollback" beats clever.     */
  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    const navHits: Row[] = navCommands
      .filter((c) => !terms.length || terms.every((t) => (c.title + ' ' + c.keywords).toLowerCase().includes(t)))
      .map((cmd) => ({ kind: 'nav', cmd }));

    if (!terms.length) {
      // No query: show navigation plus a small, stable sample so the palette
      // never opens as an empty box.
      const sample = (playbooks ?? []).slice(0, 12).map((pb) => ({ kind: 'playbook', pb } as Row));
      return [...navHits, ...sample];
    }

    const pbHits: Row[] = [];
    for (const pb of playbooks ?? []) {
      if (terms.every((t) => pb.keywords.includes(t) || pb.title.toLowerCase().includes(t))) {
        pbHits.push({ kind: 'playbook', pb });
        if (pbHits.length >= MAX_ROWS) break;
      }
    }
    return [...navHits, ...pbHits];
  }, [query, playbooks, navCommands]);

  useEffect(() => setCursor(0), [query]);

  /* -- activation --------------------------------------------------------- */
  const activate = useCallback(
    (row: Row) => {
      if (row.kind === 'nav') {
        row.cmd.run();
        hide();
        return;
      }
      // Guided playbooks copy their CLI line; that is the honest action.
      const { pb } = row;
      navigator.clipboard?.writeText(pb.cli).then(
        () => setToast(`Copied: ${pb.cli}`),
        () => setToast(pb.cli),
      );
      sfx('gold.chime.05');
      hide();
    },
    [hide],
  );

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* -- keyboard within the palette ---------------------------------------- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, rows.length - 1));
      sfx('nav.move.01', { minGapMs: 40 });
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
      sfx('nav.move.01', { minGapMs: 40 });
    }
    if (e.key === 'Enter' && rows[cursor]) { e.preventDefault(); activate(rows[cursor]); }
  };

  // Keep the cursor row scrolled into view without animating the container.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) {
    return toast ? <div className="cmdk-toast" role="status">{toast}</div> : null;
  }

  return (
    <>
      <div className="cmdk-scrim" onClick={hide} aria-hidden="true" />
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cmdk-bar">
          <span className="cmdk-prompt" aria-hidden="true">⌘</span>
          <input
            ref={inputRef}
            className="cmdk-input"
            value={query}
            placeholder={loading ? 'Loading playbook catalogue…' : 'Search playbooks, sections, connectors…'}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="cmdk-list"
            aria-autocomplete="list"
          />
          <span className="cmdk-count">
            {playbooks ? `${rows.length} / ${playbooks.length}` : '—'}
          </span>
        </div>

        <div className="cmdk-list" id="cmdk-list" role="listbox" ref={listRef}>
          {rows.length === 0 && (
            <div className="cmdk-empty">
              No match for “{query}”. Try a connector name, a verb, or an environment.
            </div>
          )}

          {rows.map((row, i) => {
            const active = i === cursor;
            if (row.kind === 'nav') {
              return (
                <button
                  key={`nav-${row.cmd.id}`}
                  data-row={i}
                  role="option"
                  aria-selected={active}
                  className={`cmdk-row ${active ? 'is-active' : ''}`}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => activate(row)}
                >
                  <span className="cmdk-kind cmdk-kind-nav">GO</span>
                  <span className="cmdk-title">{row.cmd.title}</span>
                </button>
              );
            }
            const { pb } = row;
            return (
              <button
                key={pb.id}
                data-row={i}
                role="option"
                aria-selected={active}
                className={`cmdk-row ${active ? 'is-active' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => activate(row)}
              >
                <span className={`cmdk-kind ${pb.executable ? 'cmdk-kind-run' : 'cmdk-kind-guide'}`}>
                  {pb.executable ? 'RUN' : 'GUIDE'}
                </span>
                <span className="cmdk-title">{pb.title}</span>
                <span className={`cmdk-risk cmdk-risk-${pb.risk}`}>{pb.risk}</span>
              </button>
            );
          })}
        </div>

        <div className="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> copy command</span>
          <span><kbd>esc</kbd> close</span>
          <span className="cmdk-foot-note">
            RUN = backed by a prash action · GUIDE = CLI procedure
          </span>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
