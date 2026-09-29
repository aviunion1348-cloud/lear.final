# Deploying Lear on Vercel (multi-service)

This repo ships a `vercel.json` that deploys **two services** from one
repository into a single Vercel project, behind one domain.

## The services

| Service   | Root       | Framework | Public? | Serves |
|-----------|------------|-----------|---------|--------|
| `app`     | `.`        | fastapi   | Yes, on `/api/*`, `/ws/*`, `/demo/*`, `/admin`, `/store` | `prash/server.py` — the REST + WebSocket API, the demo storefront and the admin console |
| `desktop` | `desktop/` | vite      | Yes, on `/(.*)` (catch-all) | the React 19 premium UI |

`desktop/src-tauri/` is **deliberately not a service.** It is the Rust Tauri
shell that produces a native desktop binary — there is no HTTP surface to
deploy, and adding it as a `runtime: rust` service would build a binary Vercel
can never route traffic to. It stays in the repo and is built with
`npm run tauri build`, not by Vercel.

## Routing

Rewrites are evaluated most-specific first, catch-all last:

```
/api/(.*)   → app
/ws/(.*)    → app
/demo/(.*)  → app
/admin      → app
/store      → app
/(.*)       → desktop      ← must stay last
```

This preserves the app's existing contract exactly: the frontend calls
**relative** `/api/...` and `/ws/...` URLs (see `desktop/src/lib/apiBase.ts`),
so no client-side base URL has to change. In dev, Vite proxies those same paths
to `127.0.0.1:8000`; on Vercel, the rewrites do the same job.

## Bindings

`app` calls `desktop`, so the binding is declared on **`app`** (the caller):

```json
"bindings": [
  { "type": "service", "service": "desktop", "format": "url", "env": "DESKTOP_URL" }
]
```

**Why this binding exists.** The notification paths build "open this incident in
Lear" deep-links that must point at the *frontend*, not the API. They used to
hardcode `http://localhost:1420`, which meant a Slack or email alert from a
deployed instance sent the on-call engineer to their own laptop. Those call
sites now resolve the URL through `prash/service_urls.py`:

- `prash/email_service.py` — incident emails (4 call sites)
- `prash/slack_service.py` — Slack incident messages (2 call sites)
- `prash/admin_panel.py` — the "Lear Mission Control Dashboard" button

`DESKTOP_URL` is injected by Vercel at **runtime, in functions only** — it is
not available during the build, and not in middleware. Do not set it yourself
in project environment variables; the platform owns it. Locally it is unset and
`service_urls.py` falls back to `http://localhost:1420`, so dev is unchanged.

`desktop` needs no binding: it is a static Vite build, bindings do not resolve
at build time, and the browser reaches `app` through the public rewrites using
relative URLs.

## Local testing

```bash
vercel dev     # runs both services together and injects binding variables
```

The plain local workflow is untouched:

```bash
npm start      # uvicorn on :8000 + vite on :1420 concurrently
```
