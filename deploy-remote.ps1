param(
  [string]$ComputerName = "192.168.0.5",
  [pscredential]$Credential,
  [string]$RemotePath = "D:\Codex\CRM\retail-crm",
  [int]$Port = 8790,
  [string]$PublicHost = "",
  [switch]$IncludeBundledNode
)

$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$PublicHostValue = if ($PublicHost) { $PublicHost } else { $ComputerName }
$StageRoot = Join-Path $env:TEMP "retail-crm-deploy-stage"
$PackagePath = Join-Path $env:TEMP "retail-crm-deploy.zip"
$BundledNode = "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node"

Write-Host "Preparing B2C Retail CRM deployment package..."
Remove-Item -LiteralPath $StageRoot -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $PackagePath -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $StageRoot -Force | Out-Null

$robocopyArgs = @(
  $ProjectRoot,
  $StageRoot,
  "/MIR",
  "/XD", ".git", "data", "data-test", "node_modules", "dist", ".runtime",
  "/XF", "retail-crm.config.json", "*.tmp", "*.log"
)
& robocopy @robocopyArgs | Out-Null
if ($LASTEXITCODE -gt 7) {
  throw "robocopy failed with exit code $LASTEXITCODE"
}

if ($IncludeBundledNode) {
  if (-not (Test-Path $BundledNode)) {
    throw "Bundled Node was not found at $BundledNode"
  }
  $RuntimeNode = Join-Path $StageRoot ".runtime\node"
  New-Item -ItemType Directory -Path $RuntimeNode -Force | Out-Null
  & robocopy $BundledNode $RuntimeNode /MIR | Out-Null
  if ($LASTEXITCODE -gt 7) {
    throw "Node robocopy failed with exit code $LASTEXITCODE"
  }
}

Compress-Archive -Path (Join-Path $StageRoot "*") -DestinationPath $PackagePath -Force

Write-Host "Opening PowerShell session to $ComputerName..."
$SessionParams = @{ ComputerName = $ComputerName }
if ($Credential) {
  $SessionParams.Credential = $Credential
}
$Session = New-PSSession @SessionParams

try {
  $RemoteZip = Invoke-Command -Session $Session -ScriptBlock {
    Join-Path $env:TEMP "retail-crm-deploy.zip"
  }

  Write-Host "Copying package to $ComputerName..."
  Copy-Item -ToSession $Session -Path $PackagePath -Destination $RemoteZip -Force

  Write-Host "Expanding package to $RemotePath..."
  Invoke-Command -Session $Session -ArgumentList $RemotePath, $RemoteZip -ScriptBlock {
    param($TargetPath, $ZipPath)
    $Parent = Split-Path -Parent $TargetPath
    $ExtractPath = Join-Path $env:TEMP ("retail-crm-extract-" + [guid]::NewGuid().ToString("N"))
    New-Item -ItemType Directory -Path $Parent -Force | Out-Null
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
    New-Item -ItemType Directory -Path $ExtractPath -Force | Out-Null
    try {
      if (Get-Command Expand-Archive -ErrorAction SilentlyContinue) {
        Expand-Archive -Path $ZipPath -DestinationPath $ExtractPath -Force
      } else {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($ZipPath, $ExtractPath)
      }
      Copy-Item -Path (Join-Path $ExtractPath "*") -Destination $TargetPath -Recurse -Force
    } finally {
      Remove-Item -LiteralPath $ExtractPath -Recurse -Force -ErrorAction SilentlyContinue
      Remove-Item -LiteralPath $ZipPath -Force -ErrorAction SilentlyContinue
    }
  }

  $NodeStatus = Invoke-Command -Session $Session -ArgumentList $RemotePath -ScriptBlock {
    param($TargetPath)
    $LocalNode = Join-Path $TargetPath ".runtime\node\bin\node.exe"
    if (Test-Path $LocalNode) {
      return ".runtime\node\bin\node.exe"
    }
    $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($NodeCommand) {
      return $NodeCommand.Source
    }
    return ""
  }

  Write-Host ""
  Write-Host "Deployment files copied."
  if ($NodeStatus) {
    Write-Host "Node found: $NodeStatus"
  } else {
    Write-Host "Node was not found on the remote server."
    Write-Host "Install Node.js LTS on $ComputerName or rerun this script with -IncludeBundledNode."
  }
  Write-Host ""
  Write-Host "Run in the remote session:"
  Write-Host "cd $RemotePath"
  Write-Host "powershell -ExecutionPolicy Bypass -File .\start-server.ps1 -HostName 0.0.0.0 -Port $Port -PublicHost $PublicHostValue -DataDir data"
  Write-Host ""
  Write-Host "Open: http://$PublicHostValue`:$Port/index.html"
} finally {
  Remove-PSSession $Session
}
