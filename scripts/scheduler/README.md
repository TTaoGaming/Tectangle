# Scheduler wiring (Windows)

This folder contains PowerShell scripts you can register in Task Scheduler.

Tasks to create:

- Hourly (every 1 hour): Run `scripts/scheduler/Run-HistoryThreadHourly.ps1`
- Hourly gap check (every 1 hour, offset by +5 min): Run `scripts/scheduler/Run-HistoryGapCheck.ps1 -MaxGapMin 60`
- Daily/Weekly rollups: reuse VS Code tasks or add similar scripts if desired.

Register (run in an elevated PowerShell):

- Hourly Heartbeat + Rollup copy
  - Program/script: `powershell.exe`
  - Arguments: `-NoProfile -ExecutionPolicy Bypass -File "c:\\Dev\\Spatial Input Mobile\\scripts\\scheduler\\Run-HistoryThreadHourly.ps1"`
  - Start in: `c:\\Dev\\Spatial Input Mobile`

- Hourly Gap Check (+5 min offset)
  - Program/script: `powershell.exe`
  - Arguments: `-NoProfile -ExecutionPolicy Bypass -File "c:\\Dev\\Spatial Input Mobile\\scripts\\scheduler\\Run-HistoryGapCheck.ps1" -MaxGapMin 60`
  - Start in: `c:\\Dev\\Spatial Input Mobile`

Optional alerts

- Add your alert hook inside the scripts where marked (email/Toast/Teams/Webhook).

Example (optional) schtasks commands (run as Admin):

```powershell
schtasks /Create /TN "HFO Hourly Rollup" /SC HOURLY /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'c:\Dev\Spatial Input Mobile\scripts\scheduler\Run-HistoryThreadHourly.ps1'" /ST 00:00 /F /RL HIGHEST /WD "c:\Dev\Spatial Input Mobile"

schtasks /Create /TN "HFO Hourly Gap Check" /SC HOURLY /MO 1 /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File 'c:\Dev\Spatial Input Mobile\scripts\scheduler\Run-HistoryGapCheck.ps1' -MaxGapMin 60" /ST 00:05 /F /RL HIGHEST /WD "c:\Dev\Spatial Input Mobile"
```
