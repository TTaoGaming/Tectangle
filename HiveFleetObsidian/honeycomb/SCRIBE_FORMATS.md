<!-- Updated: 2025-09-18T13:32:25.841Z -->
# Silk Scribe Formats

- History file: `HiveFleetObsidian/history/hive_history.jsonl`
- Each line: `{ "snapshot": "...", "metric_delta": "...", "lesson": "..." }`
- Keep lines short and plain; one action per line.

## Board format (working context)
Problem: <blocker now>
Metric: <one number/boolean to move>
Constraint: <limits: time, device, deps>
Horizons: 1h=<...> | 1d=<...> | 1w=<...> | 1m=<...>
Current: <current approach>

File: `HiveFleetObsidian/BOARD.current.txt`

## Output contracts (for chat turns)
- Full Counsel JSON and Solo Seat JSON are defined in `HiveFleetObsidian/HiveFleetObsidian.agent.md`.
- Scribe stores only the one-line history (snapshot, metric_delta, lesson).

## Commands
- Append one line (Node):
  `npm run hive:scribe:append -- --snapshot "..." --metric "..." --lesson "..."`
- Generate candidates (dry):
  `npm run hive:scribe:intake`
  Writes: `HiveFleetObsidian/history/silk_candidates_YYYY-MM-DD.jsonl`
- Apply filtered candidates:
  `npm run hive:scribe:apply -- --file <candidates.jsonl> --include "regex" --limit 50 --append`

## Tips
- Snapshot: 3-7 words, action-first (e.g., "Smith re-index; archive off").
- Metric: `name:delta` (e.g., `dup_titles:-3`, `smoke:pass`).
- Lesson: one take-away to keep/avoid.
