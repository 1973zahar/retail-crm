param(
    [int]$Port = 8790,
    [string]$Root = $PSScriptRoot,
    [switch]$Once
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-ContentType {
    param([string]$Path)

    switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
        ".html" { return "text/html; charset=utf-8" }
        ".htm" { return "text/html; charset=utf-8" }
        ".css" { return "text/css; charset=utf-8" }
        ".js" { return "text/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".svg" { return "image/svg+xml" }
        ".png" { return "image/png" }
        ".jpg" { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif" { return "image/gif" }
        ".webp" { return "image/webp" }
        ".ico" { return "image/x-icon" }
        ".txt" { return "text/plain; charset=utf-8" }
        ".md" { return "text/markdown; charset=utf-8" }
        default { return "application/octet-stream" }
    }
}

function Get-LanAddresses {
    [System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) |
        Where-Object {
            $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and
            -not [System.Net.IPAddress]::IsLoopback($_)
        } |
        ForEach-Object { $_.IPAddressToString }
}

function Send-HttpResponse {
    param(
        [System.Net.Sockets.TcpClient]$Client,
        [int]$StatusCode,
        [string]$StatusText,
        [byte[]]$BodyBytes,
        [string]$ContentType,
        [int64]$ContentLength = -1
    )

    $stream = $Client.GetStream()
    if ($ContentLength -lt 0) {
        $ContentLength = $BodyBytes.Length
    }

    $headers = @(
        "HTTP/1.1 $StatusCode $StatusText"
        "Content-Type: $ContentType"
        "Content-Length: $ContentLength"
        "Connection: close"
        "Cache-Control: no-store"
        ""
        ""
    ) -join "`r`n"

    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
    $stream.Write($headerBytes, 0, $headerBytes.Length)

    if ($BodyBytes.Length -gt 0) {
        $stream.Write($BodyBytes, 0, $BodyBytes.Length)
    }

    $stream.Flush()
}

function Send-ErrorResponse {
    param(
        [System.Net.Sockets.TcpClient]$Client,
        [int]$StatusCode,
        [string]$StatusText
    )

    $html = "<!doctype html><meta charset=`"utf-8`"><title>$StatusCode $StatusText</title><h1>$StatusCode $StatusText</h1>"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($html)
    Send-HttpResponse -Client $Client -StatusCode $StatusCode -StatusText $StatusText -BodyBytes $bytes -ContentType "text/html; charset=utf-8"
}

function Resolve-StaticPath {
    param([string]$RequestTarget)

    $cleanTarget = ($RequestTarget -split "\?")[0]
    $cleanTarget = ($cleanTarget -split "#")[0]

    if ([string]::IsNullOrWhiteSpace($cleanTarget) -or $cleanTarget -eq "/") {
        $cleanTarget = "/index.html"
    }

    $decodedTarget = [System.Uri]::UnescapeDataString($cleanTarget)
    $relativePath = $decodedTarget.TrimStart([char[]]@("/", "\"))
    $relativePath = $relativePath -replace "/", [System.IO.Path]::DirectorySeparatorChar
    $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $script:ResolvedRoot $relativePath))
    $rootPrefix = $script:ResolvedRoot + [System.IO.Path]::DirectorySeparatorChar

    if ($candidatePath -ne $script:ResolvedRoot -and -not $candidatePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $null
    }

    return $candidatePath
}

$script:ResolvedRoot = [System.IO.Path]::GetFullPath($Root).TrimEnd([char[]]@("\", "/"))

if (-not [System.IO.Directory]::Exists($script:ResolvedRoot)) {
    throw "Root folder not found: $script:ResolvedRoot"
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$listener.Server.SetSocketOption(
    [System.Net.Sockets.SocketOptionLevel]::Socket,
    [System.Net.Sockets.SocketOptionName]::ReuseAddress,
    $true
)
$listener.Start()

try {
    Write-Host "B2C Retail CRM LAN viewer"
    Write-Host "Root:  $script:ResolvedRoot"
    Write-Host "Local: http://127.0.0.1:$Port/index.html"

    $lanUrls = @(Get-LanAddresses | ForEach-Object { "http://$_`:$Port/index.html" })
    if ($lanUrls.Count -gt 0) {
        Write-Host "LAN:"
        foreach ($url in $lanUrls) {
            Write-Host "  $url"
        }
    } else {
        Write-Host "LAN: no IPv4 LAN address found"
    }

    Write-Host "Stop:  Ctrl+C"

    while ($true) {
        $client = $listener.AcceptTcpClient()
        $client.ReceiveTimeout = 5000
        $client.SendTimeout = 5000

        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()

            if ([string]::IsNullOrWhiteSpace($requestLine)) {
                Send-ErrorResponse -Client $client -StatusCode 400 -StatusText "Bad Request"
                continue
            }

            for ($i = 0; $i -lt 100; $i++) {
                $headerLine = $reader.ReadLine()
                if ($null -eq $headerLine -or $headerLine -eq "") {
                    break
                }
            }

            $parts = $requestLine -split " "
            if ($parts.Count -lt 2) {
                Send-ErrorResponse -Client $client -StatusCode 400 -StatusText "Bad Request"
                continue
            }

            $method = $parts[0].ToUpperInvariant()
            $requestTarget = $parts[1]

            if ($method -ne "GET" -and $method -ne "HEAD") {
                Send-ErrorResponse -Client $client -StatusCode 405 -StatusText "Method Not Allowed"
                Write-Host "$(Get-Date -Format HH:mm:ss) $method $requestTarget -> 405"
                continue
            }

            $staticPath = Resolve-StaticPath -RequestTarget $requestTarget
            if ($null -eq $staticPath) {
                Send-ErrorResponse -Client $client -StatusCode 403 -StatusText "Forbidden"
                Write-Host "$(Get-Date -Format HH:mm:ss) $method $requestTarget -> 403"
                continue
            }

            if (-not [System.IO.File]::Exists($staticPath)) {
                Send-ErrorResponse -Client $client -StatusCode 404 -StatusText "Not Found"
                Write-Host "$(Get-Date -Format HH:mm:ss) $method $requestTarget -> 404"
                continue
            }

            $contentLength = (Get-Item -LiteralPath $staticPath).Length
            if ($method -eq "HEAD") {
                $bodyBytes = [byte[]]@()
            } else {
                $bodyBytes = [System.IO.File]::ReadAllBytes($staticPath)
            }

            Send-HttpResponse `
                -Client $client `
                -StatusCode 200 `
                -StatusText "OK" `
                -BodyBytes $bodyBytes `
                -ContentType (Get-ContentType -Path $staticPath) `
                -ContentLength $contentLength

            Write-Host "$(Get-Date -Format HH:mm:ss) $method $requestTarget -> 200"
        } catch {
            try {
                Send-ErrorResponse -Client $client -StatusCode 500 -StatusText "Internal Server Error"
            } catch {
                Write-Host "Response failed: $($_.Exception.Message)"
            }

            Write-Host "Request failed: $($_.Exception.Message)"
        } finally {
            $client.Close()
        }

        if ($Once) {
            break
        }
    }
} finally {
    $listener.Stop()
}
