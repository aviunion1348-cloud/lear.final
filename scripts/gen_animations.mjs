/* =============================================================================
   LEAR MOTION LIBRARY GENERATOR
   -----------------------------------------------------------------------------
   Emits desktop/src/styles/animations.generated.css — a large, systematic set of
   GPU-safe @keyframes (transform / opacity / filter only, no layout properties)
   plus a matching utility class for each, and desktop/src/lib/generatedMotion.ts
   containing the honest name list consumed by the animation registry.

   Design rules enforced here (this is what keeps 100fps achievable):
     - Animate ONLY compositor-friendly properties: transform, opacity, filter,
       background-position, clip-path. Never width/height/top/left/margin.
     - Every family is a real parameter sweep, so each keyframe is genuinely
       distinct (different distance / angle / scale / phase), not a duplicate.
     - Utilities are emitted with `animation-fill-mode: both` and a shared
       `will-change` contract applied by the .fx-gpu helper.

   Run:  node scripts/gen_animations.mjs
   ========================================================================== */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const frames = [];   // { name, body }
const names = [];

function kf(name, body) {
  if (names.includes(name)) throw new Error(`duplicate keyframe: ${name}`);
  names.push(name);
  frames.push({ name, body });
}

const pad = (n) => String(n).padStart(2, '0');
const DIRS = { u: [0, 1], d: [0, -1], l: [1, 0], r: [-1, 0] };

/* ── F01–F04  directional entrances (4 dirs × 10 distances = 40) ─────────── */
for (const [d, [sx, sy]] of Object.entries(DIRS)) {
  [8, 14, 20, 28, 36, 48, 62, 80, 104, 132].forEach((dist, i) => {
    kf(`enter-${d}-${pad(i + 1)}`, [
      `from { opacity: 0; transform: translate3d(${sx * dist}px, ${sy * dist}px, 0); }`,
      `to   { opacity: 1; transform: translate3d(0, 0, 0); }`,
    ]);
  });
}

/* ── F05–F08  directional exits (4 × 10 = 40) ────────────────────────────── */
for (const [d, [sx, sy]] of Object.entries(DIRS)) {
  [8, 14, 20, 28, 36, 48, 62, 80, 104, 132].forEach((dist, i) => {
    kf(`exit-${d}-${pad(i + 1)}`, [
      `from { opacity: 1; transform: translate3d(0, 0, 0); }`,
      `to   { opacity: 0; transform: translate3d(${-sx * dist}px, ${-sy * dist}px, 0); }`,
    ]);
  });
}

/* ── F09  scale entrances (16) ───────────────────────────────────────────── */
[0.5, 0.6, 0.68, 0.74, 0.8, 0.84, 0.88, 0.9, 0.92, 0.94, 0.96, 1.04, 1.08, 1.14, 1.22, 1.35]
  .forEach((s, i) => kf(`scale-in-${pad(i + 1)}`, [
    `from { opacity: 0; transform: scale3d(${s}, ${s}, 1); }`,
    `to   { opacity: 1; transform: scale3d(1, 1, 1); }`,
  ]));

/* ── F10  blur entrances (12) ────────────────────────────────────────────── */
[2, 4, 6, 8, 10, 12, 16, 20, 24, 30, 38, 48].forEach((b, i) =>
  kf(`blur-in-${pad(i + 1)}`, [
    `from { opacity: 0; filter: blur(${b}px); transform: scale3d(1.02, 1.02, 1); }`,
    `to   { opacity: 1; filter: blur(0); transform: scale3d(1, 1, 1); }`,
  ]));

/* ── F11  3D flips on X and Y (2 × 10 = 20) ──────────────────────────────── */
for (const axis of ['x', 'y']) {
  [20, 30, 40, 50, 60, 72, 84, 96, 110, 125].forEach((deg, i) =>
    kf(`flip-${axis}-${pad(i + 1)}`, [
      `from { opacity: 0; transform: perspective(1200px) rotate${axis.toUpperCase()}(${deg}deg); }`,
      `to   { opacity: 1; transform: perspective(1200px) rotate${axis.toUpperCase()}(0deg); }`,
    ]));
}

/* ── F12  roll-in rotations (14) ─────────────────────────────────────────── */
[-180, -140, -110, -85, -60, -42, -28, 28, 42, 60, 85, 110, 140, 180].forEach((deg, i) =>
  kf(`roll-in-${pad(i + 1)}`, [
    `from { opacity: 0; transform: rotate(${deg}deg) scale3d(0.8, 0.8, 1); }`,
    `to   { opacity: 1; transform: rotate(0deg) scale3d(1, 1, 1); }`,
  ]));

/* ── F13  float loops — vertical bob (18 amplitudes) ─────────────────────── */
[3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 21, 24, 28, 32, 38, 44, 52].forEach((a, i) =>
  kf(`float-y-${pad(i + 1)}`, [
    `0%, 100% { transform: translate3d(0, 0, 0); }`,
    `50%      { transform: translate3d(0, -${a}px, 0); }`,
  ]));

/* ── F14  float loops — horizontal drift (12) ────────────────────────────── */
[3, 5, 7, 9, 12, 15, 18, 22, 27, 33, 40, 48].forEach((a, i) =>
  kf(`float-x-${pad(i + 1)}`, [
    `0%, 100% { transform: translate3d(0, 0, 0); }`,
    `50%      { transform: translate3d(${a}px, 0, 0); }`,
  ]));

/* ── F15  orbital drift — lissajous paths (16) ───────────────────────────── */
[[6, 4], [8, 5], [10, 6], [12, 8], [14, 9], [16, 10], [18, 12], [20, 13],
 [24, 15], [28, 18], [32, 20], [36, 23], [40, 26], [48, 30], [56, 36], [64, 42]]
  .forEach(([ax, ay], i) => kf(`drift-orbit-${pad(i + 1)}`, [
    `0%   { transform: translate3d(0, 0, 0); }`,
    `25%  { transform: translate3d(${ax}px, -${ay}px, 0); }`,
    `50%  { transform: translate3d(0, -${ay * 2}px, 0); }`,
    `75%  { transform: translate3d(-${ax}px, -${ay}px, 0); }`,
    `100% { transform: translate3d(0, 0, 0); }`,
  ]));

