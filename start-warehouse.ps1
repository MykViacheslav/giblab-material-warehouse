$ErrorActionPreference = "Stop"

$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Port = if ($env:PORT) { $env:PORT } else { "3080" }
$Url = "http://localhost:$Port/"
$HealthUrl = "http://localhost:$Port/api/health"

function Test-WarehouseServer {
  try {
    Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

if (-not (Test-WarehouseServer)) {
  Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $AppDir -WindowStyle Hidden
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-WarehouseServer) { break }
  }
}

$EdgePaths = @(
  "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$Edge = $EdgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($Edge) {
  Start-Process -FilePath $Edge -ArgumentList "--app=$Url"
} else {
  Start-Process $Url
}
