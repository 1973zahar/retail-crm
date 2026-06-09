param(
  [string]$HostName = "0.0.0.0",
  [int]$Port = 8790,
  [string]$PublicHost = "192.168.0.5",
  [string]$DataDir = "data"
)

$ErrorActionPreference = "Stop"
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
} catch {
}

$AppVersion = "2026.06.10.2"
$AppBuild = "20260610-b2c-price-qty-discount-live"
$AppReleasedAt = "2026-06-10 00:29:40 +03:00"
$RootDir = $PSScriptRoot
$ResolvedDataDir = if ([System.IO.Path]::IsPathRooted($DataDir)) { $DataDir } else { Join-Path $RootDir $DataDir }
$StatePath = Join-Path $ResolvedDataDir "retail-crm-state.json"
$SettingsPath = Join-Path $ResolvedDataDir "retail-crm-settings.json"
$PublicBaseUrl = "http://$PublicHost`:$Port"
$CrmSqlApiBaseUrl = if ($env:CRM_SQL_API_BASE_URL) { $env:CRM_SQL_API_BASE_URL.TrimEnd("/") } else { "http://192.168.0.166:3000" }
$NbuExchangeRatesUrl = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchangenew?json"
$NbuExchangeRatesCacheTtlSeconds = 21600
$script:ExchangeRatesCacheFetchedAt = [datetime]::MinValue
$script:ExchangeRatesCachePayload = $null
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
    crmSqlApiBaseUrl = $CrmSqlApiBaseUrl
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
    releasedAt = $AppReleasedAt
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
    releasedAt = $AppReleasedAt
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
    releasedAt = $AppReleasedAt
    mode = "server-powershell"
    host = $HostName
    publicHost = $PublicHost
    publicBaseUrl = $PublicBaseUrl
    crmSqlApiBaseUrl = $CrmSqlApiBaseUrl
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
    502 { "Bad Gateway" }
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

function Decode-QueryValue([string]$Value) {
  return [System.Uri]::UnescapeDataString(($Value -replace "\+", " "))
}

function Get-QueryParams([string]$RawPath) {
  $params = @{}
  if (-not $RawPath -or -not $RawPath.Contains("?")) {
    return $params
  }
  $query = $RawPath.Substring($RawPath.IndexOf("?") + 1)
  foreach ($part in ($query -split "&")) {
    if (-not $part) { continue }
    $pair = $part -split "=", 2
    $key = (Decode-QueryValue $pair[0]).ToLowerInvariant()
    $value = if ($pair.Length -gt 1) { Decode-QueryValue $pair[1] } else { "" }
    if ($key) { $params[$key] = $value }
  }
  return $params
}

function Get-QueryValue($Params, [string]$Name, [string]$Default = "") {
  $key = $Name.ToLowerInvariant()
  if ($Params.ContainsKey($key)) {
    return [string]$Params[$key]
  }
  return $Default
}

function Normalize-Text($Value) {
  if ($null -eq $Value) { return "" }
  return ([string]$Value).Trim().ToLowerInvariant()
}

function Get-BoundedParams($Params, [int]$DefaultLimit, [int]$MaxLimit) {
  $limit = $DefaultLimit
  $offset = 0
  [int]::TryParse((Get-QueryValue $Params "limit" "$DefaultLimit"), [ref]$limit) | Out-Null
  [int]::TryParse((Get-QueryValue $Params "offset" "0"), [ref]$offset) | Out-Null
  if ($limit -lt 1) { $limit = 1 }
  if ($limit -gt $MaxLimit) { $limit = $MaxLimit }
  if ($offset -lt 0) { $offset = 0 }
  return @{ limit = $limit; offset = $offset }
}

function Get-LiveQueryParams($Params, [int]$DefaultLimit, [int]$MaxLimit, [string[]]$FilterNames = @()) {
  $bounds = Get-BoundedParams $Params $DefaultLimit $MaxLimit
  $search = (Get-QueryValue $Params "search").Trim()
  $barcode = (Get-QueryValue $Params "barcode").Trim()
  $filters = @{}
  $query = @{
    limit = $bounds.limit
    offset = $bounds.offset
  }
  if ($search) { $query.search = $search }
  if ($barcode) {
    $query.barcode = $barcode
    if (-not $search) { $query.search = $barcode }
  }
  foreach ($name in $FilterNames) {
    $value = (Get-QueryValue $Params $name).Trim()
    if ($value) {
      $filters[$name] = $value
      $query[$name] = $value
    }
  }
  return @{
    params = $query
    limit = $bounds.limit
    offset = $bounds.offset
    search = $search
    barcode = $barcode
    filters = $filters
  }
}

function ConvertTo-QueryString($Params) {
  $parts = @()
  foreach ($key in $Params.Keys) {
    if ($null -eq $Params[$key]) { continue }
    $parts += ([System.Uri]::EscapeDataString([string]$key) + "=" + [System.Uri]::EscapeDataString([string]$Params[$key]))
  }
  return ($parts -join "&")
}

function Invoke-CrmSqlApi([string]$Path, $Params) {
  $query = ConvertTo-QueryString $Params
  $url = "$CrmSqlApiBaseUrl$Path"
  if ($query) { $url = "$url`?$query" }
  $client = New-Object System.Net.WebClient
  $client.Encoding = $Utf8
  $raw = $client.DownloadString($url)
  if (-not $raw) { return @{} }
  return $raw | ConvertFrom-Json
}

function Get-ObjectPropertyValue($Object, [string[]]$Names, $Default = $null) {
  if (-not $Object) { return $Default }
  foreach ($name in $Names) {
    if ($Object -is [System.Collections.IDictionary] -and $Object.Contains($name)) {
      $value = $Object[$name]
      if ($null -ne $value -and [string]$value -ne "") { return $value }
    }
    $property = $Object.PSObject.Properties[$name]
    if ($property -and $null -ne $property.Value -and [string]$property.Value -ne "") {
      return $property.Value
    }
  }
  return $Default
}

function Get-TextValue($Object, [string[]]$Names, [string]$Default = "") {
  $value = Get-ObjectPropertyValue $Object $Names $Default
  if ($null -eq $value) { return $Default }
  return ([string]$value).Trim()
}