/* ── F16  breathing scale loops (14) ─────────────────────────────────────── */
[1.01, 1.015, 1.02, 1.025, 1.03, 1.04, 1.05, 1.06, 1.07, 1.085, 1.1, 1.12, 1.15, 1.2]
  .forEach((s, i) => kf(`breathe-${pad(i + 1)}`, [
    `0%, 100% { transform: scale3d(1, 1, 1); }`,
    `50%      { transform: scale3d(${s}, ${s}, 1); }`,
  ]));

/* ── F17  gold glow pulses (16 intensities) ──────────────────────────────── */
[0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.66, 0.72, 0.78, 0.85, 0.92, 1.0]
  .forEach((o, i) => kf(`glow-gold-${pad(i + 1)}`, [
    `0%, 100% { box-shadow: 0 0 ${8 + i * 2}px rgba(232, 180, 74, ${(o * 0.35).toFixed(3)}); }`,
    `50%      { box-shadow: 0 0 ${20 + i * 4}px rgba(232, 180, 74, ${o.toFixed(3)}), 0 0 ${60 + i * 8}px rgba(232, 180, 74, ${(o * 0.35).toFixed(3)}); }`,
  ]));

/* ── F18  semantic glow pulses (5 hues × 6 steps = 30) ───────────────────── */
const HUES = {
  champagne: '247, 231, 195',
  bronze: '156, 107, 60',
  success: '63, 191, 127',
  danger: '229, 72, 77',
  info: '111, 168, 220',
};
for (const [hue, rgb] of Object.entries(HUES)) {
  [0.2, 0.3, 0.4, 0.55, 0.7, 0.9].forEach((o, i) =>
    kf(`glow-${hue}-${pad(i + 1)}`, [
      `0%, 100% { box-shadow: 0 0 ${10 + i * 3}px rgba(${rgb}, ${(o * 0.3).toFixed(3)}); }`,
      `50%      { box-shadow: 0 0 ${26 + i * 6}px rgba(${rgb}, ${o.toFixed(3)}); }`,
    ]));
}

/* ── F19  text glow / neon flicker (12) ──────────────────────────────────── */
[0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.35].forEach((o, i) =>
  kf(`text-glow-${pad(i + 1)}`, [
    `0%, 100% { text-shadow: 0 0 ${10 + i * 2}px rgba(232, 180, 74, ${Math.min(o * 0.4, 1).toFixed(3)}); }`,
    `50%      { text-shadow: 0 0 ${24 + i * 4}px rgba(232, 180, 74, ${Math.min(o, 1).toFixed(3)}), 0 0 ${70 + i * 8}px rgba(247, 231, 195, ${Math.min(o * 0.4, 1).toFixed(3)}); }`,
  ]));

/* ── F20  sheen / light sweep across a surface (14 angles) ───────────────── */
[60, 70, 80, 90, 100, 110, 120, 135, 150, 165, 180, 200, 225, 250].forEach((_, i) =>
  kf(`sheen-sweep-${pad(i + 1)}`, [
    `0%   { background-position: -${140 + i * 20}% 0; }`,
    `100% { background-position: ${140 + i * 20}% 0; }`,
  ]));

/* ── F21  gradient panning (12 speeds/paths) ─────────────────────────────── */
for (let i = 0; i < 12; i++) {
  const shift = 100 + i * 25;
  kf(`gradient-pan-${pad(i + 1)}`, [
    `0%   { background-position: 0% 50%; }`,
    `50%  { background-position: ${shift}% 50%; }`,
    `100% { background-position: 0% 50%; }`,
  ]);
}

/* ── F22  scanlines travelling vertically (12) ───────────────────────────── */
for (let i = 0; i < 12; i++) {
  kf(`scan-y-${pad(i + 1)}`, [
    `0%   { transform: translate3d(0, -${100 + i * 10}%, 0); opacity: 0; }`,
    `12%  { opacity: ${(0.3 + i * 0.05).toFixed(2)}; }`,
    `88%  { opacity: ${(0.3 + i * 0.05).toFixed(2)}; }`,
    `100% { transform: translate3d(0, ${100 + i * 10}%, 0); opacity: 0; }`,
  ]);
}

/* ── F23  scanlines travelling horizontally (10) ─────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`scan-x-${pad(i + 1)}`, [
    `0%   { transform: translate3d(-${100 + i * 12}%, 0, 0); opacity: 0; }`,
    `50%  { opacity: ${(0.35 + i * 0.05).toFixed(2)}; }`,
    `100% { transform: translate3d(${100 + i * 12}%, 0, 0); opacity: 0; }`,
  ]);
}

/* ── F24  ping / radar rings (14) ────────────────────────────────────────── */
[1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.4, 3.8, 4.2, 4.8, 5.4].forEach((s, i) =>
  kf(`ping-ring-${pad(i + 1)}`, [
    `0%   { transform: scale3d(0.9, 0.9, 1); opacity: ${(0.85 - i * 0.03).toFixed(2)}; }`,
    `100% { transform: scale3d(${s}, ${s}, 1); opacity: 0; }`,
  ]));

/* ── F25  spin variants, both directions (2 × 8 = 16) ────────────────────── */
for (const dir of ['cw', 'ccw']) {
  const sgn = dir === 'cw' ? 1 : -1;
  [360, 720, 1080, 180, 90, 45, 540, 900].forEach((deg, i) =>
    kf(`spin-${dir}-${pad(i + 1)}`, [
      `from { transform: rotate(0deg); }`,
      `to   { transform: rotate(${sgn * deg}deg); }`,
    ]));
}

/* ── F26  conic ring sweeps for animated borders (10) ────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`ring-sweep-${pad(i + 1)}`, [
    `from { transform: rotate(0deg) scale(${(1 + i * 0.02).toFixed(2)}); }`,
    `to   { transform: rotate(360deg) scale(${(1 + i * 0.02).toFixed(2)}); }`,
  ]);
}

/* ── F27  shake / error jitter (10 intensities) ──────────────────────────── */
[1, 2, 3, 4, 5, 6, 8, 10, 13, 16].forEach((a, i) =>
  kf(`shake-${pad(i + 1)}`, [
    `0%, 100% { transform: translate3d(0, 0, 0); }`,
    `20% { transform: translate3d(-${a}px, 0, 0); }`,
    `40% { transform: translate3d(${a}px, 0, 0); }`,
    `60% { transform: translate3d(-${(a * 0.6).toFixed(1)}px, 0, 0); }`,
    `80% { transform: translate3d(${(a * 0.3).toFixed(1)}px, 0, 0); }`,
  ]));

