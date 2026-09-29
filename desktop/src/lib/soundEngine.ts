/* =============================================================================
   LEAR SOUND ENGINE — 200+ procedural sci-fi UI sounds, zero audio assets
   -----------------------------------------------------------------------------
   Every sound is synthesized on the fly with the Web Audio API (oscillators,
   shaped noise, filters, envelopes), so there is nothing to download, no GBs
   of audio packs, and playback costs ~zero CPU/network.

   Registry: SFX namespaced by surface ("ui.click.03", "toast.success.01",
   "hero.whoosh.02", ...). SFX_COUNT reports the real registry size at runtime.

   Ergonomics:
     - Lazily creates ONE AudioContext; unlocks on the first user gesture
       (browser autoplay policy) — sounds simply no-op until then.
     - Master gain → gentle compressor → destination (no clipping when sounds
       stack), global volume + enable flag persisted in localStorage.
     - Per-sound throttle + global voice cap, so rapid events can't spam the
       mixer and hurt frame rate.
   ========================================================================== */

export interface SfxPart {
  r: 'tone' | 'noise';
  f0?: number;          // start frequency (tone)
  f1?: number;          // glide target
  dur: number;          // seconds
  type?: OscillatorType;
  g: number;            // gain 0..1
  a?: number;           // attack seconds
  lp?: number;          // noise lowpass start
  lpTo?: number;        // noise lowpass end (sweep)
  hp?: number;
  d?: number;           // delay offset seconds
}

type Recipe = SfxPart[];

const SFX: Record<string, Recipe> = {};
const def = (name: string, parts: Recipe) => {
  SFX[name] = parts;
};
const pad = (n: number) => String(n).padStart(2, '0');

/* ---------- Recipe tables (each entry is a genuinely distinct sound) -------- */

/* ui.click — 12 tactile clicks across pitch/timbre */
[520, 560, 608, 652, 700, 748, 804, 856, 912, 968, 1030, 1100].forEach((f, i) =>
  def(`ui.click.${pad(i + 1)}`, [
    { r: 'tone', f0: f, f1: f * 0.72, dur: 0.055, type: 'triangle', g: 0.34, a: 0.003 },
    { r: 'noise', dur: 0.03, g: 0.05, lp: 3400 },
  ])
);

/* ui.tap — 6 lower, softer confirms */
[380, 420, 460, 500, 540, 590].forEach((f, i) =>
  def(`ui.tap.${pad(i + 1)}`, [{ r: 'tone', f0: f, f1: f * 0.8, dur: 0.07, type: 'sine', g: 0.3 }])
);

/* ui.hover — 8 barely-there ticks */
[1400, 1520, 1650, 1780, 1920, 2060, 2200, 2350].forEach((f, i) =>
  def(`ui.hover.${pad(i + 1)}`, [{ r: 'tone', f0: f, dur: 0.028, type: 'sine', g: 0.07, a: 0.002 }])
);

/* ui.page — 4 page/section transitions */
[[320, 520], [300, 480], [360, 560], [280, 460]].forEach(([a, b], i) =>
  def(`ui.page.${pad(i + 1)}`, [
    { r: 'tone', f0: a, f1: b, dur: 0.16, type: 'triangle', g: 0.22 },
    { r: 'noise', dur: 0.16, g: 0.05, lp: 900, lpTo: 4200 },
  ])
);

/* nav — open/close sweeps + tab ticks */
def('nav.open', [
  { r: 'tone', f0: 300, f1: 640, dur: 0.18, type: 'triangle', g: 0.24 },
  { r: 'noise', dur: 0.2, g: 0.06, lp: 800, lpTo: 5000 },
]);
def('nav.close', [
  { r: 'tone', f0: 640, f1: 280, dur: 0.18, type: 'triangle', g: 0.22 },
  { r: 'noise', dur: 0.18, g: 0.05, lp: 4200, lpTo: 700 },
]);
def('nav.next', [{ r: 'tone', f0: 520, f1: 780, dur: 0.11, type: 'triangle', g: 0.2 }]);
def('nav.prev', [{ r: 'tone', f0: 780, f1: 520, dur: 0.11, type: 'triangle', g: 0.2 }]);
[660, 700, 740, 800].forEach((f, i) =>
  def(`nav.tab.${pad(i + 1)}`, [{ r: 'tone', f0: f, f1: f * 1.2, dur: 0.07, type: 'triangle', g: 0.2 }])
);

/* toggles — on rises, off falls */
[620, 700, 780].forEach((f, i) =>
  def(`toggle.on.${pad(i + 1)}`, [
    { r: 'tone', f0: f, f1: f * 1.5, dur: 0.1, type: 'triangle', g: 0.26 },
    { r: 'tone', f0: f * 2, dur: 0.08, type: 'sine', g: 0.14, d: 0.05 },
  ])
);
[780, 700, 620].forEach((f, i) =>
  def(`toggle.off.${pad(i + 1)}`, [
    { r: 'tone', f0: f, f1: f * 0.6, dur: 0.12, type: 'triangle', g: 0.24 },
  ])
);

/* toast chimes — info/success/warning/error ×3, critical ×2 */
const CHIME = {
  info: [[660, 880], [620, 830], [700, 940]],
  success: [[523, 784, 1046], [587, 880, 1174], [659, 988, 1318]],
  warning: [[440, 554], [466, 587], [415, 523]],
  error: [[392, 311], [349, 277], [415, 329]],
};
const CHIME_TYPE: Record<string, OscillatorType> = { info: 'sine', success: 'triangle', warning: 'square', error: 'sawtooth' };
Object.entries(CHIME).forEach(([kind, sets]) =>
  sets.forEach((notes, i) =>
    def(
      `toast.${kind}.${pad(i + 1)}`,
      notes.map((f, j) => ({
        r: 'tone' as const,
        f0: f,
        dur: kind === 'error' ? 0.22 : 0.18,
        type: CHIME_TYPE[kind],
        g: kind === 'error' ? 0.14 : 0.2,
        d: j * 0.07,
      }))
    )
  )
);
[[311, 233, 196], [329, 261, 220]].forEach((notes, i) =>
  def(
    `toast.critical.${pad(i + 1)}`,
    notes.map((f, j) => ({ r: 'tone' as const, f0: f, dur: 0.26, type: 'sawtooth' as const, g: 0.13, d: j * 0.11 }))
  )
);

/* modal */
def('modal.open', [{ r: 'tone', f0: 420, f1: 700, dur: 0.14, type: 'triangle', g: 0.22 }]);
def('modal.close', [{ r: 'tone', f0: 700, f1: 380, dur: 0.14, type: 'triangle', g: 0.2 }]);
def('modal.confirm', [
  { r: 'tone', f0: 660, dur: 0.1, type: 'triangle', g: 0.22 },
  { r: 'tone', f0: 990, dur: 0.16, type: 'sine', g: 0.18, d: 0.07 },
]);
def('modal.deny', [{ r: 'tone', f0: 330, f1: 220, dur: 0.2, type: 'square', g: 0.12 }]);

