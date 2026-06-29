$ErrorActionPreference = "Stop"

$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Source = Join-Path $AppDir "launcher\MagazynGibLabLauncher.cs"
$Output = Join-Path $AppDir "Magazyn GibLab.exe"

$CompilerCandidates = @(
  "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe",
  "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319\csc.exe"
)

$Compiler = $CompilerCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $Compiler) {
  throw "Nie znaleziono kompilatora C# .NET Framework 4."
}

& $Compiler `
  /nologo `
  /target:winexe `
  /out:$Output `
  /reference:System.dll `
  /reference:System.Windows.Forms.dll `
  $Source

Write-Host "Utworzono: $Output"
