$ErrorActionPreference = "Stop"

Write-Host "Harness Android setup starting..."

foreach ($cmd in @("git","node","npm","npx")) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        throw "Required command '$cmd' was not found in PATH."
    }
}

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

Write-Host "Node:" (node --version)
Write-Host "npm :" (npm --version)

Write-Host "Installing Capacitor dependencies..."
npm install

Write-Host "Building deterministic Android web staging payload..."
npm run build:web

if (-not (Test-Path (Join-Path $here "android"))) {
    Write-Host "Generating native Android project..."
    npx cap add android
} else {
    Write-Host "Native Android project already exists; skipping cap add."
}

Write-Host "Synchronizing generated Android project..."
npm run cap:sync

Write-Host ""
Write-Host "PASS: Capacitor Android project generated/synchronized."
Write-Host "Next command when ready: npm run cap:open"
Write-Host "No signing or publishing was performed."
