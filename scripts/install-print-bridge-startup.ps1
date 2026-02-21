$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$bridgeDir = Join-Path $repoRoot 'hardware-bridge'
$runner = Join-Path $repoRoot 'scripts\run-print-bridge.ps1'
$startupDir = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDir 'RestoFlow Print Bridge.lnk'
$bridgeEnv = Join-Path $bridgeDir '.env'
$bridgeEnvExample = Join-Path $bridgeDir '.env.example'

if (-not (Test-Path $bridgeDir)) {
    throw "Bridge directory not found: $bridgeDir"
}

if (-not (Test-Path $runner)) {
    throw "Runner script not found: $runner"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm is not installed or not in PATH.'
}

Push-Location $bridgeDir
try {
    npm install
} finally {
    Pop-Location
}

if (-not (Test-Path $bridgeEnv) -and (Test-Path $bridgeEnvExample)) {
    Copy-Item $bridgeEnvExample $bridgeEnv
    Write-Host "Created $bridgeEnv from template. Update PRINT_GATEWAY_TOKEN and PRINT_BRANCH_ID before go-live."
}

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runner`""
$shortcut.WorkingDirectory = $repoRoot
$shortcut.IconLocation = "$env:SystemRoot\System32\shell32.dll,25"
$shortcut.Description = 'Starts RestoFlow Print Bridge on user login'
$shortcut.Save()

Write-Host "Installed startup shortcut: $shortcutPath"
Write-Host 'Print Bridge will start automatically on next sign-in.'
