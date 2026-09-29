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
