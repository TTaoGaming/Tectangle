# Scribe Rollups - Sample Summary
Generated: 2025-09-10T03:29:30Z

Source: [`HiveFleetObsidian/history/hive_history.jsonl`](HiveFleetObsidian/history/hive_history.jsonl:1)

Totals (sample run)
- Lines read: 168
- Parsed: 168
- Invalid: 0

Quick 3-line rollup snippet
- 1d: Entries: 168
- 1w: Entries: 168
- 1m: Entries: 168

Sample lessons (first parsed lines)
- "Solo Seat first; JSON-only; reversible steps"
- "Detect regressions via fixed downs/ups"
- "initialized board and nest"
- "Silk Scribe engaged; Tech Tango (6mo) consolidation"
- "Decision: Pinch MVP ship now (Exploit)"
- "Hardening sprint (1 week) planned"
- "Detector redundancy: 3 checks"
- "Palm gate + hysteresis + debounce defaults"

Notes
- This sample uses the first parsed lines from the history file for examples.
- Many existing history lines do not include a per-line `ts` field; per policy the rollup script falls back to the history file mtime for horizon calculations. That makes these lines fall into all short/long horizons unless entries include explicit timestamps.
- Recommended: when appending Scribe lines include an ISO `ts` property to enable accurate horizon bucketing.

Generated artifacts
- JSON rollups and markdown summaries should appear under this directory when running the tool:
  - [`HiveFleetObsidian/tools/scribe_rollups.mjs`](HiveFleetObsidian/tools/scribe_rollups.mjs:1) to generate artifacts
  - Output examples: `scribe_rollups.<iso-safe>.json` and `scribe_rollups.<iso-safe>.md` under this folder.