/* data layer — fetches, refreshes, stream ticks */
def('data.fetch', [{ r: 'tone', f0: 500, f1: 760, dur: 0.09, type: 'sine', g: 0.16 }]);
def('data.done', [{ r: 'tone', f0: 760, f1: 980, dur: 0.12, type: 'sine', g: 0.18 }]);
def('data.refresh.01', [{ r: 'noise', dur: 0.14, g: 0.06, lp: 1200, lpTo: 5200 }]);
def('data.refresh.02', [{ r: 'noise', dur: 0.14, g: 0.06, lp: 5200, lpTo: 1000 }]);
[1200, 1320, 1460].forEach((f, i) =>
  def(`data.stream.${pad(i + 1)}`, [{ r: 'tone', f0: f, dur: 0.04, type: 'sine', g: 0.06 }])
);
[880, 940, 1000, 1060, 1120, 1180].forEach((f, i) =>
  def(`data.tick.${pad(i + 1)}`, [{ r: 'tone', f0: f, dur: 0.032, type: 'sine', g: 0.055 }])
);

/* watcher control */
def('watch.start', [
  { r: 'tone', f0: 392, f1: 784, dur: 0.2, type: 'triangle', g: 0.22 },
  { r: 'tone', f0: 1176, dur: 0.12, type: 'sine', g: 0.12, d: 0.12 },
]);
def('watch.stop', [{ r: 'tone', f0: 784, f1: 392, dur: 0.22, type: 'triangle', g: 0.2 }]);
def('watch.pause', [{ r: 'tone', f0: 520, dur: 0.09, type: 'triangle', g: 0.18 }]);
def('watch.resume', [{ r: 'tone', f0: 520, f1: 700, dur: 0.1, type: 'triangle', g: 0.18 }]);
[[988, 784], [1046, 830]].forEach(([a, b], i) =>
  def(`watch.alert.${pad(i + 1)}`, [
    { r: 'tone', f0: a, dur: 0.12, type: 'square', g: 0.1 },
    { r: 'tone', f0: b, dur: 0.16, type: 'square', g: 0.1, d: 0.12 },
  ])
);

/* incidents */
def('incident.created', [
  { r: 'tone', f0: 466, dur: 0.18, type: 'square', g: 0.12 },
  { r: 'tone', f0: 349, dur: 0.26, type: 'square', g: 0.12, d: 0.14 },
]);
def('incident.approve', [
  { r: 'tone', f0: 523, dur: 0.12, type: 'triangle', g: 0.22 },
  { r: 'tone', f0: 784, dur: 0.14, type: 'triangle', g: 0.2, d: 0.09 },
  { r: 'tone', f0: 1046, dur: 0.2, type: 'sine', g: 0.18, d: 0.18 },
]);
def('incident.deny', [{ r: 'tone', f0: 392, f1: 261, dur: 0.24, type: 'triangle', g: 0.2 }]);
def('incident.resolve', [
  { r: 'tone', f0: 523, dur: 0.14, type: 'sine', g: 0.2 },
  { r: 'tone', f0: 659, dur: 0.14, type: 'sine', g: 0.2, d: 0.1 },
  { r: 'tone', f0: 784, dur: 0.24, type: 'sine', g: 0.2, d: 0.2 },
]);
def('incident.escalate', [
  { r: 'tone', f0: 311, f1: 622, dur: 0.3, type: 'sawtooth', g: 0.1 },
]);

/* chat / copilot */
def('chat.send', [{ r: 'tone', f0: 740, f1: 1100, dur: 0.1, type: 'sine', g: 0.2 }]);
def('chat.receive', [
  { r: 'tone', f0: 880, dur: 0.1, type: 'sine', g: 0.18 },
  { r: 'tone', f0: 1174, dur: 0.14, type: 'sine', g: 0.14, d: 0.07 },
]);
def('chat.typing.01', [{ r: 'tone', f0: 1320, dur: 0.03, type: 'sine', g: 0.06 }]);
def('chat.typing.02', [{ r: 'tone', f0: 1180, dur: 0.03, type: 'sine', g: 0.06 }]);
def('chat.stream', [{ r: 'tone', f0: 1560, dur: 0.02, type: 'sine', g: 0.045 }]);
def('chat.open', [{ r: 'tone', f0: 440, f1: 880, dur: 0.16, type: 'triangle', g: 0.18 }]);
def('chat.close', [{ r: 'tone', f0: 880, f1: 440, dur: 0.16, type: 'triangle', g: 0.16 }]);
[[523, 659, 784], [587, 740, 880], [659, 830, 988]].forEach((chord, i) =>
  def(
    `ai.think.${pad(i + 1)}`,
    chord.map((f, j) => ({ r: 'tone' as const, f0: f, dur: 0.12, type: 'sine' as const, g: 0.12, d: j * 0.06 }))
  )
);
def('ai.answer', [
  { r: 'tone', f0: 659, dur: 0.1, type: 'triangle', g: 0.18 },
  { r: 'tone', f0: 988, dur: 0.18, type: 'sine', g: 0.16, d: 0.08 },
]);
def('ai.stream.tick', [{ r: 'tone', f0: 1680, dur: 0.018, type: 'sine', g: 0.035 }]);
def('ai.action', [
  { r: 'tone', f0: 330, f1: 660, dur: 0.2, type: 'triangle', g: 0.18 },
  { r: 'noise', dur: 0.16, g: 0.05, lp: 1600, lpTo: 4800, d: 0.04 },
]);

/* widgets */
def('widget.expand', [{ r: 'tone', f0: 500, f1: 760, dur: 0.12, type: 'triangle', g: 0.16 }]);
def('widget.collapse', [{ r: 'tone', f0: 760, f1: 500, dur: 0.12, type: 'triangle', g: 0.16 }]);
def('widget.add', [
  { r: 'tone', f0: 620, dur: 0.09, type: 'triangle', g: 0.2 },
  { r: 'tone', f0: 930, dur: 0.12, type: 'sine', g: 0.14, d: 0.06 },
]);
def('widget.remove', [{ r: 'tone', f0: 620, f1: 380, dur: 0.14, type: 'triangle', g: 0.18 }]);
def('widget.config', [{ r: 'tone', f0: 840, dur: 0.06, type: 'triangle', g: 0.14 }]);
def('widget.save', [
  { r: 'tone', f0: 660, dur: 0.08, type: 'sine', g: 0.18 },
  { r: 'tone', f0: 880, dur: 0.12, type: 'sine', g: 0.16, d: 0.06 },
]);

