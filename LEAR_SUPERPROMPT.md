# LEAR — "WORLD'S MOST IMMERSIVE AI-DEVOPS UI" SUPER PROMPT

> **This file is a PROMPT, not a build.** It is the single, self-contained instruction set an
> autonomous coding agent must follow to transform the **Lear** desktop app into the most
> immersive, premium, AI-centered, cinematic DevOps interface ever shipped — **without breaking
> a single working line of the backend, data layer, or API contract.**
>
> Paste this whole file to the agent as its brief. It already contains the real repository map,
> the real stack, the real run commands, the real persistence model, and the exact acceptance
> criteria. Nothing here is hypothetical — it was written against the actual cloned source.

---

## 0. IDENTITY, MISSION & THE ONE RULE

You are a **senior product engineer + motion/audio designer + performance engineer** working on
**Lear — the AI DevOps agent** (a local-first app that watches infrastructure and *acts*, not just
diagnoses). Your job: **re-skin and re-choreograph the entire frontend into a $1,000,000-looking,
100 FPS, cinematic, AI-premium experience** with live video, 200+ sci-fi sounds, and 900+ niche
animations — while every existing feature keeps working exactly as before.

### THE ONE RULE (non-negotiable)
**Do not break Lear.** The Python backend, the connector registry, the API/WebSocket contract, the
local JSON persistence, and every passing test must remain green. This is a **UI + UX + motion +
sound + presentation** overhaul. You are changing *how it looks, moves, and sounds* — never *what
data it stores or how the backend behaves*. If a change forces a backend edit, that edit must be
**additive and behavior-preserving** (e.g. serving a static build, adding an optional route), never
a rewrite of business logic.

> If any instruction below appears to conflict with THE ONE RULE, THE ONE RULE wins.

---

## 1. GROUND TRUTH — THE REAL REPOSITORY

Source repo: `github.com/aviunion1348-cloud/drufiy-prob-changes-` (a rebuild of "Lear-backend").
Final delivery repo: `github.com/aviunion1348-cloud/lear.com`.

### 1.1 Monorepo layout (verified)
```
/                         ← Python package root (lear-backend-root)
├─ package.json           ← root scripts: `npm start` runs backend + desktop concurrently
├─ pyproject.toml         ← installable: pip install -e ".[dev]"
├─ .env.example           ← credential template (copy to .env; .env is gitignored — KEEP IT SO)
├─ prash/                 ← FastAPI backend + agent brain (DO NOT change behavior)
│  ├─ server.py           ← the API: /api/config, /api/connectors, /api/dashboard/*,
│  │                        /api/projects, /api/incidents, /api/chat/*, /ws/events, …
│  ├─ connector_registry.py
│  ├─ connectors/         ← 13 providers: aws, azure, gcp, kubernetes, github, gitlab,
│  │                        datadog, grafana, pagerduty, snyk, gitleaks, terraform, vercel
│  ├─ actions/            ← remediation actions (restart_pod, rollback, open_pr, …)
│  ├─ brain/              ← diagnosis agent, correlation, kimi_client, local_memory
│  ├─ chat_manager.py     ← chat sessions persisted as JSON under .prash/chat_sessions/
│  └─ …
├─ desktop/               ← THE FRONTEND YOU ARE OVERHAULING
│  ├─ index.html
│  ├─ vite.config.ts      ← port 1420, host:true, allowedHosts:true, proxies /api + /ws → :8000
│  ├─ tailwind.config.js  ← Tailwind v4
│  ├─ src-tauri/          ← Tauri desktop shell (leave build wiring working)
│  └─ src/
│     ├─ App.tsx          ← tab router (dashboard, projects, integrations, activity,
│     │                     notifications, settings, chat) + AuroraBackground + SoundManager
│     ├─ main.tsx
│     ├─ index.css        ← 171 lines, imports styles/*
│     ├─ context/LearContext.tsx  ← global state, active tab/project, toasts, chat
│     ├─ hooks/
│     ├─ lib/
│     │  ├─ soundEngine.ts   ← "200+ procedural sci-fi UI sounds, zero audio assets" (WebAudio)
│     │  └─ motion.ts        ← springs, tweens, MOTION_PRESETS, MOTION_PRESET_COUNT
│     ├─ styles/
│     │  ├─ tokens.css       ← FULL design-token system (Tailwind v4 @theme + :root primitives)
│     │  └─ animations.css   ← 71 @keyframes today
│     └─ components/
│        ├─ Dashboard.tsx (17KB)  Sidebar.tsx (20KB)  ServiceWidget.tsx (50KB)
│        ├─ ChatWorkspace.tsx  Chatbot.tsx  Integrations.tsx  ProjectDetail.tsx
│        ├─ Projects.tsx  ProjectCreate.tsx  Settings.tsx  ActivityLog.tsx  Notifications.tsx
│        ├─ Wizard.tsx  ConnectorForm.tsx  WatcherPanel.tsx  WidgetConfigurator.tsx  …
│        ├─ ui/        ← Button, Card, Badge, Input, Modal, Dropdown, Tooltip, Skeleton,
│        │               EmptyState, index.ts   (design-system primitives — U-04 already exists)
│        ├─ dashboard/ ← HealthBar, KPIStrip, ActivityFeed, QuickActions, ServiceBoard,
│        │               IncidentCenter, CountUp   (U-03 already extracted)
│        ├─ widgets/   ← BarChart, EventTimeline, MetricCard, MetricGauge, MetricLineChart,
│        │               StatusGrid
│        └─ fx/        ← CinematicHero.tsx (26KB), AuroraBackground.tsx, SoundManager.tsx
│           └─ public/fx/  hero-glow.png, hero-grid.png, hero-mesh.png, hero-sky.png
└─ tasks/ docs/ evals/ tests/ …  ← specs, checklists, Python tests
```