function Get-NumberValue($Object, [string[]]$Names, [double]$Default = 0) {
  $value = Get-ObjectPropertyValue $Object $Names $null
  if ($null -eq $value) { return $Default }
  $number = 0.0
  if ($value -is [int] -or $value -is [long] -or $value -is [double] -or $value -is [decimal]) {
    return [double]$value
  }
  $text = ([string]$value).Trim()
  if ([double]::TryParse($text, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$number)) { return $number }
  if ([double]::TryParse($text.Replace(",", "."), [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$number)) { return $number }
  if ([double]::TryParse($text, [ref]$number)) { return $number }
  return $Default
}

function ConvertTo-NbuExchangeRate($Row) {
  $numericCode = Get-TextValue $Row @("r030", "numericCode", "numeric_code")
  $currency = (Get-TextValue $Row @("cc", "currency")).ToUpperInvariant()
  $rate = Get-NumberValue $Row @("rate")
  if (-not $numericCode -or -not $currency -or $rate -le 0) { return $null }
  return @{
    currency = $currency
    numericCode = $numericCode
    rate = $rate
    name = Get-TextValue $Row @("txt", "name")
    exchangedate = Get-TextValue $Row @("exchangedate", "exchangeDate", "exchange_date")
    source = "nbu"
  }
}

function Get-NodeFetchExecutable {
  $candidates = @(
    $env:RETAIL_B2C_NODE_EXE,
    $env:NODE_EXE,
    (Join-Path $RootDir ".runtime\node\bin\node.exe"),
    (Join-Path $RootDir "node.exe"),
    "C:\Program Files\nodejs\node.exe",
    "C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe",
    "node"
  ) | Where-Object { $_ }
  foreach ($candidate in $candidates) {
    if ($candidate -eq "node") {
      $command = Get-Command node -ErrorAction SilentlyContinue
      if ($command) { return $command.Source }
      continue
    }
    if (Test-Path $candidate) { return $candidate }
  }
  return $null
}

function Invoke-NbuExchangeRatesRaw {
  try {
    $client = New-Object System.Net.WebClient
    $client.Encoding = $Utf8
    return $client.DownloadString($NbuExchangeRatesUrl)
  } catch {
    $webClientError = $_.Exception.Message
    $nodeExe = Get-NodeFetchExecutable
    if (-not $nodeExe) {
      throw $webClientError
    }
    $script = "fetch(process.argv[1]).then(async r=>{const t=await r.text(); if(!r.ok){throw new Error(t || ('HTTP '+r.status));} process.stdout.write(t);}).catch(e=>{process.stderr.write(e && e.message ? e.message : String(e)); process.exit(1);});"
    $raw = & $nodeExe -e $script $NbuExchangeRatesUrl 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "$webClientError; Node fetch fallback failed: $raw"
    }
    return ($raw -join "`n")
  }
}

function Get-NbuExchangeRates([bool]$Force = $false) {
  $now = Get-Date
  if (-not $Force -and $script:ExchangeRatesCachePayload -and (($now - $script:ExchangeRatesCacheFetchedAt).TotalSeconds -lt $NbuExchangeRatesCacheTtlSeconds)) {
    return $script:ExchangeRatesCachePayload
  }
  $raw = Invoke-NbuExchangeRatesRaw
  $rows = if ($raw) { @($raw | ConvertFrom-Json) } else { @() }
  $rates = @()
  foreach ($row in $rows) {
    $rate = ConvertTo-NbuExchangeRate $row
    if ($rate) { $rates += $rate }
  }
  if (@($rates).Count -eq 0) {
    throw "NBU API returned empty exchange-rate payload"
  }
  $exchangeDate = if ($rates[0].exchangedate) { $rates[0].exchangedate } else { (Get-Date).ToString("dd.MM.yyyy") }
  $items = @(@{
    currency = "UAH"
    numericCode = "980"
    rate = 1
    name = "Ukrainian hryvnia"
    exchangedate = $exchangeDate
    source = "base-uah"
  }) + $rates
  $payload = @{
    data = $items
    items = $items
    total = @($items).Count
    limit = @($items).Count
    offset = 0
    hasMore = $false
    nextOffset = $null
    totalExact = $true
    source = "nbu"
    sourceDetail = $NbuExchangeRatesUrl
    bounded = $true
    fallback = $false
    productionReady = $true
    loadedAt = (Get-Date).ToUniversalTime().ToString("o")
    cacheTtlMs = $NbuExchangeRatesCacheTtlSeconds * 1000
  }
  $script:ExchangeRatesCacheFetchedAt = $now
  $script:ExchangeRatesCachePayload = $payload
  return $payload
}

function New-LiveExchangeRatesResponse($Params) {
  $forceValue = (Get-QueryValue $Params "force").ToLowerInvariant()
  $force = $forceValue -eq "1" -or $forceValue -eq "true" -or $forceValue -eq "yes"
  $currency = (Get-QueryValue $Params "currency").ToUpperInvariant()
  if (-not $currency) { $currency = (Get-QueryValue $Params "valcode").ToUpperInvariant() }
  $search = (Get-QueryValue $Params "search").ToUpperInvariant()
  $payload = Get-NbuExchangeRates $force
  $items = @()
  foreach ($item in @($payload.items)) {
    if ($currency -and [string]$item.currency -ne $currency -and [string]$item.numericCode -ne $currency) { continue }
    if ($search) {
      $haystack = "$($item.currency) $($item.numericCode) $($item.name)".ToUpperInvariant()
      if (-not $haystack.Contains($search)) { continue }
    }
    $items += $item
  }
  $payload.data = $items
  $payload.items = $items
  $payload.total = @($items).Count
  $payload.limit = @($items).Count
  $payload.query = @{ currency = $currency; search = $search }
  return $payload
}

function Get-PayloadItems($Payload) {
  if (-not $Payload) { return @() }
  foreach ($name in @("items", "data", "rows")) {
    $property = $Payload.PSObject.Properties[$name]
    if ($property -and $null -ne $property.Value) { return @($property.Value) }
  }
  $content = $Payload.PSObject.Properties["content"]
  if ($content -and $content.Value -and $content.Value.PSObject.Properties["items"]) {
    return @($content.Value.items)
  }
  return @()
}

