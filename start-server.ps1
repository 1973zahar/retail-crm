param(
  [string]$HostName = "0.0.0.0",
  [int]$Port = 8790,
  [string]$PublicHost = "192.168.0.5",
  [string]$DataDir = "data",
  [string]$NodePath = ""
)

$ErrorActionPreference = "Stop"

if (-not $NodePath) {
  $BundledNode = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  $LocalRuntimeNode = Join-Path $PSScriptRoot ".runtime\node\bin\node.exe"
  if (Test-Path $LocalRuntimeNode) {
    $NodePath = $LocalRuntimeNode
  } elseif (Test-Path $BundledNode) {
    $NodePath = $BundledNode
  } else {
    $NodePath = "node"
  }
}

Write-Host "Starting B2C Retail CRM server..."
Write-Host "Public URL: http://$PublicHost`:$Port/index.html"
Write-Host "Data dir: $DataDir"

$CanUseNode = $false
if ($NodePath -in @("server-powershell", "powershell", "disabled")) {
  Write-Host "Node runtime disabled by NodePath=$NodePath; falling back to PowerShell TCP server."
} else {
  try {
    $NodeVersionOutput = & $NodePath --version 2>&1
    if ($LASTEXITCODE -eq 0) {
      $CanUseNode = $true
      Write-Host "Node runtime: $NodeVersionOutput"
    } else {
      Write-Host "Node runtime is not usable on this server:"
      Write-Host $NodeVersionOutput
    }
  } catch {
    Write-Host "Node runtime is not available: $($_.Exception.Message)"
  }
}

if ($CanUseNode) {
  & $NodePath (Join-Path $PSScriptRoot "server.mjs") --host $HostName --port $Port --public-host $PublicHost --data-dir $DataDir
} else {
  Write-Host "Falling back to PowerShell TCP server."
  & (Join-Path $PSScriptRoot "server.ps1") -HostName $HostName -Port $Port -PublicHost $PublicHost -DataDir $DataDir
}
