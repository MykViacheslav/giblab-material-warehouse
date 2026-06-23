param([string]$ServerUrl = "http://localhost:3080/")

if ($ServerUrl -notmatch "^https?://") {
  $ServerUrl = "http://$ServerUrl"
}

$EdgePaths = @(
  "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$Edge = $EdgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($Edge) {
  Start-Process -FilePath $Edge -ArgumentList "--app=$ServerUrl"
} else {
  Start-Process $ServerUrl
}
