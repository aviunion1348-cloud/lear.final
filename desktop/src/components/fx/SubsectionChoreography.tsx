import { useEffect } from 'react';
import './SubsectionChoreography.css';

/* =============================================================================
   SUBSECTION CHOREOGRAPHY
   -----------------------------------------------------------------------------
   SectionTransition animates a *section* when you switch tabs. This animates
   everything *inside* it — the panels, cards, table blocks and stat tiles that
   make up a subsection — without editing a single one of those components.

   How it works
     1. One MutationObserver watches the document for new blocks.
     2. Any block matching SUB_SELECTOR is tagged data-sub="pending".
     3. An IntersectionObserver reveals each block the first time it scrolls
        into view, then unobserves it. Reveal = fade + 10px rise + un-blur +
        a gold hairline that draws across the top edge. 340ms.

   Why this is safe rather than a liability
     · FAIL-VISIBLE. The CSS only dims an element while data-sub="pending" is
       present, and that attribute is set exclusively by this script. No JS, no
       observers, a thrown error mid-pass — the content is simply visible. This
       layer can never leave the UI blank.
     · A hard watchdog reveals everything after 900ms no matter what, so a
       misfiring observer cannot strand a panel off-screen.
     · Elements already in view at mount are revealed on the first callback
       (~1 frame), so nothing waits on a scroll that never comes.
     · Stagger is capped: 8 blocks x 26ms = 208ms worst case, and it only
       applies to blocks revealed in the same batch.
     · Only transform / opacity / filter animate. will-change is dropped when
       the reveal finishes, so we never hold idle compositor layers.
     · Full prefers-reduced-motion bypass — the whole module no-ops.
   ========================================================================== */

/** Blocks we treat as a "subsection". Structural surfaces, not cosmetic spans. */
const SUB_SELECTOR = [
  '[data-sub-block]',
  '.glass-panel',
  '.glass-card',
  '.sec-body section',
].join(',');

/** Cap the cascade so a dense view never feels like it is loading. */
const MAX_STAGGER = 8;
const STEP_MS = 26;
/** Nothing stays dimmed longer than this, whatever the observers do. */
const WATCHDOG_MS = 900;
/** Reveals landing inside this window are treated as one cascade. */
const BATCH_WINDOW_MS = 260;

export const SubsectionChoreography: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window) || !('MutationObserver' in window)) return;

    let batch = 0;
    let batchTimer = 0;

    const reveal = (el: HTMLElement, index: number) => {
      el.style.setProperty('--sub-delay', `${Math.min(index, MAX_STAGGER) * STEP_MS}ms`);
      el.dataset.sub = 'in';
      const settle = () => {
        el.dataset.sub = 'done';
        el.style.removeProperty('--sub-delay');
      };
      el.addEventListener('animationend', settle, { once: true });
      // Belt and braces: if the animation never fires (background tab, etc.).
      window.setTimeout(settle, 700);
    };

    const io = new IntersectionObserver(
      (entries) => {
        // Reveal in document order so the cascade reads top-to-bottom.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort((a, b) =>
            a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
          );

        visible.forEach((el, i) => {
          io.unobserve(el);
          reveal(el, batch + i);
        });

        batch += visible.length;
        window.clearTimeout(batchTimer);
        batchTimer = window.setTimeout(() => {
          batch = 0;
        }, BATCH_WINDOW_MS);
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.01 },
    );

    const scan = (root: ParentNode) => {
      const nodes = root.querySelectorAll<HTMLElement>(SUB_SELECTOR);
      nodes.forEach((el) => {
        if (el.dataset.sub) return; // already handled
        el.dataset.sub = 'pending';
        el.dataset.subAt = String(performance.now());
        io.observe(el);
      });
    };

    scan(document);

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n.nodeType === 1) scan(n as Element);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Watchdog — anything still pending past WATCHDOG_MS is shown outright.
    const watchdog = window.setInterval(() => {
      const now = performance.now();
      document.querySelectorAll<HTMLElement>('[data-sub="pending"]').forEach((el) => {
        if (now - Number(el.dataset.subAt ?? now) > WATCHDOG_MS) {
          io.unobserve(el);
          el.dataset.sub = 'done';
        }
      });
    }, 300);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearInterval(watchdog);
      window.clearTimeout(batchTimer);
      document.querySelectorAll<HTMLElement>('[data-sub]').forEach((el) => {
        delete el.dataset.sub;
        delete el.dataset.subAt;
      });
    };
  }, []);

  return null;
};

export default SubsectionChoreography;