function Get-PayloadTotalInfo($Payload, $Items, $Query) {
  foreach ($name in @("total")) {
    $property = $Payload.PSObject.Properties[$name]
    if ($property -and $null -ne $property.Value) {
      $number = 0
      if ([int]::TryParse([string]$property.Value, [ref]$number)) { return @{ total = $number; exact = $true } }
    }
  }
  return @{ total = ([int]$Query.offset + @($Items).Count); exact = $false }
}

function Get-PayloadBoolean($Payload, [string[]]$Names) {
  foreach ($name in $Names) {
    $property = $Payload.PSObject.Properties[$name]
    if ($property -and $null -ne $property.Value) {
      if ($property.Value -is [bool]) { return $property.Value }
      $text = ([string]$property.Value).ToLowerInvariant()
      if ($text -eq "true") { return $true }
      if ($text -eq "false") { return $false }
    }
  }
  return $null
}

function New-CrmSqlEnvelope([string]$Path, $Query, $Items, $Payload) {
  $itemArray = @($Items)
  $totalInfo = Get-PayloadTotalInfo $Payload $itemArray $Query
  $limit = [int]$Query.limit
  $offset = [int]$Query.offset
  $explicitHasMore = Get-PayloadBoolean $Payload @("hasMore")
  if ($null -eq $explicitHasMore) {
    $pageLooksFull = @($itemArray).Count -ge $limit
    $hasMore = if ($totalInfo.exact -and -not $pageLooksFull) { ($offset + @($itemArray).Count) -lt [int]$totalInfo.total } else { $pageLooksFull }
  } else {
    $hasMore = [bool]$explicitHasMore
  }
  $nextOffset = $null
  $nextOffsetProperty = $Payload.PSObject.Properties["nextOffset"]
  if ($nextOffsetProperty -and $null -ne $nextOffsetProperty.Value) {
    $parsed = 0
    if ([int]::TryParse([string]$nextOffsetProperty.Value, [ref]$parsed)) { $nextOffset = $parsed }
  }
  if ($null -eq $nextOffset -and $hasMore) { $nextOffset = $offset + $limit }
  $queryInfo = @{ search = [string]$Query.search; barcode = [string]$Query.barcode }
  if ($Query.filters) {
    foreach ($key in $Query.filters.Keys) {
      $queryInfo[$key] = [string]$Query.filters[$key]
    }
  }
  return @{
    data = $itemArray
    items = $itemArray
    total = [int]$totalInfo.total
    limit = $limit
    offset = $offset
    hasMore = $hasMore
    nextOffset = $nextOffset
    totalExact = [bool]$totalInfo.exact
    query = $queryInfo
    source = "crm-sql-live"
    sourceDetail = "$CrmSqlApiBaseUrl$Path"
    bounded = $true
    fallback = $false
    productionReady = $true
    loadedAt = (Get-Date).ToUniversalTime().ToString("o")
  }
}

function Get-StateArray($StateContainer, [string]$Name) {
  if (-not $StateContainer -or -not $StateContainer.state) {
    return @()
  }
  $property = $StateContainer.state.PSObject.Properties[$Name]
  if (-not $property -or $null -eq $property.Value) {
    return @()
  }
  return @($property.Value)
}

function New-LiveApiEnvelope($StateContainer, $Payload) {
  $result = @{}
  foreach ($key in $Payload.Keys) {
    $result[$key] = $Payload[$key]
  }
  $items = if ($Payload.ContainsKey("data")) { @($Payload.data) } elseif ($Payload.ContainsKey("items")) { @($Payload.items) } else { @() }
  $limit = if ($Payload.ContainsKey("limit")) { [int]$Payload.limit } else { @($items).Count }
  $offset = if ($Payload.ContainsKey("offset")) { [int]$Payload.offset } else { 0 }
  $total = if ($Payload.ContainsKey("total")) { [int]$Payload.total } else { @($items).Count }
  $result.data = $items
  $result.items = $items
  $result.limit = $limit
  $result.offset = $offset
  $result.total = $total
  $result.hasMore = if ($Payload.ContainsKey("hasMore")) { [bool]$Payload.hasMore } else { @($items).Count -ge $limit }
  $result.nextOffset = if ($Payload.ContainsKey("nextOffset")) { $Payload.nextOffset } elseif ($result.hasMore) { $offset + $limit } else { $null }
  $result.totalExact = if ($Payload.ContainsKey("totalExact")) { [bool]$Payload.totalExact } else { $true }
  $result.source = "server-json-fallback"
  $result.sourceDetail = "retail-crm-state.json; target production source is PostgreSQL crm_hub through backend model layer"
  $result.bounded = $true
  $result.fallback = $true
  $result.productionReady = $false
  $result.revision = [int]($StateContainer.revision)
  $result.savedAt = [string]($StateContainer.savedAt)
  return $result
}

function Get-ScanTokens($Value) {
  $raw = Normalize-Text $Value
  if (-not $raw) { return @() }
  $tokens = New-Object System.Collections.ArrayList
  [void]$tokens.Add($raw)
  foreach ($part in ($raw -split "[|;&`n`r`t ?]+")) {
    $clean = $part.Trim()
    if (-not $clean) { continue }
    if (-not $tokens.Contains($clean)) { [void]$tokens.Add($clean) }
    $pair = $clean -split "[=:]", 2
    if ($pair.Length -gt 1 -and $pair[1]) {
      $value = $pair[1].Trim()
      if (-not $tokens.Contains($value)) { [void]$tokens.Add($value) }
    }
  }
  return @($tokens)
}

function Get-ProductScanTargets($Product) {
  $targets = @(
    $Product.sku,
    $Product.productCode,
    $Product.barcode,
    $Product.qr,
    $Product.sqlId,
    $Product.id
  ) | ForEach-Object { Normalize-Text $_ } | Where-Object { $_ }
  return @($targets)
}

