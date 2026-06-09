$ErrorActionPreference = "Stop"

$root = "D:\Codex\CRM\retail-crm"
$logDir = Join-Path $root "data"
$consoleLog = Join-Path $logDir "retail-b2c-server-console.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $root

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
Add-Content -Path (Join-Path $logDir "retail-b2c-autostart.log") -Value "[$stamp] starting Retail B2C on MESER 192.168.0.5:8790"

& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "start-server.ps1") -HostName 0.0.0.0 -Port 8790 -PublicHost 192.168.0.5 -DataDir data -NodePath server-powershell 2>&1 |
  Out-File -FilePath $consoleLog -Append -Encoding UTF8
