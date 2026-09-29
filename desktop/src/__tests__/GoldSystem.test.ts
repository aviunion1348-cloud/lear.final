/* =============================================================================
   GOLD-ERA CONTRACT TESTS
   Guards the numbers we publish and the rules that keep the UI at 100fps.
   ========================================================================== */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SFX_COUNT, SFX_NAMES, SFX_FAMILIES, MAX_VOLUME, DEFAULT_VOLUME } from '../lib/soundEngine';
import {
  ANIMATION_COUNT, ANIMATION_BREAKDOWN, CSS_KEYFRAMES, GENERATED_CSS_KEYFRAMES,
} from '../lib/animationRegistry';

const read = (p: string) => readFileSync(resolve(__dirname, '../..', p), 'utf8');

describe('sound engine (200+ sci-fi effects, loud + adjustable)', () => {
  it('registers well over 200 distinct sounds', () => {
    expect(SFX_COUNT).toBeGreaterThanOrEqual(200);
    expect(new Set(SFX_NAMES).size).toBe(SFX_COUNT);
  });

  it('covers every interaction surface with its own family', () => {
    for (const fam of ['ui', 'nav', 'toast', 'gold', 'hud', 'seq', 'robot', 'data', 'deploy', 'amb', 'ctrl']) {
      expect(SFX_FAMILIES[fam], `missing family ${fam}`).toBeTruthy();
      expect(SFX_FAMILIES[fam].length).toBeGreaterThan(0);
    }
  });

  it('is loud: master ceiling exceeds unity and defaults high', () => {
    expect(MAX_VOLUME).toBeGreaterThan(1);
    expect(DEFAULT_VOLUME).toBeGreaterThanOrEqual(0.85);
  });
});

describe('motion library (900+ animations)', () => {
  it('publishes 900+ distinct named animations', () => {
    expect(ANIMATION_COUNT).toBeGreaterThanOrEqual(900);
  });

  it('has no duplicate keyframe names across hand-authored and generated tiers', () => {
    const all = [...CSS_KEYFRAMES, ...GENERATED_CSS_KEYFRAMES];
    expect(new Set(all).size).toBe(all.length);
  });

  it('every generated keyframe really exists in the stylesheet', () => {
    const css = read('src/styles/animations.generated.css');
    expect(ANIMATION_BREAKDOWN.generatedKeyframes).toBe(GENERATED_CSS_KEYFRAMES.length);
    for (const name of GENERATED_CSS_KEYFRAMES) {
      expect(css.includes(`@keyframes ${name} {`), `missing @keyframes ${name}`).toBe(true);
    }
  });

  it('generated animations never touch layout-triggering properties', () => {
    const css = read('src/styles/animations.generated.css');
    const body = css.split('/* ---- Utility classes')[0];
    for (const bad of ['width:', 'height:', 'top:', 'left:', 'right:', 'bottom:', 'margin', 'padding']) {
      expect(body.includes(bad), `layout property "${bad}" found in keyframes`).toBe(false);
    }
  });
});

describe('gold design system', () => {
  const tokens = read('src/styles/tokens.css');

  it('defines the full gold ramp', () => {
    for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
      expect(tokens).toContain(`--color-gold-${step}:`);
    }
  });

  it('anchors the brand on gold, not pink', () => {
    expect(tokens).toContain('--color-accent: #e8b44a;');
    expect(tokens).toContain('--lear-brand-rgb: 232, 180, 74;');
  });

  it('keeps pink only as the rare whisper accent', () => {
    expect(tokens).toContain('--color-whisper: #ff3a89;');
    const pink = (tokens.match(/ff3a89|255, 58, 137/gi) ?? []).length;
    expect(pink, 'pink should appear only in the whisper tokens').toBeLessThanOrEqual(3);
  });

  it('carries every U-01 scale', () => {
    for (const t of ['--space-', '--text-', '--radius-', '--shadow-', '--dur-', '--ease-', '--z-', '--blur-']) {
      expect(tokens).toContain(t);
    }
  });

  it('grades the video backdrop bright', () => {
    expect(tokens).toContain('--video-brightness: 1.28;');
  });
});

describe('no pink left in shipped source', () => {
  it('has no hard-coded neon pink outside the token file', () => {
    const files = [
      'src/components/Sidebar.tsx',
      'src/components/fx/CinematicLanding.css',
      'src/components/ServiceWidget.tsx',
      'src/lib/motion.ts',
    ];
    for (const f of files) {
      expect(read(f).toLowerCase(), `${f} still contains pink`).not.toContain('ff3a89');
    }
  });
});

