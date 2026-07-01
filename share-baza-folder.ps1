$ShareName = "Baza"
$SharePath = "C:\Baza"

$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator
)

if (-not $isAdmin) {
  Write-Host "Potrzebne uprawnienia administratora. Otwieram okno UAC..."
  Start-Process powershell -Verb RunAs -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", "`"$PSCommandPath`""
  )
  exit
}

$folders = @(
  $SharePath,
  "$SharePath\MagazynGibLab",
  "$SharePath\MagazynGibLab\Backupy",
  "$SharePath\MagazynGibLab\Eksporty",
  "$SharePath\MagazynGibLab\Importy",
  "$SharePath\MagazynGibLab\Dokumenty"
)

foreach ($folder in $folders) {
  New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

$everyoneSid = New-Object System.Security.Principal.SecurityIdentifier "S-1-1-0"
$everyone = $everyoneSid.Translate([System.Security.Principal.NTAccount]).Value

icacls $SharePath /grant "${everyone}:(OI)(CI)M" /T | Out-Null

$existing = Get-SmbShare -Name $ShareName -ErrorAction SilentlyContinue
if (-not $existing) {
  New-SmbShare -Name $ShareName -Path $SharePath -ChangeAccess $everyone -Description "Wspolna baza plikow Magazyn GibLab" | Out-Null
} else {
  Grant-SmbShareAccess -Name $ShareName -AccountName $everyone -AccessRight Change -Force | Out-Null
}

try {
  Enable-NetFirewallRule -DisplayGroup "File and Printer Sharing" -ErrorAction SilentlyContinue
  Enable-NetFirewallRule -DisplayGroup "Udostępnianie plików i drukarek" -ErrorAction SilentlyContinue
} catch {
  Write-Host "Nie udalo sie automatycznie wlaczyc reguly File and Printer Sharing."
}

Write-Host "Gotowe."
Write-Host "Folder lokalny: $SharePath"
Write-Host "Adres sieciowy po nazwie: \\$env:COMPUTERNAME\$ShareName"
Write-Host "Adres sieciowy po IP: \\192.168.8.186\$ShareName"
