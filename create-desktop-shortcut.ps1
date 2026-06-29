$ErrorActionPreference = "Stop"

$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Target = Join-Path $AppDir "Magazyn GibLab.exe"
if (-not (Test-Path $Target)) {
  & (Join-Path $AppDir "build-launcher.ps1")
}
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "Magazyn GibLab.lnk"

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Target
$Shortcut.WorkingDirectory = $AppDir

$Icon = "C:\GibLabLocal\GibLabLocal.exe"
if (Test-Path $Icon) {
  $Shortcut.IconLocation = $Icon
} else {
  $Shortcut.IconLocation = "$Target,0"
}

$Shortcut.Save()
Write-Host "Utworzono skrót: $ShortcutPath"
