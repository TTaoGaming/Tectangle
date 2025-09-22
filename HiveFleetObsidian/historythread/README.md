# HistoryThread

Purpose: Human-friendly, machine-parseable rollups of work over time.

- Sources: Hive history (JSONL) and Heartbeat reports.
- Views: hourly/, daily/, weekly/ one-pagers.
- Canon: this folder becomes the reading path for progress and patterns.

How it works (no-code):
- VS Code tasks call existing npm scripts (heartbeat, probes) and copy latest report into rollup folders.
- Windows Task Scheduler runs the tasks hourly/daily/weekly.

Gap check:
- If no heartbeat landed in the last hour while editors ran, write a GAP note.

One-pager template (top of each .md):
- Executive summary
- What changed since last
- Signals (counts)
- Risks & next moves (plain language)
- Glossary (jargon → meaning)
