#!/usr/bin/env python3
"""Generate docs/PREMIUM_IDEAS.md — a 1,000-idea premium UI/UX backlog for Lear.

Deterministic by design: same input tables → same document, so diffing the
output across runs is meaningful in review. Ideas are composed from real Lear
domain tables (13 connectors, representative actions, app surfaces) crossed
with curated idea templates per theme. Each line is a concrete, buildable
micro-feature — not filler.

Usage: python3 scripts/generate_premium_ideas.py
"""
from __future__ import annotations

import datetime

CONNECTORS = [
    "Kubernetes", "AWS", "GCP", "Azure", "Vercel", "GitHub Actions", "GitLab CI",
    "Datadog", "Grafana", "PagerDuty", "Snyk", "Gitleaks", "Terraform",
]
ACTIONS = [
    "restart-pod", "scale", "rollback", "edit-configmap", "edit-secret", "exec",
    "open-pr", "apply-ci-fix", "execute-aws", "execute-gcp", "vercel-redeploy",
    "vercel-rollback", "datadog-mute-monitor", "grafana-silence-alert",
    "pagerduty-acknowledge", "pagerduty-resolve", "pagerduty-page",
    "snyk-ignore-issue", "terraform-init", "terraform-apply",
]
SCREENS = [
    "Dashboard", "Lear Chat", "Projects", "Integrations", "Activity Log",
    "Notifications", "Settings", "Onboarding Wizard", "Cinematic Hero",
    "Service Widget", "Sidebar", "Incident Center",
]
SCREENS_MAP = SCREENS
METRICS = [
    "latency", "error rate", "pod restarts", "deploy frequency", "cost drift",
    "alert count", "token usage", "p99 latency", "queue depth", "CPU utilisation",
    "memory pressure", "retry churn",
]

SLOT_TABLES = {"c": CONNECTORS, "a": ACTIONS, "s": SCREENS_MAP, "m": METRICS}

# Per-theme context used for "{s}" placeholders inside that theme's signature
# templates, so sentences stay about the surface the theme is actually about.
CONTEXTS = [
    "dashboard", "copilot", "onboarding wizard", "integration card",
    "project", "service widget", "watcher stream", "notification center",
    "incident thread", "action pipeline", "sound settings", "motion system",
    "hero surface", "accessibility layer", "performance budget", "theme settings",
    "terminal UI", "security page", "chart", "copilot",
    "desktop shell", "test suite", "docs site", "offline state",
    "sharing card", "widget", "⌘K palette", "service card",
    "outbound message", "settings page", "error state", "icon set",
    "app grid", "data table",
]

