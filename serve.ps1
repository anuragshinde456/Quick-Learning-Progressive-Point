$port = 8085
$prefix = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Server running at $prefix"

$root = $PSScriptRoot
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function To-JsonArray($list) {
    if (-not $list) { return "[]" }
    $arr = @($list)
    if ($arr.Count -eq 0) { return "[]" }
    $strList = @()
    foreach ($item in $arr) {
        $strList += ($item | ConvertTo-Json -Depth 10)
    }
    return "[`n" + ($strList -join ",`n") + "`n]"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = [System.Uri]::UnescapeDataString($request.Url.LocalPath)

        # --- REST API: Gallery Database (Server-side persistent storage, ZERO LocalStorage) ---
        if ($path -eq "/api/gallery" -or $path.StartsWith("/api/gallery/")) {
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
            $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey")

            if ($request.HttpMethod -eq "OPTIONS") {
                $response.StatusCode = 200
                $response.Close()
                continue
            }

            $dataDir = Join-Path $root "data"
            if (-not (Test-Path $dataDir)) {
                New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
            }
            $dataFile = Join-Path $dataDir "gallery.json"

            if ($request.HttpMethod -eq "GET") {
                if (-not (Test-Path $dataFile)) {
                    $initGallery = @(
                        @{
                            id = "gal_db_001"
                            title = "Odisha Board & Entrance Toppers Felicitation Ceremony"
                            category = "Achievements"
                            imageUrl = "assets/gallery_achievement.jpg"
                            description = "Honoring our exceptional Class 10/12 CHSE Odisha & CBSE state rankers and NEET/JEE achievers mentored by QPCP home faculty across Bhubaneswar & Cuttack."
                            uploadedBy = "admin"
                            createdAt = (Get-Date).ToString("o")
                        }
                    )
                    $initJson = To-JsonArray $initGallery
                    [System.IO.File]::WriteAllText($dataFile, $initJson, $utf8NoBom)
                }

                $bytes = [System.IO.File]::ReadAllBytes($dataFile)
                $response.ContentType = "application/json; charset=utf-8"
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }
            elseif ($request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
                $rawBody = $reader.ReadToEnd()
                $newItem = $rawBody | ConvertFrom-Json

                if (-not $newItem.id) {
                    $newItem | Add-Member -NotePropertyName "id" -NotePropertyValue ("gal_" + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()) -Force
                }
                if (-not $newItem.createdAt) {
                    $newItem | Add-Member -NotePropertyName "createdAt" -NotePropertyValue ((Get-Date).ToString("o")) -Force
                }

                # If imageUrl is base64 data URL, save physical image file to assets/gallery_uploads on server
                if ($newItem.imageUrl -and $newItem.imageUrl.StartsWith("data:image/")) {
                    try {
                        $parts = $newItem.imageUrl -split ",", 2
                        $headerPart = $parts[0]
                        $base64Data = $parts[1]
                        $ext = ".png"
                        if ($headerPart -match "image/jpeg" -or $headerPart -match "image/jpg") { $ext = ".jpg" }
                        elseif ($headerPart -match "image/webp") { $ext = ".webp" }
                        elseif ($headerPart -match "image/gif") { $ext = ".gif" }

                        $uploadDir = Join-Path $root "assets\gallery_uploads"
                        if (-not (Test-Path $uploadDir)) {
                            New-Item -ItemType Directory -Path $uploadDir -Force | Out-Null
                        }

                        $fileName = $newItem.id + $ext
                        $destPath = Join-Path $uploadDir $fileName
                        $imgBytes = [System.Convert]::FromBase64String($base64Data)
                        [System.IO.File]::WriteAllBytes($destPath, $imgBytes)

                        # Update imageUrl to clean relative asset URL
                        $newItem.imageUrl = "assets/gallery_uploads/" + $fileName
                    } catch {
                        Write-Host "Base64 decode error: $_"
                    }
                }

                $existing = @()
                if (Test-Path $dataFile) {
                    $currentJson = [System.IO.File]::ReadAllText($dataFile, [System.Text.Encoding]::UTF8)
                    if ($currentJson -and $currentJson.Trim().Length -gt 0) {
                        $parsed = $currentJson | ConvertFrom-Json
                        if ($parsed -is [System.Array]) {
                            $existing = @($parsed)
                        } elseif ($parsed) {
                            $existing = @($parsed)
                        }
                    }
                }

                $updatedList = @($newItem) + $existing
                $updatedJson = To-JsonArray $updatedList
                [System.IO.File]::WriteAllText($dataFile, $updatedJson, $utf8NoBom)

                $outBytes = $utf8NoBom.GetBytes(($newItem | ConvertTo-Json -Depth 5))
                $response.ContentType = "application/json; charset=utf-8"
                $response.StatusCode = 201
                $response.ContentLength64 = $outBytes.Length
                $response.OutputStream.Write($outBytes, 0, $outBytes.Length)
                $response.Close()
                continue
            }
            elseif ($request.HttpMethod -eq "DELETE") {
                $deleteId = $request.QueryString["id"]
                if ($deleteId -and (Test-Path $dataFile)) {
                    $existing = @()
                    $currentJson = [System.IO.File]::ReadAllText($dataFile, [System.Text.Encoding]::UTF8)
                    if ($currentJson -and $currentJson.Trim().Length -gt 0) {
                        $parsed = $currentJson | ConvertFrom-Json
                        if ($parsed -is [System.Array]) {
                            $existing = @($parsed)
                        } elseif ($parsed) {
                            $existing = @($parsed)
                        }
                    }
                    $filtered = $existing | Where-Object { $_.id -ne $deleteId }
                    $updatedJson = To-JsonArray $filtered
                    [System.IO.File]::WriteAllText($dataFile, $updatedJson, $utf8NoBom)
                }
                $response.ContentType = "application/json; charset=utf-8"
                $msg = '{"success":true}'
                $msgBytes = $utf8NoBom.GetBytes($msg)
                $response.ContentLength64 = $msgBytes.Length
                $response.OutputStream.Write($msgBytes, 0, $msgBytes.Length)
                $response.Close()
                continue
            }
        }

        # --- Static File Serving & SPA Clean URL Fallback ---
        if ($path -eq "/" -or [string]::IsNullOrWhiteSpace($path)) { $path = "/index.html" }

        $filePath = Join-Path $root $path.TrimStart('/')

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            switch ($ext) {
                ".html" { $response.ContentType = "text/html; charset=utf-8" }
                ".css"  { $response.ContentType = "text/css" }
                ".js"   { $response.ContentType = "application/javascript" }
                ".jpg"  { $response.ContentType = "image/jpeg" }
                ".jpeg" { $response.ContentType = "image/jpeg" }
                ".png"  { $response.ContentType = "image/png" }
                ".webp" { $response.ContentType = "image/webp" }
                ".svg"  { $response.ContentType = "image/svg+xml" }
                ".ico"  { $response.ContentType = "image/x-icon" }
                ".json" { $response.ContentType = "application/json" }
                default { $response.ContentType = "application/octet-stream" }
            }

            $response.ContentLength64 = $bytes.Length
            if ($request.HttpMethod -ne "HEAD") {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } else {
            # SPA Clean URL Fallback: For routes without file extension (/about-us, /gallery, /student/dashboard, /admin/applicants, etc.)
            $hasExt = [System.IO.Path]::HasExtension($path)
            $spaIndex = Join-Path $root "index.html"
            if (-not $hasExt -and (Test-Path $spaIndex)) {
                $bytes = [System.IO.File]::ReadAllBytes($spaIndex)
                $response.ContentType = "text/html; charset=utf-8"
                $response.StatusCode = 200
                $response.ContentLength64 = $bytes.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                $response.StatusCode = 404
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.ContentLength64 = $buffer.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
            }
        }

        $response.OutputStream.Close()
    } catch {
        # Keep server alive on unexpected client disconnects
    }
}
