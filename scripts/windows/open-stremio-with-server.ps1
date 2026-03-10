param(
  [string]$Port = "7000",
  [string]$StremioPath = ""
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Resolve-StremioPath {
  param([string]$RequestedPath)

  if ($RequestedPath) {
    if (Test-Path $RequestedPath) {
      return (Resolve-Path $RequestedPath).Path
    }
    throw "Stremio executable was not found at '$RequestedPath'."
  }

  $candidates = @(
    "$Env:LocalAppData\Programs\LNV\Stremio-4\stremio.exe",
    "$Env:LocalAppData\Programs\stremio\stremio.exe",
    "$Env:ProgramFiles\LNV\Stremio-4\stremio.exe",
    "$Env:ProgramFiles(x86)\LNV\Stremio-4\stremio.exe"
  )

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path $candidate)) {
      return (Resolve-Path $candidate).Path
    }
  }

  throw "Could not find Stremio automatically. Re-run with -StremioPath 'C:\path\to\stremio.exe'."
}

function Ensure-Dependency {
  param([string]$CommandName)
  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw "$CommandName was not found. Install Node.js first, then rerun this script."
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

Ensure-Dependency "node"
Ensure-Dependency "npm"

$stremioExe = Resolve-StremioPath -RequestedPath $StremioPath

Write-Step "Starting local addon server on port $Port"
$Env:PORT = $Port
$serverProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "start" -WorkingDirectory $repoRoot -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 3

if ($serverProcess.HasExited) {
  throw "The addon server exited immediately. Run 'npm start' manually to inspect the error."
}

Write-Step "Opening Stremio"
Start-Process -FilePath $stremioExe

Write-Host ""
Write-Host "Server PID: $($serverProcess.Id)" -ForegroundColor Green
Write-Host "Addon UI: http://localhost:$Port" -ForegroundColor Green
Write-Host "Close the server later with: Stop-Process -Id $($serverProcess.Id)" -ForegroundColor Yellow
