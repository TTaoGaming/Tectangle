Yeah# PowerShell script to recursively copy contents of piano-genie-clone to TAGS-standalone/piano-genie with backups and timestamp preservation.
$ErrorActionPreference = 'Continue'
$srcRootRel = 'August Tectangle Sprint/piano-genie-clone'
$dstRootRel = 'TAGS-standalone/piano-genie'
try {
  $srcFull = (Resolve-Path -Path $srcRootRel -ErrorAction Stop).Path
} catch {
  Write-Output (ConvertTo-Json @{ error = "ERROR_RESOLVE_SRC"; message = "Source path not found: $srcRootRel" })
  exit 2
}
if (-not (Test-Path -Path $dstRootRel)) {
  New-Item -ItemType Directory -Path $dstRootRel -Force | Out-Null
}
$dstFull = (Resolve-Path -Path $dstRootRel -ErrorAction Stop).Path
# choose actual source path containing index.html
if (Test-Path (Join-Path $srcFull 'index.html')) {
  $actualSrc = $srcFull
} else {
  $foundDir = Get-ChildItem -Path $srcFull -Directory -Recurse -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName 'index.html') } | Select-Object -First 1
  if ($foundDir) {
    $actualSrc = $foundDir.FullName
  } else {
    # maybe nested 'piano-genie-clone' path - fallback search for any index.html under source root
    $foundFile = Get-ChildItem -Path $srcFull -Filter 'index.html' -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($foundFile) {
      $actualSrc = $foundFile.Directory.FullName
    } else {
      Write-Output (ConvertTo-Json @{ error = "NO_INDEX_FOUND"; message = "No index.html found in source root or subdirectories: $srcRootRel" })
      exit 2
    }
  }
}
# initialize counters and arrays
$filesCopied = 0
$filesOverwritten = 0
$backups = @()
$failures = @()
# Get all files under actualSrc
$allFiles = Get-ChildItem -Path $actualSrc -File -Recurse -ErrorAction SilentlyContinue
foreach ($fi in $allFiles) {
  $srcFile = $fi.FullName
  # compute relative path
  $relative = $srcFile.Substring($actualSrc.Length)
  if ($relative.StartsWith('\') -or $relative.StartsWith('/')) { $relative = $relative.Substring(1) }
  $dstFile = Join-Path $dstFull $relative
  $dstDir = Split-Path -Parent $dstFile
  if (-not (Test-Path -Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
  try {
    if (Test-Path -Path $dstFile) {
      $timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH-mm-ssZ')
      $safeTs = $timestamp -replace ':','-'
      $backupFile = $dstFile + '.bak.' + $safeTs
      Copy-Item -Path $dstFile -Destination $backupFile -Force -ErrorAction Stop
      $backups += $backupFile
      $filesOverwritten += 1
    }
    Copy-Item -Path $srcFile -Destination $dstFile -Force -ErrorAction Stop
    # preserve timestamps
    try {
      $srcInfo = Get-Item $srcFile -ErrorAction Stop
      $dstInfo = Get-Item $dstFile -ErrorAction Stop
      $dstInfo.LastWriteTime = $srcInfo.LastWriteTime
      $dstInfo.CreationTime = $srcInfo.CreationTime
    } catch { }
    $filesCopied += 1
  } catch {
    $errMsg = $_.Exception.Message
    $failures += "$srcFile -> $dstFile : $errMsg"
  }
}
# verification
$indexExists = Test-Path (Join-Path $dstFull 'index.html')
$assetsPath = Join-Path $dstFull 'assets'
$assetsExists = Test-Path $assetsPath
$assetsHasContent = $false
if ($assetsExists) {
  $fileCount = (Get-ChildItem -Path $assetsPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
  $assetsHasContent = ($fileCount -gt 0)
}
$adapterSrcPath = Join-Path $dstFull 'src\js\tectangleAdapter.js'
$adapterAssetsPath = Join-Path $dstFull 'assets\js\tectangleAdapter.js'
$adapterSrcExists = Test-Path $adapterSrcPath
$adapterAssetsExists = Test-Path $adapterAssetsPath
$adapterDetected = $null
if ($adapterSrcExists) { $adapterDetected = $adapterSrcPath } elseif ($adapterAssetsExists) { $adapterDetected = $adapterAssetsPath }
$report = @{
  filesCopied = $filesCopied
  filesOverwritten = $filesOverwritten
  backups = $backups
  failures = $failures
  verify = @{
    index_html = $indexExists
    assets_dir = $assetsExists
    assets_has_content = $assetsHasContent
    adapter_src_exists = $adapterSrcExists
    adapter_assets_exists = $adapterAssetsExists
    adapter_path = $adapterDetected
  }
}
# Output report as JSON
$report | ConvertTo-Json -Depth 10
exit 0