# LEAR SUPERPROMPT V3 — THE GOLD ERA

> A self-directed execution brief for any agent continuing this codebase.
> Read `PRASH_V2.md` first for product truth; read this for **visual, motion,
> audio and performance law**. Where the two disagree about aesthetics, this
> file wins. Where they disagree about product behaviour, `PRASH_V2.md` wins.

---

## 0. The one-paragraph brief

Lear is a local-first AI DevOps agent that watches infrastructure and *acts*.
The interface must feel like the command deck of something far more expensive
than it is: **molten gold on obsidian black**, cinematic, dense with motion and
sound, and — non-negotiably — **smooth**. Premium is not decoration bolted onto
a slow app. Premium is the *absence of jank*. If a beautiful effect costs a
frame, the effect loses.

---

## 1. Visual law

### 1.1 Colour
- **Gold is the brand.** Anchor `#E8B44A`. Full ramp `--color-gold-50…950`.
- **Black is the canvas.** `--color-background: #05050a`. True obsidian, faintly
  warm. Never a blue-grey dark theme.
- **Pink is a whisper.** `#FF3A89` survives only as `--color-whisper`. It may
  occupy **<2% of visible surface** and must never be a primary action colour.
  A test enforces this; do not defeat it.
- **Neutrals are warm.** Cool grey next to gold reads cheap. The neutral ramp is
  deliberately warm-tinted charcoal.
- **Never hard-code a colour.** Every value comes from a token. A magic hex in a
  component is a bug, not a style choice.

### 1.2 Material
Gold must read as **metal**, not as yellow:
- Always pair a gradient (`--gradient-gold`) with an inset bevel highlight
  (`--shadow-bevel-gold`) — light enters from the top edge.
- A moving sheen sells metal better than any static gradient. Use the
  `sheen-sweep-*` / `ingot-*` families.
- Glow (`--shadow-glow-gold`) is atmosphere, not emphasis. Overuse turns luxury
  into neon.

### 1.3 Typography
Outfit for display, Inter for UI, JetBrains Mono for data and telemetry.
Monospace with wide tracking (`--tracking-widest`) is the "instrument readout"
voice — use it for HUD labels, never for prose.

### 1.4 Depth
Every cinematic scene is **at least three planes** moving at different rates:
far plate, near plate, content. One plane is a still image; three planes is a
camera.

---

## 2. Motion law

### 2.1 The hard rule
**Animate only `transform`, `opacity`, `filter`, `clip-path`,
`background-position`, `box-shadow`, `stroke-*`.**

Never `width`, `height`, `top`, `left`, `right`, `bottom`, `margin`, `padding`,
or `border-width`. These trigger layout, layout triggers paint, and paint at
60Hz is how you lose the frame budget. A test in
`desktop/src/__tests__/GoldSystem.test.ts` scans the generated stylesheet and
fails the build on violation. It has already caught a real offender.

### 2.2 The budget
Target **100fps → 10ms per frame**. Of that, JavaScript gets **≤4ms**. If you
cannot do it in 4ms, do less of it — do not do it slower.

### 2.3 Architecture rules
1. **One rAF loop per surface.** Not one per component. A surface with parallax,
   telemetry and particles has *one* callback that does all three.
2. **One style write per frame.** Write CSS custom properties on a single root
   node; let children be pure consumers. Writing to N elements is N style
   recalcs.
3. **Adaptive quality, never adaptive framerate.** Measure rolling frame time.
   When it exceeds 11ms, shed work (particles, blur radius, layer count). Climb
   back when headroom returns. The user must never see a slow frame; they may
   see slightly fewer sparks.
4. **Cap DPR at 2.** Beyond that you are burning fill-rate no one can see.
5. **`contain: paint` every animated layer.** A repaint must never invalidate a
   sibling.
6. **Promote, then release.** `will-change` is a loan, not a gift. `.fx-gpu`
   takes it; `.fx-gpu-done` gives it back.
7. **Passive listeners** for `pointermove` / `scroll`, always.
8. **Never animate during layout-sensitive work.** Read all geometry, then write
   all styles. Never interleave.

### 2.4 Choreography
- Stagger siblings at **40–60ms**. Faster feels glitchy; slower feels sluggish.
- Entrances **decelerate** (`--ease-decelerate`); exits **accelerate**.
- Springs (`--ease-spring`) for anything the user directly manipulates; eases
  for anything the system does on its own.
- A cinematic beat is **1.7–2.2s**. Shorter reads as a transition, not a moment.

### 2.5 Accessibility
`prefers-reduced-motion` collapses every duration to 0.01ms globally **and**
per-library. The boot wipe is removed entirely, not merely shortened — a
full-screen flash is a hazard, not a delight.

---

## 3. Audio law

### 3.1 Procedural, always
Every sound is synthesised at runtime from oscillators and shaped noise. **Zero
audio files.** 312 effects currently cost 0 bytes of download. Do not introduce
an asset pack; extend `SFX` with a new recipe instead.

