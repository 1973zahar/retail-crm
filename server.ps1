param(
  [string]$HostName = "0.0.0.0",
  [int]$Port = 8790,
  [string]$PublicHost = "192.168.0.5",
  [string]$DataDir = "data"
)

$ErrorActionPreference = "Stop"

$AppVersion = "2026.06.06.7"
$AppBuild = "20260606-b2c-login-session"
$RootDir = $PSScriptRoot
$ResolvedDataDir = if ([System.IO.Path]::IsPathRooted($DataDir)) { $DataDir } else { Join-Path $RootDir $DataDir }
$StatePath = Join-Path $ResolvedDataDir "retail-crm-state.json"
$SettingsPath = Join-Path $ResolvedDataDir "retail-crm-settings.json"
$PublicBaseUrl = "http://$PublicHost`:$Port"
$Utf8 = [System.Text.Encoding]::UTF8
$Ascii = [System.Text.Encoding]::ASCII

$MimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".svg" = "image/svg+xml"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".ico" = "image/x-icon"
}

function New-DefaultSettings {
  return @{
    mode = "server"
    publicHost = $PublicHost
    publicBaseUrl = $PublicBaseUrl
    apiBaseUrl = ""
    bindAddress = $HostName
    port = $Port
    storageBackend = "server-json"
    dataDir = $DataDir
    multiUser = $true
    externalAccess = $true
    allowLocalFallback = $true
    autoRefreshSeconds = 15
    lastSavedAt = ""
  }
}

function New-DefaultStateContainer {
  return @{
    revision = 0
    savedAt = ""
    savedBy = ""
    build = $AppBuild
    appVersion = $AppVersion
    conflict = $false
    state = $null
  }
}

function New-DefaultSettingsContainer {
  return @{
    revision = 0
    savedAt = ""
    savedBy = ""
    build = $AppBuild
    settings = New-DefaultSettings
  }
}

function Convert-ToJsonBytes($Value) {
  $json = $Value | ConvertTo-Json -Depth 100 -Compress
  return $Utf8.GetBytes($json + "`n")
}

function Read-JsonFile($Path, $Fallback) {
  if (-not (Test-Path -LiteralPath $Path)) {
    return $Fallback
  }
  $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  if (-not $raw) {
    return $Fallback
  }
  return $raw | ConvertFrom-Json
}

function Write-JsonFile($Path, $Value) {
  New-Item -ItemType Directory -Path (Split-Path -Parent $Path) -Force | Out-Null
  $temp = "$Path.$PID.$([guid]::NewGuid().ToString("N")).tmp"
  ($Value | ConvertTo-Json -Depth 100) + "`n" | Set-Content -LiteralPath $temp -Encoding UTF8
  Move-Item -LiteralPath $temp -Destination $Path -Force
}

function Normalize-Settings($Settings) {
  $defaults = New-DefaultSettings
  $source = @{}
  if ($Settings) {
    foreach ($property in $Settings.PSObject.Properties) {
      $source[$property.Name] = $property.Value
    }
  }
  foreach ($key in $defaults.Keys) {
    if (-not $source.ContainsKey($key) -or $null -eq $source[$key]) {
      $source[$key] = $defaults[$key]
    }
  }
  $source.port = [int]$source.port
  $source.multiUser = [bool]$source.multiUser
  $source.externalAccess = [bool]$source.externalAccess
  $source.allowLocalFallback = [bool]$source.allowLocalFallback
  $source.autoRefreshSeconds = [int]$source.autoRefreshSeconds
  return $source
}

function New-HealthPayload($StateContainer) {
  return @{
    ok = $true
    appVersion = $AppVersion
    build = $AppBuild
    mode = "server-powershell"
    host = $HostName
    publicHost = $PublicHost
    publicBaseUrl = $PublicBaseUrl
    port = $Port
    dataDir = $ResolvedDataDir
    revision = [int]($StateContainer.revision)
    savedAt = [string]($StateContainer.savedAt)
  }
}

function Get-StatusText([int]$StatusCode) {
  switch ($StatusCode) {
    200 { "OK" }
    204 { "No Content" }
    400 { "Bad Request" }
    403 { "Forbidden" }
    404 { "Not Found" }
    500 { "Internal Server Error" }
    default { "OK" }
  }
}

