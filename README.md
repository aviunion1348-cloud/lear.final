# Lear — the AI DevOps agent

> **Gold-on-obsidian premium build.** This repository contains the full source
> tree *and* a one-file download of the exact same build.

---

## Download & install (one copy-paste)

**The zip lives at the repository root: [`lear-premium-ui-full.zip`](./lear-premium-ui-full.zip)**

Everything you can browse in this repo is that zip, extracted. They are the
same build — the extracted files were produced by unzipping the committed
archive, so the download and the browsable source can never drift apart.

### Windows (CMD)

```cmd
cd C:\Users\123\Desktop
curl -L -o lear-premium-ui-full.zip https://github.com/aviunion1348-cloud/lear.final/raw/arena/01a0ec0b-lear-final/lear-premium-ui-full.zip
tar -xf lear-premium-ui-full.zip
cd lear-premium-ui
pip install -e ".[dev]"
copy .env.example .env
npm install
npm start
```

### macOS / Linux

```bash
curl -L -o lear-premium-ui-full.zip https://github.com/aviunion1348-cloud/lear.final/raw/arena/01a0ec0b-lear-final/lear-premium-ui-full.zip
unzip lear-premium-ui-full.zip && cd lear-premium-ui
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
npm install
npm start
```

Then open **http://localhost:1420**.

`npm start` runs both halves at once — the FastAPI backend on `:8000` and the
premium UI on `:1420`, which proxies `/api` and `/ws` to it. Fill in one model
key (`DEEPSEEK_API_KEY` or `KIMI_API_KEY`) in `.env` when the wizard asks.

### What you get

| | |
|---|---|
| Design system | Gold ramp `#E8B44A` on obsidian `#05050a`; full spacing, type, elevation, radius and motion scales |
| Entry | Cinematic scroll landing → **Direction** sequence (8 VFX layers) → **console ignition** power-on |
| Console | Every subsection wipes, rises and cascades in, each with its own gold accent temperature |
| Motion | 2,183 distinct animations, 14,712 tunable instantiations — all transform/opacity/filter only |
| Audio | 312 procedural sci-fi sounds, 37 families, **zero audio assets**, loud + adjustable |
| Deploy | `vercel.json` — FastAPI + Vite as two services behind one domain |

See [`TASK_CHECKLIST.md`](./TASK_CHECKLIST.md) for every number and how to
reproduce it, and [`LEAR_SUPERPROMPT_V3_GOLD.md`](./LEAR_SUPERPROMPT_V3_GOLD.md)
for the visual, motion, audio and performance law this build follows.

---

## Install from git — quick start

```bash
git clone https://github.com/aviunion1348-cloud/drufiy-prob-changes-.git
cd drufiy-prob-changes-
python3 -m venv .venv && source .venv/bin/activate   # Python 3.10+
pip install -e ".[dev]"                              # CLI + desktop backend + test deps
cp .env.example .env                                 # fill in one model key
                                                     # (DEEPSEEK_API_KEY or KIMI_API_KEY)

# terminal 1 — the desktop app's local backend (API on :8000)
uvicorn prash.server:app --host 0.0.0.0 --port 8000

# terminal 2 — the premium UI (on :1420, proxies /api + /ws to :8000)
cd desktop && npm install && npm run dev             # Node 18+
```