function Test-ProductMatch($Product, [string]$Search, [string]$Barcode) {
  $barcodeQuery = Normalize-Text $Barcode
  if ($barcodeQuery) {
    $tokens = Get-ScanTokens $barcodeQuery
    foreach ($target in (Get-ProductScanTargets $Product)) {
      if ($tokens -contains $target -or $barcodeQuery.Contains($target)) { return $true }
    }
    return $false
  }
  $raw = Normalize-Text $Search
  if (-not $raw) { return $true }
  $haystack = Normalize-Text (@(
    $Product.name,
    $Product.sku,
    $Product.productCode,
    $Product.barcode,
    $Product.qr,
    $Product.sqlId,
    $Product.productGroupPath,
    $Product.productFullPath,
    $Product.category,
    $Product.productKind,
    $Product.productSeries,
    $Product.productGroup
  ) -join " ")
  if ($haystack.Contains($raw)) { return $true }
  $tokens = Get-ScanTokens $raw
  foreach ($target in (Get-ProductScanTargets $Product)) {
    if ($tokens -contains $target -or $raw.Contains($target)) { return $true }
  }
  return $false
}

function Test-CustomerMatch($Customer, [string]$Search) {
  $raw = Normalize-Text $Search
  if (-not $raw) { return $true }
  $haystack = Normalize-Text (@(
    $Customer.name,
    $Customer.phone,
    $Customer.email,
    $Customer.id,
    $Customer.sqlId,
    $Customer.counterpartyCode
  ) -join " ")
  return $haystack.Contains($raw)
}

function Get-ProductStockSummary($State, [string]$ProductId) {
  $rows = @()
  if ($State -and $State.stock) {
    $rows = @($State.stock | Where-Object { $_.productId -eq $ProductId })
  }
  $retail = 0
  $total = 0
  $wholesale = 0
  foreach ($row in $rows) {
    $qty = [double]($row.qty)
    $total += $qty
    if (-not $row.warehouseCode -or [string]$row.warehouseCode -eq "2") { $retail += $qty }
    if ((Normalize-Text $row.warehouseName).Contains("гурт")) { $wholesale += $qty }
  }
  return @{ retailStockQty = $retail; stockTotalQty = $total; stockWholesaleQty = $wholesale }
}

function ConvertTo-PublicProduct($Product, $State) {
  $stock = Get-ProductStockSummary $State ([string]$Product.id)
  return @{
    id = [string]$Product.id
    sqlId = [string]$Product.sqlId
    productCode = if ($Product.productCode) { [string]$Product.productCode } else { [string]$Product.sku }
    sku = if ($Product.sku) { [string]$Product.sku } else { [string]$Product.productCode }
    name = [string]$Product.name
    barcode = [string]$Product.barcode
    qr = [string]$Product.qr
    category = [string]$Product.category
    categoryPrimary = if ($Product.categoryPrimary) { [string]$Product.categoryPrimary } else { [string]$Product.category }
    productGroupPath = [string]$Product.productGroupPath
    productFullPath = [string]$Product.productFullPath
    productGroupCodePath = [string]$Product.productGroupCodePath
    productGroupLevel = [double]($Product.productGroupLevel)
    productKind = [string]$Product.productKind
    productSeries = [string]$Product.productSeries
    productGroup = [string]$Product.productGroup
    characteristics = if ($Product.characteristics) { @($Product.characteristics) } else { @() }
    price = [double]($Product.price)
    cost = [double]($Product.cost)
    priceSummary = [string]$Product.priceSummary
    priceTypes = [string]$Product.priceTypes
    priceCurrencies = [string]$Product.priceCurrencies
    prices = if ($Product.prices) { @($Product.prices) } else { @() }
    minStock = [double]($Product.minStock)
    source = if ($Product.source) { [string]$Product.source } else { "sql" }
    retailStockQty = $stock.retailStockQty
    stockTotalQty = $stock.stockTotalQty
    stockWholesaleQty = $stock.stockWholesaleQty
  }
}

function Find-ProductById($StateContainer, [string]$Id) {
  $raw = Normalize-Text $Id
  foreach ($product in (Get-StateArray $StateContainer "products")) {
    $ids = @($product.id, $product.sqlId, $product.productCode, $product.sku, $product.barcode) | ForEach-Object { Normalize-Text $_ }
    if ($ids -contains $raw) { return $product }
  }
  return $null
}

function Select-Page($Rows, [int]$Offset, [int]$Limit) {
  return @($Rows | Select-Object -Skip $Offset -First $Limit)
}

function New-ProductsResponse($StateContainer, $Params) {
  $bounds = Get-BoundedParams $Params 20 100
  $search = Get-QueryValue $Params "search"
  $barcode = Get-QueryValue $Params "barcode"
  $rows = @()
  foreach ($product in (Get-StateArray $StateContainer "products")) {
    if (Test-ProductMatch $product $search $barcode) {
      $rows += ConvertTo-PublicProduct $product $StateContainer.state
    }
  }
  $items = @(Select-Page $rows $bounds.offset $bounds.limit)
  return New-LiveApiEnvelope $StateContainer @{
    items = $items
    total = @($rows).Count
    limit = $bounds.limit
    offset = $bounds.offset
    query = @{ search = $search; barcode = $barcode }
  }
}

function ConvertTo-PublicCustomer($Customer) {
  return @{
    id = [string]$Customer.id
    sqlId = [string]$Customer.sqlId
    counterpartyCode = [string]$Customer.counterpartyCode
    name = [string]$Customer.name
    phone = [string]$Customer.phone
    email = [string]$Customer.email
    loyalty = if ($Customer.loyalty) { [string]$Customer.loyalty } else { "standard" }
    balance = [double]($Customer.balance)
    balanceCurrency = if ($Customer.balanceCurrency) { [string]$Customer.balanceCurrency } else { "UAH" }
    source = if ($Customer.source) { [string]$Customer.source } else { "sql" }
    exportStatus = [string]$Customer.exportStatus
  }
}