### 1.2 Persistence = "the database" (KEEP INTACT)
There is **no SQL database**. Lear is **local-first**:
- **Credentials:** `.env` (gitignored — must stay gitignored and never committed).
- **Chat sessions:** JSON files under `.prash/chat_sessions/` (`sessions_index.json`, `session_*.json`).
- **Agent memory:** `.prash/memory.json` (`PRASH_MEMORY_PATH`).
- **Config/state:** served/masked through `/api/config`.

**"Keep the database intact" means:** do not change these paths, schemas, or read/write logic; do
not migrate, wipe, or reformat any `.prash/*` file; do not alter what `/api/config`,
`/api/chat/*`, `/api/projects`, `/api/dashboard/*` return. The UI must consume the **exact same**
endpoints and shapes it consumes today.

### 1.3 How it runs (verified)
```bash
# from repo root
python -m venv .venv && source .venv/bin/activate    # Python 3.10+
pip install -e ".[dev]"
cp .env.example .env                                  # fill ONE model key (DEEPSEEK or KIMI)

npm install            # root (concurrently)
cd desktop && npm install && cd ..

npm start              # runs BOTH: uvicorn prash.server:app :8000  +  vite desktop :1420
# open http://localhost:1420
```
The frontend calls **relative** `/api/*` and `/ws/*`; Vite proxies them to `127.0.0.1:8000`.
**Never hard-code `localhost`/`127.0.0.1` in browser code** — keep everything relative so the live
preview and Vercel both work.

---

## 2. WHAT "DONE" LOOKS LIKE (DELIVERABLES)

You must deliver **all** of the following, in one coherent, working tree:

1. **A fully working app** — `npm start` boots backend + frontend; every existing tab, connector,
   chat, project, widget, notification, and watcher works exactly as before, now dramatically more
   premium and animated.
2. **A downloadable ZIP** committed to a release/artifact path: `lear-premium-ui-full.zip`
   (a clean tree — no `node_modules`, no `.venv`, no `.env`, no `.prash/` user data), so a user can
   download, unzip, `npm install`, and run.
3. **A direct GitHub push** of the full extracted tree to `github.com/aviunion1348-cloud/lear.com`
   on branch `arena/01a0eb79-lear-com` (the session branch — never push elsewhere).
4. **Vercel-deployable frontend:** `desktop/` builds to static assets (`npm --prefix desktop run
   build`) and deploys to Vercel; add `desktop/vercel.json` (SPA rewrite to `/index.html`) and a
   short `DEPLOY.md` explaining that the FastAPI backend is local-first and how to point the built
   frontend at a backend (env-driven API base with a relative default).
5. **npm-compatible local run** unchanged (`npm start`).
6. **Updated docs:** `CHANGELOG.md`, and a new `UI_OVERHAUL.md` describing every visual/motion/audio
   change, the animation/sound registries, and the performance methodology.