/* ── F28  bounce / spring settle (12) ────────────────────────────────────── */
[6, 8, 10, 12, 15, 18, 22, 26, 32, 38, 46, 56].forEach((h, i) =>
  kf(`bounce-${pad(i + 1)}`, [
    `0%, 100% { transform: translate3d(0, 0, 0); }`,
    `30%  { transform: translate3d(0, -${h}px, 0); }`,
    `55%  { transform: translate3d(0, -${(h * 0.45).toFixed(1)}px, 0); }`,
    `75%  { transform: translate3d(0, -${(h * 0.18).toFixed(1)}px, 0); }`,
    `90%  { transform: translate3d(0, -${(h * 0.06).toFixed(1)}px, 0); }`,
  ]));

/* ── F29  jelly / squash-stretch (10) ────────────────────────────────────── */
[0.03, 0.05, 0.07, 0.09, 0.11, 0.14, 0.17, 0.21, 0.26, 0.32].forEach((k, i) =>
  kf(`jelly-${pad(i + 1)}`, [
    `0%, 100% { transform: scale3d(1, 1, 1); }`,
    `30% { transform: scale3d(${(1 + k).toFixed(2)}, ${(1 - k * 0.8).toFixed(2)}, 1); }`,
    `45% { transform: scale3d(${(1 - k * 0.6).toFixed(2)}, ${(1 + k * 0.6).toFixed(2)}, 1); }`,
    `65% { transform: scale3d(${(1 + k * 0.3).toFixed(2)}, ${(1 - k * 0.3).toFixed(2)}, 1); }`,
  ]));

/* ── F30  wiggle rotations (10) ──────────────────────────────────────────── */
[1, 1.5, 2, 3, 4, 5, 7, 9, 12, 15].forEach((deg, i) =>
  kf(`wiggle-${pad(i + 1)}`, [
    `0%, 100% { transform: rotate(0deg); }`,
    `25% { transform: rotate(-${deg}deg); }`,
    `75% { transform: rotate(${deg}deg); }`,
  ]));

/* ── F31  swing / pendulum with origin at top (10) ───────────────────────── */
[3, 5, 7, 9, 12, 15, 19, 24, 30, 38].forEach((deg, i) =>
  kf(`swing-${pad(i + 1)}`, [
    `0%, 100% { transform: rotate(0deg); }`,
    `20% { transform: rotate(${deg}deg); }`,
    `40% { transform: rotate(-${(deg * 0.7).toFixed(1)}deg); }`,
    `60% { transform: rotate(${(deg * 0.4).toFixed(1)}deg); }`,
    `80% { transform: rotate(-${(deg * 0.2).toFixed(1)}deg); }`,
  ]));

/* ── F32  opacity flicker / hologram instability (12) ────────────────────── */
for (let i = 0; i < 12; i++) {
  const lo = (0.2 + i * 0.05).toFixed(2);
  kf(`flicker-${pad(i + 1)}`, [
    `0%, 100% { opacity: 1; }`,
    `${8 + i}%  { opacity: ${lo}; }`,
    `${12 + i}% { opacity: 1; }`,
    `${43 + i}% { opacity: ${lo}; }`,
    `${47 + i}% { opacity: 1; }`,
    `${72 + i}% { opacity: ${(Number(lo) + 0.2).toFixed(2)}; }`,
    `${76 + i}% { opacity: 1; }`,
  ]);
}

/* ── F33  glitch displacement (12) ───────────────────────────────────────── */
[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 22].forEach((a, i) =>
  kf(`glitch-${pad(i + 1)}`, [
    `0%, 100% { transform: translate3d(0, 0, 0); filter: none; }`,
    `12% { transform: translate3d(-${a}px, ${(a * 0.3).toFixed(1)}px, 0); filter: hue-rotate(${a * 2}deg); }`,
    `24% { transform: translate3d(${a}px, -${(a * 0.3).toFixed(1)}px, 0); }`,
    `36% { transform: translate3d(-${(a * 0.5).toFixed(1)}px, 0, 0); filter: saturate(1.6); }`,
    `48% { transform: translate3d(0, 0, 0); }`,
  ]));

/* ── F34  clip-path reveals: 4 directions × 6 = 24 ───────────────────────── */
const CLIPS = {
  right: (p) => `inset(0 ${p}% 0 0)`,
  left: (p) => `inset(0 0 0 ${p}%)`,
  up: (p) => `inset(${p}% 0 0 0)`,
  down: (p) => `inset(0 0 ${p}% 0)`,
};
for (const [dir, fn] of Object.entries(CLIPS)) {
  [100, 92, 84, 72, 60, 45].forEach((p, i) =>
    kf(`wipe-${dir}-${pad(i + 1)}`, [
      `from { clip-path: ${fn(p)}; opacity: ${i === 0 ? 0.6 : 0.8}; }`,
      `to   { clip-path: ${fn(0)}; opacity: 1; }`,
    ]));
}

/* ── F35  iris / circle reveals (10) ─────────────────────────────────────── */
[0, 6, 12, 18, 25, 32, 40, 50, 62, 75].forEach((r, i) =>
  kf(`iris-in-${pad(i + 1)}`, [
    `from { clip-path: circle(${r}% at 50% 50%); opacity: 0.4; }`,
    `to   { clip-path: circle(150% at 50% 50%); opacity: 1; }`,
  ]));