function Send-Bytes($Client, [int]$StatusCode, [string]$ContentType, [byte[]]$Bytes) {
  $stream = $Client.GetStream()
  $headers = @(
    "HTTP/1.1 $StatusCode $(Get-StatusText $StatusCode)"
    "Content-Type: $ContentType"
    "Content-Length: $($Bytes.Length)"
    "Access-Control-Allow-Origin: *"
    "Access-Control-Allow-Methods: GET,PUT,POST,OPTIONS"
    "Access-Control-Allow-Headers: Content-Type"
    "Cache-Control: no-store, no-cache, must-revalidate, max-age=0"
    "Connection: close"
    ""
    ""
  ) -join "`r`n"
  $headerBytes = $Ascii.GetBytes($headers)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Bytes.Length -gt 0) {
    $stream.Write($Bytes, 0, $Bytes.Length)
  }
}

function Send-Json($Client, [int]$StatusCode, $Value) {
  Send-Bytes $Client $StatusCode "application/json; charset=utf-8" (Convert-ToJsonBytes $Value)
}

function Send-Text($Client, [int]$StatusCode, [string]$Text) {
  Send-Bytes $Client $StatusCode "text/plain; charset=utf-8" ($Utf8.GetBytes($Text))
}

function Find-HeaderEnd([byte[]]$Bytes) {
  for ($index = 0; $index -le $Bytes.Length - 4; $index += 1) {
    if ($Bytes[$index] -eq 13 -and $Bytes[$index + 1] -eq 10 -and $Bytes[$index + 2] -eq 13 -and $Bytes[$index + 3] -eq 10) {
      return $index
    }
  }
  return -1
}

function Read-HttpRequest($Client) {
  $stream = $Client.GetStream()
  $buffer = New-Object byte[] 8192
  $memory = New-Object System.IO.MemoryStream
  $headerEnd = -1
  while ($headerEnd -lt 0) {
    $read = $stream.Read($buffer, 0, $buffer.Length)
    if ($read -le 0) {
      break
    }
    $memory.Write($buffer, 0, $read)
    $headerEnd = Find-HeaderEnd $memory.ToArray()
  }

  $allBytes = $memory.ToArray()
  if ($headerEnd -lt 0) {
    return $null
  }

  $headerText = $Ascii.GetString($allBytes, 0, $headerEnd)
  $lines = $headerText -split "`r`n"
  $requestLine = $lines[0]
  $parts = $requestLine -split " "
  $method = $parts[0]
  $rawPath = $parts[1]
  $headers = @{}
  for ($index = 1; $index -lt $lines.Length; $index += 1) {
    $line = $lines[$index]
    $colon = $line.IndexOf(":")
    if ($colon -gt 0) {
      $headers[$line.Substring(0, $colon).Trim().ToLowerInvariant()] = $line.Substring($colon + 1).Trim()
    }
  }

  $contentLength = 0
  if ($headers.ContainsKey("content-length")) {
    $contentLength = [int]$headers["content-length"]
  }

  $bodyStart = $headerEnd + 4
  $bodyBytes = New-Object byte[] 0
  if ($contentLength -gt 0) {
    $bodyBytes = New-Object byte[] $contentLength
    $available = [Math]::Max(0, $allBytes.Length - $bodyStart)
    $copy = [Math]::Min($available, $contentLength)
    if ($copy -gt 0) {
      [Array]::Copy($allBytes, $bodyStart, $bodyBytes, 0, $copy)
    }
    $offset = $copy
    while ($offset -lt $contentLength) {
      $read = $stream.Read($bodyBytes, $offset, $contentLength - $offset)
      if ($read -le 0) {
        break
      }
      $offset += $read
    }
  }

  return @{
    Method = $method
    RawPath = $rawPath
    Path = ($rawPath -split "\?")[0]
    Headers = $headers
    Body = if ($bodyBytes.Length -gt 0) { $Utf8.GetString($bodyBytes) } else { "" }
  }
}

