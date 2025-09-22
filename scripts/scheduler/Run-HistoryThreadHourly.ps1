param(
  [int]$MaxGapMin = 60
)

# Ensure we run from repo root regardless of Task Scheduler working dir
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\\..')
Set-Location -LiteralPath $repoRoot

# Run heartbeat and copy latest heartbeat md to HistoryThread hourly folder
Write-Host "[Hourly] Heartbeat + Rollup copy"
$node = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $node) { $node = 'node' }
& $node HiveFleetObsidian/tools/heartbeat.mjs | Out-Host

$hb = Get-ChildItem -Path 'HiveFleetObsidian/reports/heartbeat' -Filter 'heartbeat_*.md' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($hb) {
  New-Item -ItemType Directory -Force -Path 'HiveFleetObsidian/historythread/hourly' | Out-Null
  Copy-Item $hb.FullName 'HiveFleetObsidian/historythread/hourly/' -Force
  Write-Host "[Hourly] Copied -> $($hb.Name)"
} else {
  Write-Warning "[Hourly] No heartbeat report found"
}

# Run gap check and emit a GAP file if violated
Write-Host "[Hourly] Gap audit ($MaxGapMin min)"
$gapNode = $node
$gapJson = & $gapNode HiveFleetObsidian/tools/history_gap_audit.mjs --max-gap-min $MaxGapMin 2>$null
Write-Host $gapJson
try {
  $gap = $gapJson | ConvertFrom-Json
} catch { $gap = $null }

if ($gap -and $gap.gapViolation) {
  $out = 'HiveFleetObsidian/historythread/hourly/GAP_' + (Get-Date -Format 'yyyy-MM-ddTHH-mm-ss') + '.md'
  $msg = "[GAP] No scribe append within $($gap.threshold) min. MaxGap=$($gap.maxGapMinutes). Entries=$($gap.entries)."
  Set-Content -Path $out -Value $msg -Encoding UTF8
  Write-Warning $msg
  # TODO: Optional alert hook (email/Toast/Teams/Webhook)
}

exit 0