> Honesty rule: report the **real** counts you ship (animations, sounds, fps measurements). Never
> claim "1000+" if you built 640. Claim exactly what exists and how it was measured.

---

## 3. THE DESIGN NORTH STAR — "AI, PREMIUM, CINEMATIC"

Lear is an **AI DevOps agent**. The visual language must say *intelligent, alive, expensive,
trustworthy* — not tacky. Think: Linear × Vercel × Arc × a Marvel HUD × a luxury car cluster.

### 3.1 Aesthetic pillars
- **Deep, dimensional dark UI** (base `#080b11`) — but **counter the flat black** with layered
  depth: aurora/mesh gradients, volumetric glow, glass, grain, parallax, and **brightened live
  video** underlays so it reads *sophisticated and ultra-advanced*, never a dead black void.
- **Brand:** the existing neon-pink ramp anchored on `#FF3A89`, paired with **intelligence violet**
  (`#8b5cf6`) and **signal cyan** (`#22d3ee`). Status colors already defined in `tokens.css`
  (success/warning/danger/info) — **drive all state color from tokens; never hard-code**.
- **Typography:** UI = Inter; **display = Outfit** (already in tokens). Optionally add one editorial
  display serif (loaded from Google Fonts, self-hostable) for hero numerals — but keep the two
  token families authoritative.
- **Motion is meaning:** every state change (connect, incident, deploy, metric tick, AI thinking)
  has a matching motion + sound. Motion is *fast, springy, and interruptible* — never blocking.
- **AI presence:** a persistent, tasteful "intelligence" motif — a living aurora/neural field, a
  breathing orb for the agent, streaming token shimmer, thinking pulses — so the app always feels
  like a mind is present.

### 3.2 The cinematic reference (adapt, don't copy)
Use the **Mostar cinematic-scroll technique** (sticky stage + scroll-scrubbed layered parallax +
segmented `smoothstep` choreography + counter-scaled foreground) as the engine for Lear's **hero /
landing / onboarding cinematic**, re-themed entirely to Lear's world:

- Replace Mostar's photographic layers with **Lear's own FX layers**: `hero-sky`, `hero-mesh`,
  `hero-grid`, `hero-glow` (already in `public/fx/`) plus new generated layers — a data-mesh
  horizon, drifting telemetry particles, an incident constellation, a bridge-of-light connecting
  "signal → diagnosis → action."
- Reuse the **exact math discipline** from the reference: `clamp`, `smoothstep(e0,e1,v)`,
  `lerp`, `segmentInOut(s,a,b,c,d)`, a `getScrollDistance()` clamp, per-frame `lerp` smoothing of
  scroll and pointer, CSS custom properties written with fixed `.toFixed` precision, and a single
  `requestAnimationFrame` loop guarded by an `rafPending` flag that re-requests only while values
  are still settling. `CinematicHero.tsx` already exists — **upgrade it to this rig**, don't rebuild
  from zero.
- Honor **`prefers-reduced-motion`**: snap values, zero the pointer parallax, disable transitions —
  the composition still scrubs, just without inertia.
- The cinematic is the **entry/onboarding & "About Lear" surface**; it must hand off seamlessly into
  the real, working app (the dashboard) — the redirection/sub-page flow must be wired and real.

---

## 4. TASK BREAKDOWN

The prior pass already delivered a strong foundation. Your job is to **elevate, unify, and
massively extend** it. For each task: keep behavior, raise polish, wire real data, hit the perf
budget.

### U-01 — Design system audit & token overhaul  *(foundation exists — harden & extend)*
`desktop/src/styles/tokens.css` already defines Tailwind v4 `@theme` + `:root` scales for spacing,
typography (Inter/Outfit/JetBrains Mono), a neon-pink brand ramp on `#FF3A89`, violet+cyan
secondaries, a cool neutral scale, semantic status colors, elevation/shadow, glow shadows.
- **Audit** for any remaining magic values across all components; replace with tokens.
- **Add** motion/easing tokens (durations, spring configs, standard cubic-beziers incl. the
  `cubic-bezier(0.22,1,0.36,1)` used by the cinematic), z-index scale, blur scale, and
  **video-underlay tokens** (brightness/overlay-alpha so black is always countered).
- **Add** a light-on-dark "glass" recipe and a "premium card" recipe as tokenized utilities.
- Document the final token catalog in `UI_OVERHAUL.md`.