/* projects */
def('project.create', [
  { r: 'tone', f0: 392, dur: 0.1, type: 'triangle', g: 0.2 },
  { r: 'tone', f0: 587, dur: 0.12, type: 'triangle', g: 0.18, d: 0.08 },
  { r: 'tone', f0: 784, dur: 0.16, type: 'sine', g: 0.16, d: 0.16 },
]);
def('project.select', [{ r: 'tone', f0: 587, f1: 742, dur: 0.09, type: 'triangle', g: 0.18 }]);
def('project.switch', [
  { r: 'tone', f0: 500, f1: 700, dur: 0.1, type: 'triangle', g: 0.16 },
  { r: 'noise', dur: 0.1, g: 0.04, lp: 2000, lpTo: 4200 },
]);
def('project.delete', [{ r: 'tone', f0: 440, f1: 220, dur: 0.22, type: 'triangle', g: 0.2 }]);
def('project.import', [{ r: 'noise', dur: 0.2, g: 0.06, lp: 1000, lpTo: 5000 }]);
def('project.open', [{ r: 'tone', f0: 440, f1: 660, dur: 0.12, type: 'triangle', g: 0.18 }]);

/* wizard */
def('wizard.step', [{ r: 'tone', f0: 620, f1: 800, dur: 0.1, type: 'triangle', g: 0.18 }]);
def('wizard.next', [{ r: 'tone', f0: 560, f1: 760, dur: 0.1, type: 'triangle', g: 0.18 }]);
def('wizard.back', [{ r: 'tone', f0: 760, f1: 560, dur: 0.1, type: 'triangle', g: 0.16 }]);
def('wizard.complete', [
  { r: 'tone', f0: 523, dur: 0.12, type: 'sine', g: 0.2 },
  { r: 'tone', f0: 659, dur: 0.12, type: 'sine', g: 0.2, d: 0.08 },
  { r: 'tone', f0: 784, dur: 0.14, type: 'sine', g: 0.2, d: 0.16 },
  { r: 'tone', f0: 1046, dur: 0.26, type: 'sine', g: 0.18, d: 0.24 },
]);
def('wizard.connect', [
  { r: 'tone', f0: 330, f1: 660, dur: 0.2, type: 'sine', g: 0.16 },
  { r: 'tone', f0: 990, dur: 0.14, type: 'sine', g: 0.12, d: 0.14 },
]);
def('wizard.error', [{ r: 'tone', f0: 329, f1: 261, dur: 0.2, type: 'square', g: 0.12 }]);

/* settings / inputs */
def('settings.save', [
  { r: 'tone', f0: 700, dur: 0.08, type: 'sine', g: 0.18 },
  { r: 'tone', f0: 940, dur: 0.12, type: 'sine', g: 0.15, d: 0.06 },
]);
def('settings.slider', [{ r: 'tone', f0: 1100, dur: 0.024, type: 'sine', g: 0.05 }]);
def('settings.toggle', [{ r: 'tone', f0: 680, f1: 820, dur: 0.07, type: 'triangle', g: 0.16 }]);
def('settings.keybind', [{ r: 'tone', f0: 960, dur: 0.05, type: 'square', g: 0.09 }]);

/* auth */
def('auth.success', [
  { r: 'tone', f0: 587, dur: 0.1, type: 'sine', g: 0.2 },
  { r: 'tone', f0: 880, dur: 0.16, type: 'sine', g: 0.16, d: 0.08 },
]);
def('auth.fail', [
  { r: 'tone', f0: 349, dur: 0.14, type: 'sawtooth', g: 0.1 },
  { r: 'tone', f0: 277, dur: 0.2, type: 'sawtooth', g: 0.1, d: 0.1 },
]);
def('auth.expired', [{ r: 'tone', f0: 392, f1: 311, dur: 0.26, type: 'triangle', g: 0.16 }]);

/* hero / cinematic */
[420, 380, 340, 300].forEach((lp, i) =>
  def(`hero.whoosh.${pad(i + 1)}`, [
    { r: 'noise', dur: 0.5 + i * 0.08, g: 0.09, lp: lp * 2, lpTo: lp * 18 },
    { r: 'tone', f0: 220, f1: 440 + i * 60, dur: 0.4, type: 'sine', g: 0.05 },
  ])
);
[[196, 392], [220, 440]].forEach(([a, b], i) =>
  def(`hero.reveal.${pad(i + 1)}`, [
    { r: 'tone', f0: a, f1: b, dur: 0.7, type: 'sine', g: 0.1 },
    { r: 'tone', f0: b * 2, dur: 0.5, type: 'sine', g: 0.05, d: 0.25 },
  ])
);
def('hero.riser', [
  { r: 'tone', f0: 110, f1: 880, dur: 1.4, type: 'sawtooth', g: 0.05 },
  { r: 'noise', dur: 1.4, g: 0.05, lp: 600, lpTo: 8000 },
]);
def('hero.impact', [
  { r: 'tone', f0: 160, f1: 60, dur: 0.5, type: 'sine', g: 0.3 },
  { r: 'noise', dur: 0.3, g: 0.1, lp: 3000, lpTo: 400 },
]);
def('hero.shimmer', [
  { r: 'tone', f0: 1568, dur: 0.4, type: 'sine', g: 0.05 },
  { r: 'tone', f0: 2093, dur: 0.5, type: 'sine', g: 0.04, d: 0.1 },
]);

/* metrics */
[900, 980, 1060].forEach((f, i) => def(`metric.update.${pad(i + 1)}`, [{ r: 'tone', f0: f, dur: 0.04, type: 'sine', g: 0.05 }]));
def('metric.spike', [
  { r: 'tone', f0: 880, f1: 1320, dur: 0.14, type: 'triangle', g: 0.14 },
]);
def('metric.recover', [{ r: 'tone', f0: 660, f1: 880, dur: 0.16, type: 'sine', g: 0.14 }]);

/* keyboard / search / filter */
def('kbd.enter', [{ r: 'tone', f0: 980, dur: 0.05, type: 'triangle', g: 0.14 }]);
def('kbd.esc', [{ r: 'tone', f0: 520, dur: 0.05, type: 'triangle', g: 0.12 }]);
def('kbd.backspace', [{ r: 'tone', f0: 340, dur: 0.04, type: 'triangle', g: 0.1 }]);
def('kbd.shortcut', [
  { r: 'tone', f0: 760, dur: 0.05, type: 'sine', g: 0.12 },
  { r: 'tone', f0: 1010, dur: 0.07, type: 'sine', g: 0.1, d: 0.04 },
]);
def('search.open', [{ r: 'tone', f0: 660, f1: 920, dur: 0.09, type: 'sine', g: 0.14 }]);
def('search.type', [{ r: 'tone', f0: 1240, dur: 0.026, type: 'sine', g: 0.05 }]);
def('search.clear', [{ r: 'tone', f0: 500, dur: 0.06, type: 'sine', g: 0.1 }]);
def('filter.apply', [{ r: 'tone', f0: 700, f1: 900, dur: 0.08, type: 'triangle', g: 0.14 }]);
def('filter.clear', [{ r: 'tone', f0: 900, f1: 600, dur: 0.08, type: 'triangle', g: 0.12 }]);

