$out = @()
$out += 'Problem: '
$out += 'Metric: '
$out += 'Constraint: '
$out += 'Horizons: 1h= | 1d= | 1w= | 1m='
$out += 'Current: '
$out -join "`n" | Set-Content -Path "$PSScriptRoot/../BOARD.current.txt"
Write-Host "Initialized BOARD.current.txt"