### U-02 — Sidebar & navigation redesign  *(`Sidebar.tsx`, 20KB)*
- Smoother transitions, clearer active state (animated indicator that slides between items with a
  spring), **collapsible rail** (icon-only ↔ expanded) that remembers state.
- **Full keyboard navigation**: arrow keys move focus, Enter activates, `[` toggles collapse, a
  command-palette hotkey (`⌘K`/`Ctrl-K`) opens quick nav. Visible focus rings from tokens.
- Micro-sound on hover/select/collapse (from the sound engine, subtle).
- Live status dots per section (e.g. incident count badge) fed by the **real** context/API.

### U-03 — Dashboard redesign  *(`Dashboard.tsx` + `dashboard/` subcomponents already extracted)*
- Keep the composition of `HealthBar`, `KPIStrip`, `ActivityFeed`, `QuickActions`, `ServiceBoard`,
  `IncidentCenter`, `CountUp`; **upgrade each** with micro-animations on data updates (count-up,
  flash-on-change, shimmer-on-refresh), skeleton loaders, and staggered mount reveals.
- Wire everything to the **real** endpoints already in use: `/api/dashboard/summary`,
  `/api/dashboard/activity?limit=8`, `/api/incidents`, `/api/incident/:id/approve`.
- Add an optional **cinematic "command deck" mode** (the hero rig, dialed down) as an ambient
  backdrop behind the KPIs — brightened video/mesh underlay, never obscuring data.

### U-04 — Component library foundation  *(`ui/` primitives already exist)*
- `Button, Card, Badge, Input, Modal, Dropdown, Tooltip, Skeleton, EmptyState` exist — **unify**
  them on the tokens, add variants (primary/ghost/danger/glass), loading/disabled/focus states,
  and **built-in motion + sound hooks** (press ripple, hover lift, success/err chime) that respect
  reduced-motion and the global mute.
- Add missing primitives the overhaul needs: `Segmented`, `Switch`, `Tabs`, `Toast` (align with
  existing `NotificationToast`), `Progress`, `Sparkline`, `CommandPalette`, `Kbd`, `ScrollArea`.
- Everything else in the app must be refactored to build on these — no bespoke buttons/cards left.

### U-05 (NEW) — Motion system to 900+ animations
`motion.ts` (`MOTION_PRESETS`) + `animations.css` (71 keyframes) are the base.
- Grow to a **documented registry of 900+ distinct animations** across three tiers:
  1. **CSS keyframes** in `animations.css` (ambient loops: aurora drift, grain, scanlines, glow
     breathing, particle float, gradient shift, shimmer, etc.).
  2. **`motion.ts` presets** (enter/exit/hover/press/stagger springs & tweens) consumed via a
     `preset()` helper and `inViewOnce`.
  3. **Scroll/pointer-driven** parallax & scrub choreographies (the cinematic rig + section
     reveals).
- Every animation must be **named, categorized, and counted** by a runtime registry so
  `ANIMATION_COUNT` is real and printable. Provide a hidden `/animations` gallery route (dev-only)
  that renders each one for QA.
- **Perf gate:** all ambient/looping animations must be GPU-friendly (`transform`/`opacity`/filter
  only), `will-change` used sparingly, and auto-paused when off-screen (IntersectionObserver) and
  under reduced-motion.

### U-06 (NEW) — Sound design to 200+ effects, mapped everywhere
`soundEngine.ts` already procedurally generates 200+ sci-fi sounds via WebAudio (zero audio assets).
- **Verify/extend** to a documented **200+ registry** with a printable `SOUND_COUNT`, organized by
  family (ui, chat, ai, data, connect, deploy, incident, hero, kbd, drag, filter, alert, fx…).
- **Map a sound to every meaningful interaction**: hover, click, toggle, open/close, tab change,
  connect success/fail, incident create/approve/deny/escalate/resolve, deploy start/success/fail,
  metric tick, AI think/stream/answer/action, keyboard, drag/drop, slider, notifications.
- Global **mute + volume**, persisted; **respect an OS "reduce"/quiet preference**; never autoplay
  before a user gesture (WebAudio unlock on first interaction). Keep it **tasteful** — layered,
  short, high-tech, never annoying; provide an intensity setting (Off / Subtle / Full).

### U-07 (NEW) — Live video / cinematic backgrounds (brightened, premium)
- Add **live, looping background video** underlays on hero/onboarding and (optionally) the command
  deck — abstract, high-tech, on-brand (data flows, light fields, particle nebulae).