Open **http://localhost:1420** — the onboarding wizard takes it from there.
The `prash` CLI (`prash repl`, `prash tui`, `prash watch`, …) works from the
same install — see [The commands](#the-commands). A ready-made download of this
exact tree is also attached to releases as `lear-premium-ui-full.zip`.

---

## Setup

Requires **Python 3.10+**. Takes about two minutes.

```bash
git clone https://github.com/Drufiy/Lear-backend.git
cd Lear-backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
```

Confirm the `prash` command resolved:

```bash
prash --help
```

Then create your local config from the template:

```bash
cp .env.example .env
```

Open `.env` and fill in **one model key** — either `DEEPSEEK_API_KEY` or
`KIMI_API_KEY`. Everything else can stay blank to start. `.env` is gitignored and
never leaves your machine.

> **Read this before you edit `.env`.** Leave unused keys *completely blank*
> (`KUBECONFIG=`), never a placeholder like `KUBECONFIG=none`. Prash treats a blank
> value as "not configured" and falls back to the sensible default; a placeholder is
> taken literally and will break in confusing ways. This exact thing broke the very
> first real install (`PRASH_V2.md` §10, 2026-08-14).

Check it loaded — this never prints secret values, only which keys it found:

```bash
prash config
```

Run the test suite (should be **457 passed, 7 skipped** — the skips are live-cluster
tests that only run in CI):

```bash
pytest -q
```

That's enough to develop against. Everything below is only needed for the
Kubernetes features.

---

## Optional: a local Kubernetes cluster

Needed for `prash fix`, `prash watch`, and `restart-pod`. Requires Docker Desktop
running, plus [`kind`](https://kind.sigs.k8s.io) and `kubectl`
(`brew install kind kubectl` on macOS).

```bash
kind create cluster --name prash-dev
kubectl apply -f prash/connectors/testdata/broken-pod.yaml
```

`kind` sets your kubectl context automatically. Put these in `.env`:

```
KUBE_CONTEXT=kind-prash-dev
KUBE_NAMESPACE=prash-demo
```

The fixture pod reaches a real `CrashLoopBackOff` in about 15 seconds — verify with
`kubectl get pods -n prash-demo`. Tear it all down with
`kind delete cluster --name prash-dev`.

---

## Trying it

```bash
prash repl                    # persistent session — best place to start
prash actions                 # every action, with its risk tier
prash config                  # local config, secrets redacted
prash tui                     # dashboard-style terminal UI
```

Once a cluster is up:

```bash
prash watch                                    # poll for broken pods, notify on new ones
prash fix prash-demo/<pod-name>                # diagnose a pod, act on the verdict
prash fix prash-demo/<pod-name> --repo <owner/repo>   # ...and propose a manifest fix as a PR
```

For CI failures:

```bash
prash fix <owner>/<repo> --ci --run-id <n>     # needs GITHUB_TOKEN
```

**Safety, worth knowing before you run anything:** every action goes through a
permission engine (`read-only` / `ask` / `auto-safe` / `environment-scoped` /
`bypass`, default `ask`), a circuit breaker that halts repeated action on one
resource, and an append-only audit log (`prash audit`). Add `--dry-run` to any
command to see the plan without touching anything real.

---

## The commands

| Command | What it does |
|---|---|
| `prash repl` | Persistent interactive session; remembers namespace/pod between commands |
| `prash tui` | Dashboard-style terminal UI |
| `prash fix` | Diagnose a k8s pod or CI run, then run the recommended action through the permission pipeline |
| `prash run <action> <resource>` | Execute one action directly |
| `prash watch` | Poll a namespace, notify on newly broken pods |
| `prash investigate <resource>` | Read-only connector probe |
| `prash actions` | List registered actions and risk tiers |
| `prash audit` | Show the append-only audit log |
| `prash config` | Show local config (secrets redacted) |
| `prash circuit` | Inspect or reset the circuit breaker |

Run `prash <command> --help` for flags — that output is generated from the real
parser, so it's never out of date.

---

## Who's building this

- **Aradhya** (founder) — read connectors, diagnosis brain, the watcher
- **Aryan** (CTO) — CLI spine, permission engine, write actions, REPL/TUI, test coverage
- **Anant** — leading the connector rewrite (`CONNECTOR_REWRITE_SPEC.md`): `watch`/`get_stats`/`alert` on every connector, real execution, Terraform
- **Maneesh** — distribution, marketing, fundraising (development as needed)

Day-by-day breakdown in `PRASH_V2.md` §6 and §6b.

---

## The desktop app — Premium UI

The `desktop/` app (Vite + React + Tauri) carries a full design system and a
cinematic presentation layer built around the brand's neon pink (`#FF3A89`):

- **Design tokens** — one token system (`desktop/src/styles/tokens.css`) drives
  the whole shell: 8-pt spatial scale, Inter + Outfit type ramp, neutral ramp
  with the pink accent anchored, semantic status colors, elevation/radius and
  motion/easing tokens. Dark-first glass surfaces with reduced-motion handling.
- **Component library** — typed primitives in `desktop/src/components/ui/`
  (`Button, Card, Badge, Input, Modal, Dropdown, Tooltip, Skeleton, EmptyState`),
  all sound- and motion-wired; the dashboard composes `KPIStrip`, `HealthBar`,
  `ActivityFeed`, `QuickActions`, `IncidentCenter` and `ServiceBoard` from them.
- **Cinematic layer** — an animated aurora background (adaptive 4-tier quality
  governor, pauses on hidden tabs), a scroll-driven hero with an infinite
  capability carousel, and a **synthesized sound engine** shipping **207 sound
  recipes** plus a **336-preset motion registry** (`SFX_COUNT` /
  `MOTION_PRESET_COUNT` are runtime-exported and asserted in tests).
- **Sidebar** — collapsible rail (⌘/Ctrl+B), Alt+1…7 section jumps, active-pill
  motion, persisted per user.

Docs: [`docs/LEAR_UI_SUPER_TASK.md`](./docs/LEAR_UI_SUPER_TASK.md) (build
spec + execution log) and [`docs/PREMIUM_IDEAS.md`](./docs/PREMIUM_IDEAS.md)
(a 1,496-idea premium backlog, generated by
`scripts/generate_premium_ideas.py`).

Run it locally:

```bash
python -m uvicorn prash.server:app --host 0.0.0.0 --port 8000   # backend
cd desktop && npm install && npm run dev                        # frontend on :1420
```

`desktop/` tests: `npm test` (24 passing), `npm run build` is clean.

---

## Status

Working end to end today: the `prash` CLI and REPL, a five-mode permission engine,
circuit breaker and audit log, **13 connectors** (AWS, Azure, Datadog, GCP, GitHub,
GitLab, Gitleaks, Grafana, Kubernetes, PagerDuty, Snyk, Terraform, Vercel), **20
actions** across them, the diagnosis brain with a golden-case eval harness, and the
background watcher. Run `prash actions` for the live, current list — it's generated
from the real registry, so unlike this paragraph it can't go stale.

Both fix paths are **live-verified against real infrastructure**, not mocks: a real CI
failure and a real broken Kubernetes manifest each produced a real pull request with a
correct diff. Gitleaks is live-verified against a real binary and real committed
secrets; AWS, GCP, Vercel, and Snyk each have a reusable `scripts/testing/break_*.py`
fixture, though several are currently blocked on live credentials (tracked honestly
in `PRASH_V2.md`, not hidden).

Current focus is the **connector rewrite** (`CONNECTOR_REWRITE_SPEC.md`): a shared
interface so every connector supports proactive watching and multi-connector
correlation, not just read-then-diagnose. **457 tests passing.** Known gaps and open
questions are tracked honestly in `PRASH_V2.md` §9/§10 and in GitHub Issues.
