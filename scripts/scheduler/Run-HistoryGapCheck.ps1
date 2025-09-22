param(
  [int]$MaxGapMin = 60
)

Write-Host "[GapCheck] Auditing max gap ($MaxGapMin min)"
$gapJson = node HiveFleetObsidian/tools/history_gap_audit.mjs --max-gap-min $MaxGapMin 2>$null
Write-Host $gapJson
try { $gap = $gapJson | ConvertFrom-Json } catch { $gap = $null }

if ($gap -and $gap.gapViolation) {
  New-Item -ItemType Directory -Force -Path 'HiveFleetObsidian/historythread/hourly' | Out-Null
  $out = 'HiveFleetObsidian/historythread/hourly/GAP_' + (Get-Date -Format 'yyyy-MM-ddTHH-mm-ss') + '.md'
  $msg = "[GAP] No scribe append within $($gap.threshold) min. MaxGap=$($gap.maxGapMinutes). Entries=$($gap.entries)."
  Set-Content -Path $out -Value $msg -Encoding UTF8
  Write-Warning $msg
  # TODO: Optional alert hook (email/Toast/Teams/Webhook)
}

exit 0