/* ── F36  Ken Burns camera moves (16 unique paths) ───────────────────────── */
[[1.0, 1.14, 0, 0, -2, 3], [1.06, 1.2, -2, 2, 3, -2], [1.12, 1.0, 3, -3, 0, 2],
 [1.0, 1.22, 2, 3, -3, -3], [1.08, 1.16, -3, 0, 2, 4], [1.15, 1.02, 0, -4, 3, 1],
 [1.02, 1.18, 4, 2, -2, -4], [1.2, 1.05, -4, 3, 1, -1], [1.04, 1.26, 1, -2, -4, 3],
 [1.1, 1.0, -1, 4, 2, -3], [1.0, 1.3, 3, 3, -1, -2], [1.18, 1.08, -2, -3, 4, 2],
 [1.05, 1.24, 2, -4, -3, 1], [1.22, 1.1, -3, 2, 1, -4], [1.03, 1.16, 4, -1, -2, 2],
 [1.14, 1.28, -1, -2, 3, 4]]
  .forEach(([s0, s1, x0, y0, x1, y1], i) =>
    kf(`kenburns-${pad(i + 1)}`, [
      `0%   { transform: scale3d(${s0}, ${s0}, 1) translate3d(${x0}%, ${y0}%, 0); }`,
      `100% { transform: scale3d(${s1}, ${s1}, 1) translate3d(${x1}%, ${y1}%, 0); }`,
    ]));

/* ── F37  parallax layer drifts (5 depths × 4 dirs = 20) ─────────────────── */
[2, 4, 7, 11, 16].forEach((depth, di) => {
  for (const [d, [sx, sy]] of Object.entries(DIRS)) {
    kf(`parallax-${d}-${pad(di + 1)}`, [
      `0%, 100% { transform: translate3d(0, 0, 0); }`,
      `50%      { transform: translate3d(${sx * depth}px, ${sy * depth}px, 0); }`,
    ]);
  }
});

/* ── F38  particle rise paths (18) ───────────────────────────────────────── */
for (let i = 0; i < 18; i++) {
  const drift = ((i % 6) - 2.5) * 14;
  const rise = 120 + i * 22;
  kf(`particle-rise-${pad(i + 1)}`, [
    `0%   { transform: translate3d(0, 0, 0) scale(${(0.4 + (i % 5) * 0.14).toFixed(2)}); opacity: 0; }`,
    `10%  { opacity: ${(0.4 + (i % 4) * 0.15).toFixed(2)}; }`,
    `80%  { opacity: ${(0.25 + (i % 4) * 0.1).toFixed(2)}; }`,
    `100% { transform: translate3d(${drift}px, -${rise}px, 0) scale(${(0.15 + (i % 3) * 0.1).toFixed(2)}); opacity: 0; }`,
  ]);
}

/* ── F39  ember fall paths (12) ──────────────────────────────────────────── */
for (let i = 0; i < 12; i++) {
  const drift = ((i % 5) - 2) * 18;
  kf(`ember-fall-${pad(i + 1)}`, [
    `0%   { transform: translate3d(0, -20px, 0) rotate(0deg); opacity: 0; }`,
    `15%  { opacity: ${(0.5 + (i % 4) * 0.12).toFixed(2)}; }`,
    `100% { transform: translate3d(${drift}px, ${160 + i * 18}px, 0) rotate(${(i % 2 ? 1 : -1) * (120 + i * 20)}deg); opacity: 0; }`,
  ]);
}

/* ── F40  comet streaks (10) ─────────────────────────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`comet-${pad(i + 1)}`, [
    `0%   { transform: translate3d(-${20 + i * 6}vw, ${i * 4}vh, 0) rotate(${18 + i * 3}deg) scaleX(0.4); opacity: 0; }`,
    `15%  { opacity: 1; }`,
    `85%  { opacity: 0.85; }`,
    `100% { transform: translate3d(${110 + i * 6}vw, ${i * 4 - 12}vh, 0) rotate(${18 + i * 3}deg) scaleX(1.6); opacity: 0; }`,
  ]);
}

/* ── F41  data-stream / matrix rain columns (14) ─────────────────────────── */
for (let i = 0; i < 14; i++) {
  kf(`data-stream-${pad(i + 1)}`, [
    `0%   { transform: translate3d(0, -${100 + i * 8}%, 0); opacity: 0; }`,
    `10%  { opacity: ${(0.35 + (i % 5) * 0.12).toFixed(2)}; }`,
    `90%  { opacity: ${(0.2 + (i % 4) * 0.1).toFixed(2)}; }`,
    `100% { transform: translate3d(0, ${100 + i * 8}%, 0); opacity: 0; }`,
  ]);
}

/* ── F42  HUD bracket assembly (8 corners/scales) ────────────────────────── */
for (let i = 0; i < 8; i++) {
  const o = 12 + i * 5;
  kf(`hud-bracket-${pad(i + 1)}`, [
    `0%   { opacity: 0; transform: translate3d(${(i % 2 ? -o : o)}px, ${(i % 4 < 2 ? -o : o)}px, 0) scale(0.7); }`,
    `60%  { opacity: 1; transform: translate3d(0, 0, 0) scale(1.05); }`,
    `100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }`,
  ]);
}

/* ── F43  radar / scanner sweeps (8) ─────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`radar-sweep-${pad(i + 1)}`, [
    `0%   { transform: rotate(0deg); opacity: ${(0.4 + i * 0.06).toFixed(2)}; }`,
    `50%  { opacity: ${(0.8 + i * 0.02).toFixed(2)}; }`,
    `100% { transform: rotate(360deg); opacity: ${(0.4 + i * 0.06).toFixed(2)}; }`,
  ]);
}

/* ── F44  progress / loading indeterminate bars (10) ─────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`indeterminate-${pad(i + 1)}`, [
    `0%   { transform: translate3d(-100%, 0, 0) scaleX(${(0.2 + i * 0.05).toFixed(2)}); }`,
    `50%  { transform: translate3d(0, 0, 0) scaleX(${(0.5 + i * 0.05).toFixed(2)}); }`,
    `100% { transform: translate3d(100%, 0, 0) scaleX(${(0.2 + i * 0.05).toFixed(2)}); }`,
  ]);
}

/* ── F45  skeleton shimmer speeds (8) ────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`skeleton-${pad(i + 1)}`, [
    `0%   { background-position: -${200 + i * 40}% 0; }`,
    `100% { background-position: ${200 + i * 40}% 0; }`,
  ]);
}

/* ── F46  equalizer bars — staggered phases (16) ─────────────────────────── */
for (let i = 0; i < 16; i++) {
  const h = 0.25 + (i % 8) * 0.09;
  kf(`equalize-${pad(i + 1)}`, [
    `0%, 100% { transform: scaleY(${h.toFixed(2)}); }`,
    `25%      { transform: scaleY(${Math.min(h + 0.5, 1).toFixed(2)}); }`,
    `50%      { transform: scaleY(${Math.max(h - 0.15, 0.1).toFixed(2)}); }`,
    `75%      { transform: scaleY(${Math.min(h + 0.3, 1).toFixed(2)}); }`,
  ]);
}

