Scribe - How to Log Turns

What to log (per turn)
- snapshot: what changed this turn (1 short phrase)
- metric_delta: what moved (e.g., -120ms, +1.0 F1, demo_unblocked=true)
- lesson: keep/avoid (short phrase)

Where to log
- Append one JSON object per line to: ../history/hive_history.jsonl

Example JSONL line
{"snapshot":"enabled debounce 60ms","metric_delta":"-45ms median","lesson":"small guardrails first"}

Tips
- Keep lines single-line JSON (no trailing commas).
- Prefer concrete numbers/booleans over prose.
- If a turn is exploratory only, set metric_delta to "n/a".

