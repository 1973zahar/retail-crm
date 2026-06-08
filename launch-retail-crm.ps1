param(
  [string]$HostName = "0.0.0.0",
  [int]$Port = 18810,
  [string]$PublicHost = "",
  [string]$DataDir = "data",
  [int]$StartupTimeoutSec = 20,
  [ValidateSet("Normal", "Minimized", "Hidden")]
  [string]$ServerWindowStyle = "Minimized",
  [switch]$NoBrowser,
  [switch]$KeepOpen
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartScript = Join-Path $ScriptDir "start-server.ps1"

if (-not (Test-Path -LiteralPath $StartScript)) {
  throw "Cannot find start-server.ps1 at $StartScript"
}

function Test-RetailLanCandidate {
  param([string]$Address)

  if (-not $Address) {
    return $false
  }

  if ($Address -eq "127.0.0.1" -or $Address -eq "0.0.0.0" -or $Address -eq "255.255.255.255") {
    return $false
  }

  if ($Address.StartsWith("169.254.")) {
    return $false
  }

  return ($Address -match '^\d{1,3}(\.\d{1,3}){3}$')
}

function Resolve-RetailLanPublicHost {
  $candidates = @()

  try {
    $interfaces = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()
    foreach ($adapter in $interfaces) {
      if ($adapter.OperationalStatus -ne [System.Net.NetworkInformation.OperationalStatus]::Up) {
        continue
      }

      if ($adapter.NetworkInterfaceType -eq [System.Net.NetworkInformation.NetworkInterfaceType]::Loopback -or
          $adapter.NetworkInterfaceType -eq [System.Net.NetworkInformation.NetworkInterfaceType]::Tunnel -or
          $adapter.NetworkInterfaceType -eq [System.Net.NetworkInformation.NetworkInterfaceType]::Ppp) {
        continue
      }

      foreach ($unicast in $adapter.GetIPProperties().UnicastAddresses) {
        if ($unicast.Address.AddressFamily -ne [System.Net.Sockets.AddressFamily]::InterNetwork) {
          continue
        }

        $address = $unicast.Address.ToString()
        if (Test-RetailLanCandidate $address) {
          $candidates += $address
        }
      }
    }
  } catch {
    $candidates = @()
  }

  $preferred = $candidates | Where-Object { $_ -like "192.168.*" } | Select-Object -First 1
  if ($preferred) {
    return $preferred
  }

  $preferred = $candidates | Where-Object { $_ -like "10.*" } | Select-Object -First 1
  if ($preferred) {
    return $preferred
  }

  $preferred = $candidates | Where-Object { $_ -match '^172\.(1[6-9]|2[0-9]|3[0-1])\.' } | Select-Object -First 1
  if ($preferred) {
    return $preferred
  }

  if ($candidates.Count -gt 0) {
    return $candidates[0]
  }

  throw "Cannot auto-detect a LAN IPv4 address. Pass -PublicHost <LAN IP> explicitly."
}

if (-not $PublicHost) {
  if ($HostName -eq "0.0.0.0" -or $HostName -eq "*" -or $HostName -eq "+") {
    $PublicHost = Resolve-RetailLanPublicHost
  } elseif ($HostName -eq "127.0.0.1" -or $HostName -eq "localhost") {
    throw "Retail B2C launcher is LAN-only. Use -HostName 0.0.0.0 -PublicHost <LAN IP>."
  } else {
    $PublicHost = $HostName
  }
}

if ($PublicHost -eq "127.0.0.1" -or $PublicHost -eq "localhost") {
  throw "Retail B2C launcher is LAN-only. PublicHost cannot be $PublicHost."
}

function Resolve-RetailPath {
  param([string]$PathValue)

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return $PathValue
  }

  return (Join-Path $ScriptDir $PathValue)
}

$ResolvedDataDir = Resolve-RetailPath $DataDir
New-Item -ItemType Directory -Force -Path $ResolvedDataDir | Out-Null

$BaseUrl = "http://$PublicHost`:$Port"
$HealthUrl = "$BaseUrl/api/health"
$IndexUrl = "$BaseUrl/index.html"
$LauncherLog = Join-Path $ResolvedDataDir "retail-crm-launcher.log"
$ServerOutLog = Join-Path $ResolvedDataDir "retail-crm-server.out.log"
$ServerErrLog = Join-Path $ResolvedDataDir "retail-crm-server.err.log"
$ServerRunnerCmd = Join-Path $ResolvedDataDir "retail-crm-server-runner.cmd"

function Write-LauncherLog {
  param([string]$Message)

  $line = "{0} {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -LiteralPath $LauncherLog -Value $line -Encoding UTF8
}