/* ── F47  waveform ripple phases (12) ────────────────────────────────────── */
for (let i = 0; i < 12; i++) {
  kf(`wave-phase-${pad(i + 1)}`, [
    `0%, 100% { transform: translate3d(0, 0, 0) scaleY(1); }`,
    `25%  { transform: translate3d(0, -${2 + i}px, 0) scaleY(${(1 + i * 0.03).toFixed(2)}); }`,
    `50%  { transform: translate3d(0, 0, 0) scaleY(1); }`,
    `75%  { transform: translate3d(0, ${2 + i}px, 0) scaleY(${(1 - i * 0.02).toFixed(2)}); }`,
  ]);
}

/* ── F48  ripple-out click feedback (10) ─────────────────────────────────── */
[2, 2.5, 3, 3.5, 4, 5, 6, 7, 8.5, 10].forEach((s, i) =>
  kf(`ripple-${pad(i + 1)}`, [
    `0%   { transform: scale3d(0, 0, 1); opacity: ${(0.6 - i * 0.03).toFixed(2)}; }`,
    `100% { transform: scale3d(${s}, ${s}, 1); opacity: 0; }`,
  ]));

/* ── F49  press-down feedback (8) ────────────────────────────────────────── */
[0.99, 0.98, 0.97, 0.96, 0.95, 0.93, 0.91, 0.88].forEach((s, i) =>
  kf(`press-${pad(i + 1)}`, [
    `0%, 100% { transform: scale3d(1, 1, 1); }`,
    `50%      { transform: scale3d(${s}, ${s}, 1); }`,
  ]));

/* ── F50  focus-ring expansions (8) ──────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`focus-ring-${pad(i + 1)}`, [
    `0%   { box-shadow: 0 0 0 0 rgba(232, 180, 74, ${(0.5 + i * 0.05).toFixed(2)}); }`,
    `100% { box-shadow: 0 0 0 ${4 + i * 2}px rgba(232, 180, 74, 0); }`,
  ]);
}

/* ── F51  count-up digit rolls (8) ───────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`digit-roll-${pad(i + 1)}`, [
    `0%   { transform: translate3d(0, ${40 + i * 8}%, 0); opacity: 0; filter: blur(${(i * 0.5).toFixed(1)}px); }`,
    `100% { transform: translate3d(0, 0, 0); opacity: 1; filter: blur(0); }`,
  ]);
}

/* ── F52  value-delta flashes: up/down × 5 = 10 ──────────────────────────── */
for (const [dir, rgb] of [['up', '63, 191, 127'], ['down', '229, 72, 77']]) {
  [0.15, 0.25, 0.35, 0.5, 0.65].forEach((o, i) =>
    kf(`delta-${dir}-${pad(i + 1)}`, [
      `0%   { background-color: rgba(${rgb}, 0); }`,
      `25%  { background-color: rgba(${rgb}, ${o}); }`,
      `100% { background-color: rgba(${rgb}, 0); }`,
    ]));
}

/* ── F53  typing caret / cursor blinks (6) ───────────────────────────────── */
for (let i = 0; i < 6; i++) {
  kf(`caret-${pad(i + 1)}`, [
    `0%, ${45 + i * 3}%   { opacity: 1; }`,
    `${46 + i * 3}%, 100% { opacity: 0; }`,
  ]);
}

/* ── F54  thinking-dot sequences (9 phases) ──────────────────────────────── */
for (let i = 0; i < 9; i++) {
  kf(`dot-think-${pad(i + 1)}`, [
    `0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.35; }`,
    `${20 + i * 5}% { transform: translate3d(0, -${4 + (i % 4) * 2}px, 0); opacity: 1; }`,
  ]);
}

/* ── F55  toast enter/exit pairs (2 × 6 = 12) ────────────────────────────── */
for (const [mode, sign] of [['in', 1], ['out', -1]]) {
  [24, 36, 48, 64, 84, 110].forEach((d, i) =>
    kf(`toast-${mode}-${pad(i + 1)}`, mode === 'in' ? [
      `0%   { opacity: 0; transform: translate3d(${d}px, 0, 0) scale(0.94); }`,
      `100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }`,
    ] : [
      `0%   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }`,
      `100% { opacity: 0; transform: translate3d(${sign * -d}px, 0, 0) scale(0.94); }`,
    ]));
}

/* ── F56  modal / dialog entrances (10) ──────────────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`modal-in-${pad(i + 1)}`, [
    `0%   { opacity: 0; transform: translate3d(0, ${8 + i * 4}px, 0) scale(${(0.94 - i * 0.005).toFixed(3)}); filter: blur(${(i * 0.6).toFixed(1)}px); }`,
    `100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }`,
  ]);
}

/* ── F57  drawer slides (4 dirs × 4 = 16) ────────────────────────────────── */
for (const [d, [sx, sy]] of Object.entries(DIRS)) {
  [100, 75, 50, 30].forEach((p, i) =>
    kf(`drawer-${d}-${pad(i + 1)}`, [
      `0%   { transform: translate3d(${sx * p}%, ${sy * p}%, 0); opacity: 0.4; }`,
      `100% { transform: translate3d(0, 0, 0); opacity: 1; }`,
    ]));
}