### 3.2 Loudness
`MAX_VOLUME = 1.6` — deliberately **above unity** so "max" is genuinely loud.
This is only safe because a `DynamicsCompressor` (−20dB threshold, 12:1 ratio,
30dB knee, 3ms attack) sits in front of the destination. **If you remove the
compressor you must lower the ceiling.** Default volume is `0.9`; this is a
showpiece, not background furniture.

### 3.3 Coverage
**Everything audible.** Every click, hover, open, close, toggle, success,
failure, arrival and departure has a voice. Silence is a bug. Current coverage:
37 families — `ui`, `nav`, `toast`, `modal`, `gold`, `hud`, `seq`, `robot`,
`data`, `deploy`, `incident`, `amb`, `ctrl`, `chat`, `widget`, `wizard`, …

### 3.4 Restraint mechanisms
Loud and dense is only pleasant if it never becomes noise:
- **Per-name throttle** (`minGapMs`, default 45ms) — rapid events can't machine-gun.
- **Global voice cap** (24) — protects the mixer *and* the frame budget.
- **Deterministic variation** — `sfxFor(family, key)` gives the same element the
  same voice every time, so repetition feels intentional rather than random.
- **Hover is quieter than click** by roughly 4×, and throttled harder.

### 3.5 Layering
A cinematic moment is **never one sound**. Use `sfxCue([...])` to stack a riser,
a whoosh, an impact and a reveal at millisecond offsets. See the `CUES` macros.

---

## 4. The cinematic surfaces

Two exist. Both follow the same rig.

**`CinematicLanding`** — scroll-scrubbed entry gate. ~3,700px of scrub tells
observe → diagnose → act, then the capability carousel flies in.

**`DirectionSequence`** — the showpiece overlay. 8 layers:

```
0  camera plate (video if present, else Ken-Burns image) + brightness grade
1  depth haze + gold god-rays
2  perspective floor grid travelling toward the viewer
3  canvas particle field (DPR-capped, frame-budgeted, adaptive)
4  light-sweep + dual scan bars + CRT line texture
5  HUD: corner brackets, 3-ring scanner, live telemetry readouts
6  content: glitching gold split-glyph title, vector cards, CTA
7  film grain + vignette + boot wipe
```

### 4.1 The video contract
Ship a **generated plate** that already looks alive under a Ken-Burns camera,
and **probe for a real video** with a `HEAD` request at mount. Upgrade only on
`res.ok && content-type startsWith('video')`. This means:
- the repo stays small and the app never ships a broken `<video>`;
- an operator upgrades the scene by *copying one file in*, with no code change.

Drop-in path: `desktop/public/media/robotics-hero.mp4` (or `.webm`).

### 4.2 Brightness
The plate is the **light source for the whole scene**. Grade it bright
(`brightness(1.28)`) and let the vignette and grain pull it back to
sophistication. Bright + graded = expensive. Bright + ungraded = tacky.

---

## 5. Component law

Nine primitives in `desktop/src/components/ui/` are the foundation:
`Button`, `Card`, `Badge`, `Input`, `Modal`, `Dropdown`, `Tooltip`, `Skeleton`,
`EmptyState`.

**Every new component composes these.** If you find yourself writing a bare
`<button className="...">`, you are creating a divergence. Extend a primitive
with a new variant instead.

No component should exceed ~400 lines. `Dashboard.tsx` was 50KB of bloat; it is
now a composition root over 7 sub-components. Apply the same treatment to
anything that grows past the line.

---

## 6. Honesty law

This matters more than any of the above.

- **Never publish a number you cannot reproduce.** Counts come from runtime
  registries (`SFX_COUNT`, `ANIMATION_COUNT`), never from a marketing estimate.
- **Never conflate distinct things with combinations.** 2,183 distinct
  animations and 14,712 tunable instantiations are *both* reported, separately
  and labelled, because merging them would inflate the headline dishonestly.
- **Never hide a pre-existing failure.** The 6 failing backend tests are
  documented as pre-existing, with the verification method stated, rather than
  quietly skipped.
- **Never claim a fix you did not verify.** Run the build. Run the tests. Curl
  the endpoint.

---

## 7. Definition of done

A change is complete only when all of these hold:

```bash
npx tsc --noEmit                      # zero errors
npm --prefix desktop test             # all green
npm --prefix desktop run build        # green
pytest -q                             # no NEW failures vs. base commit
node scripts/gen_animations.mjs       # regenerates cleanly
```

Plus, by inspection:
- [ ] No hard-coded colours — tokens only.
- [ ] No layout-triggering properties in any keyframe.
- [ ] Every new interactive element has a sound and a visual response.
- [ ] `prefers-reduced-motion` respected.
- [ ] Keyboard reachable, with a visible focus ring.
- [ ] Every published number traced to a runtime registry.
