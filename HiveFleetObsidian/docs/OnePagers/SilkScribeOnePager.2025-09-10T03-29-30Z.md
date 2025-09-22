# Silk Scribe - One‑Pager
Generated: 2025-09-10T03:29:30Z

Purpose
- Provide lightweight, non‑destructive rollups of Scribe history to surface lessons, counts, and recurring keywords across horizons.

Data sources
- Primary history: [`HiveFleetObsidian/history/hive_history.jsonl`](HiveFleetObsidian/history/hive_history.jsonl:1)
- Chats & turns: [`HiveFleetObsidian/reports/turns/`](HiveFleetObsidian/reports/turns/:1)
- Chat transcripts: [`HiveFleetObsidian/reports/chats/`](HiveFleetObsidian/reports/chats/:1)
- Supporting tools: [`HiveFleetObsidian/tools/append_history.mjs`](HiveFleetObsidian/tools/append_history.mjs:1), [`HiveFleetObsidian/tools/silk_scribe_intake.mjs`](HiveFleetObsidian/tools/silk_scribe_intake.mjs:1)

Horizons
- 1d (24 hours)
- 1w (7 days)
- 1m (30 days)
- 1q (90 days)
- 6mo (182 days)
- 1y (365 days)
- 5y (1825 days)
- 10y (3650 days)
- 100y (36500 days)

Retention & rollup rules
- Keep original append‑only JSONL (never modify) at [`HiveFleetObsidian/history/hive_history.jsonl`](HiveFleetObsidian/history/hive_history.jsonl:1)
- Rollups are computed and written into [`HiveFleetObsidian/docs/OnePagers/scribe_rollups/`](HiveFleetObsidian/docs/OnePagers/scribe_rollups/:1) as timestamped artifacts.
- Rollup cadence: ad‑hoc (manual) or scheduled (daily/weekly). Recommended: daily automated rollups with weekly human review.
- Aggregation: counts per horizon, sample lessons (top N), and top recurring keywords.
- Non‑destructive: rollup process reads history and writes new files only; it never mutates existing history lines.

Example rollup JSON schema
```json
{
  "generatedAt":"ISO-8601",
  "source":"HiveFleetObsidian/history/hive_history.jsonl",
  "totals": { "all": 123, "invalid": 2 },
  "horizons": {
    "1d": { "count": 12, "sample_lessons":[ "..." ], "top_keywords":[["pinch",5],["smoke",3]] },
    "1w": { "count": 40 },
    "1m": { "count": 120 }
  }
}
```

Sample markdown output (excerpt)
```
# Scribe Rollups - Generated: 2025-09-10T03:29:30Z

## 1d (24h)
- Entries: 12
- Sample lessons:
  - "Solo Seat first; JSON-only; reversible steps"
- Top keywords: pinch (5), smoke (3)
```

Non‑destructive guidelines
- Append‑only Scribe: use [`HiveFleetObsidian/tools/append_history.mjs`](HiveFleetObsidian/tools/append_history.mjs:1) or the PowerShell helper to add lines.
- Rollup cadence: run daily for operational visibility; keep weekly human review to validate patterns.
- Review cadence: keep quarterly strategy reviews (1q) and annual retrospectives (1y).

Quick start (local)
- Generate rollups: `node HiveFleetObsidian/tools/scribe_rollups.mjs`
- Output: JSON + Markdown under [`HiveFleetObsidian/docs/OnePagers/scribe_rollups/`](HiveFleetObsidian/docs/OnePagers/scribe_rollups/:1)

Notes
- If history file is missing or unreadable, the rollup script must abort without writing artifacts.
- Use this one‑pager as evergreen documentation for the Silk Scribe rollup workflow.