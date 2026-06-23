$ErrorActionPreference = "Stop"

$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Target = Join-Path $AppDir "Magazyn GibLab.cmd"
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "Magazyn GibLab.lnk"

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Target
$Shortcut.WorkingDirectory = $AppDir

$Icon = "C:\GibLabLocal\GibLabLocal.exe"
if (Test-Path $Icon) {
  $Shortcut.IconLocation = $Icon
}

$Shortcut.Save()
Write-Host "Utworzono skrót: $ShortcutPath"