- Requirements: **brightened, sophisticated look** (not a dark tacky loop) via token-driven
  brightness/contrast + a gradient/scrim overlay so foreground text stays AA-contrast; muted,
  `playsinline`, `loop`, `preload="metadata"`, **poster** fallback, and **auto-pause off-screen**.
- Ship efficient formats (prefer AV1/WebM + H.264 MP4 fallback), lazy-load, and **never** let video
  cost the 100 FPS budget on the data-heavy screens (throttle/disable on low-power/`reduced-motion`).
- Videos may be generated/sourced as royalty-free or synthesized; store under `desktop/public/media/`
  and keep total repo weight reasonable — if large, document an external/CDN option in `DEPLOY.md`.

### U-08 (NEW) — Every surface gets the treatment
Apply premium visuals + motion + sound to **all** existing components, keeping their data/logic:
`Chatbot`, `ChatWorkspace`, `ChatMessage`, `Integrations`, `ConnectorForm`, `Wizard` (+ Step*),
`Projects`, `ProjectCreate`, `ProjectDetail`, `Settings`, `ActivityLog`, `Notifications`,
`NotificationToast`, `WatcherPanel`, `WidgetConfigurator`, `ServiceWidget`, and all `widgets/*`.
Special attention to the **AI chat** (streaming token shimmer, thinking orb, tool-call cards) and
**incident flow** (dramatic but clear approve/deny choreography) — this is where "AI premium" sells.

---

## 5. PERFORMANCE BUDGET — "SUPER SMOOTH, ~100 FPS, NO LAG"

Smoothness is a **hard acceptance criterion**, not a vibe. Engineer for it:

- **Target:** 90–120 FPS on a modern laptop; **never** sustained jank below 60 FPS on any screen.
  Measure with the browser Performance panel and an in-app FPS meter (dev-only overlay) and report
  real numbers in `UI_OVERHAUL.md`.
- **Animate only `transform`, `opacity`, and cheap `filter`.** No animating layout properties
  (width/height/top/left/margin) on the hot path — the cinematic uses transforms + CSS vars exactly
  like the reference rig.
- **One rAF loop** for scroll/pointer-driven work (coalesced, `rafPending`-guarded); everything else
  via CSS/compositor. Batch DOM reads/writes; avoid layout thrash.
- **Virtualize** long lists (activity log, notifications, chat history) so scroll stays cheap.
- **IntersectionObserver** to pause off-screen video/animation; **content-visibility** where safe.
- **Code-split** heavy routes (cinematic, widget configurator, charts) with lazy imports; keep the
  first dashboard paint fast.
- **Respect `prefers-reduced-motion`** and a low-power mode: degrade gracefully (snap, fewer
  particles, video paused).
- Ship a `usePerf()` hook / FPS overlay toggle so the smoothness claim is verifiable.

---

## 6. NON-NEGOTIABLE GUARDRAILS (repeat of THE ONE RULE, expanded)

- **Backend behavior frozen.** `prash/**` logic, connector auth, actions, brain, and the API/WS
  contract stay functionally identical. Additive, behavior-preserving changes only (e.g. optionally
  serving the built `desktop/dist` from FastAPI for single-process runs).
- **Persistence frozen.** No changes to `.prash/*` schemas/paths or `/api/config` masking. `.env`
  stays gitignored; **never commit secrets** — scan the diff for secret patterns before every commit.
- **Contract-first UI.** Consume the exact endpoints listed in §1.3/§U-03; if the UI needs data the
  API doesn't expose, prefer client-side derivation over changing the backend; if a new read-only
  endpoint is truly required, add it additively and document it.
- **Tests stay green.** Run and keep passing: `npm --prefix desktop run test` (Vitest) and
  `python -m pytest -q`. Add tests for new UI logic. `npm --prefix desktop run build` must succeed.
- **Accessibility:** keyboard-operable, visible focus, ARIA labels (as the current components
  already do), AA contrast even over video, and motion/sound both fully disable-able.
- **No dead ends:** every button, tab, redirect, and sub-page must actually work end-to-end.
- **Cross-target:** must run via `npm start` locally, load in the live preview (bind `0.0.0.0`,
  `allowedHosts` already true), build for Tauri, and build static for Vercel.

---

## 7. SUGGESTED EXECUTION ORDER (so nothing breaks)