function Test-RetailHealth {
  param([string]$Uri)

  try {
    $health = Invoke-RestMethod -UseBasicParsing -Uri $Uri -TimeoutSec 2
    if ($health -and ($health.ok -eq $true)) {
      return $health
    }
  } catch {
    return $null
  }

  return $null
}

function ConvertTo-CmdArgument {
  param([string]$Value)

  if ($Value.Contains('"')) {
    throw "Cannot quote command argument containing double quote: $Value"
  }

  return '"' + $Value + '"'
}

function Write-ServerRunner {
  $lines = @(
    "@echo off",
    "cd /d $(ConvertTo-CmdArgument $ScriptDir)",
    "powershell.exe -NoProfile -ExecutionPolicy Bypass -File $(ConvertTo-CmdArgument $StartScript) -HostName $(ConvertTo-CmdArgument $HostName) -Port $Port -PublicHost $(ConvertTo-CmdArgument $PublicHost) -DataDir $(ConvertTo-CmdArgument $ResolvedDataDir) 1>> $(ConvertTo-CmdArgument $ServerOutLog) 2>> $(ConvertTo-CmdArgument $ServerErrLog)"
  )

  Set-Content -LiteralPath $ServerRunnerCmd -Value $lines -Encoding ASCII
}

function Get-HealthVersion {
  param($Health)

  if ($Health.version) {
    return [string]$Health.version
  }

  if ($Health.appVersion) {
    return [string]$Health.appVersion
  }

  return ""
}

function Start-RetailServerProcess {
  Write-ServerRunner
  Write-LauncherLog "Starting server process host=$HostName port=$Port publicHost=$PublicHost runner=$ServerRunnerCmd"

  return Start-Process `
    -FilePath $ServerRunnerCmd `
    -WorkingDirectory $ScriptDir `
    -WindowStyle $ServerWindowStyle `
    -PassThru
}

Write-LauncherLog "Launcher requested URL=$IndexUrl dataDir=$ResolvedDataDir"

$ExistingHealth = Test-RetailHealth $HealthUrl
if ($ExistingHealth) {
  Write-Host "Retail B2C CRM is already running."
  Write-Host "URL: $IndexUrl"
  Write-LauncherLog "Existing healthy server detected build=$($ExistingHealth.build) revision=$($ExistingHealth.revision)"

  if (-not $NoBrowser) {
    Start-Process $IndexUrl | Out-Null
  }

  if (-not $KeepOpen) {
    exit 0
  }
}

if (-not $ExistingHealth) {
  Write-Host "Starting Retail B2C CRM..."
  Write-Host "URL: $IndexUrl"
  Write-Host "Data dir: $ResolvedDataDir"

  $Process = Start-RetailServerProcess
  Write-LauncherLog "Server process started pid=$($Process.Id)"
}


$Deadline = (Get-Date).AddSeconds($StartupTimeoutSec)
$Health = $ExistingHealth

while ((Get-Date) -lt $Deadline) {
  Start-Sleep -Milliseconds 500
  $Health = Test-RetailHealth $HealthUrl
  if ($Health) {
    break
  }
}

if (-not $Health) {
  $pidText = if ($Process) { [string]$Process.Id } else { "unknown" }
  Write-LauncherLog "Server did not become healthy before timeout. pid=$pidText"
  throw "Retail B2C CRM did not become ready within $StartupTimeoutSec seconds. Check $LauncherLog, $ServerOutLog and $ServerErrLog"
}

$HealthVersion = Get-HealthVersion $Health
Write-Host "Retail B2C CRM is ready."
Write-Host "Build: $($Health.build)"
Write-Host "Version: $HealthVersion"
Write-Host "URL: $IndexUrl"
Write-LauncherLog "Server ready build=$($Health.build) version=$HealthVersion revision=$($Health.revision)"

if (-not $NoBrowser) {
  Start-Process $IndexUrl | Out-Null
}

if ($KeepOpen) {
  Write-Host ""
  Write-Host "Launcher watchdog is running. Keep this window open while using Retail B2C CRM."
  Write-Host "Press Ctrl+C to stop the watcher."
  Write-LauncherLog "KeepOpen watchdog started."

  while ($true) {
    Start-Sleep -Seconds 15
    $LoopHealth = Test-RetailHealth $HealthUrl
    if ($LoopHealth) {
      continue
    }

    Write-Host "Retail B2C CRM is not responding. Restarting server..."
    Write-LauncherLog "KeepOpen watchdog detected missing health; restarting server."
    $Process = Start-RetailServerProcess
    Write-LauncherLog "KeepOpen restart process started pid=$($Process.Id)"
  }
}