function ConvertTo-LiveProduct($Row) {
  $productCode = Get-TextValue $Row @("productCode", "product_code", "sku", "code")
  $price = Get-NumberValue $Row @("latestPrice", "latest_price", "price", "amount")
  $currency = Get-TextValue $Row @("latestPriceCurrency", "latest_price_currency", "currency") "UAH"
  $priceType = Get-TextValue $Row @("latestPriceType", "latest_price_type", "priceTypeName", "price_type_name")
  return @{
    id = Get-TextValue $Row @("id", "productCode", "product_code", "sku", "oneCRef", "one_c_ref", "barcode")
    sqlId = Get-TextValue $Row @("oneCRef", "one_c_ref", "externalId", "external_id", "id")
    productCode = $productCode
    sku = Get-TextValue $Row @("sku", "productCode", "product_code")
    barcode = Get-TextValue $Row @("barcode", "bar_code")
    qr = Get-TextValue $Row @("qr")
    name = Get-TextValue $Row @("name", "productName", "product_name", "description") "SQL product"
    category = Get-TextValue $Row @("category", "categoryName", "category_name", "productGroupName", "product_group_name") "Other"
    categoryPrimary = Get-TextValue $Row @("categoryPrimary", "category_primary", "category", "categoryName") "Other"
    categorySecondary = Get-TextValue $Row @("categorySecondary", "category_secondary")
    supplyChannel = Get-TextValue $Row @("supplyChannel", "supply_channel")
    importer = Get-TextValue $Row @("importer")
    isSparePart = [bool](Get-ObjectPropertyValue $Row @("isSparePart", "is_spare_part") $false)
    productGroupPath = Get-TextValue $Row @("productGroupPath", "product_group_path", "categoryPath")
    productFullPath = Get-TextValue $Row @("productFullPath", "product_full_path", "productGroupPath", "product_group_path")
    productGroupCodePath = Get-TextValue $Row @("productGroupCodePath", "product_group_code_path")
    productGroupLevel = Get-NumberValue $Row @("productGroupLevel", "product_group_level")
    productKind = Get-TextValue $Row @("productKind", "product_kind")
    productSeries = Get-TextValue $Row @("productSeries", "product_series")
    productGroup = Get-TextValue $Row @("productGroup", "product_group", "productGroupName", "product_group_name")
    characteristics = if ($Row.characteristics) { @($Row.characteristics) } else { @() }
    price = $price
    cost = Get-NumberValue $Row @("cost")
    priceSummary = if ($price -ne 0) { "$price $currency" } else { "" }
    priceTypes = $priceType
    priceCurrencies = $currency
    prices = if ($price -ne 0) { @(@{ priceType = $priceType; currency = $currency; price = $price }) } else { @() }
    minStock = Get-NumberValue $Row @("minStock", "min_stock")
    retailStockQty = Get-NumberValue $Row @("availableQuantity", "available_quantity", "stockOnRetailWarehouse", "stock_on_retail_warehouse")
    stockTotalQty = Get-NumberValue $Row @("totalQuantity", "total_quantity", "stockTotalAllWarehouses", "stock_total_all_warehouses")
    stockWholesaleQty = Get-NumberValue $Row @("stockOnOtherWarehouses", "stock_on_other_warehouses")
    source = "crm-sql-live"
  }
}

function ConvertTo-LiveProductPrice($Row) {
  return @{
    id = Get-TextValue $Row @("id", "productCode", "product_code", "productName", "product_name")
    productCode = Get-TextValue $Row @("productCode", "product_code", "sku")
    productName = Get-TextValue $Row @("productName", "product_name", "name")
    priceTypeCode = Get-TextValue $Row @("priceTypeCode", "price_type_code")
    priceTypeName = Get-TextValue $Row @("priceTypeName", "price_type_name", "priceType", "price_type")
    currency = Get-TextValue $Row @("currency") "UAH"
    amount = Get-NumberValue $Row @("amount", "price")
    price = Get-NumberValue $Row @("price", "amount")
    snapshotAt = Get-TextValue $Row @("snapshotAt", "snapshot_at", "importedAt", "imported_at")
    sourceFile = Get-TextValue $Row @("sourceFile", "source_file")
    importedAt = Get-TextValue $Row @("importedAt", "imported_at")
    source = "crm-sql-live"
  }
}

function ConvertTo-LiveCounterparty($Row) {
  $counterpartyCode = Get-TextValue $Row @("counterpartyCode", "counterparty_code", "externalId", "external_id")
  return @{
    id = Get-TextValue $Row @("id", "counterpartyCode", "counterparty_code", "oneCRef", "one_c_ref")
    sqlId = Get-TextValue $Row @("oneCRef", "one_c_ref", "externalId", "external_id")
    counterpartyCode = $counterpartyCode
    name = Get-TextValue $Row @("name", "fullName", "full_name", "counterpartyName", "counterparty_name") "SQL counterparty"
    fullName = Get-TextValue $Row @("fullName", "full_name", "counterpartyName", "counterparty_name", "name")
    phone = Get-TextValue $Row @("phone")
    email = Get-TextValue $Row @("email")
    taxId = Get-TextValue $Row @("taxId", "tax_id")
    sourceModule = Get-TextValue $Row @("sourceModule", "source_module")
    sourceFile = Get-TextValue $Row @("sourceFile", "source_file")
    importedAt = Get-TextValue $Row @("importedAt", "imported_at")
    isDeleted = [bool](Get-ObjectPropertyValue $Row @("isDeleted", "is_deleted") $false)
    source = "crm-sql-live"
  }
}

function Select-UniqueLiveCounterparties($Items) {
  $seen = @{}
  $unique = @()
  foreach ($item in @($Items)) {
    $key = (Get-TextValue $item @("counterpartyCode", "id", "sqlId", "name")).ToLowerInvariant()
    if (-not $key -or $seen.ContainsKey($key)) { continue }
    $seen[$key] = $true
    $unique += $item
  }
  return $unique
}

function Test-LiveCounterpartyMatch($Item, [string]$Search) {
  $query = $Search.Trim().ToLowerInvariant()
  if (-not $query) { return $true }
  $values = @(
    (Get-TextValue $Item @("counterpartyCode")),
    (Get-TextValue $Item @("id")),
    (Get-TextValue $Item @("sqlId")),
    (Get-TextValue $Item @("name")),
    (Get-TextValue $Item @("fullName")),
    (Get-TextValue $Item @("phone")),
    (Get-TextValue $Item @("email")),
    (Get-TextValue $Item @("taxId"))
  )
  foreach ($value in $values) {
    if ($value -and $value.ToLowerInvariant().Contains($query)) { return $true }
  }
  return $false
}

