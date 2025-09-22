param(
  [Parameter(Mandatory=$true)][string]$JsonLine,
  [string]$Path = "$PSScriptRoot/../history/hive_history.jsonl"
)

# Append single-line JSON to history file
$JsonLine | Out-File -FilePath $Path -Append -Encoding utf8
Write-Host "Appended to $Path"

# Usage:
#   ./append_history.ps1 -JsonLine '{"snapshot":"...","metric_delta":"...","lesson":"..."}'