function Handle-Api($Client, $Request) {
  $method = $Request.Method
  $path = $Request.Path

  if ($method -eq "OPTIONS") {
    Send-Bytes $Client 204 "text/plain; charset=utf-8" (New-Object byte[] 0)
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/health") {
    $stateContainer = Read-JsonFile $StatePath (New-DefaultStateContainer)
    Send-Json $Client 200 (New-HealthPayload $stateContainer)
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/bootstrap") {
    $stateContainer = Read-JsonFile $StatePath (New-DefaultStateContainer)
    $settingsContainer = Read-JsonFile $SettingsPath (New-DefaultSettingsContainer)
    $health = New-HealthPayload $stateContainer
    $payload = @{
      ok = $health.ok
      appVersion = $health.appVersion
      build = $health.build
      mode = $health.mode
      host = $health.host
      publicHost = $health.publicHost
      publicBaseUrl = $health.publicBaseUrl
      port = $health.port
      dataDir = $health.dataDir
      revision = $health.revision
      savedAt = $health.savedAt
      settings = $settingsContainer.settings
      settingsRevision = [int]($settingsContainer.revision)
      state = $stateContainer.state
      stateRevision = [int]($stateContainer.revision)
    }
    Send-Json $Client 200 $payload
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/state") {
    Send-Json $Client 200 (Read-JsonFile $StatePath (New-DefaultStateContainer))
    return
  }

  if ($method -eq "PUT" -and $path -eq "/api/state") {
    $body = if ($Request.Body) { $Request.Body | ConvertFrom-Json } else { $null }
    if (-not $body -or -not $body.state) {
      Send-Json $Client 400 @{ error = "state object is required" }
      return
    }
    $current = Read-JsonFile $StatePath (New-DefaultStateContainer)
    $baseRevision = if ($body.baseRevision) { [int]$body.baseRevision } else { 0 }
    $next = @{
      revision = [int]($current.revision) + 1
      savedAt = [DateTime]::UtcNow.ToString("o")
      savedBy = [string]($body.savedBy)
      build = if ($body.build) { [string]$body.build } else { $AppBuild }
      appVersion = if ($body.appVersion) { [string]$body.appVersion } else { $AppVersion }
      conflict = ($baseRevision -gt 0 -and $baseRevision -lt [int]($current.revision))
      state = $body.state
    }
    Write-JsonFile $StatePath $next
    Send-Json $Client 200 $next
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/settings") {
    Send-Json $Client 200 (Read-JsonFile $SettingsPath (New-DefaultSettingsContainer))
    return
  }

  if ($method -eq "PUT" -and $path -eq "/api/settings") {
    $body = if ($Request.Body) { $Request.Body | ConvertFrom-Json } else { $null }
    if (-not $body -or -not $body.settings) {
      Send-Json $Client 400 @{ error = "settings object is required" }
      return
    }
    $current = Read-JsonFile $SettingsPath (New-DefaultSettingsContainer)
    $settings = Normalize-Settings $body.settings
    $next = @{
      revision = [int]($current.revision) + 1
      savedAt = [DateTime]::UtcNow.ToString("o")
      savedBy = [string]($body.savedBy)
      build = if ($body.build) { [string]$body.build } else { $AppBuild }
      settings = $settings
    }
    Write-JsonFile $SettingsPath $next
    $stateContainer = Read-JsonFile $StatePath (New-DefaultStateContainer)
    Send-Json $Client 200 @{
      revision = $next.revision
      savedAt = $next.savedAt
      savedBy = $next.savedBy
      build = $next.build
      settings = $next.settings
      stateRevision = [int]($stateContainer.revision)
    }
    return
  }

  Send-Json $Client 404 @{ error = "API route not found" }
}

function Send-Static($Client, $Request) {
  $path = [System.Uri]::UnescapeDataString($Request.Path)
  if ($path -eq "/") {
    $path = "/index.html"
  }
  $relative = $path.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar)
  $filePath = [System.IO.Path]::GetFullPath((Join-Path $RootDir $relative))
  $rootFullPath = [System.IO.Path]::GetFullPath($RootDir)
  if (-not $filePath.StartsWith($rootFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    Send-Json $Client 403 @{ error = "Forbidden" }
    return
  }
  if (-not (Test-Path -LiteralPath $filePath)) {
    $filePath = Join-Path $RootDir "index.html"
  }
  $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
  $contentType = if ($MimeTypes.ContainsKey($extension)) { $MimeTypes[$extension] } else { "application/octet-stream" }
  Send-Bytes $Client 200 $contentType ([System.IO.File]::ReadAllBytes($filePath))
}

New-Item -ItemType Directory -Path $ResolvedDataDir -Force | Out-Null

if ($HostName -eq "0.0.0.0" -or $HostName -eq "*" -or $HostName -eq "+") {
  $ipAddress = [System.Net.IPAddress]::Any
} elseif ($HostName -eq "localhost") {
  $ipAddress = [System.Net.IPAddress]::Loopback
} else {
  $ipAddress = [System.Net.IPAddress]::Parse($HostName)
}

$listener = New-Object System.Net.Sockets.TcpListener($ipAddress, $Port)
$listener.Start()

Write-Host "B2C Retail CRM $AppBuild"
Write-Host "PowerShell TCP server listening: $HostName`:$Port"
Write-Host "Public URL: $PublicBaseUrl/index.html"
Write-Host "Data dir: $ResolvedDataDir"
Write-Host "Press Ctrl+C to stop."

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $request = Read-HttpRequest $client
      if (-not $request) {
        Send-Text $client 400 "Bad request"
      } elseif ($request.Path.StartsWith("/api/")) {
        Handle-Api $client $request
      } else {
        Send-Static $client $request
      }
    } catch {
      Send-Json $client 500 @{ error = $_.Exception.Message }
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
