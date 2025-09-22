param(
  [int]$MaxGapMin = 60,
  [string]$StartAt = "00:00",
  [string]$GapOffset = "00:05"
)

Import-Module ScheduledTasks -ErrorAction SilentlyContinue | Out-Null
function Test-IsAdmin { $id=[Security.Principal.WindowsIdentity]::GetCurrent(); $p=new-object Security.Principal.WindowsPrincipal($id); return $p.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator) }

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\\..')
$hourly = Join-Path $PSScriptRoot 'Run-HistoryThreadHourly.ps1'
$gap = Join-Path $PSScriptRoot 'Run-HistoryGapCheck.ps1'
$psExe = Join-Path $env:SystemRoot 'System32\\WindowsPowerShell\\v1.0\\powershell.exe'

$task1 = 'HFO Hourly Rollup'
$task2 = 'HFO Hourly Gap Check'

Write-Host "[Register] Creating/Updating scheduled tasks via ScheduledTasks cmdlets at $repoRoot..."

function New-HourlyTrigger([string]$time) {
  $start = (Get-Date).Date + [TimeSpan]::Parse($time)
  if ($start -lt (Get-Date)) { $start = $start.AddDays(1) }
  New-ScheduledTaskTrigger -Once -At $start -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 3650)
}

# Task 1: Hourly Rollup
$action1 = New-ScheduledTaskAction -Execute $psExe -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $hourly)
$trigger1 = New-HourlyTrigger $StartAt
try {
  if (Test-IsAdmin) { $runLevel = 'Highest' } else { $runLevel = 'Limited' }
  Register-ScheduledTask -TaskName $task1 -Action $action1 -Trigger $trigger1 -RunLevel $runLevel -Force | Out-Null
  Write-Host "[Register] $task1 registered."
} catch { Write-Warning $_ }

# Task 2: Hourly Gap Check (offset)
$action2 = New-ScheduledTaskAction -Execute $psExe -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}" -MaxGapMin {1}' -f $gap, $MaxGapMin)
$trigger2 = New-HourlyTrigger $GapOffset
try {
  if (Test-IsAdmin) { $runLevel = 'Highest' } else { $runLevel = 'Limited' }
  Register-ScheduledTask -TaskName $task2 -Action $action2 -Trigger $trigger2 -RunLevel $runLevel -Force | Out-Null
  Write-Host "[Register] $task2 registered."
} catch { Write-Warning $_ }

Write-Host "[Register] Done."
exit 0
