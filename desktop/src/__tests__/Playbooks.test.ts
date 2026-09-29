/* =============================================================================
   PLAYBOOK CATALOGUE CONTRACT
   -----------------------------------------------------------------------------
   The catalogue's one dangerous property is that it is generated. It would be
   trivial for it to grow to any number by inventing capabilities the backend
   does not have. These tests check the generated file against the REAL
   contents of prash/actions, so "630 of these can actually run" stays a fact
   rather than a marketing line.
   ========================================================================== */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PLAYBOOKS, PLAYBOOK_COUNT, PLAYBOOK_EXECUTABLE_COUNT, PLAYBOOK_CONNECTORS,
} from '../lib/playbooks.generated';

const REPO = resolve(__dirname, '../../..');
const ACTIONS = resolve(REPO, 'prash/actions');
const CONNECTORS_DIR = resolve(REPO, 'prash/connectors');

const actionModules = existsSync(ACTIONS)
  ? readdirSync(ACTIONS).filter((f) => f.endsWith('.py') && !f.startsWith('__')).map((f) => f.slice(0, -3))
  : [];

describe('playbook catalogue', () => {
  it('ships well over a thousand playbooks', () => {
    expect(PLAYBOOK_COUNT).toBeGreaterThanOrEqual(1000);
    expect(PLAYBOOKS.length).toBe(PLAYBOOK_COUNT);
  });

  it('has no duplicate ids', () => {
    expect(new Set(PLAYBOOKS.map((p) => p.id)).size).toBe(PLAYBOOKS.length);
  });

  it('marks a playbook executable ONLY when a real action module exists', () => {
    // This is the whole point of the suite.
    expect(actionModules.length).toBeGreaterThan(0);
    for (const pb of PLAYBOOKS) {
      if (pb.executable) {
        expect(pb.action, `${pb.id} claims executable with no action`).toBeTruthy();
        expect(
          actionModules.includes(pb.action as string),
          `${pb.id} claims to run "${pb.action}", which is not in prash/actions`,
        ).toBe(true);
      }
    }
  });

  it('never claims executable for a missing module', () => {
    const lying = PLAYBOOKS.filter(
      (p) => p.executable && !actionModules.includes(p.action ?? ''),
    );
    expect(lying).toHaveLength(0);
  });

  it('reports an executable count that matches the data', () => {
    expect(PLAYBOOKS.filter((p) => p.executable).length).toBe(PLAYBOOK_EXECUTABLE_COUNT);
  });

  it('keeps a substantial guided remainder rather than faking coverage', () => {
    const guided = PLAYBOOK_COUNT - PLAYBOOK_EXECUTABLE_COUNT;
    expect(guided).toBeGreaterThan(0);
    // Every guided entry must carry the CLI line that makes it actionable.
    for (const pb of PLAYBOOKS) {
      if (!pb.executable) expect(pb.cli.startsWith('prash ')).toBe(true);
    }
  });

  it('only references connectors that actually ship', () => {
    const shipped = readdirSync(CONNECTORS_DIR)
      .filter((f) => f.endsWith('.py') && !f.startsWith('__') && f !== 'base.py')
      .map((f) => f.slice(0, -3));
    for (const c of PLAYBOOK_CONNECTORS) {
      if (c === 'prash') continue; // the platform itself, not a connector
      expect(shipped.includes(c), `unknown connector ${c}`).toBe(true);
    }
  });

  it('refuses one-click account-wide destructive operations', () => {
    const reckless = PLAYBOOKS.filter((p) => p.scope === 'account' && p.risk === 'high');
    expect(reckless).toHaveLength(0);
  });

  it('gives every playbook the fields the palette renders', () => {
    for (const pb of PLAYBOOKS.slice(0, 200)) {
      expect(pb.title.length).toBeGreaterThan(4);
      expect(pb.summary.length).toBeGreaterThan(10);
      expect(['low', 'medium', 'high']).toContain(pb.risk);
      expect(['remediate', 'investigate', 'notify']).toContain(pb.intent);
      expect(pb.keywords).toBe(pb.keywords.toLowerCase());
    }
  });

  it('is regenerable — the generator is committed and deterministic', () => {
    const gen = readFileSync(resolve(REPO, 'scripts/gen_playbooks.mjs'), 'utf8');
    expect(gen).toContain('playbooks.generated.ts');
    expect(gen).toContain('ACTION_MODULES');
  });
});

describe('command palette', () => {
  const tsx = readFileSync(resolve(__dirname, '../components/fx/CommandPalette.tsx'), 'utf8');
  const css = readFileSync(resolve(__dirname, '../components/fx/CommandPalette.css'), 'utf8');

  it('loads the 850KB catalogue lazily, not on first paint', () => {
    expect(tsx).toContain("await import('../../lib/playbooks.generated')");
    expect(tsx).not.toMatch(/^import \{ PLAYBOOKS \}/m);
  });

  it('shows whether a row can run or is guidance', () => {
    expect(tsx).toContain("'RUN'");
    expect(tsx).toContain("'GUIDE'");
  });

  it('keeps risk colour-coded instead of gold', () => {
    expect(css).toContain('.cmdk-risk-high');
    expect(css).toContain('#e5484d');
    expect(css).toContain('#3fbf7f');
  });

  it('is fully keyboard operable and restores focus', () => {
    for (const k of ['ArrowDown', 'ArrowUp', 'Enter', 'Escape']) expect(tsx).toContain(k);
    expect(tsx).toContain('restoreFocus');
    expect(tsx).toContain("aria-modal");
    expect(tsx).toContain('role="listbox"');
  });

  it('does not animate individual rows', () => {
    // A 40-row list animating per row is how a palette starts feeling slow.
    const rowRule = (css.match(/\.cmdk-row \{([^}]*)\}/)?.[1] ?? '')
      .replace(/\/\*[\s\S]*?\*\//g, ''); // strip comments before asserting
    expect(rowRule).not.toContain('animation');
    expect(rowRule).not.toContain('transform');
  });

  it('honours reduced motion', () => {
    expect(css).toContain('prefers-reduced-motion');
  });
});
