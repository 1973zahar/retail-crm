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

& $NodePath .\server.mjs --host $HostName --port $Port --public-host $PublicHost --data-dir $DataDir