/* drag / sliders */
def('drag.start', [{ r: 'tone', f0: 500, dur: 0.05, type: 'triangle', g: 0.12 }]);
def('drag.drop', [{ r: 'tone', f0: 640, dur: 0.08, type: 'triangle', g: 0.16 }]);
def('drag.hover', [{ r: 'tone', f0: 800, dur: 0.03, type: 'sine', g: 0.05 }]);
[1000, 1080, 1160].forEach((f, i) => def(`slider.move.${pad(i + 1)}`, [{ r: 'tone', f0: f, dur: 0.02, type: 'sine', g: 0.04 }]));
def('slider.end', [{ r: 'tone', f0: 840, dur: 0.06, type: 'sine', g: 0.12 }]);

/* system */
def('system.boot', [
  { r: 'tone', f0: 261, dur: 0.16, type: 'sine', g: 0.18 },
  { r: 'tone', f0: 329, dur: 0.16, type: 'sine', g: 0.18, d: 0.1 },
  { r: 'tone', f0: 392, dur: 0.18, type: 'sine', g: 0.18, d: 0.2 },
  { r: 'tone', f0: 523, dur: 0.34, type: 'sine', g: 0.18, d: 0.3 },
  { r: 'noise', dur: 0.5, g: 0.03, lp: 1000, lpTo: 6000, d: 0.05 },
]);
def('system.ready', [
  { r: 'tone', f0: 523, dur: 0.1, type: 'sine', g: 0.16 },
  { r: 'tone', f0: 784, dur: 0.2, type: 'sine', g: 0.14, d: 0.08 },
]);
def('system.error', [
  { r: 'tone', f0: 311, dur: 0.18, type: 'sawtooth', g: 0.1 },
  { r: 'tone', f0: 233, dur: 0.26, type: 'sawtooth', g: 0.1, d: 0.12 },
]);
def('system.notify.01', [
  { r: 'tone', f0: 830, dur: 0.09, type: 'sine', g: 0.16 },
  { r: 'tone', f0: 1108, dur: 0.14, type: 'sine', g: 0.13, d: 0.07 },
]);
def('system.notify.02', [
  { r: 'tone', f0: 740, dur: 0.09, type: 'sine', g: 0.15 },
  { r: 'tone', f0: 988, dur: 0.14, type: 'sine', g: 0.12, d: 0.07 },
]);

/* alerts */
def('alert.info', [{ r: 'tone', f0: 880, dur: 0.1, type: 'sine', g: 0.14 }]);
def('alert.warn', [
  { r: 'tone', f0: 622, dur: 0.12, type: 'square', g: 0.09 },
  { r: 'tone', f0: 622, dur: 0.12, type: 'square', g: 0.09, d: 0.16 },
]);
def('alert.crit', [
  { r: 'tone', f0: 740, dur: 0.1, type: 'square', g: 0.1 },
  { r: 'tone', f0: 554, dur: 0.1, type: 'square', g: 0.1, d: 0.12 },
  { r: 'tone', f0: 740, dur: 0.14, type: 'square', g: 0.1, d: 0.24 },
]);

/* deploy */
def('deploy.start', [
  { r: 'tone', f0: 392, f1: 587, dur: 0.18, type: 'triangle', g: 0.18 },
]);
def('deploy.success', [
  { r: 'tone', f0: 523, dur: 0.1, type: 'sine', g: 0.18 },
  { r: 'tone', f0: 784, dur: 0.14, type: 'sine', g: 0.16, d: 0.08 },
  { r: 'tone', f0: 1046, dur: 0.22, type: 'sine', g: 0.14, d: 0.16 },
]);
def('deploy.fail', [
  { r: 'tone', f0: 392, f1: 261, dur: 0.24, type: 'sawtooth', g: 0.1 },
]);

/* generic beeps & blips — the utility belt (24 more voices) */
[440, 480, 523, 587, 659, 698, 784, 880, 988, 1046, 1174, 1318].forEach((f, i) =>
  def(`beep.${pad(i + 1)}`, [{ r: 'tone', f0: f, dur: 0.08, type: 'square', g: 0.08 }])
);
[440, 493, 554, 622, 740, 831, 932, 1108, 1244, 1396, 1568, 1760].forEach((f, i) =>
  def(`blip.${pad(i + 1)}`, [{ r: 'tone', f0: f, f1: f * 1.14, dur: 0.06, type: 'sine', g: 0.12 }])
);
[600, 800, 1000, 1400, 1800, 2400].forEach((lp, i) =>
  def(`whoosh.${pad(i + 1)}`, [{ r: 'noise', dur: 0.22 + i * 0.03, g: 0.07, lp, lpTo: lp * 4 }])
);

/* selection chirps, power moves, scans, connector handshake (12 more voices) */
[560, 608, 664, 724, 788, 860].forEach((f, i) =>
  def(`ui.select.${pad(i + 1)}`, [
    { r: 'tone', f0: f, dur: 0.05, type: 'triangle', g: 0.16 },
    { r: 'tone', f0: f * 1.5, dur: 0.07, type: 'sine', g: 0.1, d: 0.04 },
  ])
);
def('fx.power.up', [
  { r: 'tone', f0: 220, f1: 880, dur: 0.4, type: 'sawtooth', g: 0.08 },
  { r: 'noise', dur: 0.35, g: 0.05, lp: 800, lpTo: 6400 },
]);
def('fx.power.down', [
  { r: 'tone', f0: 880, f1: 180, dur: 0.42, type: 'sawtooth', g: 0.08 },
  { r: 'noise', dur: 0.35, g: 0.05, lp: 6400, lpTo: 700 },
]);
def('scan.start', [{ r: 'noise', dur: 0.24, g: 0.06, lp: 1200, lpTo: 5600 }]);
def('scan.complete', [
  { r: 'tone', f0: 740, dur: 0.09, type: 'sine', g: 0.16 },
  { r: 'tone', f0: 1108, dur: 0.15, type: 'sine', g: 0.13, d: 0.07 },
]);
def('connect.success', [
  { r: 'tone', f0: 523, dur: 0.1, type: 'sine', g: 0.2 },
  { r: 'tone', f0: 1046, dur: 0.18, type: 'sine', g: 0.16, d: 0.09 },
]);
def('connect.fail', [
  { r: 'tone', f0: 311, dur: 0.16, type: 'square', g: 0.1 },
  { r: 'tone', f0: 233, dur: 0.22, type: 'square', g: 0.1, d: 0.1 },
]);

/* =============================================================================
   GOLD-ERA EXPANSION BANK — added for the premium gold/obsidian overhaul.
   Every entry below is a distinct recipe (different partials, glides, filter
   sweeps or timing), not a re-pitch of an existing one.
   ========================================================================== */

/* gold.* — the signature metallic family: struck-bar partials + air ---------- */
[
  [392, 'gold.chime'], [440, 'gold.chime'], [494, 'gold.chime'], [523, 'gold.chime'],
  [587, 'gold.chime'], [659, 'gold.chime'], [698, 'gold.chime'], [784, 'gold.chime'],
  [880, 'gold.chime'], [988, 'gold.chime'], [1046, 'gold.chime'], [1175, 'gold.chime'],
].forEach(([f, base], i) =>
  def(`${base}.${pad(i + 1)}`, [
    { r: 'tone', f0: f as number, dur: 0.5, type: 'sine', g: 0.2, a: 0.004 },
    { r: 'tone', f0: (f as number) * 2.76, dur: 0.34, type: 'sine', g: 0.08, a: 0.004 },
    { r: 'tone', f0: (f as number) * 5.4, dur: 0.2, type: 'sine', g: 0.035, a: 0.003 },
    { r: 'noise', dur: 0.05, g: 0.03, lp: 7200 },
  ])
);