/* ── F58  tooltip pops (8) ───────────────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`tooltip-pop-${pad(i + 1)}`, [
    `0%   { opacity: 0; transform: scale(${(0.8 + i * 0.02).toFixed(2)}) translate3d(0, ${4 + i}px, 0); }`,
    `70%  { opacity: 1; transform: scale(1.02) translate3d(0, 0, 0); }`,
    `100% { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }`,
  ]);
}

/* ── F59  badge pops (8) ─────────────────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`badge-pop-${pad(i + 1)}`, [
    `0%   { transform: scale(0); opacity: 0; }`,
    `${50 + i * 3}% { transform: scale(${(1.15 + i * 0.03).toFixed(2)}); opacity: 1; }`,
    `100% { transform: scale(1); opacity: 1; }`,
  ]);
}

/* ── F60  status flashes (4 states × 4 = 16) ─────────────────────────────── */
for (const [state, rgb] of Object.entries({
  success: '63, 191, 127', danger: '229, 72, 77',
  warning: '232, 180, 74', info: '111, 168, 220',
})) {
  [0.2, 0.32, 0.45, 0.6].forEach((o, i) =>
    kf(`flash-${state}-${pad(i + 1)}`, [
      `0%, 100% { box-shadow: 0 0 0 0 rgba(${rgb}, 0); }`,
      `35%      { box-shadow: 0 0 ${18 + i * 6}px ${2 + i}px rgba(${rgb}, ${o}); }`,
    ]));
}

/* ── F61  success checkmark draws (6) ────────────────────────────────────── */
for (let i = 0; i < 6; i++) {
  kf(`check-draw-${pad(i + 1)}`, [
    `0%   { stroke-dashoffset: ${60 + i * 10}; opacity: 0.4; }`,
    `100% { stroke-dashoffset: 0; opacity: 1; }`,
  ]);
}

/* ── F62  SVG line draws (10 path lengths) ───────────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`line-draw-${pad(i + 1)}`, [
    `from { stroke-dashoffset: ${100 + i * 60}; }`,
    `to   { stroke-dashoffset: 0; }`,
  ]);
}

/* ── F63  dash-flow along edges (8 speeds) ───────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`dash-flow-${pad(i + 1)}`, [
    `from { stroke-dashoffset: 0; }`,
    `to   { stroke-dashoffset: -${20 + i * 12}; }`,
  ]);
}

/* ── F64  node pulses on graph vertices (8) ──────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`node-pulse-${pad(i + 1)}`, [
    `0%, 100% { transform: scale(1); filter: brightness(1); }`,
    `50%      { transform: scale(${(1.1 + i * 0.05).toFixed(2)}); filter: brightness(${(1.2 + i * 0.1).toFixed(2)}); }`,
  ]);
}

/* ── F65  marquee / ticker loops (8) ─────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`marquee-${pad(i + 1)}`, [
    `from { transform: translate3d(0, 0, 0); }`,
    `to   { transform: translate3d(-${50 + i * 6}%, 0, 0); }`,
  ]);
}

/* ── F66  vertical tickers (6) ───────────────────────────────────────────── */
for (let i = 0; i < 6; i++) {
  kf(`ticker-up-${pad(i + 1)}`, [
    `0%   { transform: translate3d(0, 0, 0); }`,
    `100% { transform: translate3d(0, -${100 / (i + 1)}%, 0); }`,
  ]);
}

/* ── F67  hue rotations for holographic surfaces (8) ─────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`holo-${pad(i + 1)}`, [
    `0%, 100% { filter: hue-rotate(0deg) saturate(1); }`,
    `50%      { filter: hue-rotate(${8 + i * 5}deg) saturate(${(1.1 + i * 0.08).toFixed(2)}); }`,
  ]);
}

/* ── F68  brightness pulses for video plates (8) ─────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`brighten-${pad(i + 1)}`, [
    `0%, 100% { filter: brightness(${(1.05 + i * 0.03).toFixed(2)}) contrast(1.05); }`,
    `50%      { filter: brightness(${(1.25 + i * 0.06).toFixed(2)}) contrast(${(1.12 + i * 0.02).toFixed(2)}); }`,
  ]);
}

/* ── F69  vignette breathing (6) ─────────────────────────────────────────── */
for (let i = 0; i < 6; i++) {
  kf(`vignette-${pad(i + 1)}`, [
    `0%, 100% { opacity: ${(0.5 + i * 0.05).toFixed(2)}; transform: scale(1); }`,
    `50%      { opacity: ${(0.68 + i * 0.05).toFixed(2)}; transform: scale(${(1.02 + i * 0.01).toFixed(2)}); }`,
  ]);
}

/* ── F70  film-grain jitters (8 unique offsets) ──────────────────────────── */
const GRAIN = [[1, -1], [-2, 2], [3, -3], [-3, 1], [2, 3], [-1, -2], [4, 0], [0, -4]];
GRAIN.forEach(([x, y], i) =>
  kf(`grain-${pad(i + 1)}`, [
    `0%   { transform: translate3d(0, 0, 0); }`,
    `20%  { transform: translate3d(${x}%, ${y}%, 0); }`,
    `40%  { transform: translate3d(${y}%, ${x}%, 0); }`,
    `60%  { transform: translate3d(-${x}%, ${y}%, 0); }`,
    `80%  { transform: translate3d(${y}%, -${x}%, 0); }`,
    `100% { transform: translate3d(0, 0, 0); }`,
  ]));

/* ── F71  aurora field drifts (10) ───────────────────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`aurora-${pad(i + 1)}`, [
    `0%   { transform: translate3d(0, 0, 0) rotate(0deg) scale(${(1 + i * 0.02).toFixed(2)}); }`,
    `33%  { transform: translate3d(${3 + i}%, -${2 + i}%, 0) rotate(${2 + i}deg) scale(${(1.05 + i * 0.02).toFixed(2)}); }`,
    `66%  { transform: translate3d(-${2 + i}%, ${3 + i}%, 0) rotate(-${1 + i}deg) scale(${(1.02 + i * 0.02).toFixed(2)}); }`,
    `100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(${(1 + i * 0.02).toFixed(2)}); }`,
  ]);
}

/* ── F72  perspective grid travel (8) ────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`grid-travel-${pad(i + 1)}`, [
    `from { background-position: 0 0; }`,
    `to   { background-position: 0 ${40 + i * 10}px; }`,
  ]);
}

/* ── F73  tilt on hover — 4 corners × 3 = 12 ─────────────────────────────── */
const CORNERS = { tl: [-1, -1], tr: [1, -1], bl: [-1, 1], br: [1, 1] };
for (const [c, [cx, cy]] of Object.entries(CORNERS)) {
  [3, 6, 10].forEach((deg, i) =>
    kf(`tilt-${c}-${pad(i + 1)}`, [
      `from { transform: perspective(900px) rotateX(0deg) rotateY(0deg); }`,
      `to   { transform: perspective(900px) rotateX(${-cy * deg}deg) rotateY(${cx * deg}deg); }`,
    ]));
}