function ConvertTo-LiveWarehouse($Row) {
  $warehouseCode = Get-TextValue $Row @("warehouseCode", "warehouse_code", "code", "id")
  return @{
    id = Get-TextValue $Row @("id", "warehouseCode", "warehouse_code", "code") $warehouseCode
    warehouseCode = $warehouseCode
    warehouseName = Get-TextValue $Row @("warehouseName", "warehouse_name", "name") "SQL warehouse"
    sourceFile = Get-TextValue $Row @("sourceFile", "source_file")
    importedAt = Get-TextValue $Row @("importedAt", "imported_at")
    source = "crm-sql-live"
  }
}

function ConvertTo-LiveStockBalance($Row) {
  $productCode = Get-TextValue $Row @("productCode", "product_code", "sku")
  $warehouseCode = Get-TextValue $Row @("warehouseCode", "warehouse_code", "warehouseId", "warehouse_id")
  $qty = Get-NumberValue $Row @("availableQty", "available_qty", "availableQuantity", "available_quantity", "qty", "quantity", "balance")
  return @{
    id = Get-TextValue $Row @("id") "$productCode`:$warehouseCode"
    productId = Get-TextValue $Row @("productId", "product_id", "productCode", "product_code", "sku")
    productCode = $productCode
    sku = Get-TextValue $Row @("sku", "productCode", "product_code")
    productName = Get-TextValue $Row @("productName", "product_name", "name")
    warehouseId = Get-TextValue $Row @("warehouseId", "warehouse_id", "warehouseCode", "warehouse_code")
    warehouseCode = $warehouseCode
    warehouseName = Get-TextValue $Row @("warehouseName", "warehouse_name", "warehouse") "Склад"
    qty = $qty
    quantity = Get-NumberValue $Row @("quantity", "qty") $qty
    availableQty = $qty
    reservedQty = Get-NumberValue $Row @("reservedQty", "reserved_qty", "reservedQuantity", "reserved_quantity")
    snapshotAt = Get-TextValue $Row @("snapshotAt", "snapshot_at", "importedAt", "imported_at")
    sourceFile = Get-TextValue $Row @("sourceFile", "source_file")
    importedAt = Get-TextValue $Row @("importedAt", "imported_at")
    source = "crm-sql-live"
  }
}

function ConvertTo-LiveSerialStock($Row) {
  $productCode = Get-TextValue $Row @("productCode", "product_code", "sku")
  $warehouseCode = Get-TextValue $Row @("warehouseCode", "warehouse_code", "warehouseId", "warehouse_id")
  $serialName = Get-TextValue $Row @("serialName", "serial_name", "serialNumber", "serial_number", "serial", "name")
  $quantity = Get-NumberValue $Row @("availableQty", "available_qty", "quantity", "qty", "balance")
  $balanceSign = Get-TextValue $Row @("balanceSign", "balance_sign")
  if (-not $balanceSign) {
    $balanceSign = if ($quantity -gt 0) { "positive" } elseif ($quantity -lt 0) { "negative" } else { "zero" }
  }
  return @{
    id = Get-TextValue $Row @("id") "$productCode`:$warehouseCode`:$serialName"
    productId = Get-TextValue $Row @("productId", "product_id", "productCode", "product_code", "sku")
    productCode = $productCode
    sku = Get-TextValue $Row @("sku", "productCode", "product_code")
    productName = Get-TextValue $Row @("productName", "product_name", "name")
    warehouseId = Get-TextValue $Row @("warehouseId", "warehouse_id", "warehouseCode", "warehouse_code")
    warehouseCode = $warehouseCode
    warehouseName = Get-TextValue $Row @("warehouseName", "warehouse_name", "warehouse") "Склад"
    serialName = $serialName
    serialNumber = Get-TextValue $Row @("serialNumber", "serial_number", "serialName", "serial_name", "serial")
    quantity = $quantity
    availableQty = $quantity
    balanceSign = $balanceSign
    snapshotAt = Get-TextValue $Row @("snapshotAt", "snapshot_at", "importedAt", "imported_at")
    sourceFile = Get-TextValue $Row @("sourceFile", "source_file")
    importedAt = Get-TextValue $Row @("importedAt", "imported_at")
    source = "crm-sql-live"
  }
}

function New-LiveProductsResponse($Params) {
  $query = Get-LiveQueryParams $Params 20 100
  $payload = Invoke-CrmSqlApi "/products" $query.params
  $items = @()
  foreach ($row in (Get-PayloadItems $payload)) { $items += ConvertTo-LiveProduct $row }
  return New-CrmSqlEnvelope "/products" $query $items $payload
}

function New-LiveProductPricesResponse($Params) {
  $query = Get-LiveQueryParams $Params 20 100 @("productCode")
  $payload = Invoke-CrmSqlApi "/one-c-mirror/product-prices" $query.params
  $productCodeFilter = (Get-QueryValue $Params "productCode").Trim().ToLowerInvariant()
  $items = @()
  foreach ($row in (Get-PayloadItems $payload)) {
    $item = ConvertTo-LiveProductPrice $row
    if ($productCodeFilter -and ([string]$item.productCode).Trim().ToLowerInvariant() -ne $productCodeFilter) { continue }
    $items += $item
  }
  return New-CrmSqlEnvelope "/one-c-mirror/product-prices" $query $items $payload
}