/* gold.strike — heavier metal impacts (8) ----------------------------------- */
[160, 190, 220, 255, 290, 330, 380, 430].forEach((f, i) =>
  def(`gold.strike.${pad(i + 1)}`, [
    { r: 'tone', f0: f, f1: f * 0.55, dur: 0.34, type: 'triangle', g: 0.3 },
    { r: 'tone', f0: f * 3.2, dur: 0.24, type: 'sine', g: 0.11, a: 0.003 },
    { r: 'noise', dur: 0.11, g: 0.11, lp: 5200, lpTo: 900 },
  ])
);

/* gold.shimmer — slow ascending sparkle beds (6) ---------------------------- */
[0, 1, 2, 3, 4, 5].forEach((i) =>
  def(`gold.shimmer.${pad(i + 1)}`, [
    { r: 'tone', f0: 1200 + i * 180, f1: 2400 + i * 260, dur: 0.6, type: 'sine', g: 0.07, a: 0.12 },
    { r: 'tone', f0: 1800 + i * 200, f1: 3200 + i * 300, dur: 0.5, type: 'sine', g: 0.045, a: 0.1, d: 0.08 },
    { r: 'noise', dur: 0.55, g: 0.028, lp: 3000, lpTo: 11000 },
  ])
);

/* hud.* — HUD bracket / reticle / lock-on (10) ------------------------------ */
def('hud.bracket.in', [
  { r: 'tone', f0: 1400, f1: 2100, dur: 0.07, type: 'square', g: 0.07 },
  { r: 'noise', dur: 0.06, g: 0.05, lp: 6000, lpTo: 2400 },
]);
def('hud.bracket.out', [
  { r: 'tone', f0: 2100, f1: 1200, dur: 0.07, type: 'square', g: 0.06 },
]);
def('hud.reticle', [
  { r: 'tone', f0: 900, dur: 0.04, type: 'square', g: 0.08 },
  { r: 'tone', f0: 1350, dur: 0.05, type: 'square', g: 0.06, d: 0.045 },
]);
def('hud.lock', [
  { r: 'tone', f0: 660, dur: 0.05, type: 'square', g: 0.1 },
  { r: 'tone', f0: 990, dur: 0.05, type: 'square', g: 0.1, d: 0.06 },
  { r: 'tone', f0: 1320, dur: 0.14, type: 'sine', g: 0.14, d: 0.12 },
]);
def('hud.unlock', [
  { r: 'tone', f0: 1320, f1: 560, dur: 0.16, type: 'triangle', g: 0.1 },
]);
def('hud.telemetry', [{ r: 'tone', f0: 2200, dur: 0.018, type: 'square', g: 0.035 }]);
def('hud.warning', [
  { r: 'tone', f0: 720, dur: 0.1, type: 'square', g: 0.12 },
  { r: 'tone', f0: 720, dur: 0.1, type: 'square', g: 0.12, d: 0.16 },
]);
def('hud.critical', [
  { r: 'tone', f0: 880, f1: 620, dur: 0.14, type: 'sawtooth', g: 0.13 },
  { r: 'tone', f0: 880, f1: 620, dur: 0.14, type: 'sawtooth', g: 0.13, d: 0.2 },
  { r: 'tone', f0: 880, f1: 560, dur: 0.2, type: 'sawtooth', g: 0.13, d: 0.4 },
]);
def('hud.boot', [
  { r: 'tone', f0: 110, f1: 880, dur: 0.7, type: 'sawtooth', g: 0.1, a: 0.08 },
  { r: 'noise', dur: 0.75, g: 0.06, lp: 400, lpTo: 9000 },
  { r: 'tone', f0: 1320, dur: 0.3, type: 'sine', g: 0.12, d: 0.6 },
]);
def('hud.shutdown', [
  { r: 'tone', f0: 880, f1: 90, dur: 0.8, type: 'sawtooth', g: 0.1 },
  { r: 'noise', dur: 0.8, g: 0.06, lp: 9000, lpTo: 300 },
]);

/* seq.* — the Direction sequence choreography cues (14) --------------------- */
def('seq.open', [
  { r: 'tone', f0: 70, f1: 220, dur: 1.1, type: 'sine', g: 0.34, a: 0.14 },
  { r: 'tone', f0: 330, f1: 660, dur: 0.85, type: 'triangle', g: 0.14, a: 0.2, d: 0.1 },
  { r: 'noise', dur: 1.2, g: 0.1, lp: 300, lpTo: 8000 },
  { r: 'tone', f0: 1320, dur: 0.5, type: 'sine', g: 0.1, a: 0.1, d: 0.7 },
]);
def('seq.close', [
  { r: 'tone', f0: 240, f1: 60, dur: 0.9, type: 'sine', g: 0.3, a: 0.02 },
  { r: 'noise', dur: 0.85, g: 0.09, lp: 7000, lpTo: 220 },
]);
def('seq.impact', [
  { r: 'tone', f0: 58, f1: 34, dur: 1.3, type: 'sine', g: 0.5, a: 0.004 },
  { r: 'tone', f0: 120, f1: 60, dur: 0.6, type: 'triangle', g: 0.2 },
  { r: 'noise', dur: 0.45, g: 0.18, lp: 2400, lpTo: 180 },
]);
def('seq.riser', [
  { r: 'tone', f0: 150, f1: 1800, dur: 1.9, type: 'sawtooth', g: 0.1, a: 0.6 },
  { r: 'noise', dur: 2.0, g: 0.09, lp: 500, lpTo: 12000 },
]);
def('seq.downlifter', [
  { r: 'tone', f0: 1600, f1: 90, dur: 1.4, type: 'sawtooth', g: 0.1, a: 0.05 },
  { r: 'noise', dur: 1.4, g: 0.08, lp: 11000, lpTo: 260 },
]);
def('seq.whoosh.near', [{ r: 'noise', dur: 0.62, g: 0.2, lp: 400, lpTo: 7000 }]);
def('seq.whoosh.far', [{ r: 'noise', dur: 0.95, g: 0.11, lp: 260, lpTo: 4200 }]);
def('seq.whoosh.rev', [{ r: 'noise', dur: 0.7, g: 0.16, lp: 8000, lpTo: 340 }]);
def('seq.stinger', [
  { r: 'tone', f0: 523, dur: 0.22, type: 'sawtooth', g: 0.16 },
  { r: 'tone', f0: 784, dur: 0.22, type: 'sawtooth', g: 0.14, d: 0.02 },
  { r: 'tone', f0: 1046, dur: 0.5, type: 'sine', g: 0.18, d: 0.05 },
  { r: 'noise', dur: 0.3, g: 0.09, lp: 6000, lpTo: 1200 },
]);
def('seq.reveal', [
  { r: 'tone', f0: 261, dur: 0.7, type: 'sine', g: 0.16, a: 0.16 },
  { r: 'tone', f0: 392, dur: 0.7, type: 'sine', g: 0.13, a: 0.18, d: 0.06 },
  { r: 'tone', f0: 523, dur: 0.8, type: 'sine', g: 0.12, a: 0.2, d: 0.12 },
  { r: 'tone', f0: 784, dur: 0.9, type: 'sine', g: 0.09, a: 0.24, d: 0.2 },
]);
def('seq.glitch', [
  { r: 'noise', dur: 0.05, g: 0.16, lp: 9000 },
  { r: 'tone', f0: 1800, f1: 400, dur: 0.06, type: 'square', g: 0.1, d: 0.05 },
  { r: 'noise', dur: 0.04, g: 0.13, lp: 5000, d: 0.12 },
  { r: 'tone', f0: 900, f1: 2400, dur: 0.05, type: 'square', g: 0.09, d: 0.17 },
]);
def('seq.heartbeat', [
  { r: 'tone', f0: 62, f1: 40, dur: 0.24, type: 'sine', g: 0.4 },
  { r: 'tone', f0: 58, f1: 36, dur: 0.3, type: 'sine', g: 0.3, d: 0.3 },
]);
def('seq.pulse.deep', [{ r: 'tone', f0: 48, f1: 30, dur: 1.6, type: 'sine', g: 0.34, a: 0.3 }]);
def('seq.enter.console', [
  { r: 'tone', f0: 196, f1: 392, dur: 0.5, type: 'triangle', g: 0.22, a: 0.02 },
  { r: 'tone', f0: 587, dur: 0.4, type: 'sine', g: 0.16, d: 0.22 },
  { r: 'tone', f0: 880, dur: 0.6, type: 'sine', g: 0.14, d: 0.34 },
  { r: 'noise', dur: 0.7, g: 0.07, lp: 900, lpTo: 8000 },
]);

