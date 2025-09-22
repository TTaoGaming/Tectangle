# Silk Scribe - Rollups README

Quick overview
- Script: [`HiveFleetObsidian/tools/scribe_rollups.mjs`](HiveFleetObsidian/tools/scribe_rollups.mjs:1)
- Purpose: safely parse the append-only Scribe history (`[`HiveFleetObsidian/history/hive_history.jsonl`](HiveFleetObsidian/history/hive_history.jsonl:1)`) and produce timestamped rollup artifacts (JSON + human-friendly Markdown) under this directory.

Usage
- Run locally:
  ```
  node HiveFleetObsidian/tools/scribe_rollups.mjs
  ```
- Options:
  - `--history <path>` - override history file (defaults to [`HiveFleetObsidian/history/hive_history.jsonl`](HiveFleetObsidian/history/hive_history.jsonl:1))
  - `--out <dir>` - override output dir (defaults to this directory)

What the script produces
- JSON summary: `scribe_rollups.<iso-safe>.json` (example: [`HiveFleetObsidian/docs/OnePagers/scribe_rollups/scribe_rollups.2025-09-10T03-29-30Z.json`](HiveFleetObsidian/docs/OnePagers/scribe_rollups/scribe_rollups.2025-09-10T03-29-30Z.json:1))
- Markdown summary: `scribe_rollups.<iso-safe>.md` (human-friendly)
- These are idempotent in the sense they never modify history and only produce new timestamped files.

Behavior & guarantees
- Safely parses JSONL lines and skips invalid lines.
- If per-entry timestamps are missing, the script falls back to the history file mtime for horizon calculations (per Silk Scribe policy).
- If the history file is missing or unreadable, the script aborts and does not write outputs (stop rule).

Recommended workflow
- Run daily (cron / scheduled CI) and keep weekly human review cadence.
- Add to daily maintenance flow (e.g., call from `hive_daily.mjs`) once reviewed.
- Next steps:
  - Add LLM-backed summary pass (optional) to convert rollups into concise action bullets.
  - Add horizon-specific thresholds/alerts (e.g., spikes in 'fail' / 'dup' terms).
  - Add tests around parsing edge cases (malformed lines), and a CI smoke run.

Example (mocked) outputs
- JSON: `scribe_rollups.<iso-safe>.json` with fields:
  - `generatedAt`, `source`, `totals {lines, parsed, invalid}`, `horizons {1d,1w,1m,...}`
- Markdown: top-level counts, sample lessons, and top keywords.

Files created by this task (examples)
- [`HiveFleetObsidian/docs/OnePagers/SilkScribeOnePager.2025-09-10T03-29-30Z.md`](HiveFleetObsidian/docs/OnePagers/SilkScribeOnePager.2025-09-10T03-29-30Z.md:1)
- [`HiveFleetObsidian/tools/scribe_rollups.mjs`](HiveFleetObsidian/tools/scribe_rollups.mjs:1)
- [`HiveFleetObsidian/docs/OnePagers/scribe_rollups/sources.2025-09-10T03-29-30Z.json`](HiveFleetObsidian/docs/OnePagers/scribe_rollups/sources.2025-09-10T03-29-30Z.json:1)
- [`HiveFleetObsidian/docs/OnePagers/scribe_rollups/sample_summary.2025-09-10T03-29-30Z.md`](HiveFleetObsidian/docs/OnePagers/scribe_rollups/sample_summary.2025-09-10T03-29-30Z.md:1) (example summary produced for inspection)

Contact / notes
- The script is intentionally conservative: it will abort rather than write partial/misleading artifacts if the history file cannot be read.