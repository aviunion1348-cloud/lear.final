#!/usr/bin/env bash
# =============================================================================
# LEAR — ONE-COMMAND INSTALLER (macOS / Linux)
# -----------------------------------------------------------------------------
# Downloads leardevop.zip, extracts it, installs both halves of the stack,
# starts them, and opens the immersive console.
#
# Run it with a single paste:
#
#   curl -fsSL https://raw.githubusercontent.com/aviunion1348-cloud/lear.final/arena/01a0ec0b-lear-final/install.sh | bash
#
# Installs into the CURRENT directory. No sudo, no PATH changes.
# =============================================================================
set -euo pipefail

REPO="aviunion1348-cloud/lear.final"
BRANCH="arena/01a0ec0b-lear-final"
ZIP="leardevop.zip"
URL="https://github.com/${REPO}/raw/${BRANCH}/${ZIP}"
TARGET="$(pwd)/lear-premium-ui"

GOLD=$'\033[38;5;179m'; DIM=$'\033[2m'; GREEN=$'\033[32m'; RED=$'\033[31m'; OFF=$'\033[0m'
gold() { printf '%s%s%s\n' "$GOLD" "$1" "$OFF"; }
dim()  { printf '%s%s%s\n' "$DIM"  "$1" "$OFF"; }
ok()   { printf '  %s[OK]%s %s\n' "$GREEN" "$OFF" "$1"; }
err()  { printf '  %s[!!]%s %s\n' "$RED"   "$OFF" "$1"; }

echo
gold '    ##       ########    ###    ########'
gold '    ##       ##         ## ##   ##     ##'
gold '    ##       ######    ##   ##  ########'
gold '    ##       ##       ######### ##   ##'
gold '    ######## ######## ##     ## ##     ##'
echo
dim  '    AI DevOps agent - gold/obsidian immersive console'
dim  '    ------------------------------------------------'
echo

# ---- 1. prerequisites -------------------------------------------------------
gold '[1/7] Checking prerequisites'
PY=""
for c in python3 python; do
  if command -v "$c" >/dev/null 2>&1; then
    if "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)' 2>/dev/null; then
      PY="$c"; break
    fi
  fi
done
[ -n "$PY" ] || { err "Python 3.10+ not found. Install it, then re-run."; exit 1; }
ok "Python: $($PY --version)"

command -v node >/dev/null 2>&1 || { err "Node.js 18+ not found. https://nodejs.org/"; exit 1; }
NODE_MAJOR="$(node --version | sed 's/^v//' | cut -d. -f1)"
[ "$NODE_MAJOR" -ge 18 ] || { err "Node 18+ required, found $(node --version)"; exit 1; }
ok "Node: $(node --version)"

command -v unzip >/dev/null 2>&1 || { err "unzip not found. Install it (apt install unzip)."; exit 1; }

# ---- 2. download ------------------------------------------------------------
echo; gold "[2/7] Downloading ${ZIP}"; dim "      ${URL}"
curl -fL --progress-bar -o "$ZIP" "$URL"
ok "Downloaded $(du -h "$ZIP" | cut -f1)"

# ---- 3. extract -------------------------------------------------------------
echo; gold '[3/7] Extracting'
if [ -d "$TARGET" ]; then
  dim "      existing folder found - moving it to lear-premium-ui.bak"
  rm -rf "${TARGET}.bak"; mv "$TARGET" "${TARGET}.bak"
fi
unzip -q "$ZIP"
[ -d "$TARGET" ] || { err "Extract failed - $TARGET not found"; exit 1; }
ok "Extracted to $TARGET"
cd "$TARGET"

# ---- 4. backend -------------------------------------------------------------
echo; gold '[4/7] Installing the backend (this takes a minute)'
"$PY" -m venv .venv
./.venv/bin/python -m pip install --upgrade pip --quiet
./.venv/bin/python -m pip install -e ".[dev]" --quiet
ok 'Backend installed'

# ---- 5. frontend ------------------------------------------------------------
echo; gold '[5/7] Installing the premium UI'
(cd desktop && npm install --no-audit --no-fund --loglevel=error)
ok 'UI installed'

# ---- 6. config --------------------------------------------------------------
echo; gold '[6/7] Configuration'
if [ ! -f .env ]; then
  cp .env.example .env
  ok 'Created .env from the template'
  dim '      Add ONE model key (DEEPSEEK_API_KEY or KIMI_API_KEY) to unlock the brain.'
  dim '      Leave unused keys completely blank - never a placeholder.'
else
  ok '.env already exists - left untouched'
fi

# ---- 7. launch --------------------------------------------------------------
echo; gold '[7/7] Starting Lear'
./.venv/bin/python -m uvicorn prash.server:app --host 127.0.0.1 --port 8000 \
  >/tmp/lear-backend.log 2>&1 &
ok 'Backend starting on http://127.0.0.1:8000'
(cd desktop && npm run dev >/tmp/lear-ui.log 2>&1 &)
ok 'UI starting on http://localhost:1420'

dim ''; dim '      waiting for the dev server to come up...'
UP=0
for _ in $(seq 1 40); do
  sleep 0.7
  if curl -fsS -o /dev/null http://localhost:1420 2>/dev/null; then UP=1; break; fi
done

echo
if [ "$UP" -eq 1 ]; then
  (command -v open >/dev/null && open http://localhost:1420) || \
  (command -v xdg-open >/dev/null && xdg-open http://localhost:1420) || true
  gold '    LEAR IS LIVE  ->  http://localhost:1420'
  echo
  dim  '    Scroll the landing, hit DIRECTION for the cinematic sequence,'
  dim  '    then Enter Console to watch the ignition.'
else
  err 'The UI did not respond in time. Logs: /tmp/lear-ui.log /tmp/lear-backend.log'
  dim "    cd $TARGET && npm start"
fi
echo
dim "    Installed at: $TARGET"
dim  '    To run again later:  npm start'
echo