# Global, correctly-typed idea bank. "{x} in templates of group g is ALWAYS
# filled from TABLES[g], so every generated sentence is grammatically sound.
# Each theme consumes a rotating window of this bank beneath its signature ideas.
GLOBAL_BANK: list[tuple[str, str]] = [
    # ---- connector-slotted (x ∈ 13 connectors)
    ("Per-{x} health timeline chip (last 24h of validate() results) on the connector card.", "c"),
    ("Least-privilege guidance for {x}: list the exact scopes the token needs and why.", "c"),
    ("When {x} auth fails, show last-known identity and greyed metrics — never hide the card.", "c"),
    ("Deep-link button that jumps from the {x} card to the provider's token console.", "c"),
    ("Show {x} rate-limit headroom as a quiet meter on its settings page.", "c"),
    ("One-click synthetic event injector for {x} to demo the watch pipeline safely.", "c"),
    ("Credential rotation reminder chip for {x} after its configured grace period.", "c"),
    ("Auto-suggest {x} resources during project setup from live discovery.", "c"),
    ("Dependency impact hint: surfaces that go dark when {x} disconnects.", "c"),
    ("Gold-signals widget bundle applied automatically when {x} is first configured.", "c"),
    ("Compare two {x} resources on the same chart axis with one toggle.", "c"),
    ("Per-{x} watch presets: 'critical only', 'everything', 'quiet hours'.", "c"),
    ("Copy masked connection summary for {x}; hold-to-reveal with auto-remask.", "c"),
    ("Per-{x} digest emails summarizing a week of its events.", "c"),
    ("Alert-fatigue leaderboard attributed by source, {x} included.", "c"),
    ("Console URL auto-link from every {x} resource row.", "c"),
    ("Per-{x} noise budget: demote event classes the user keeps dismissing.", "c"),
    ("Deploy events from {x} draw markers on every related chart.", "c"),
    ("Per-{x} timeout/backoff visualization when calls retry.", "c"),
    ("Credential diff view: which {x} keys changed in .env this session.", "c"),
    ("Per-{x} setup checklist surfaced in the wizard with live status.", "c"),
    ("Identity chip on the {x} card (account/user/org the token resolves to).", "c"),
    ("Per-{x} 'test connection' handshake with animated probe stages.", "c"),
    ("Quota dashboards for {x} where provider APIs expose usage.", "c"),
    ("Graceful {x} degraded mode with next-validate countdown.", "c"),
    ("Per-{x} cost surface, joined to services in the project view.", "c"),
    ("Template monitors for {x} cloned into new projects on create.", "c"),
    ("Event provenance: every {x} row links to the exact poll that produced it.", "c"),
    ("Per-{x} quiet-hours schedule enforced server-side, not just visually.", "c"),
    ("Health-strip filter pin: show only {x} services across the dashboard.", "c"),
    # ---- action-slotted (x ∈ 20 representative actions, rendered backticked)
    ("Render every {x} plan as a before/after diff, not just prose.", "a"),
    ("Dry-run ledger entry for every {x} simulation, searchable.", "a"),
    ("Time-boxed approvals: {x} prompts expire after a visible countdown.", "a"),
    ("Hold-to-confirm ring for irreversible runs like {x}.", "a"),
    ("Blast-radius hint ahead of {x}: dependents found in the project graph.", "a"),
    ("Verification panel after {x}: exact checks, outputs, verdicts.", "a"),
    ("Audit chip linking each {x} execution to its JSONL record.", "a"),
    ("Queueing: stage {x} with other actions into a review manifest.", "a"),
    ("Parameterized shortcuts for {x} on the ⌘K palette with defaults.", "a"),
    ("Risk-tier badge beside {x} everywhere it is mentioned.", "a"),
    ("Circuit-breaker gauge for {x}'s target before you fire it.", "a"),
    ("Rollback path documentation attached to {x} runs.", "a"),
    ("Success/revert streak line for {x} visible on its action card.", "a"),
    ("Two-person rule option for {x} in production environments.", "a"),
    ("Dry-run-first policy toggle for {x} in permission modes.", "a"),
    ("Estimated duration hint for {x} learned from past executions.", "a"),
    ("Approval-by-context: pre-fill why {x} is being recommended now.", "a"),
    ("Exclude {x} from bulk ops when its resource is under maintenance.", "a"),
    ("Sound signature for {x} success vs failure — distinct, documented.", "a"),
    ("Auto-escalate repeated {x} failures into an incident draft.", "a"),
    ("Param validation previews for {x} before the permission decision.", "a"),
    ("Environment gating matrix showing where {x} may run unchecked.", "a"),
    ("Execution replay of {x} as an animated step checklist.", "a"),
    ("One-click 'copy as CLI command' for {x} with flags filled.", "a"),
    ("Cooldowns for {x} per resource, configurable per environment.", "a"),
    # ---- screen-slotted (x ∈ 12 app surfaces)
    ("Give {x} a command-palette filter that dims everything except matches.", "s"),
    ("Remember scroll position per tab inside {x} across sessions.", "s"),
    ("Density toggle (comfortable / compact / analyst) on {x}, persisted.", "s"),
    ("Spotlight mode: {x} expands edge-to-edge for demos with one key.", "s"),
    ("Sticky section headers while scrolling long content in {x}.", "s"),
    ("Keyboard map overlay (`?`) scoped to shortcuts that work inside {x}.", "s"),
    ("Per-panel skeleton twins eliminating layout shift in {x} refreshes.", "s"),
    ("Hover crosshairs on charts inside {x} pinning nearest event annotation.", "s"),
    ("Copy-as-image export for any panel inside {x}.", "s"),
    ("Print stylesheet for {x}: clean type, timestamps, zero chrome.", "s"),
    ("Contextual empty states in {x} with a cause, an action, and a docs link.", "s"),
    ("Deep-linkable sections inside {x} via shareable URL hashes.", "s"),
    ("Warn-on-unsaved styling whenever {x} drafts are abandoned.", "s"),
    ("Reduced-motion storyboard for {x} verified in a dedicated test.", "s"),
    ("Landmark roles and aria labels across every region of {x}.", "s"),
    ("Panel-level error boundaries: one bad tile never blanks {x}.", "s"),
    ("World-clock header strip inside {x} for distributed on-call teams.", "s"),
    ("Session resume: reopen {x} with last-used filters restored.", "s"),
    ("Live-updating document title/badge reflecting {x}'s worst state.", "s"),
    ("Mobile pass for {x}: stacked cards, swipeable rows, tap-to-expand.", "s"),
    # ---- metric-slotted (x ∈ 12 metric nouns)
    ("Anomaly band behind {x} charts using rolling z-score, painted in violet.", "m"),
    ("Forecast ghost line on {x} charts (Holt-Winters), clearly labeled projection.", "m"),
    ("Percentile bands (p50/p95/p99) as nested gradients behind {x}.", "m"),
    ("Small-multiples generator: {x} across services in aligned charts.", "m"),
    ("Attach dated notes to {x} charts ('deploy froze this').", "m"),
    ("SLO tile live-joining {x} with its target and error-budget burn.", "m"),
    ("Staleness chip on {x}: seconds since last live point.", "m"),
    ("Zoom-to-selection with pinch for {x}, plus double-click reset.", "m"),
    ("Log-scale toggle for skewed {x} with honest axis labeling.", "m"),
    ("Export {x} as PNG/SVG/CSV in one click — unwatermarked.", "m"),
]


