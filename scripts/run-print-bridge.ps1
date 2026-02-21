$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$bridgeDir = Join-Path $repoRoot 'hardware-bridge'
$logDir = Join-Path $env:LOCALAPPDATA 'RestoFlow\Logs'
$logFile = Join-Path $logDir 'print-bridge.log'

if (-not (Test-Path $bridgeDir)) {
    throw "Bridge directory not found: $bridgeDir"
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is not installed or not in PATH.'
}

if (-not (Test-Path $logDir)) {
    New-Item -Path $logDir -ItemType Directory -Force | Out-Null
}

Set-Location $bridgeDir

while ($true) {
    "[$(Get-Date -Format o)] starting print bridge..." | Out-File -FilePath $logFile -Append -Encoding utf8
    node .\index.js *>> $logFile
    "[$(Get-Date -Format o)] print bridge stopped, retrying in 3 seconds..." | Out-File -FilePath $logFile -Append -Encoding utf8
    Start-Sleep -Seconds 3
}
