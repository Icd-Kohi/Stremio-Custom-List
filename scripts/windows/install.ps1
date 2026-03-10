param(
  [switch]$SkipNodeCheck
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Message)
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Assert-Command {
  param(
    [string]$CommandName,
    [string]$HelpMessage
  )

  if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
    throw $HelpMessage
  }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repoRoot

Write-Step "Preparing Windows environment for stremio-custom-lists"

if (-not $SkipNodeCheck) {
  Assert-Command -CommandName "node" -HelpMessage "Node.js was not found. Install the current LTS from https://nodejs.org/ and rerun this script."
  Assert-Command -CommandName "npm" -HelpMessage "npm was not found. Reinstall Node.js with npm included and rerun this script."
}

Write-Step "Installing npm dependencies"
npm install

Write-Step "Running test suite"
npm test

Write-Step "Installation complete"
Write-Host "Next steps:" -ForegroundColor Green
Write-Host "  1. Run scripts\windows\open-stremio-with-server.bat to start the server and open Stremio."
Write-Host "  2. Open http://localhost:7000 in your browser to create a token and manage lists."
