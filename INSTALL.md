# Installing Lear

Three ways in. **Method A avoids the browser download entirely**, which is the
only reliable way around the security prompt — see the section at the bottom for
why that prompt appears and what it actually means.

---

## A. Clone and install (recommended — no download warning)

Nothing is fetched by your browser, so nothing gets flagged. Requires `git`.

**macOS / Linux**
```bash
git clone --branch arena/01a0ec0b-lear-final --depth 1 \
  https://github.com/aviunion1348-cloud/lear.final.git lear
cd lear && bash install.sh --local
```

**Windows (PowerShell)**
```powershell
git clone --branch arena/01a0ec0b-lear-final --depth 1 `
  https://github.com/aviunion1348-cloud/lear.final.git lear
cd lear; powershell -ExecutionPolicy Bypass -File .\install.ps1 -Local
```

`--local` / `-Local` skips the download step and installs from the checkout you
already have.

---

## B. One-command install

Fetches the archive, installs both halves of the stack, starts them, opens the
console.

**Windows**
```powershell
powershell -ExecutionPolicy Bypass -c "irm https://github.com/aviunion1348-cloud/lear.final/raw/arena/01a0ec0b-lear-final/install.ps1 | iex"
```

**macOS / Linux**
```bash
curl -fsSL https://github.com/aviunion1348-cloud/lear.final/raw/arena/01a0ec0b-lear-final/install.sh | bash
```

---

## C. Download the archive by hand

[learfinal.zip](https://github.com/aviunion1348-cloud/lear.final/raw/arena/01a0ec0b-lear-final/learfinal.zip)

```bash
unzip learfinal.zip && cd lear-premium-ui
python -m venv .venv && .venv/bin/pip install -e ".[dev]"
cd desktop && npm install && cd ..
cp .env.example .env
.venv/bin/python -m uvicorn prash.server:app --port 8000 &
cd desktop && npm run dev
```

Then open <http://localhost:1420>.

---

## Verify what you downloaded

Checksums for every published file live in
[`SHA256SUMS.txt`](SHA256SUMS.txt), regenerated on every release.

**Windows**
```powershell
Get-FileHash .\learfinal.zip -Algorithm SHA256
```

**macOS / Linux**
```bash
shasum -a 256 learfinal.zip
```

Compare the result against `SHA256SUMS.txt`. If it matches, the file you have is
byte-for-byte the file that was published.

---

## About the security warning

You will probably see one of these:

- Chrome/Edge: *"learfinal.zip isn't commonly downloaded and may be dangerous"*
- Windows: *"Windows protected your PC"* (SmartScreen) on `INSTALL-LEAR.bat`

**Neither is a virus detection.** No scanner has found anything in these files.
Both are *reputation* warnings, and they are triggered by exactly the properties
this project has by definition:

1. The file is new and has been downloaded a handful of times. SmartScreen and
   Chrome's Safe Browsing both score partly on how many people have already
   downloaded a given binary. A brand-new file starts at zero and is warned
   about until it accumulates a reputation.
2. `INSTALL-LEAR.bat` is an unsigned script that launches PowerShell, which is a
   textbook heuristic pattern — it is also what every legitimate one-line
   installer does.

**The only real fix is an Authenticode code-signing certificate**, which costs
a few hundred dollars a year from a CA and has to be issued to a verified legal
entity. I cannot produce one, and I am not going to tell you a warning is
"nothing" and leave it at that — so the honest options are:

- **Use Method A.** Cloning bypasses the download reputation system completely.
  This is what I would do.
- **Verify the checksum** (above) and then click through — *More info →
  Run anyway* on Windows, or *Keep* in Chrome.
- **Read the installer first.** `install.ps1` and `install.sh` are plain text,
  fully commented, and do nothing hidden. Open them in the browser before you
  run anything.

What the installers actually do: check Python 3.10+ and Node 18+, create a
virtualenv in the install directory, `pip install -e ".[dev]"`, `npm install`,
copy `.env.example` to `.env`, and start uvicorn on :8000 and vite on :1420.
No admin rights, no PATH changes, no registry writes, no telemetry, nothing
installed outside the folder you run it in.