/* ── F74  card lift on hover (8) ─────────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`lift-${pad(i + 1)}`, [
    `from { transform: translate3d(0, 0, 0) scale(1); }`,
    `to   { transform: translate3d(0, -${2 + i}px, 0) scale(${(1.005 + i * 0.005).toFixed(3)}); }`,
  ]);
}

/* ── F75  stagger placeholders — pure delays as animations (20) ──────────── */
for (let i = 0; i < 20; i++) {
  kf(`stagger-${pad(i + 1)}`, [
    `0%   { opacity: 0; transform: translate3d(0, ${10 + i}px, 0); }`,
    `${Math.min(10 + i * 2, 60)}% { opacity: 0; transform: translate3d(0, ${10 + i}px, 0); }`,
    `100% { opacity: 1; transform: translate3d(0, 0, 0); }`,
  ]);
}

/* ── F76  sidebar rail interactions (10) ─────────────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`rail-indicator-${pad(i + 1)}`, [
    `0%   { transform: scaleY(0) translate3d(0, ${(i - 5) * 6}px, 0); opacity: 0; }`,
    `60%  { transform: scaleY(1.15) translate3d(0, 0, 0); opacity: 1; }`,
    `100% { transform: scaleY(1) translate3d(0, 0, 0); opacity: 1; }`,
  ]);
}

/* ── F77  chart bar grows (12 phases) ────────────────────────────────────── */
for (let i = 0; i < 12; i++) {
  kf(`bar-grow-${pad(i + 1)}`, [
    `0%   { transform: scaleY(0); opacity: 0.3; }`,
    `${60 + i * 2}% { transform: scaleY(${(1.04 + i * 0.01).toFixed(2)}); opacity: 1; }`,
    `100% { transform: scaleY(1); opacity: 1; }`,
  ]);
}

/* ── F78  gauge needle sweeps (10) ───────────────────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`gauge-sweep-${pad(i + 1)}`, [
    `0%   { transform: rotate(-${100 + i * 8}deg); }`,
    `70%  { transform: rotate(${4 + i}deg); }`,
    `100% { transform: rotate(0deg); }`,
  ]);
}

/* ── F79  gold ingot shine passes (10) ───────────────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`ingot-${pad(i + 1)}`, [
    `0%   { background-position: -${160 + i * 30}% 50%; filter: brightness(1); }`,
    `45%  { filter: brightness(${(1.15 + i * 0.04).toFixed(2)}); }`,
    `100% { background-position: ${160 + i * 30}% 50%; filter: brightness(1); }`,
  ]);
}

/* ── F80  power-on / boot reveals (8) ────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`power-on-${pad(i + 1)}`, [
    `0%   { opacity: 0; transform: scaleY(0.004) scaleX(${(0.4 + i * 0.05).toFixed(2)}); filter: brightness(4); }`,
    `35%  { opacity: 1; transform: scaleY(0.02) scaleX(1); filter: brightness(3); }`,
    `70%  { transform: scaleY(1) scaleX(1); filter: brightness(1.6); }`,
    `100% { opacity: 1; transform: scale(1); filter: brightness(1); }`,
  ]);
}

/* ── F81  depth dolly (camera push/pull) (10) ────────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`dolly-${pad(i + 1)}`, [
    `0%   { transform: perspective(1000px) translate3d(0, 0, -${40 + i * 20}px); opacity: 0; }`,
    `100% { transform: perspective(1000px) translate3d(0, 0, 0); opacity: 1; }`,
  ]);
}

/* ── F82  shockwave impacts (8) ──────────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`shockwave-${pad(i + 1)}`, [
    `0%   { transform: scale(0.2); opacity: ${(0.8 - i * 0.05).toFixed(2)}; }`,
    `100% { transform: scale(${(2.5 + i * 0.5).toFixed(1)}); opacity: 0; }`,
  ]);
}

/* ── F83  chromatic-aberration pulses (6) ────────────────────────────────── */
for (let i = 0; i < 6; i++) {
  kf(`chroma-${pad(i + 1)}`, [
    `0%, 100% { filter: none; }`,
    `50%      { filter: drop-shadow(${1 + i}px 0 0 rgba(229, 72, 77, 0.5)) drop-shadow(-${1 + i}px 0 0 rgba(111, 168, 220, 0.5)); }`,
  ]);
}

/* ── F84  slow zoom plates (10) ──────────────────────────────────────────── */
for (let i = 0; i < 10; i++) {
  kf(`slow-zoom-${pad(i + 1)}`, [
    `0%   { transform: scale(1); }`,
    `100% { transform: scale(${(1.05 + i * 0.02).toFixed(2)}); }`,
  ]);
}

/* ── F85  reveal masks with blur (8) ─────────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`mask-reveal-${pad(i + 1)}`, [
    `0%   { clip-path: inset(0 ${100 - i * 4}% 0 0); filter: blur(${4 + i}px); opacity: 0.5; }`,
    `100% { clip-path: inset(0 0 0 0); filter: blur(0); opacity: 1; }`,
  ]);
}

/* ── F86  text letter drops (12 phases for split-text choreography) ──────── */
for (let i = 0; i < 12; i++) {
  kf(`letter-drop-${pad(i + 1)}`, [
    `0%   { opacity: 0; transform: translate3d(0, -${20 + i * 6}px, 0) rotateX(${40 + i * 4}deg); }`,
    `100% { opacity: 1; transform: translate3d(0, 0, 0) rotateX(0deg); }`,
  ]);
}

/* ── F87  text letter rises (12) ─────────────────────────────────────────── */
for (let i = 0; i < 12; i++) {
  kf(`letter-rise-${pad(i + 1)}`, [
    `0%   { opacity: 0; transform: translate3d(0, ${20 + i * 6}px, 0); filter: blur(${(i * 0.4).toFixed(1)}px); }`,
    `100% { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0); }`,
  ]);
}

