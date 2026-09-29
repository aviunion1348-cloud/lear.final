# Deploying Lear (npm local + Vercel static)

Lear is a **local-first** app: the FastAPI backend (`prash/`) runs on your machine
and your credentials never leave it. The **premium UI** in `desktop/` is a standard
Vite/React build that runs locally against that backend *and* deploys as a static
site to Vercel.

---

## 1. Run everything locally (recommended — full features)

```bash
# from the repo root
python3 -m venv .venv && source .venv/bin/activate      # Python 3.10+
pip install -e ".[dev]"                                  # backend + tests
cp .env.example .env                                     # add ONE model key (DEEPSEEK or KIMI)

npm install                                              # root (concurrently)
npm install --prefix desktop                             # frontend deps

npm start          # runs BOTH: uvicorn :8000  +  vite :1420
```

Open **http://localhost:1420**. Vite proxies `/api` and `/ws` to the backend on
`:8000` (see `desktop/vite.config.ts`). The onboarding wizard takes it from there.

Minimal backend deps if you only want the desktop API (no heavy cloud SDKs):

```bash
pip install fastapi "uvicorn[standard]" python-dotenv python-multipart pyyaml httpx pydantic openai rich
python -m uvicorn prash.server:app --host 0.0.0.0 --port 8000
```

---

## 2. Build the frontend

```bash
npm run build --prefix desktop     # → desktop/dist (static assets)
npm run preview --prefix desktop   # optional local preview of the build
```

---

## 3. Deploy the frontend to Vercel

`desktop/vercel.json` is already configured (Vite framework, SPA rewrite, asset
caching). In the Vercel dashboard:

- **Root Directory:** `desktop`
- **Build Command:** `npm run build`  (auto)
- **Output Directory:** `dist`  (auto)

### Pointing the static frontend at a backend
The app calls **relative** `/api/*` by default (perfect for local dev/Tauri). For a
Vercel deploy where the backend lives elsewhere, set an env var at build time:

```
VITE_API_BASE = https://your-lear-backend.example.com
```

`src/lib/apiBase.ts` then transparently rewrites `/api` fetches and `/ws` sockets
to that base — no source edits needed. Leave it empty to keep relative behavior.

> The Python backend is not deployed to Vercel (it's local-first and shells out to
> real tools like kubectl/terraform). Host it wherever you like — a VM, a container,
> or keep it on your machine — and point `VITE_API_BASE` at it. Without a backend,
> the static site loads and shows the onboarding/unconfigured states.

---

## 4. Desktop (Tauri) build

The Tauri shell in `desktop/src-tauri/` still builds normally:

```bash
npm run tauri build --prefix desktop
```

---

## Download-and-run ZIP

A clean, ready-to-run archive is produced as **`lear-premium-ui-full.zip`**
(no `node_modules`, `.venv`, `.env`, or `.prash` user data). Unzip, then follow
step 1.
