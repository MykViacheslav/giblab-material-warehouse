$RuleName = "Magazyn GibLab 3080"

if (-not (Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3080
}

Write-Host "Reguła zapory gotowa: $RuleName"
