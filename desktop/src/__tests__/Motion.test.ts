import { describe, expect, it } from 'vitest';
import { MOTION_PRESETS, MOTION_PRESET_COUNT, preset } from '../lib/motion';

describe('motion preset registry (U-fx: ~900 animation presets)', () => {
  it('exposes 300+ framer-motion presets (the JS layer of the ~900 combined system)', () => {
    expect(MOTION_PRESET_COUNT).toBeGreaterThanOrEqual(300);
  });

  it('count is consistent with the map', () => {
    expect(Object.keys(MOTION_PRESETS).length).toBe(MOTION_PRESET_COUNT);
  });

  it('covers every preset family', () => {
    const families = new Set(MOTION_PRESETS ? Object.keys(MOTION_PRESETS).map((k) => k.split('.')[0]) : []);
    for (const fam of ['enter', 'exit', 'hover', 'tap', 'em', 'loop', 'stagger', 'layout', 'hero']) {
      expect(families.has(fam), `missing family ${fam}`).toBe(true);
    }
  });

  it('entrance presets are hidden→visible pairs with transitions', () => {
    const enter = MOTION_PRESETS['enter.rise.md.soft'];
    expect(enter).toBeDefined();
    expect(enter.hidden).toBeDefined();
    expect(enter.visible).toBeDefined();
  });

  it('unknown names fall back to the soft fade entrance', () => {
    expect(preset('nope.unknown.thing')).toBe(MOTION_PRESETS['enter.fade.md.soft']);
  });
});