/* robot.* — servo / mechanical motion (12) ---------------------------------- */
[0, 1, 2, 3, 4, 5].forEach((i) => {
  def(`robot.servo.${pad(i + 1)}`, [
    { r: 'tone', f0: 220 + i * 60, f1: 380 + i * 80, dur: 0.16 + i * 0.02, type: 'sawtooth', g: 0.07 },
    { r: 'noise', dur: 0.16 + i * 0.02, g: 0.04, lp: 2200 + i * 400 },
  ]);
  def(`robot.servo.rev.${pad(i + 1)}`, [
    { r: 'tone', f0: 380 + i * 80, f1: 220 + i * 60, dur: 0.16 + i * 0.02, type: 'sawtooth', g: 0.07 },
    { r: 'noise', dur: 0.16 + i * 0.02, g: 0.04, lp: 2200 + i * 400 },
  ]);
});

/* robot.* — hydraulics, latches, joints (8) --------------------------------- */
def('robot.hydraulic', [
  { r: 'noise', dur: 0.5, g: 0.1, lp: 900, lpTo: 260 },
  { r: 'tone', f0: 140, f1: 90, dur: 0.45, type: 'triangle', g: 0.09 },
]);
def('robot.latch', [
  { r: 'tone', f0: 520, f1: 300, dur: 0.05, type: 'square', g: 0.12 },
  { r: 'noise', dur: 0.05, g: 0.1, lp: 4200 },
]);
def('robot.joint', [{ r: 'tone', f0: 300, f1: 420, dur: 0.1, type: 'triangle', g: 0.08 }]);
def('robot.spin.up', [
  { r: 'tone', f0: 80, f1: 640, dur: 1.2, type: 'sawtooth', g: 0.09, a: 0.3 },
  { r: 'noise', dur: 1.2, g: 0.05, lp: 600, lpTo: 6000 },
]);
def('robot.spin.down', [
  { r: 'tone', f0: 640, f1: 70, dur: 1.4, type: 'sawtooth', g: 0.09 },
  { r: 'noise', dur: 1.4, g: 0.05, lp: 6000, lpTo: 400 },
]);
def('robot.step', [
  { r: 'tone', f0: 90, f1: 55, dur: 0.18, type: 'sine', g: 0.26 },
  { r: 'noise', dur: 0.1, g: 0.08, lp: 1800, lpTo: 400 },
]);
def('robot.charge', [
  { r: 'tone', f0: 180, f1: 1400, dur: 0.9, type: 'square', g: 0.06, a: 0.4 },
  { r: 'tone', f0: 90, f1: 700, dur: 0.9, type: 'sawtooth', g: 0.05, a: 0.4 },
]);
def('robot.discharge', [
  { r: 'noise', dur: 0.3, g: 0.2, lp: 12000, lpTo: 600 },
  { r: 'tone', f0: 1200, f1: 110, dur: 0.34, type: 'sawtooth', g: 0.12 },
]);

/* data.* — telemetry, streams, packets (10) --------------------------------- */
[0, 1, 2, 3, 4, 5].forEach((i) =>
  def(`data.packet.${pad(i + 1)}`, [
    { r: 'tone', f0: 1600 + i * 240, dur: 0.022, type: 'square', g: 0.05 },
  ])
);
def('data.stream.start', [{ r: 'noise', dur: 0.3, g: 0.05, lp: 1400, lpTo: 7000 }]);
def('data.stream.stop', [{ r: 'noise', dur: 0.26, g: 0.05, lp: 7000, lpTo: 900 }]);
def('data.sync', [
  { r: 'tone', f0: 880, dur: 0.06, type: 'sine', g: 0.1 },
  { r: 'tone', f0: 1174, dur: 0.06, type: 'sine', g: 0.1, d: 0.07 },
  { r: 'tone', f0: 1568, dur: 0.12, type: 'sine', g: 0.1, d: 0.14 },
]);
def('data.error', [
  { r: 'tone', f0: 220, dur: 0.1, type: 'square', g: 0.14 },
  { r: 'noise', dur: 0.12, g: 0.08, lp: 1800 },
]);