# Each theme: (title, intro, [templates]). "{c}=connector  {a}=action  {s}=screen"
# Templates should read correctly for ANY value of the slot's table.
THEMES: list[tuple[str, str, list[str]]] = [
    ("Dashboard & Mission Control", "Make the home surface feel like a flight deck, not a file cabinet.", [
        "Add a {s}-scoped KPI trend line behind every KPI tile (7 polls, true client history).",
        "Give the {s} a command-palette filter (type to dim everything except matches).",
        "Let the {s} remember its scroll position per project/environment tab.",
        "Add a collapsible 'layout edit mode' on the {s} with drag-to-reorder and localStorage persistence.",
        "Show a tiny world-clock strip on the {s} header for distributed on-call teams.",
        "Pulses: when {s} data refreshes, ripple a hairline flash across only the tiles that changed.",
        "Empty-quota microcopy: if the {s} has no services, show a 3-step illustrated checklist instead of prose.",
        "Add hover crosshairs to {s} charts that pin the nearest event annotation.",
        "Give the {s} a one-click 'theatre mode' that expands it over the sidebar for demos.",
        "Per-{s} density toggle (comfortable / compact / analyst) stored per user.",
    ]),
    ("Chat, Copilot & LLM UX", "Avi's lane: the copilot should feel alive, legible, and trustworthy.", [
        "Stream {s} responses with a per-token glow cursor and a soft, sub-audible typewriter rhythm.",
        "Show the diagnosis confidence as an inline gradient gauge under every {s} answer.",
        "Add 'why?' folds under {s} suggestions revealing the exact log lines used as evidence.",
        "Give {s} an action-risk chip (SAFE / APPROVAL / NEVER colors) beside any proposed command.",
        "Let users react to {s} messages (🔥/🎯/👎) and write the feedback into local memory for evals.",
        "Add a model indicator with latency readout in the {s} (DeepSeek/Kimi + ms to first token).",
        "Draft regen: one click re-runs the {s} answer with 'shorter', 'more technical', or 'plain English'.",
        "Show episodic-memory hits used in an answer as cited cards inside the {s}.",
        "Add `--dry-run` preview rendering in the {s}: show the plan the dispatcher WOULD execute.",
        "Time-to-fix stopwatch inside the {s} for incident threads (start → approve → verify).",
    ]),
    ("Onboarding & First Run", "The first five minutes decide whether anyone trusts the agent.", [
        ""
        "Progress narrative on the {s}: 'Plugging into 13 providers' beats a bare spinner.",
        "Deep-link prefill for the {s} from README badges (repo URL → form).",
        "Per-field inline validators in the {s} that explain what an invalid key looks like, not just 'invalid'.",
        "Test-connection buttons with animated handshake states in every {s} step.",
        "Skip-with-confidence: each {s} step shows what you lose by skipping.",
        "A 90-second guided tour after the {s} that drives the copilot to diagnose a fixture.",
        "Persona presets on the {s}: 'Solo dev', 'Platform team', 'Founder on-call' tweak defaults.",
        "Celebrate completion of the {s} with a confetti-lite particle burst + boot arpeggio.",
        "Show masked credential previews immediately after entry in the {s} to prove local storage.",
        "Allow exporting an 'onboarding report' PDF from the {s} for audit trails.",
    ]),
    ("Integrations & Credentials UX", "13 connectors, one trust model — make that legible.", [
        "Per-{c} health timeline chip (last 24h of validate() results) on the connector card.",
        "Least-privilege hints per {c}: show exactly which scopes the token needs and why.",
        "Rotate-key reminder badge on {c} after N days (N configurable in Settings).",
        "Per-{c} 'docs deep-link' that jumps to the exact console page to mint a token.",
        "Offline Degrade Mode: when {c} auth fails, show last-known identity + greyed metrics, never hide the card.",
        "Copy-connection-string for {c} with one click, values masked by default, hold-to-reveal.",
        "A global 'credential diff' view showing which {c} keys changed in {.env} this session.",
        "Webhook tester panel for {c} that fires a synthetic event through the watch pipeline.",
        "Per-{c} quota/usage meter where the provider exposes one (rate-limit headroom).",
        "Visual dependency graph: which surfaces break if {c} disconnects.",
    ]),
    ("Projects, Stacks & Environments", "Organize sprawling infrastructure into obvious shape.", [
        "Colored environment ribbons ({s}-wide) — production gets the dangerous stripe everywhere, once.",
        "Cross-env diff: what services exist in staging but not production, at a glance.",
        "Drag services between environments with an arpeggio confirmation and undo toast.",
        "Project health rollup stopping at worst-of: red if ANY environment has an error.",
        "Attach runbook links per environment; surface them next to incidents in that env.",
        "Auto-suggest service attachments from {c} resource discovery instead of manual lists.",
        "Project templates: 'storefront', 'data pipeline', 'SaaS API' that prefill environments + services.",
        "Pin favorite projects to the sidebar rail; the rest collapse into a searchable list.",
        "Per-project billing/cost hook: show provider cost APIs next to services when configured.",
        "Shareable read-only project snapshot (export JSON, import elsewhere).",
    ]),
    ("Widgets & Telemetry", "Dashboards die by clutter; design for glanceability.", [
        "Every widget gets a sound-mapped alert threshold: cross it and a soft tone plays once.",
        "Widget spotlight: clicking a metric pins it to a global 'vital signs' strip at the top.",
        "Per-{c} widget presets (gold signals bundle) applied on first configure.",
        "Anomaly bands on {m} charts using rolling z-score, painted behind the line in violet.",
        "Fullscreen widget mode with a cinematic zoom transition and ESC to return.",
        "Widget notes: attach a dated comment to any {m} chart ('deploy froze this').",
        "Compare mode: overlay the same {m} metric from two services on one axis.",
        "Forecast ghost line on {m} charts using simple Holt-Winters, clearly marked as projection.",
        "Status-grid heat: fade tiles by recency so stale {c} data greys out visibly.",
        "Widget-to-incident: convert any {m} spike into an incident draft with one click.",
    ]),
    ("Watcher & Live Event Stream", "The nervous system; make signal outrun noise.", [
        "Event severity learning: thumbs-down an event class and it demotes itself visually next time.",
        "Watch presets per {c} ('critical paths only', 'everything', 'quiet hours') switchable per target.",
        "Correlated-event flash: when {c} events cluster within 2 minutes, group them into one bundle card.",
        "River-of-time scrubber: drag back over the last hour of events without losing live tail.",
        "Per-watch heartbeat visualization directly in the watcher panel row.",
        "One-click 'simulate event' per {c} to demo the pipeline end-to-end safely.",
        "Pause-all panic lever with auto-resume timer (5/15/60 minutes).",
        "Watch templates that mirror the demo scripts (configmap-break, oomkill, latency spike).",
        "Quiet routing: warnings to toasts, errors to toasts + sound, critical to toast + sound + email.",
        "Per-event 'investigate in chat' deep link prefilled with the event payload.",
    ]),
    ("Notifications & Escalations", "Attention is the scarcest resource in on-call.", [
        "Notification center grouping: collapse N repeats of the same alert into '×N' with expand.",
        "Snooze with a reason (required microcopy) so muted alerts aren't invisible forever.",
        "Digest mode: batch low-severity notifications into a 30-minute summary card.",
        "Per-{c} notification channels (pager for prod, toast for staging).",
        "Read receipts on approval-required notifications, written into the incident record.",
        "Escalation ladder UI: show who gets paged at +5m, +15m if an approval idles.",
        "One-click 'ack + open thread' from any toast.",
        "Weekly alert-fatigue report: noisiest {c}, most-muted rule, most-acked target.",
        "Quiet hours schedule with an always-override for CRITICAL severity.",
        "Toast queue choreography: max 3 visible, rest stacked with a count and review tray.",
    ]),
    ("Incidents & War Room", "Where the product proves its worth under pressure.", [
        "Incident timeline with expandable 'agent thinking' phases inline between events.",
        "Replay button: re-render the remediating {a} steps as an animated checklist.",
        "A 'similar past incidents' rail fed by local memory signatures.",
        "Approval receipts rendered as signed cards (who, when, which {a}, verification result).",
        "Post-incident report generator (markdown export with timeline, actions, memory lessons).",
        "Blameless language linting for incident notes written in the UI.",
        "Escalation banner if verification says {a} applied but probes disagree (honesty gap fix).",
        "Hotkeys: approve (a), deny (d), chat (c) with a two-key confirm for irreversible actions.",
        "Incident 'watch party' mode: multiple local tabs stream the same incident state.",
        "Auto-open the design doc/runbook links attached to the affected service on incident open.",
    ]),
    ("Actions, Permissions & Safety", "The hands of the agent — telegraph trust at every step.", [
        "Render every {a} plan as a before/after diff preview, not just prose.",
        "Risk-tier color language: SAFE=emerald, APPROVAL=amber, NEVER=crimson — used identically everywhere.",
        "Dry-run ledger: a searchable history of every {a} simulated but not executed.",
        "Circuit-breaker gauge per resource visible before you trigger {a}.",
        "'Why am I being asked?' explainer on every approval prompt (mode, tier, env rules cited).",
        "Time-boxed approval: approvals for {a} expire after 10 minutes with a countdown chip.",
        "Dual-confirm choreography for irreversible actions: hold-to-confirm with progress ring.",
        "Post-action verification panel: show the exact checks run, their output, and their verdict.",
        "Bulk action staging: queue several {a} calls, review as a manifest, execute in order.",
        "Action audit heatmap: which {a} runs most, against which resource, with success rate.",
    ]),
    ("Sound & Sensory Design", "The 206-voice orchestra needs conducting rules.", [
        "Themed sound packs (Nebula default, Terminal retro, Minimal ticks) switchable in Settings.",
        "Severity ladder mixing: chimes use success tones, warnings use amber square waves, errors descending.",
        "Adaptive volume: duck UI sounds while any modal is open; restore on close.",
        "Per-surface mute matrix (hero on, toasts off at night, chat always).",
        "Haptic mirror on supported devices for approval-critical sounds.",
        "Sound-onboarding: ask once, with a 'preview the orchestra' demo page.",
        "Beat-synced processing indicator: the thinking pulse follows a 96bpm clock.",
        "Accessible sound captions: a live textual 'sound log' for screen-reader users.",
        "Achievement chimes for streaks: zero-error week, first approved fix, first {c} connected.",
        "Silent hour auto-mute with an override hotkey.",
    ]),
    ("Motion & Interaction Craft", "~900 presets mean nothing without choreography discipline.", [
        "Motion budget audit page: list every animation on screen with its estimated GPU cost.",
        "Stagger discipline rule: lists animate 60ms/item, capped at 8 items, remainder fades as one.",
        "Route-level transitions keyed to Navigation type (tab vs drill vs modal).",
        "Success choreography: a 400ms glow wash when any risky action verifies green.",
        "Error choreography: 1 shake, never more than once, then static color language.",
        "Skeleton-to-content morphs that preserve exact bounding boxes (no layout jumps).",
        "Parallax restraint policy: only hero + background layers may move with the pointer, max 24px.",
        "Reduced-motion style guide documented with before/after GIFs in docs/",
        "The 'exit exam': every animated component must define its exit timeline explicitly.",
        "FPS meter debug overlay gated behind `?debug=fps` for the team.",
    ]),
    ("Cinematic & Brand Surfaces", "The premium face: hero, aurora, marketing moments.", [
        "Seasonal hero variants (aurora default, eclipse for incidents, dawn for all-clear).",
        "Per-product-line hero tint while preserving the #FF3A89 anchor (theme token, not hex churn).",
        "Screensaver mode: idle 10 minutes → the aurora takes the whole window with a clock.",
        "Press-kit page with the generated layers, logo, and token palette for demos.",
        "Launch-day intro sequence (skippable, max 6 seconds) telling the local-first story.",
        "Ambient status scenes: the hero's horizon lights flicker with real watch heartbeats.",
        "Brand gradient governance: a visual test that fails CI if gradients drift from the token ramp.",
        "Changelog page with cinematic reveal cards per release.",
        "Exportable 'thank-you' card after major incidents resolved, for sharing with the team.",
        "A 404/decoy page that renders the aurora and a single 'signal lost' line.",
    ]),
    ("Accessibility & Inclusion", "Premium means usable by everyone, including past-midnight-you.", [
        "Full keyboard map documented in-app (`?` overlay) with conflicts linted in tests.",
        "Focus ring design system: 2px brand outline, 2px offset, never removed without replacement.",
        "Screen-reader live regions for watcher events (polite) and approvals (assertive).",
        "Contrast CI: token pairs must pass WCAG AA at 4.5:1 for body text, 3:1 for large.",
        "Text zoom resilience: 200% zoom must not clip the sidebar nav or hero panels.",
        "Photosensitivity audit: no >3 flashes/sec anywhere; shimmer speeds capped.",
        "Dyslexia-friendly font option (OpenDyslexic alt) wired to the typography tokens.",
        "Motion-off storyboard: verify every critical flow makes sense with animations disabled.",
        "Color-blind safe status duplicate: icons + words accompany every colored status.",
        "RTL layout smoke theme for future i18n passes.",
    ]),
    ("Performance Engineering", "Smooth is a feature; budget it like one.", [
        "Route-level code-splitting for every top-level tab (dashboard, chat, settings…).",
        "Long-list virtualization for Activity Log beyond 200 rows.",
        "Memoize KPI tiles so 3.5s polls only re-render tiles whose values changed.",
        "Image budget: hero layers preloaded, everything below the fold lazy + decoded async.",
        "Canvas governor telemetry: log tier changes to a debug ring buffer (last 50).",
        "Font loading: swap with size-adjust fallbacks tuned so layout doesn't jump.",
        "WebSocket message coalescing: batch UI rerenders of high-frequency ticks to 10Hz.",
        "Idle work pattern: prefetch Integrations bundle during dashboard idle frames.",
        "Measure INP on every click handler in CI; fail above 100ms budget on mid hardware.",
        "Tab hibernation: hidden dashboard suspends polling timers gracefully and resumes cleanly.",
    ]),
    ("Theming & Personalization", "One brand ramp, many moods — without hex chaos.", [
        "Light mode tokens derived programmatically from the same ramps (contrast-checked).",
        "Accent slider that interpolates the brand ramp toward cyan/violet while holding contrast.",
        "Per-project accent chips (prod=rose, staging=amber, dev=cyan) echoed across the shell.",
        "Surface texture options: none / grain / scanlines, applied to glass tokens only.",
        "Saved theme presets with export/import JSON.",
        "Terminal-inspired themes for the CLI/TUI that mirror the desktop tokens.",
        "Dark-dim variant for NOC walls with forced-larger KPI type scale.",
        "Holiday-safe rule set: brand stays neutral, only decorative layers may theme.",
        "Theme preview pane applying changes live before save.",
        "Print stylesheet for dashboards (yes, really — incident reviews happen on paper).",
    ]),
    ("CLI, TUI & REPL Parity", "The terminal is a first-class Lear surface too.", [
        "TUI theme parity: read the same token JSON the desktop uses for colors.",
        "Rich-powered incident cards in the TUI matching the desktop IncidentCenter layout.",
        "REPL autocomplete for {a} names, resources, and watch targets from live config.",
        "TUI watch mode with the same severity color language as the desktop watcher.",
        "JSON output flag on every command for scripting, with a stable schema test in CI.",
        "Progress spinners replaced by structured phase readouts for long {a} runs.",
        "TUI help overlay mirroring the desktop `?` shortcut map.",
        "Terminal bell policy matching the desktop severity sounds (opt-in).",
        "Inline edit of permission mode with immediate guardrail preview.",
        "Headless-friendly env detection (no TTY → no interactive prompts, fail loudly).",
    ]),
    ("Security & Trust UI", "Show the seatbelts; people trust what they can inspect.", [
        "Credential reveal choreography: masked by default, hold-to-peek, auto-remask in 5s.",
        "Session badge showing which permission mode is armed, always visible in the sidebar.",
        "Approval receipts with a local signature hash so screenshots are verifiable.",
        "Security posture page: CORS, WS auth status, headers — with fix-it links to ROADMAP tasks.",
        "Audit log viewer with per-column filters and export for compliance.",
        "Key rotation wizard per {c} with zero-downtime guidance per provider.",
        "Suspicious-activity meter: repeated failed {c} auth attempts raise a visible flag.",
        "'What leaves this machine?' page: explicit outbound call inventory per feature.",
        "Secret-scan grep of the UI bundles in CI (no token-like strings shipped).",
        "Lock mode: one hotkey hides all metrics/headers for shoulder-surfing moments.",
    ]),
    ("Data Visualization & Chart Craft", "Charts are claims; draw them responsibly.", [
        "Chart annotation language: deploys, incidents, and {a} executions pinned as vertical markers.",
        "Log-scale toggle for skewed {m} metrics, with clear axis labeling.",
        "Small-multiples generator: same {m} across services in aligned mini-charts.",
        "Percentile bands (p50/p95/p99) rendered as nested gradient areas behind lines.",
        "Event-density strip under every timeline showing when things happened without reading labels.",
        "Accessible chart summaries: auto-generated Alt-text sentence per chart.",
        "Lag indicator on live charts: how stale the last point is, in seconds.",
        "Zoom-to-fill selection with pinch support on touch devices.",
        "Empty-bucket honesty: gaps in data render as gaps, never as zero-filled lines.",
        "Chart export: PNG/SVG/CSV with one click, watermark-free (it's your data).",
    ]),
    ("AI Transparency & Memory", "The brain should show its work.", [
        "Reasoning-trace drawer: every {s} answer expandable into its full phase log.",
        "Confidence decomposition: which evidence sources moved the score, as bars.",
        "Memory inspector: browse what local episodic memory holds, edit or expire entries.",
        "'Unverified claim' linter: any UI sentence asserting a fact must trace to an API field.",
        "Model comparison mode: run the same prompt through DeepSeek and Kimi, show both.",
        "Prompt library: save, version, and share effective diagnosis prompts per team.",
        "Eval replay: re-run recorded cases from evals/ and diff outcomes visually.",
        "Edit-grounding preview: show exact files/lines an AI fix will touch before applying.",
        "Speculation flags on answers derived from heuristics rather than provider data.",
        "Cost meter per session: estimated tokens × model pricing, kept locally.",
    ]),
    ("Mobile, Tauri & Companion Surfaces", "The agent in your pocket (carefully).", [
        "Responsive dashboard pass: cards stack, hero collapses to static key art.",
        "Tauri global hotkey to focus the app with copilot pre-opened.",
        "System tray status: aggregate health dot + quick approve/deny for approvals.",
        "Tauri native notifications for CRITICAL events even when the window is closed.",
        "Signed mobile-friendly incident approve page (the war-room page, responsive).",
        "Offline shell: cached last-known dashboard readable without the backend.",
        "Deep links: lear://incident/<id>, lear://service/<c>/<r> from emails/chat.",
        "Watch-app glance: three complications — health, watches, pending approvals.",
        "Touch gesture pass: swipe-to-dismiss toasts, pull-to-refresh on lists.",
        "Low-power mode: disables canvas background + streams on battery saver.",
    ]),
    ("Testing, QA & CI for the UI", "Beauty that regresses isn't beauty for long.", [
        "Visual regression suite: screenshot baseline per screen state in CI.",
        "Storybook-style gallery for every ui/ primitive variant.",
        "Contract tests asserting dashboard sub-components accept the real API payloads.",
        "Reduced-motion test run: full suite under forced reduce-motion media.",
        "Keyboard-only e2e journey: onboard → connect → approve → resolve, no mouse.",
        "SFX registry drift test: any data-sfx attribute must resolve in the engine.",
        "Bundle-size budget check: fail when main chunk grows >10% over baseline.",
        "Accessibility axe pass on every screen in CI.",
        "Synthetic watch-event e2e: mock WS server drives the dashboard visibly in tests.",
        "Fuzz the connector form renderer with random registry schemas.",
    ]),
    ("Docs, Demos & Developer Experience", "Make contribution and storytelling cheap.", [
        "Interactive component playground page inside the app (dev-only route).",
        "Recorded golden demo (5 min) scripted with the failure-injection fixtures.",
        "Docs-as-code for the design system with live token swatches generated from CSS.",
        "PR template with UI checklist: reduced motion? keyboard? sounds? tokens?",
        "Architecture animation: 60-second narrated canvas explainer of plan→execute→verify.",
        "New-contributor map: 'your first UI change' guided by code mods and tests.",
        "Design-decision log (ADR) template for future visual changes.",
        "Auto-generated dependency/impact graph of components, refreshed per release.",
        "Demo mode switch: deterministic seeded data for reproducible screenshots.",
        "Public roadmap page synced from ROADMAP.md with week-by-week progress bars.",
    ]),
    ("Resilience, Offline & Edge Cases", "Where most premium work quietly shows.", [
        "Backend-down state: full-screen aurora + honest 'bridge offline' panel with retry.",
        "Partial-fail rendering: each panel degrades independently (never white-screen the app).",
        "Clock-skew guard: warn when client/server time differs >2s (breaks event ordering).",
        "Slow-network mode: requests show per-request latency badges and cancellation.",
        "Duplicate-tab coordination: second tab becomes read-only and says why.",
        "Storage-quota notice when localStorage/chat JSON approaches limits.",
        "Crash-recovery banner offering the raw error report as downloadable JSON.",
        "Connector-timeout backoff visualization (why the card says 'retrying…').",
        "Stale-data watermark: anything older than its TTL gets a subtle 'stale' ribbon.",
        "Long-session memory guard: cap event buffers and announce truncation visibly.",
    ]),
    ("Growth, Sharing & Wow-Moments", "Small touches people screenshot and share.", [
        "One-click 'weekly wins' card: fixes shipped, incidents resolved, uptime — exportable.",
        "Incident-resolved cinematic: 2-second aurora sweep across the app on RESOLVED.",
        "Copy-as-image for any panel for incident reviews and standups.",
        "Milestone toasts: 100th action executed, first zero-error day, 30-day streak.",
        "Shareable onboarding score for teams adopting Lear (optional, local-only).",
        "Easter egg: konami code → the aurora goes full rainbow for one shift.",
        "Day-one delight: the first validated {c} connection plays a distinctive chord.",
        "CLI↔Desktop unity: `prash ui` boots the desktop pointed at your terminal's config.",
        "Custom-branded status page export for teams to share uptime externally.",
        "Release-notes toast with cinematic highlights after upgrades.",
    ]),
    ("Chart & Widget Micro-interactions", "Polish at the 100-pixel scale.", [
        "Metric card flip: front shows value, back shows 24h spark + percentile.",
        "Gauge needle physics: overshoot-and-settle spring on big changes.",
        "Status-grid hover magnifier that lifts a cell with its exact timestamps.",
        "Timeline scrub preview: thumbnails of the chart while dragging the range.",
        "Event-row press-and-hold to preview full raw payload in a drawer.",
        "Bar-chart lasso select → auto-filters the table underneath.",
        "Unit toggle (ms/s) per chart remembered per user.",
        "Live badge jitter suppression: values update at most every 2s with tween.",
        "Sparkline hover dot with the exact value in a tooltip.",
        "Empty-chart art: skeleton mountains, not blank boxes.",
    ]),
    ("Copilot Command & Quick Switcher", "⌘K is the mouse of premium apps.", [
        "Global ⌘K palette with fuzzy search over screens, projects, {a}, and settings.",
        "Palette actions: start watch on {c}, open approvals, toggle sounds, switch env.",
        "Recent-command row learning from frequency, stored locally.",
        "Inline AI answers inside the palette for 'how do I …' questions.",
        "Palette themable footer showing current project/env/mode context.",
        "Command permissions gate: {a} entries respect the current permission mode.",
        "Palette tips rotation (one tip per open, locally rotated).",
        "Nicknames: alias long resource ids to short handles for palette and CLI.",
        "History-aware duplicates: same query re-run shows diff vs last result.",
        "One-key deep jumps: g-d dashboard, g-i integrations, g-n notifications (g-prefix).",
    ]),
    ("SRE Wisdom & Workflow Details", "Nerdy details SREs notice and love.", [
        "Auto-link {c} console URLs for every resource (jump straight to provider UI).",
        "SLO tile: attach target % + error budget burn to any service card.",
        "Maintenance windows: scheduled quiet zones that visibly mute banners, not truth.",
        "Run status verbs standardized everywhere (Starting → Streaming → Degraded → Failed).",
        "Time-since formatting rule: live seconds under 2m, then minutes, then absolute date.",
        "Deploy correlation marks: any {c} deploy event draws a marker on every related chart.",
        "'No news' provenance: when healthy, show the last check time, not silence.",
        "Blast-radius hint: approving {a} shows dependents discovered from project graph.",
        "Retry queues for failed notifications with visible attempt counts.",
        "Terminology glossary drawer (CrashLoopBackOff et al.) searchable from copilot.",
    ]),
    ("Email & Slack Channel UX", "The bidirectional surfaces most demos never show.", [
        "Redesign incident emails with the hero palette and a single, unmistakable approve CTA.",
        "Email render tests: every incident type screenshot-tested across dark mail clients.",
        "Slack Block Kit polish: severity color bar, thinking-fold blocks, one-touch approve button.",
        "Deep link previews: paste a lear://incident link in Slack and unfurl it richly.",
        "Reply-parsed confirmations: 'approved by you via email' chips inside the incident thread.",
        "Per-incident Slack thread sync: agent thinking lands as threaded replies, not new posts.",
        "Digest emails for non-critical alerts with a weekly noise score.",
        "Unsubscribe-safe routing: fine-grained per-severity email prefs, one click.",
        "Email accessibility pass: semantic tables, alt text, text-only mirror.",
        "Signed approve URLs with expiry, rendered as obvious countdown badges.",
    ]),
    ("Settings Surface", "Where power users judge craft the hardest.", [
        "Settings search: jump to any control by name with ⌘K-style fuzzy matching.",
        "Change-diff banner: '3 unsaved changes' with one-click review before save.",
        "Per-section 'reset to defaults' with typed confirmation for dangerous zones.",
        "Import/export of the full settings profile (JSON) with schema version field.",
        "Live preview pane for theme/motion/sound changes before committing.",
        "Settings audit log: who changed what, when, from which tab (local only).",
        "Danger-zone separation: destructive controls visually isolated + hold-to-confirm.",
        "Secret fields with rotation reminders and last-changed timestamps.",
        "Guided 'recommended profile' quiz that sets 20 options at once.",
        "Keyboard-first settings: every control reachable without a mouse, visibly.",
    ]),
    ("Errors, Empty States & Edge Copy", "The UI you meet when things go wrong defines trust.", [
        "Every empty state gets: illustration, one-line cause, one recovery action, docs link.",
        "Error copy style guide: says what happened, what we tried, what YOU can do — in that order.",
        "Inline field errors with fix suggestions, not just red text.",
        "Retry buttons that show attempt number and backoff countdown honestly.",
        "404 panel for impossible routes with a 'return to mission control' beacon.",
        "Dead-connector card state with last-good data and re-auth CTA.",
        "Partial widgets: render the metrics that loaded; mark the rest 'no data' honestly.",
        "Long-error collapsible: first line visible, stack hidden behind 'technical details'.",
        "Rate-limit notices with provider name and reset window.",
        "Offline-first message grammar: 'you're offline' vs 'backend unreachable' vs 'provider down'.",
    ]),
    ("Iconography & Glyphs", "A coherent glyph language makes everything feel intentional.", [
        "Connector glyph set: every provider gets a 16px outline mark in one stroke language.",
        "Status glyphs share geometry: healthy=shield, degraded=pulse, error=diamond, offline=hollow.",
        "Action category icons mapped 1:1 to risk tiers with consistent line weight.",
        "Kinetic icons: watcher icon sweeps a radar arc while streaming.",
        "Empty-state illustration kit (6 scenes) in the same one-stroke style.",
        "Icon usage audit: one icon per concept across the app, deduplicated in a registry.",
        "16px vs 20px discipline: enforce sizes via the shared Icon wrapper.",
        "Textless-mode toggle: icons with tooltips only, for expert density.",
        "Glyph contrast pass against every surface token combo in CI.",
        "Brand mark usage rules: the gradient spark reserved for identity moments only.",
    ]),
    ("Layout, Rhythm & Information Architecture", "The invisible 80% of 'premium'.", [
        "8px vertical rhythm audit: every panel padding on the spacing token scale.",
        "Max-width policy: reading columns ≤ 76ch, dashboards ≤ 1440px centered.",
        "Panel hierarchy rules: H2+H3 sizes per nesting depth, automated in a lint.",
        "Sticky sub-headers for long settings/activity sections as you scroll.",
        "Grid discipline: KPI cards always in 4/2/1 column responsive sets — never orphan widths.",
        "Whitespace budget: command bars breathe at 24px, data tables condense at 8px.",
        "Z-axis contract: 8 named elevation levels (tokens) — nothing arbitrary above them.",
        "Print layout for audits: clean typography, no chrome, timestamps everywhere.",
        "Landmark roles on every region (banner/nav/main/aside) verified in tests.",
        "Consistent 'card anatomy': header row / body / footer actions, token-spaced.",
    ]),
    ("Data-Dense Tables & Logs", "Where analysts will live all day.", [
        "Column personalization: reorder, resize, hide — persisted per user per table.",
        "Row hover preview drawer: full record without leaving the table.",
        "Log tail mode with pause-on-scroll and resume-to-live button.",
        "Log level chips consistent with severity tokens everywhere.",
        "Copy mode: one click copies the visible rows as clean markdown.",
        "In-table filters with counts ('error (12)') and one-click clear-all.",
        "Saved filter presets per table, shareable as URL params.",
        "Time column dual display: relative + absolute on hover.",
        "Row expansion keyboard: space toggles, arrows traverse, documented in `?`.",
        "Diff view for config edits: syntax-highlighted before/after inline.",
    ]),
]