1. **Baseline & safety net.** Install deps; run `npm start`, `pytest -q`, `npm --prefix desktop run
   test`, `npm --prefix desktop run build`. Record the green baseline. Snapshot every `/api/*`
   response shape used by the UI.
2. **U-01 tokens hardening** (add motion/z/blur/video tokens) — nothing visual breaks yet.
3. **U-04 primitives unification** — so every later change builds on solid primitives.
4. **U-02 sidebar**, then **U-03 dashboard** — the two most-seen surfaces.
5. **U-05 motion registry** + **U-06 sound mapping** — wire the systems, then apply per surface.
6. **U-07 live video** underlays with the brightness/scrim tokens + off-screen pause.
7. **Cinematic hero/onboarding** upgrade (the Mostar-technique rig) + real redirection into the app.
8. **U-08 sweep** every remaining surface.
9. **Performance pass** — profile, virtualize, code-split, hit the FPS budget; add the FPS overlay.
10. **QA against §8**, update docs, build the ZIP, commit, push, (optionally) open a PR.

Commit in **small, focused, reversible** commits with clear messages. After each milestone, re-run
the full test + build gate so a regression is caught immediately.

---

## 8. ACCEPTANCE CHECKLIST (the agent must self-verify ALL)

**Works / not broken**
- [ ] `npm start` boots backend (:8000) + frontend (:1420); app loads in browser & live preview.
- [ ] Every tab works: Dashboard, Projects, Integrations, Activity, Notifications, Settings, Chat.
- [ ] Connectors connect/verify/disconnect; chat sessions create/load/stream; incidents
      approve/deny; projects create/detail; widgets render — all against the real API.
- [ ] `.prash/*` data and `.env` untouched; `pytest -q` and Vitest pass; `desktop` build succeeds.

**Premium / immersive**
- [ ] No flat dead-black screens — depth via aurora/mesh/glass/grain/**brightened video**.
- [ ] Cinematic hero uses the sticky-stage scroll-scrub rig with `smoothstep`/`lerp`/`segmentInOut`,
      pointer parallax, reduced-motion fallback, and hands off into the working dashboard.
- [ ] Sidebar: animated active indicator, collapsible rail, full keyboard nav, command palette.
- [ ] Dashboard sub-components animate on data update; skeletons on load; staggered reveals.
- [ ] UI primitives unified on tokens with motion + sound; no bespoke one-off buttons/cards remain.

**Systems (real, counted)**
- [ ] `ANIMATION_COUNT ≥ 900`, printable at runtime; dev `/animations` gallery renders them.
- [ ] `SOUND_COUNT ≥ 200`, printable; a sound mapped to every meaningful interaction; global
      mute/volume/intensity persisted; no autoplay before user gesture.
- [ ] Live video underlays are brightened, scrimmed for AA contrast, off-screen-paused, format-fallbacked.

**Performance**
- [ ] Sustained ≥ 60 FPS everywhere; ~90–120 FPS on hero/dashboard on a modern laptop (measured).
- [ ] Only transform/opacity/filter on hot paths; long lists virtualized; heavy routes code-split.
- [ ] `prefers-reduced-motion` + low-power mode degrade gracefully.

**Delivery**
- [ ] Full tree pushed to `github.com/aviunion1348-cloud/lear.com` @ `arena/01a0eb79-lear-com`.
- [ ] `lear-premium-ui-full.zip` (clean, no node_modules/.venv/.env/.prash) attached/committed.
- [ ] `desktop/vercel.json` + `DEPLOY.md`; static build deploys to Vercel; local `npm start` works.
- [ ] `CHANGELOG.md` + `UI_OVERHAUL.md` updated with real counts and the perf methodology.

---

## 9. OUTPUT CONTRACT FOR THE AGENT

When finished, the agent must produce a short report containing:
1. **What changed**, per surface (bulleted).
2. **Real numbers:** animation count, sound count, measured FPS per key screen, bundle size.
3. **Test/build results:** pasted pass summaries for Vitest, pytest, and `vite build`.
4. **How to run** locally and **how to deploy** to Vercel (link to `DEPLOY.md`).
5. **The ZIP location** and the **pushed commit SHA / branch**.
6. **Anything intentionally NOT done** and why (honesty over hype).

> Final reminder: **elevate the experience to the world's most immersive AI-DevOps UI — but if it
> doesn't still run, connect, chat, and persist exactly like today, it is a failure.** Beauty first,
> but never at the cost of THE ONE RULE.