/* deploy.* — CI/CD + infra lifecycle cues (12) ------------------------------ */
def('deploy.start', [
  { r: 'tone', f0: 294, f1: 440, dur: 0.3, type: 'triangle', g: 0.18 },
  { r: 'noise', dur: 0.32, g: 0.05, lp: 800, lpTo: 5000 },
]);
def('deploy.progress', [{ r: 'tone', f0: 660, dur: 0.035, type: 'sine', g: 0.06 }]);
def('deploy.success', [
  { r: 'tone', f0: 523, dur: 0.14, type: 'sine', g: 0.2 },
  { r: 'tone', f0: 659, dur: 0.14, type: 'sine', g: 0.18, d: 0.12 },
  { r: 'tone', f0: 784, dur: 0.16, type: 'sine', g: 0.18, d: 0.24 },
  { r: 'tone', f0: 1046, dur: 0.5, type: 'sine', g: 0.2, d: 0.36 },
]);
def('deploy.fail', [
  { r: 'tone', f0: 392, f1: 262, dur: 0.3, type: 'sawtooth', g: 0.14 },
  { r: 'tone', f0: 196, f1: 131, dur: 0.5, type: 'sawtooth', g: 0.14, d: 0.16 },
]);
def('deploy.rollback', [
  { r: 'tone', f0: 784, f1: 392, dur: 0.4, type: 'triangle', g: 0.16 },
  { r: 'noise', dur: 0.42, g: 0.06, lp: 5200, lpTo: 700 },
]);
def('deploy.scale.up', [
  { r: 'tone', f0: 330, f1: 660, dur: 0.26, type: 'triangle', g: 0.15 },
  { r: 'tone', f0: 495, f1: 990, dur: 0.26, type: 'sine', g: 0.08, d: 0.05 },
]);
def('deploy.scale.down', [
  { r: 'tone', f0: 660, f1: 330, dur: 0.26, type: 'triangle', g: 0.14 },
]);
def('deploy.restart', [
  { r: 'tone', f0: 220, f1: 660, dur: 0.22, type: 'square', g: 0.09 },
  { r: 'tone', f0: 660, f1: 220, dur: 0.22, type: 'square', g: 0.08, d: 0.22 },
]);
def('incident.open', [
  { r: 'tone', f0: 620, dur: 0.12, type: 'square', g: 0.14 },
  { r: 'tone', f0: 465, dur: 0.12, type: 'square', g: 0.14, d: 0.14 },
  { r: 'tone', f0: 620, dur: 0.2, type: 'square', g: 0.14, d: 0.28 },
]);
def('incident.resolve', [
  { r: 'tone', f0: 440, dur: 0.14, type: 'sine', g: 0.18 },
  { r: 'tone', f0: 880, dur: 0.44, type: 'sine', g: 0.16, d: 0.12 },
]);
def('incident.escalate', [
  { r: 'tone', f0: 440, f1: 880, dur: 0.24, type: 'sawtooth', g: 0.13 },
  { r: 'tone', f0: 880, f1: 1320, dur: 0.3, type: 'sawtooth', g: 0.12, d: 0.2 },
]);
def('incident.approve', [
  { r: 'tone', f0: 587, dur: 0.1, type: 'sine', g: 0.2 },
  { r: 'tone', f0: 1175, dur: 0.34, type: 'sine', g: 0.17, d: 0.08 },
  { r: 'noise', dur: 0.2, g: 0.04, lp: 3000, lpTo: 9000 },
]);

/* amb.* — one-shot atmosphere beds (8) -------------------------------------- */
[0, 1, 2, 3].forEach((i) => {
  def(`amb.drone.${pad(i + 1)}`, [
    { r: 'tone', f0: 44 + i * 12, dur: 3.2 + i * 0.4, type: 'sine', g: 0.16, a: 0.9 },
    { r: 'tone', f0: 66 + i * 18, dur: 3.0 + i * 0.4, type: 'sine', g: 0.08, a: 1.1, d: 0.2 },
  ]);
  def(`amb.air.${pad(i + 1)}`, [
    { r: 'noise', dur: 2.4 + i * 0.5, g: 0.035, lp: 600 + i * 300, lpTo: 1800 + i * 500 },
  ]);
});

/* slider / control surfaces (8) --------------------------------------------- */
[0, 1, 2, 3, 4, 5, 6, 7].forEach((i) =>
  def(`ctrl.notch.${pad(i + 1)}`, [
    { r: 'tone', f0: 900 + i * 90, dur: 0.02, type: 'square', g: 0.05 },
  ])
);
def('ctrl.toggle.on', [
  { r: 'tone', f0: 520, f1: 780, dur: 0.08, type: 'triangle', g: 0.18 },
  { r: 'noise', dur: 0.04, g: 0.05, lp: 4000 },
]);
def('ctrl.toggle.off', [
  { r: 'tone', f0: 780, f1: 440, dur: 0.08, type: 'triangle', g: 0.16 },
]);
def('ctrl.volume.test', [
  { r: 'tone', f0: 440, dur: 0.12, type: 'sine', g: 0.24 },
  { r: 'tone', f0: 660, dur: 0.18, type: 'sine', g: 0.2, d: 0.1 },
]);

export const SFX_NAMES: string[] = Object.keys(SFX).sort();
export const SFX_COUNT = SFX_NAMES.length;

/** Registry grouped by namespace — used by the sound board in Settings. */
export const SFX_FAMILIES: Record<string, string[]> = SFX_NAMES.reduce((acc, n) => {
  const fam = n.split('.')[0];
  (acc[fam] ||= []).push(n);
  return acc;
}, {} as Record<string, string[]>);

/* ---------- Engine ---------------------------------------------------------- */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let unlocked = false;
let activeVoices = 0;
const lastPlayed = new Map<string, number>();
const listeners = new Set<(enabled: boolean) => void>();
const volumeListeners = new Set<(volume: number) => void>();

const ENABLED_KEY = 'lear.sfx.enabled';
const VOLUME_KEY = 'lear.sfx.volume';
/** Voice cap — raised for the cinematic sequence, still frame-rate safe. */
const MAX_VOICES = 24;
const MIN_GAP_MS = 45;

/**
 * Master volume ceiling. Deliberately ABOVE unity so "max" is genuinely loud
 * (the user asked for loud + adjustable). The DynamicsCompressor in front of
 * the destination tames the peaks, so pushing past 1.0 adds perceived loudness
 * rather than digital clipping.
 */
export const MAX_VOLUME = 1.6;
/** Default is high — this is a showpiece UI, not a background utility. */
export const DEFAULT_VOLUME = 0.9;

export function isSfxEnabled(): boolean {
  try {
    return (localStorage.getItem(ENABLED_KEY) ?? '1') === '1';
  } catch {
    return true;
  }
}

export function getSfxVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw === null) return DEFAULT_VOLUME;
    const v = parseFloat(raw);
    return Number.isFinite(v) ? Math.min(MAX_VOLUME, Math.max(0, v)) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

/** 0..1 slider position ↔ real gain (which can exceed unity). */
export function getSfxVolumePct(): number {
  return getSfxVolume() / MAX_VOLUME;
}

function setMasterGain() {
  if (master && ctx) {
    master.gain.setTargetAtTime(getSfxVolume(), ctx.currentTime, 0.02);
  }
}

export function setSfxEnabled(enabled: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
  } catch { /* storage unavailable */ }
  listeners.forEach((cb) => cb(enabled));
}

export function setSfxVolume(v: number) {
  const clamped = Math.min(MAX_VOLUME, Math.max(0, v));
  try {
    localStorage.setItem(VOLUME_KEY, String(clamped));
  } catch { /* storage unavailable */ }
  setMasterGain();
  volumeListeners.forEach((cb) => cb(clamped));
}