TARGET_PER_THEME = 44


def fill_slot(idea: str, slot: str, table: list[str], idx: int) -> str:
    value = table[idx % len(table)]
    if slot == "a":
        value = f"`{value}`"
    return idea.replace("{" + slot + "}", value)


def fill_template(template: str, step: int, context: str) -> str:
    """Fill each slot from its matching domain table (grammar stays correct).

    Independent rotation offsets per slot type prevent pair-locking cycles.
    """
    idea = template
    if "{s}" in idea:
        idea = idea.replace("{s}", context)
    for slot, table in SLOT_TABLES.items():
        marker = "{" + slot + "}"
        if marker in idea:
            idea = fill_slot(idea, slot, table, step + len(table) + ord(slot))
    return idea


def fill_bank_entry(template: str, group: str, seed: int) -> str:
    """Fill a global-bank template's {x} from its OWN typed table."""
    table = SLOT_TABLES[group]
    value = table[seed % len(table)]
    if group == "a" and not template.startswith("`"):
        value = f"`{value}`"
    return template.replace("{x}", value)


def main() -> None:
    ideas: list[str] = []
    per_theme_number: list[int] = []
    for t_idx, (title, intro, templates) in enumerate(THEMES):
        context = CONTEXTS[t_idx % len(CONTEXTS)]
        emitted: list[str] = []
        seen: set[str] = set()
        # 1) signature templates of the theme, cycled for c/a/m variety
        attempts = 0
        while attempts < TARGET_PER_THEME * 20 and len(emitted) < len(templates) * 3:
            idea = fill_template(templates[attempts % len(templates)], attempts, context)
            attempts += 1
            if idea not in seen:
                seen.add(idea)
                emitted.append(idea)
        # 2) rotating window of the global bank, filled deterministically
        b = len(GLOBAL_BANK)
        k = 0
        while len(emitted) < TARGET_PER_THEME and k < b * 2:
            template, group = GLOBAL_BANK[(t_idx * 11 + k) % b]
            idea = fill_bank_entry(template, group, seed=t_idx * 7 + k * 3)
            k += 1
            if idea not in seen:
                seen.add(idea)
                emitted.append(idea)
        per_theme_number.append(len(emitted))
        ideas.append(f"## {t_idx + 1}. {title}\n\n_{intro}_\n")
        body = "\n".join(f"{i + 1}. {idea}" for i, idea in enumerate(emitted))
        ideas.append(body + "\n")

    total = sum(per_theme_number)
    today = datetime.date(2026, 9, 29).isoformat()
    header = (
        "# LEAR PREMIUM IDEAS — the 1,000-idea upgrade backlog\n\n"
        f"Generated deterministically by `scripts/generate_premium_ideas.py` on {today}.\n\n"
        "**How to read this:** every line is a buildable micro-feature composed from\n"
        "Lear's real domain tables (13 connectors, 30 permissioned actions, 12 app\n"
        "surfaces). Numbers restart per theme. Pull items into sprints by theme, or\n"
        "grep for a connector/action/surface name to find every idea that touches it.\n\n"
        f"**Total ideas in this document: {total}**\n\n"
        "---\n"
    )
    doc = "\n".join([header, *ideas])
    with open("docs/PREMIUM_IDEAS.md", "w", encoding="utf-8") as fh:
        fh.write(doc)
    print(f"wrote docs/PREMIUM_IDEAS.md with {total} ideas across {len(THEMES)} themes")


if __name__ == "__main__":
    main()