function New-LiveCounterpartiesResponse($Params) {
  $query = Get-LiveQueryParams $Params 20 100
  $search = Get-QueryValue $Params "search"
  $path = if ($search) { "/one-c-mirror/counterparty-balances" } else { "/one-c-mirror/counterparties" }
  $payload = Invoke-CrmSqlApi $path $query.params
  $items = @()
  foreach ($row in (Get-PayloadItems $payload)) { $items += ConvertTo-LiveCounterparty $row }
  $items = @(Select-UniqueLiveCounterparties $items)
  if ($search -and @($items).Count -le 1) {
    $fallbackParams = @{}
    foreach ($key in $query.params.Keys) { $fallbackParams[$key] = $query.params[$key] }
    $fallbackParams.limit = 100
    $fallbackParams.offset = 0
    $fallbackPayload = Invoke-CrmSqlApi "/one-c-mirror/counterparties" $fallbackParams
    $fallbackItems = @()
    foreach ($row in (Get-PayloadItems $fallbackPayload)) {
      $item = ConvertTo-LiveCounterparty $row
      if (Test-LiveCounterpartyMatch $item $search) { $fallbackItems += $item }
    }
    $items = @(Select-UniqueLiveCounterparties (@($items) + @($fallbackItems)) | Select-Object -First ([int]$query.limit))
  }
  if ($search) {
    $payload | Add-Member -NotePropertyName total -NotePropertyValue @($items).Count -Force
    $payload | Add-Member -NotePropertyName hasMore -NotePropertyValue $false -Force
    $payload | Add-Member -NotePropertyName nextOffset -NotePropertyValue $null -Force
  }
  return New-CrmSqlEnvelope $path $query $items $payload
}

function New-LiveWarehousesResponse($Params) {
  $query = Get-LiveQueryParams $Params 20 100
  $payload = Invoke-CrmSqlApi "/one-c-mirror/warehouses" $query.params
  $items = @()
  foreach ($row in (Get-PayloadItems $payload)) { $items += ConvertTo-LiveWarehouse $row }
  return New-CrmSqlEnvelope "/one-c-mirror/warehouses" $query $items $payload
}

function New-LiveStockBalancesResponse($Params) {
  $query = Get-LiveQueryParams $Params 20 100 @("productCode", "warehouseCode")
  $payload = Invoke-CrmSqlApi "/one-c-mirror/stock-balances" $query.params
  $items = @()
  foreach ($row in (Get-PayloadItems $payload)) { $items += ConvertTo-LiveStockBalance $row }
  return New-CrmSqlEnvelope "/one-c-mirror/stock-balances" $query $items $payload
}

function New-LiveSerialStockResponse($Params) {
  $query = Get-LiveQueryParams $Params 20 100 @("productCode", "warehouseCode")
  $payload = Invoke-CrmSqlApi "/one-c-mirror/serial-stock" $query.params
  $items = @()
  foreach ($row in (Get-PayloadItems $payload)) { $items += ConvertTo-LiveSerialStock $row }
  return New-CrmSqlEnvelope "/one-c-mirror/serial-stock" $query $items $payload
}

function New-CustomersResponse($StateContainer, $Params) {
  $bounds = Get-BoundedParams $Params 20 100
  $search = Get-QueryValue $Params "search"
  $rows = @()
  foreach ($customer in (Get-StateArray $StateContainer "customers")) {
    if (Test-CustomerMatch $customer $search) {
      $rows += ConvertTo-PublicCustomer $customer
    }
  }
  $items = @(Select-Page $rows $bounds.offset $bounds.limit)
  return New-LiveApiEnvelope $StateContainer @{
    items = $items
    total = @($rows).Count
    limit = $bounds.limit
    offset = $bounds.offset
    query = @{ search = $search }
  }
}

function New-StockBalancesResponse($StateContainer, $Params) {
  $bounds = Get-BoundedParams $Params 50 100
  $search = Get-QueryValue $Params "search"
  $productId = Normalize-Text (Get-QueryValue $Params "productId")
  $warehouseRaw = Get-QueryValue $Params "warehouseId"
  if (-not $warehouseRaw) {
    $warehouseRaw = Get-QueryValue $Params "warehouseCode"
  }
  $warehouseId = Normalize-Text $warehouseRaw
  $products = @{}
  foreach ($product in (Get-StateArray $StateContainer "products")) {
    $products[[string]$product.id] = $product
  }
  $rows = @()
  foreach ($row in (Get-StateArray $StateContainer "stock")) {
    if ($productId -and (Normalize-Text $row.productId) -ne $productId -and (Normalize-Text $row.productCode) -ne $productId) { continue }
    if ($warehouseId -and (Normalize-Text $row.warehouseCode) -ne $warehouseId -and (Normalize-Text $row.warehouseName) -ne $warehouseId) { continue }
    $product = if ($products.ContainsKey([string]$row.productId)) { $products[[string]$row.productId] } else { $null }
    if ($search) {
      $haystack = Normalize-Text (@($row.productId, $row.productCode, $row.warehouseCode, $row.warehouseName, $product.name, $product.sku, $product.productCode) -join " ")
      if (-not $haystack.Contains((Normalize-Text $search))) { continue }
    }
    $rows += @{
      productId = [string]$row.productId
      productCode = if ($row.productCode) { [string]$row.productCode } elseif ($product) { [string]$product.productCode } else { "" }
      productName = if ($product) { [string]$product.name } else { "" }
      warehouseCode = [string]$row.warehouseCode
      warehouseName = [string]$row.warehouseName
      qty = [double]($row.qty)
      reservedQty = [double]($row.reservedQty)
    }
  }
  $items = @(Select-Page $rows $bounds.offset $bounds.limit)
  return New-LiveApiEnvelope $StateContainer @{
    items = $items
    total = @($rows).Count
    limit = $bounds.limit
    offset = $bounds.offset
    query = @{ search = $search; productId = $productId; warehouseId = $warehouseId }
  }
}

