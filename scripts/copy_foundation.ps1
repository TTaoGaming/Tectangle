# Copy Foundation contents from source to destination with backups
param(
    [string]$Source = "August Tectangle Sprint/foundation",
    [string]$Destination = "TAGS-standalone/foundation"
)

$errors = New-Object System.Collections.ArrayList
$backups = New-Object System.Collections.ArrayList
[int]$copied = 0
[int]$overwritten = 0

try {
    $srcItem = Get-Item -Path $Source -ErrorAction Stop
    $srcRoot = $srcItem.FullName.TrimEnd('\','/')
} catch {
    Write-Output (ConvertTo-Json @{ error = "SourceNotFound"; message = $_.Exception.Message})
    exit 1
}

# Ensure destination exists
if (-not (Test-Path -Path $Destination)) {
    try {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    } catch {
        Write-Output (ConvertTo-Json @{ error = "CreateDestinationFailed"; message = $_.Exception.Message})
        exit 1
    }
}

# Get all files
$files = Get-ChildItem -Path $srcRoot -File -Recurse -Force

foreach ($file in $files) {
    try {
        $rel = $file.FullName.Substring($srcRoot.Length).TrimStart('\','/')
        $target = Join-Path -Path $Destination -ChildPath $rel
        $tDir = Split-Path -Path $target -Parent
        if (-not (Test-Path -Path $tDir)) {
            New-Item -ItemType Directory -Path $tDir -Force | Out-Null
        }
        if (Test-Path -Path $target) {
            $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ss'Z'")
            $bak = $target + ".bak." + $ts
            try {
                Copy-Item -Path $target -Destination $bak -Force -ErrorAction Stop
                [void]$backups.Add($bak)
            } catch {
                [void]$errors.Add("backup:$target => " + $_.Exception.Message)
            }
            $overwritten++
        }
        try {
            Copy-Item -Path $file.FullName -Destination $target -Force -ErrorAction Stop
            # preserve timestamps where possible
            $srcIt = Get-Item -Path $file.FullName -ErrorAction Stop
            $dstIt = Get-Item -Path $target -ErrorAction Stop
            try {
                $dstIt.CreationTimeUtc = $srcIt.CreationTimeUtc
                $dstIt.LastWriteTimeUtc = $srcIt.LastWriteTimeUtc
                $dstIt.LastAccessTimeUtc = $srcIt.LastAccessTimeUtc
            } catch {
                # fallback to local time properties
                try {
                    $dstIt.CreationTime = $srcIt.CreationTime
                    $dstIt.LastWriteTime = $srcIt.LastWriteTime
                    $dstIt.LastAccessTime = $srcIt.LastAccessTime
                } catch {
                    # ignore if unable to set timestamps
                }
            }
            $copied++
        } catch {
            [void]$errors.Add($file.FullName + " => " + $_.Exception.Message)
            continue
        }
    } catch {
        [void]$errors.Add($file.FullName + " => " + $_.Exception.Message)
        continue
    }
}

# Verification
$verifyIndex = Test-Path -Path (Join-Path $Destination "index.html")
$verifyAdapter = Test-Path -Path (Join-Path $Destination "sdk\adapter\adapter.js")
$verifyAssets = $false
if (Test-Path -Path (Join-Path $Destination "assets")) {
    try {
        $assetFiles = Get-ChildItem -Path (Join-Path $Destination "assets") -File -Recurse -ErrorAction SilentlyContinue
        if ($assetFiles.Count -gt 0) { $verifyAssets = $true }
    } catch {}
}
$sourceUiExists = Test-Path -Path (Join-Path $Source "ui")
if ($sourceUiExists) {
    $verifyUi = Test-Path -Path (Join-Path $Destination "ui")
} else {
    $verifyUi = "N/A"
}

$out = [ordered]@{
    copied = $copied
    overwritten = $overwritten
    backups = $backups
    failed = $errors
    verify = [ordered]@{
        index_html = $verifyIndex
        adapter_js = $verifyAdapter
        assets = $verifyAssets
        ui = $verifyUi
    }
}

$out | ConvertTo-Json -Depth 6