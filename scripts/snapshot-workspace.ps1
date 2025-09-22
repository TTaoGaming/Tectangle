<# Snapshot workspace (PowerShell)
   Creates a timestamped archive under archive-stale/archive-YYYY-MM-DDTHH-MM-SSZ/
   Excludes common large/virtual folders (node_modules, .venv, archive-stale).
   Usage (PowerShell): powershell -ExecutionPolicy Bypass -File .\scripts\snapshot-workspace.ps1
#>

$ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ss'Z'")
$archiveDir = Join-Path -Path "archive-stale" -ChildPath "archive-$ts"
New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null
Write-Output "Snapshot directory: $archiveDir"

$exclude = @('node_modules', '.venv', 'archive-stale', '.git')
$items = Get-ChildItem -Path . -Force | Where-Object { $exclude -notcontains $_.Name }

$paths = @()
foreach ($it in $items) {
  $paths += $it.FullName
}

$zipPath = Join-Path -Path $archiveDir -ChildPath "workspace-$ts.zip"

try {
  Compress-Archive -Path $paths -DestinationPath $zipPath -Force -ErrorAction Stop
  Write-Output "Snapshot created: $zipPath"
} catch {
  Write-Warning "Compress-Archive failed: $_. Exception. Falling back to recursive copy..."
  foreach ($p in $paths) {
    $relative = $p.Substring((Get-Location).Path.Length).TrimStart('\')
    $dest = Join-Path -Path $archiveDir -ChildPath $relative
    $destDir = Split-Path -Parent $dest
    if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    Copy-Item -Path $p -Destination $dest -Recurse -Force -ErrorAction SilentlyContinue
  }
  Write-Output "Snapshot copy completed at $archiveDir"
}

Write-Output ""
Write-Output "When opening a PR, add this line to the PR description:"
Write-Output "BACKUP-CREATED: $archiveDir"