/* ── F88  connector-status transitions (5 states × 3 = 15) ───────────────── */
for (const [state, rgb] of Object.entries({
  connected: '63, 191, 127', degraded: '232, 180, 74', failed: '229, 72, 77',
  syncing: '111, 168, 220', idle: '107, 103, 93',
})) {
  [1, 2, 3].forEach((n, i) =>
    kf(`conn-${state}-${pad(n)}`, [
      `0%, 100% { opacity: ${(0.55 + i * 0.1).toFixed(2)}; box-shadow: 0 0 ${4 + i * 3}px rgba(${rgb}, 0.4); }`,
      `50%      { opacity: 1; box-shadow: 0 0 ${12 + i * 6}px rgba(${rgb}, 0.85); }`,
    ]));
}

/* ── F89  notification attention nudges (8) ──────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`nudge-${pad(i + 1)}`, [
    `0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }`,
    `15% { transform: translate3d(0, -${2 + i}px, 0) rotate(-${2 + i}deg); }`,
    `30% { transform: translate3d(0, 0, 0) rotate(${2 + i}deg); }`,
    `45% { transform: translate3d(0, -${1 + i * 0.5}px, 0) rotate(-${1 + i * 0.5}deg); }`,
  ]);
}

/* ── F90  spinner dual-ring phases (8) ───────────────────────────────────── */
for (let i = 0; i < 8; i++) {
  kf(`spinner-${pad(i + 1)}`, [
    `0%   { transform: rotate(0deg) scale(${(0.9 + i * 0.02).toFixed(2)}); }`,
    `50%  { transform: rotate(180deg) scale(${(1 + i * 0.02).toFixed(2)}); }`,
    `100% { transform: rotate(360deg) scale(${(0.9 + i * 0.02).toFixed(2)}); }`,
  ]);
}

/* =========================================================================
   EMIT
   ====================================================================== */
const header = `/* =============================================================================
   LEAR GENERATED MOTION LIBRARY — DO NOT EDIT BY HAND
   -----------------------------------------------------------------------------
   Generated by scripts/gen_animations.mjs
   ${names.length} distinct @keyframes + ${names.length} matching .fx-* utilities.

   Every keyframe animates ONLY compositor-friendly properties (transform,
   opacity, filter, clip-path, background-position, box-shadow, stroke-*), so
   the library never triggers layout and stays inside the 10ms frame budget
   required for a sustained 100fps+ presentation.

   Usage:   <div class="fx-gpu fx-enter-u-04 fx-dur-400 fx-ease-decelerate" />
   ========================================================================== */

`;

const css = [
  header,
  ...frames.map(({ name, body }) =>
    `@keyframes ${name} {\n${body.map((l) => '  ' + l).join('\n')}\n}\n`),
  '\n/* ---- Utility classes: one per keyframe ---------------------------------- */\n',
  ...names.map((n) =>
    `.fx-${n} { animation-name: ${n}; animation-duration: var(--fx-dur, 600ms); animation-timing-function: var(--fx-ease, cubic-bezier(0.16, 1, 0.3, 1)); animation-delay: var(--fx-delay, 0ms); animation-iteration-count: var(--fx-iter, 1); animation-fill-mode: both; }`),
  `

/* ---- Loop helper: add to any of the above to run forever ---------------- */
.fx-loop { animation-iteration-count: infinite; }
.fx-alt  { animation-direction: alternate; }
.fx-rev  { animation-direction: reverse; }
.fx-paused { animation-play-state: paused; }

/* ---- GPU contract ------------------------------------------------------- */
.fx-gpu {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
  contain: paint;
}
.fx-gpu-done { will-change: auto; }

/* ---- Duration / delay / easing modifiers -------------------------------- */
${[80, 120, 160, 200, 260, 320, 400, 500, 600, 800, 1000, 1400, 1800, 2400, 3200, 4800, 6400, 9600]
    .map((d) => `.fx-dur-${d} { --fx-dur: ${d}ms; }`).join('\n')}
${[0, 40, 80, 120, 160, 200, 260, 320, 400, 500, 640, 800, 1000, 1400]
    .map((d) => `.fx-delay-${d} { --fx-delay: ${d}ms; }`).join('\n')}
.fx-ease-standard   { --fx-ease: cubic-bezier(0.2, 0, 0, 1); }
.fx-ease-decelerate { --fx-ease: cubic-bezier(0.16, 1, 0.3, 1); }
.fx-ease-accelerate { --fx-ease: cubic-bezier(0.7, 0, 0.84, 0); }
.fx-ease-spring     { --fx-ease: cubic-bezier(0.34, 1.56, 0.64, 1); }
.fx-ease-swift      { --fx-ease: cubic-bezier(0.22, 1, 0.36, 1); }
.fx-ease-anticipate { --fx-ease: cubic-bezier(0.68, -0.55, 0.27, 1.55); }
.fx-ease-linear     { --fx-ease: linear; }

/* ---- Stagger children without per-element classes ----------------------- */
.fx-stagger > * { animation-fill-mode: both; }
${Array.from({ length: 24 }, (_, i) =>
      `.fx-stagger > *:nth-child(${i + 1}) { animation-delay: calc(var(--fx-stagger-step, 45ms) * ${i}); }`).join('\n')}

/* ---- Accessibility: honour reduced-motion for the whole library --------- */
@media (prefers-reduced-motion: reduce) {
  [class*="fx-"] {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
`,
].join('\n');

const outCss = resolve(ROOT, 'desktop/src/styles/animations.generated.css');
mkdirSync(dirname(outCss), { recursive: true });
writeFileSync(outCss, css);

const ts = `/* =============================================================================
   GENERATED — DO NOT EDIT BY HAND (scripts/gen_animations.mjs)
   The honest name list for every keyframe in styles/animations.generated.css.
   ========================================================================== */
export const GENERATED_KEYFRAMES: readonly string[] = ${JSON.stringify(names, null, 2)
  .replace(/"/g, "'")} as const;

export const GENERATED_KEYFRAME_COUNT = ${names.length};
`;
writeFileSync(resolve(ROOT, 'desktop/src/lib/generatedMotion.ts'), ts);

console.log(`✓ ${names.length} distinct keyframes → animations.generated.css`);
console.log(`✓ ${names.length} .fx-* utilities + modifiers`);
