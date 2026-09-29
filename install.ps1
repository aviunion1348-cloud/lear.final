<#
    LEAR — ONE-COMMAND INSTALLER
    ============================================================================
    Downloads leardevop.zip, extracts it, installs both halves of the stack,
    starts them, and opens the immersive console in your browser.

    Run it with a single paste:

        powershell -ExecutionPolicy Bypass -c "irm https://raw.githubusercontent.com/aviunion1348-cloud/lear.final/arena/01a0ec0b-lear-final/install.ps1 | iex"

    What it actually does (nothing hidden):
      1. checks Python 3.10+ and Node 18+ are present
      2. downloads leardevop.zip from this repository
      3. extracts to .\lear-premium-ui
      4. creates a virtualenv and pip-installs the backend
      5. npm-installs the frontend
      6. copies .env.example to .env if you don't have one
      7. launches uvicorn (:8000) and vite (:1420) in two windows
      8. opens http://localhost:1420

    It installs into the CURRENT directory. It does not touch anything else,
    does not require admin, and does not modify your PATH or registry.
#>

$ErrorActionPreference = 'Stop'

$Repo    = 'aviunion1348-cloud/lear.final'
$Branch  = 'arena/01a0ec0b-lear-final'
$ZipName = 'leardevop.zip'
$ZipUrl  = "https://github.com/$Repo/raw/$Branch/$ZipName"
$Target  = Join-Path (Get-Location) 'lear-premium-ui'

function Write-Gold($t) { Write-Host $t -ForegroundColor Yellow }
function Write-Dim($t)  { Write-Host $t -ForegroundColor DarkGray }
function Write-Ok($t)   { Write-Host "  [OK] $t" -ForegroundColor Green }
function Write-Err($t)  { Write-Host "  [!!] $t" -ForegroundColor Red }

Write-Host ''
Write-Gold '    ##       ########    ###    ########'
Write-Gold '    ##       ##         ## ##   ##     ##'
Write-Gold '    ##       ######    ##   ##  ########'
Write-Gold '    ##       ##       ######### ##   ##'
Write-Gold '    ######## ######## ##     ## ##     ##'
Write-Host ''
Write-Dim  '    AI DevOps agent - gold/obsidian immersive console'
Write-Dim  '    ------------------------------------------------'
Write-Host ''

# ---- 1. prerequisites -------------------------------------------------------
Write-Gold '[1/7] Checking prerequisites'

$py = $null
foreach ($c in @('python', 'python3', 'py')) {
    try {
        $v = & $c --version 2>&1
        if ($v -match 'Python (\d+)\.(\d+)') {
            if ([int]$Matches[1] -ge 3 -and [int]$Matches[2] -ge 10) { $py = $c; break }
        }
    } catch { }
}
if (-not $py) {
    Write-Err 'Python 3.10+ not found. Install it from https://www.python.org/downloads/'
    Write-Err 'Tick "Add python.exe to PATH" in the installer, then re-run this command.'
    return
}
Write-Ok "Python: $(& $py --version)"

try { $nodeV = node --version } catch {
    Write-Err 'Node.js 18+ not found. Install it from https://nodejs.org/ then re-run.'
    return
}
if ([int](($nodeV -replace '^v','') -split '\.')[0] -lt 18) {
    Write-Err "Node 18+ required, found $nodeV. Update from https://nodejs.org/"
    return
}
Write-Ok "Node: $nodeV"

# ---- 2. download ------------------------------------------------------------
Write-Host ''
Write-Gold "[2/7] Downloading $ZipName"
Write-Dim  "      $ZipUrl"
$zipPath = Join-Path (Get-Location) $ZipName
$ProgressPreference = 'SilentlyContinue'   # ~10x faster Invoke-WebRequest
Invoke-WebRequest -Uri $ZipUrl -OutFile $zipPath -UseBasicParsing
$sizeMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Ok "Downloaded ${sizeMB} MB"

# ---- 3. extract -------------------------------------------------------------
Write-Host ''
Write-Gold '[3/7] Extracting'
if (Test-Path $Target) {
    Write-Dim "      existing folder found - moving it to lear-premium-ui.bak"
    if (Test-Path "$Target.bak") { Remove-Item "$Target.bak" -Recurse -Force }
    Move-Item $Target "$Target.bak"
}
Expand-Archive -Path $zipPath -DestinationPath (Get-Location) -Force
if (-not (Test-Path $Target)) { Write-Err "Extract failed - $Target not found"; return }
Write-Ok "Extracted to $Target"
Set-Location $Target

# ---- 4. python backend ------------------------------------------------------
Write-Host ''
Write-Gold '[4/7] Installing the backend (this takes a minute)'
& $py -m venv .venv
$venvPy = Join-Path $Target '.venv\Scripts\python.exe'
& $venvPy -m pip install --upgrade pip --quiet
& $venvPy -m pip install -e ".[dev]" --quiet
Write-Ok 'Backend installed'

# ---- 5. frontend ------------------------------------------------------------
Write-Host ''
Write-Gold '[5/7] Installing the premium UI'
Push-Location desktop
npm install --no-audit --no-fund --loglevel=error
Pop-Location
Write-Ok 'UI installed'

# ---- 6. config --------------------------------------------------------------
Write-Host ''
Write-Gold '[6/7] Configuration'
if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Ok 'Created .env from the template'
    Write-Dim '      Add ONE model key (DEEPSEEK_API_KEY or KIMI_API_KEY) to unlock the brain.'
    Write-Dim '      Leave unused keys completely blank - never a placeholder.'
} else {
    Write-Ok '.env already exists - left untouched'
}

# ---- 7. launch --------------------------------------------------------------
Write-Host ''
Write-Gold '[7/7] Starting Lear'
Start-Process -FilePath $venvPy `
    -ArgumentList '-m','uvicorn','prash.server:app','--host','127.0.0.1','--port','8000' `
    -WorkingDirectory $Target -WindowStyle Minimized
Write-Ok 'Backend starting on http://127.0.0.1:8000'

Start-Process -FilePath 'cmd.exe' `
    -ArgumentList '/c','npm','run','dev' `
    -WorkingDirectory (Join-Path $Target 'desktop') -WindowStyle Minimized
Write-Ok 'UI starting on http://localhost:1420'

Write-Dim ''
Write-Dim '      waiting for the dev server to come up...'
$up = $false
foreach ($i in 1..40) {
    Start-Sleep -Milliseconds 700
    try {
        $r = Invoke-WebRequest 'http://localhost:1420' -UseBasicParsing -TimeoutSec 2
        if ($r.StatusCode -eq 200) { $up = $true; break }
    } catch { }
}

Write-Host ''
if ($up) {
    Start-Process 'http://localhost:1420'
    Write-Gold '    LEAR IS LIVE  ->  http://localhost:1420'
    Write-Host ''
    Write-Dim  '    Scroll the landing, hit DIRECTION for the cinematic sequence,'
    Write-Dim  '    then Enter Console to watch the ignition.'
} else {
    Write-Err 'The UI did not respond in time. Start it by hand:'
    Write-Dim "    cd $Target"
    Write-Dim '    npm start'
}
Write-Host ''
Write-Dim  "    Installed at: $Target"
Write-Dim  '    To run again later:  npm start'
Write-Host ''
