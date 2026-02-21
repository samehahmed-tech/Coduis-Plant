$ErrorActionPreference = 'Stop'

$startupDir = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDir 'RestoFlow Print Bridge.lnk'

if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force
    Write-Host "Removed startup shortcut: $shortcutPath"
} else {
    Write-Host 'Startup shortcut was not found. Nothing to remove.'
}