describe('console entry + subsection choreography', () => {
  const ign = read('src/components/fx/ConsoleIgnition.css');
  const sec = read('src/components/fx/SectionTransition.css');
  const app = read('src/App.tsx');

  it('plays an ignition sequence on the landing -> console handoff', () => {
    expect(app).toContain('ConsoleIgnition');
    expect(app).toContain('setIgniting(true)');
    // it must unmount itself, not linger in the tree
    expect(app).toContain('onDone={() => setIgniting(false)}');
  });

  it('wraps EVERY console subsection in the shared transition', () => {
    expect(app).toContain('<SectionTransition sectionKey={activeTab}>');
    for (const tab of ['dashboard', 'chat', 'projects', 'integrations',
                       'activity', 'notifications', 'settings']) {
      expect(app).toContain(`activeTab === '${tab}'`);
    }
  });

  it('keeps the entrance inside the usability budget', () => {
    // body entrance must complete fast enough to stay workable
    expect(sec).toContain('animation: sec-body 420ms');
    // and the stagger must be capped so long lists never wait on a cascade
    expect(sec).toContain('nth-child(n+10)');
  });

  it('releases compositor layers after settling', () => {
    expect(sec).toContain('.sec.sec-settled');
    expect(sec).toContain('will-change: auto');
  });

  it('animates only compositor-safe properties in the entry sequences', () => {
    for (const [name, css] of [['ignition', ign], ['section', sec]] as const) {
      const blocks = css.match(/@keyframes[^{]+\{[\s\S]*?\n\}/g) ?? [];
      expect(blocks.length, `${name} has keyframes`).toBeGreaterThan(0);
      for (const b of blocks) {
        for (const bad of ['width:', 'height:', 'top:', 'left:', 'margin', 'padding']) {
          expect(b.includes(bad), `${name}: layout prop "${bad}" in ${b.slice(0, 40)}`).toBe(false);
        }
      }
    }
  });

  it('both entry surfaces honour reduced motion', () => {
    expect(ign).toContain('prefers-reduced-motion');
    expect(sec).toContain('prefers-reduced-motion');
  });

  it('gives each subsection its own gold accent temperature', () => {
    const t = read('src/components/fx/SectionTransition.tsx');
    for (const tab of ['dashboard', 'chat', 'projects', 'integrations',
                       'activity', 'notifications', 'settings']) {
      expect(t).toContain(`${tab}:`);
    }
  });
});

/* =============================================================================
   ROUND 3 — subsection choreography, pointer light, gold/black glass
   These guard the two properties that make heavy VFX survivable in a console
   you actually work in: it must never hide content, and it must never hold a
   compositor layer or an animation frame it isn't using.
   ========================================================================== */
describe('subsection choreography (every panel animates, nothing disappears)', () => {
  const tsx = read('src/components/fx/SubsectionChoreography.tsx');
  const css = read('src/components/fx/SubsectionChoreography.css');

  it('is fail-visible: only the script ever dims a panel', () => {
    // The dim is bound to data-sub="pending", which only this module writes.
    expect(css).toContain("[data-sub='pending']");
    expect(tsx).toContain("dataset.sub = 'pending'");
    // No blanket rule may hide subsection content without that attribute.
    expect(css).not.toMatch(/^\s*\.glass-panel\s*\{[^}]*opacity:\s*0/m);
  });

  it('has a watchdog that force-reveals anything left pending', () => {
    expect(tsx).toContain('WATCHDOG_MS');
    expect(tsx).toMatch(/dataset\.sub = 'done'/);
  });

  it('caps the cascade so dense views never feel like they are loading', () => {
    const max = Number(tsx.match(/MAX_STAGGER\s*=\s*(\d+)/)?.[1]);
    const step = Number(tsx.match(/STEP_MS\s*=\s*(\d+)/)?.[1]);
    expect(max).toBeLessThanOrEqual(10);
    expect(step).toBeLessThanOrEqual(30);
    expect(max * step).toBeLessThanOrEqual(260); // worst-case cascade
  });

  it('unobserves each panel after its first reveal', () => {
    expect(tsx).toContain('io.unobserve');
  });

  it('drops will-change once a panel has settled', () => {
    expect(css).toContain("[data-sub='done']");
    expect(css.split("[data-sub='done']")[1]).toContain('will-change: auto');
  });

  it('animates only compositor-safe properties', () => {
    const blocks = css.match(/@keyframes[^{]+\{[\s\S]*?\n\}/g) ?? [];
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      for (const bad of ['width:', 'height:', 'top:', 'left:', 'margin', 'padding']) {
        expect(b.includes(bad), `layout prop "${bad}" in keyframe`).toBe(false);
      }
    }
  });

  it('bypasses entirely under reduced motion', () => {
    expect(tsx).toContain('prefers-reduced-motion');
    expect(css).toContain('prefers-reduced-motion');
  });
});

describe('pointer spotlight (one listener for the whole console)', () => {
  const tsx = read('src/components/fx/PointerSpotlight.tsx');
  const css = read('src/components/fx/PointerSpotlight.css');

  it('registers a single passive pointer listener', () => {
    expect(tsx).toContain("addEventListener('pointermove'");
    expect(tsx).toContain('passive: true');
    expect((tsx.match(/addEventListener\('pointermove'/g) ?? []).length).toBe(1);
  });

  it('parks its rAF loop when the light has caught up', () => {
    expect(tsx).toContain('running = false');
    expect(tsx).toContain('EPSILON');
  });

  it('stops animating when the tab is hidden', () => {
    expect(tsx).toContain('visibilitychange');
    expect(tsx).toContain('cancelAnimationFrame');
  });

  it('is pure decoration and never intercepts input', () => {
    expect(css).toContain('pointer-events: none');
    expect(tsx).toContain('aria-hidden');
  });

  it('is disabled for reduced motion and touch', () => {
    expect(tsx).toContain('prefers-reduced-motion');
    expect(tsx).toContain('pointer: coarse');
  });
});

describe('gold/black glass material', () => {
  const css = read('src/styles/glass-gold.css');

  it('re-tints the existing glass surfaces without new classNames', () => {
    for (const sel of ['.glass-panel', '.glass-card', '.glass-heavy']) {
      expect(css).toContain(sel);
    }
  });

  it('is black and gold, not the old blue', () => {
    expect(css).toContain('--glass-gold-rgb: 232, 180, 74');
    expect(css).not.toMatch(/rgba\(\s*(14,\s*19,\s*31|20,\s*27,\s*44)/);
  });

  it('reacts to the shared pointer variables rather than its own listener', () => {
    expect(css).toContain('--lear-px');
    expect(css).toContain('--lear-py');
  });

  it('keeps panels readable: body alpha stays well above transparent', () => {
    const alphas = [...css.matchAll(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*(0?\.\d+)\s*\)/g)]
      .map((m) => Number(m[1]));
    // the glass body layers must be opaque enough for AA text
    expect(Math.max(...alphas)).toBeGreaterThanOrEqual(0.82);
  });

  it('degrades to an opaque pane where backdrop-filter is unsupported', () => {
    expect(css).toContain('@supports not');
  });

  it('is imported globally so every panel picks it up', () => {
    expect(read('src/index.css')).toContain('./styles/glass-gold.css');
  });
});

/* =============================================================================
   ROUND 4 — onboarding stage: the duplicate-header bug and the last of the blue
   ========================================================================== */
describe('wizard stage', () => {
  const wiz = read('src/components/Wizard.tsx');
  const css = read('src/components/Wizard.css');

  it('renders the connector header exactly once', () => {
    // ConnectorForm paints the header (with live status, identity chip and the
    // re-verify button). Wizard used to paint its own copy directly above it,
    // which is the duplication visible in the reported screenshot.
    expect(wiz).toContain('<ConnectorForm');
    expect(wiz).not.toContain('{selectedConnector.description}');
    expect(wiz).not.toContain('{selectedConnector.name}');
  });

  it('does not nest a glass card inside another glass card', () => {
    // ConnectorForm wraps itself in .glass-card; the pane holding it must not.
    const pane = wiz.slice(wiz.indexOf('Dynamic Form Area'), wiz.indexOf('<ConnectorForm'));
    expect(pane).not.toContain('glass-card');
  });

  it('lets the live backdrop through instead of painting over it', () => {
    expect(wiz).not.toContain('min-h-screen bg-background');
    expect(wiz).toContain('wizard-stage');
  });

  it('keeps a visible keyboard focus ring independent of the glow', () => {
    expect(css).toContain(':focus-visible');
    expect(css).toContain('outline:');
  });

  it('stops its standing animation under reduced motion', () => {
    expect(css).toContain('prefers-reduced-motion');
  });
});

describe('palette: gold and black, no leftover cyan console chrome', () => {
  const surfaces = [
    'src/components/ChatWorkspace.tsx',
    'src/components/Wizard.tsx',
    'src/components/Chatbot.tsx',
    'src/components/fx/AuroraBackground.tsx',
    'src/components/fx/AtmosphereOverlay.tsx',
  ];

  it('has no cyan/blue decorative classes left on the main surfaces', () => {
    for (const f of surfaces) {
      const src = read(f);
      for (const bad of ['cyan-', 'text-sky-', 'bg-blue-', '#00F0FF']) {
        expect(src.includes(bad), `${f} still uses ${bad}`).toBe(false);
      }
    }
  });

  it('warms the aurora neural field to gold', () => {
    const a = read('src/components/fx/AuroraBackground.tsx');
    expect(a).not.toContain('rgba(150,180,255');
    expect(a).toContain('rgba(232,196,120');
  });

  it('still keeps the semantic status colours distinguishable', () => {
    // Gold everywhere would make success/danger unreadable. These stay.
    const t = read('src/styles/tokens.css');
    expect(t).toContain('#3fbf7f'); // success
    expect(t).toContain('#e5484d'); // danger
  });
});