/** Set from a 0..1 slider position, mapped onto the 0..MAX_VOLUME gain range. */
export function setSfxVolumePct(pct: number) {
  setSfxVolume(Math.min(1, Math.max(0, pct)) * MAX_VOLUME);
}

/** Subscribe to volume changes (keeps multiple sliders in sync). */
export function onSfxVolumeChange(cb: (v: number) => void): () => void {
  volumeListeners.add(cb);
  return () => volumeListeners.delete(cb);
}

/** Subscribe to enable/disable changes (e.g. to re-render a toggle). */
export function onSfxEnabledChange(cb: (enabled: boolean) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    // Tuned for the above-unity master gain: catches peaks early with a wide
    // soft knee so "loud" reads as dense and cinematic, never as clipping.
    comp.threshold.value = -20;
    comp.knee.value = 30;
    comp.ratio.value = 12;
    comp.attack.value = 0.003;
    comp.release.value = 0.22;
    comp.connect(ctx.destination);
    master = ctx.createGain();
    master.connect(comp);
    setMasterGain();
    // Shared 1s white-noise buffer — every noise voice slices from this.
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

/** Called once from the first user gesture; resumes the suspended context. */
export function unlockSfx() {
  const c = ensureContext();
  if (!c || unlocked) return;
  unlocked = true;
  if (c.state === 'suspended') {
    void c.resume().catch(() => undefined);
  }
}

function renderTone(c: AudioContext, out: AudioNode, p: SfxPart, t0: number) {
  const o = c.createOscillator();
  o.type = p.type ?? 'sine';
  const g = c.createGain();
  const attack = p.a ?? 0.005;
  o.frequency.setValueAtTime(Math.max(p.f0 ?? 440, 1), t0);
  if (p.f1) o.frequency.exponentialRampToValueAtTime(Math.max(p.f1, 1), t0 + p.dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(p.g, 0.001), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur);
  o.connect(g).connect(out);
  o.start(t0);
  o.stop(t0 + p.dur + 0.05);
  activeVoices++;
  o.onended = () => {
    activeVoices = Math.max(0, activeVoices - 1);
  };
}

function renderNoise(c: AudioContext, out: AudioNode, p: SfxPart, t0: number) {
  if (!noiseBuf) return;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(p.lp ?? 1400, t0);
  if (p.lpTo) f.frequency.exponentialRampToValueAtTime(Math.max(p.lpTo, 40), t0 + p.dur);
  const g = c.createGain();
  const attack = p.a ?? 0.012;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(p.g, 0.001), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur);
  src.connect(f).connect(g).connect(out);
  src.start(t0);
  src.stop(t0 + p.dur + 0.05);
  activeVoices++;
  src.onended = () => {
    activeVoices = Math.max(0, activeVoices - 1);
  };
}

/**
 * Play a named sound. Safe to call anywhere: no-op when disabled, before the
 * first user gesture, or when the registry doesn't know the name.
 */
export function sfx(name: string, opts?: { minGapMs?: number }): void {
  if (!isSfxEnabled()) return;
  const recipe = SFX[name];
  if (!recipe) return;
  const now = performance.now();
  const gap = opts?.minGapMs ?? MIN_GAP_MS;
  const last = lastPlayed.get(name) ?? -Infinity;
  if (now - last < gap) return;
  if (activeVoices >= MAX_VOICES) return;
  const c = ensureContext();
  if (!c || !master) return;
  if (c.state !== 'running') return; // not unlocked yet — silently skip
  lastPlayed.set(name, now);
  const t0 = c.currentTime + 0.005;
  for (const part of recipe) {
    const start = t0 + (part.d ?? 0);
    if (part.r === 'tone') renderTone(c, master, part, start);
    else renderNoise(c, master, part, start);
  }
}

/** React-friendly helper to bind hover/click sfx to props. */
export function sfxProps(click?: string, hover?: string) {
  return {
    onClick: () => click && sfx(click),
    onMouseEnter: () => hover && sfx(hover, { minGapMs: 70 }),
  };
}

/* =============================================================================
   LAYERED CUE SCHEDULER
   -----------------------------------------------------------------------------
   The cinematic surfaces (landing, Direction sequence) stack several one-shots
   into a single "moment". Doing that with setTimeout drifts and can land audio
   work inside a paint frame; these helpers schedule off the audio clock and
   bypass the per-name throttle so a deliberate layer is never swallowed.
   ========================================================================== */

/** Play several sounds at millisecond offsets, as one cue. */
export function sfxCue(layers: Array<{ name: string; at?: number; }>): void {
  if (!isSfxEnabled()) return;
  for (const { name, at = 0 } of layers) {
    if (at <= 0) { sfx(name, { minGapMs: 0 }); continue; }
    window.setTimeout(() => sfx(name, { minGapMs: 0 }), at);
  }
}

/** Pick a random member of a family, e.g. sfxAny('ui.click') → ui.click.07 */
export function sfxAny(family: string, opts?: { minGapMs?: number }): void {
  const pool = SFX_FAMILIES[family.split('.')[0]]?.filter((n) => n.startsWith(family + '.'));
  if (!pool || pool.length === 0) return sfx(family, opts);
  sfx(pool[(Math.random() * pool.length) | 0], opts);
}

/** Deterministic variant picker — same key always yields the same voice. */
export function sfxFor(family: string, key: string, opts?: { minGapMs?: number }): void {
  const pool = SFX_FAMILIES[family.split('.')[0]]?.filter((n) => n.startsWith(family + '.'));
  if (!pool || pool.length === 0) return sfx(family, opts);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  sfx(pool[Math.abs(h) % pool.length], opts);
}

/** Named cue macros used across the cinematic surfaces. */
export const CUES = {
  sequenceOpen: () => sfxCue([
    { name: 'seq.riser' }, { name: 'seq.whoosh.near', at: 900 },
    { name: 'seq.impact', at: 1750 }, { name: 'seq.reveal', at: 1850 },
    { name: 'hud.boot', at: 2100 },
  ]),
  sequenceClose: () => sfxCue([
    { name: 'seq.downlifter' }, { name: 'seq.close', at: 250 },
    { name: 'hud.shutdown', at: 400 },
  ]),
  enterConsole: () => sfxCue([
    { name: 'seq.whoosh.near' }, { name: 'seq.enter.console', at: 260 },
    { name: 'gold.chime.09', at: 520 },
  ]),
  panelOpen: () => sfxCue([{ name: 'nav.open' }, { name: 'hud.bracket.in', at: 70 }]),
  panelClose: () => sfxCue([{ name: 'nav.close' }, { name: 'hud.bracket.out', at: 60 }]),
  lockOn: () => sfxCue([{ name: 'hud.reticle' }, { name: 'hud.lock', at: 120 }]),
  deploySuccess: () => sfxCue([{ name: 'deploy.success' }, { name: 'gold.shimmer.03', at: 300 }]),
  deployFail: () => sfxCue([{ name: 'deploy.fail' }, { name: 'hud.critical', at: 200 }]),
  goldStrike: () => sfxAny('gold.strike'),
} as const;
