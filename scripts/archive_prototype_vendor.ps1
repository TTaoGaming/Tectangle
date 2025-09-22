# Archive prototype & vendor files listed in inventory.md
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\archive_prototype_vendor.ps1
# This script moves files (not delete) preserving directory structure under archive-stale/auto-archive-<timestamp>
# Review the inventory file before running.

$ErrorActionPreference = 'Stop'

$inventoryPath = 'August Tectangle Sprint/foundation/docs/inventory.md'
if (-not (Test-Path $inventoryPath)) {
  Write-Error "Inventory not found at path: $inventoryPath"
  exit 1
}

$content = Get-Content -Raw -Path $inventoryPath
$pattern = '- \[`([^`]+)`\].*classification:\s*(prototype|vendor)'
[System.Text.RegularExpressions.Regex]$rx = $pattern
$matches = $rx.Matches($content)

if ($matches.Count -eq 0) {
  Write-Output "No prototype/vendor entries found in inventory."
  exit 0
}

$ts = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'
$archiveRoot = Join-Path 'archive-stale' ("auto-archive-$ts")
New-Item -ItemType Directory -Path $archiveRoot -Force | Out-Null
Write-Output "Archive root created: $archiveRoot"

foreach ($m in $matches) {
  $path = $m.Groups[1].Value.Trim()
  $class = $m.Groups[2].Value.Trim()
  if ([string]::IsNullOrWhiteSpace($path)) { continue }

  if (Test-Path -LiteralPath $path) {
    $dest = Join-Path $archiveRoot $path
    $destDir = Split-Path $dest -Parent
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    try {
      Move-Item -LiteralPath $path -Destination $dest -Force
      Write-Output "Moved: $path -> $dest"
    } catch {
      Write-Warning "Failed to move: $path -> $dest : $_"
    }
  } else {
    Write-Output "Not found (skipped): $path"
  }
}

Write-Output "Archive complete. Archive root: $archiveRoot"