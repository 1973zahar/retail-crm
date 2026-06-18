$ErrorActionPreference = "Stop"

$root = "D:\Codex\CRM\retail-crm"
$logDir = Join-Path $root "data"
$runId = Get-Date -Format "yyyyMMdd-HHmmss"
$stdoutLog = Join-Path $logDir "retail-b2c-server-$runId.out.log"
$stderrLog = Join-Path $logDir "retail-b2c-server-$runId.err.log"
$autostartLog = Join-Path $logDir "retail-b2c-autostart.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $root

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
Add-Content -Path $autostartLog -Value "[$stamp] starting Retail B2C on MESER 192.168.0.5:8790 runId=$runId"

$listeners = @()
$lines = cmd /c 'netstat -ano | findstr :8790'
foreach ($line in $lines) {
  if ($line -match 'LISTENING\s+(\d+)') {
    $processId = [int]$matches[1]
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
    $listeners += [pscustomobject]@{
      ProcessId = $processId
      CommandLine = if ($process) { [string]$process.CommandLine } else { "" }
    }
  }
}

if ($listeners.Count -gt 0) {
  $retailListener = $listeners | Where-Object { $_.CommandLine -like "*retail-crm*" -and ($_.CommandLine -like "*server.mjs*" -or $_.CommandLine -like "*server.ps1*") } | Select-Object -First 1
  if ($retailListener) {
    Add-Content -Path $autostartLog -Value "[$stamp] port 8790 already has Retail B2C listener pid=$($retailListener.ProcessId); no duplicate start"
    exit 0
  }

  $summary = ($listeners | ForEach-Object { "pid=$($_.ProcessId) cmd=$($_.CommandLine)" }) -join " | "
  Add-Content -Path $autostartLog -Value "[$stamp] port 8790 occupied by unknown listener; stopped before start: $summary"
  exit 2
}

$localRuntimeNode = Join-Path $root ".runtime\node\bin\node.exe"
if (Test-Path $localRuntimeNode) {
  $process = Start-Process -FilePath $localRuntimeNode -ArgumentList @("server.mjs", "--host", "0.0.0.0", "--port", "8790", "--public-host", "192.168.0.5", "--data-dir", "data") -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru
  Add-Content -Path $autostartLog -Value "[$stamp] started Node Retail B2C pid=$($process.Id) stdout=$stdoutLog stderr=$stderrLog"
  exit 0
}

$process = Start-Process -FilePath "powershell.exe" -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $root "start-server.ps1"), "-HostName", "0.0.0.0", "-Port", "8790", "-PublicHost", "192.168.0.5", "-DataDir", "data", "-NodePath", "server-powershell") -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -PassThru
Add-Content -Path $autostartLog -Value "[$stamp] started PowerShell Retail B2C pid=$($process.Id) stdout=$stdoutLog stderr=$stderrLog"