function New-WarehousesResponse($StateContainer, $Params) {
  $bounds = Get-BoundedParams $Params 100 100
  $search = Normalize-Text (Get-QueryValue $Params "search")
  $warehouses = @{}
  foreach ($row in (Get-StateArray $StateContainer "stock")) {
    $code = [string]$row.warehouseCode
    $name = [string]$row.warehouseName
    $key = if ($code) { $code } else { $name }
    if (-not $key) { continue }
    if ($search -and -not (Normalize-Text "$code $name").Contains($search)) { continue }
    if (-not $warehouses.ContainsKey($key)) {
      $warehouses[$key] = @{ warehouseCode = $code; warehouseName = $name }
    }
  }
  $rows = @($warehouses.Values)
  $items = @(Select-Page $rows $bounds.offset $bounds.limit)
  return New-LiveApiEnvelope $StateContainer @{
    items = $items
    total = @($rows).Count
    limit = $bounds.limit
    offset = $bounds.offset
    query = @{ search = $search }
  }
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

  if ($method -eq "GET" -and $path -eq "/api/live/products") {
    try {
      Send-Json $Client 200 (New-LiveProductsResponse (Get-QueryParams $Request.RawPath))
    } catch {
      Send-Json $Client 502 @{ error = $_.Exception.Message; source = "crm-sql-live"; bounded = $true }
    }
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/live/product-prices") {
    try {
      Send-Json $Client 200 (New-LiveProductPricesResponse (Get-QueryParams $Request.RawPath))
    } catch {
      Send-Json $Client 502 @{ error = $_.Exception.Message; source = "crm-sql-live"; bounded = $true }
    }
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/live/exchange-rates") {
    try {
      Send-Json $Client 200 (New-LiveExchangeRatesResponse (Get-QueryParams $Request.RawPath))
    } catch {
      Send-Json $Client 502 @{
        error = $_.Exception.Message
        code = "NBU_EXCHANGE_RATES_UNAVAILABLE"
        source = "nbu"
        bounded = $true
      }
    }
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/live/counterparties") {
    try {
      Send-Json $Client 200 (New-LiveCounterpartiesResponse (Get-QueryParams $Request.RawPath))
    } catch {
      Send-Json $Client 502 @{ error = $_.Exception.Message; source = "crm-sql-live"; bounded = $true }
    }
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/live/warehouses") {
    try {
      Send-Json $Client 200 (New-LiveWarehousesResponse (Get-QueryParams $Request.RawPath))
    } catch {
      Send-Json $Client 502 @{ error = $_.Exception.Message; source = "crm-sql-live"; bounded = $true }
    }
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/live/stock-balances") {
    try {
      Send-Json $Client 200 (New-LiveStockBalancesResponse (Get-QueryParams $Request.RawPath))
    } catch {
      Send-Json $Client 502 @{ error = $_.Exception.Message; source = "crm-sql-live"; bounded = $true }
    }
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/live/serial-stock") {
    $params = Get-QueryParams $Request.RawPath
    if (-not (Get-QueryValue $params "productCode").Trim()) {
      Send-Json $Client 400 @{
        error = "productCode is required"
        code = "SERIAL_PRODUCT_REQUIRED"
        source = "crm-sql-live"
        bounded = $true
      }
      return
    }
    try {
      Send-Json $Client 200 (New-LiveSerialStockResponse $params)
    } catch {
      Send-Json $Client 502 @{ error = $_.Exception.Message; source = "crm-sql-live"; bounded = $true }
    }
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/products") {
    try {
      Send-Json $Client 200 (New-LiveProductsResponse (Get-QueryParams $Request.RawPath))
    } catch {
      $stateContainer = Read-JsonFile $StatePath (New-DefaultStateContainer)
      $payload = New-ProductsResponse $stateContainer (Get-QueryParams $Request.RawPath)
      $payload["fallbackError"] = $_.Exception.Message
      Send-Json $Client 200 $payload
    }
    return
  }

  if ($method -eq "GET" -and $path.StartsWith("/api/products/")) {
    $stateContainer = Read-JsonFile $StatePath (New-DefaultStateContainer)
    $productId = Decode-QueryValue ($path.Substring("/api/products/".Length))
    $product = Find-ProductById $stateContainer $productId
    if (-not $product) {
      Send-Json $Client 404 @{ error = "Product not found" }
      return
    }
    Send-Json $Client 200 (New-LiveApiEnvelope $stateContainer @{ item = ConvertTo-PublicProduct $product $stateContainer.state })
    return
  }

  if ($method -eq "GET" -and ($path -eq "/api/customers" -or $path -eq "/api/clients")) {
    $stateContainer = Read-JsonFile $StatePath (New-DefaultStateContainer)
    Send-Json $Client 200 (New-CustomersResponse $stateContainer (Get-QueryParams $Request.RawPath))
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/stock-balances") {
    $stateContainer = Read-JsonFile $StatePath (New-DefaultStateContainer)
    Send-Json $Client 200 (New-StockBalancesResponse $stateContainer (Get-QueryParams $Request.RawPath))
    return
  }

  if ($method -eq "GET" -and $path -eq "/api/warehouses") {
    $stateContainer = Read-JsonFile $StatePath (New-DefaultStateContainer)
    Send-Json $Client 200 (New-WarehousesResponse $stateContainer (Get-QueryParams $Request.RawPath))
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
      releasedAt = $health.releasedAt
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
    $conflict = ($baseRevision -lt [int]($current.revision))
    $nextState = $body.state
    if ($conflict -and $current.state -and $current.state.employeeSessions) {
      if ($nextState.PSObject.Properties.Name -contains "employeeSessions") {
        $nextState.employeeSessions = $current.state.employeeSessions
      } else {
        $nextState | Add-Member -NotePropertyName "employeeSessions" -NotePropertyValue $current.state.employeeSessions
      }
    }
    $next = @{
      revision = [int]($current.revision) + 1
      savedAt = [DateTime]::UtcNow.ToString("o")
      savedBy = [string]($body.savedBy)
      build = if ($body.build) { [string]$body.build } else { $AppBuild }
      appVersion = if ($body.appVersion) { [string]$body.appVersion } else { $AppVersion }
      releasedAt = if ($body.releasedAt) { [string]$body.releasedAt } else { $AppReleasedAt }
      conflict = $conflict
      state = $nextState
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
      releasedAt = if ($body.releasedAt) { [string]$body.releasedAt } else { $AppReleasedAt }
      settings = $settings
    }
    Write-JsonFile $SettingsPath $next
    $stateContainer = Read-JsonFile $StatePath (New-DefaultStateContainer)
    Send-Json $Client 200 @{
      revision = $next.revision
      savedAt = $next.savedAt
      savedBy = $next.savedBy
      build = $next.build
      releasedAt = $next.releasedAt
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
      try {
        Send-Json $client 500 @{ error = $_.Exception.Message }
      } catch {
        Write-Host "Request failed before response could be sent: $($_.Exception.Message)"
      }
    } finally {
      try {
        $client.Close()
      } catch {
      }
    }
  }
} finally {
  $listener.Stop()
}
