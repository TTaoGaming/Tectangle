Agents (Agent.md, CrewAI, LangGraph) — Executive Two‑Pager
==========================================================

Metadata
--------

- title: Agents — Agent.md, CrewAI, LangGraph
- doc_type: two-pager
- timestamp: 2025-09-05T00:10:00Z
- tags: [agents, automation, LangGraph, CrewAI]
- summary: Use agents for meta‑automation (docs, goldens curation, CI helpers), not runtime gesture processing.

Page 1 — What/Why
-----------------

- Agent.md: markdown contract for agent goals/tools/constraints.
- CrewAI: multi‑agent orchestration in Python.
- LangGraph: graph‑based deterministic orchestration (LangChain ecosystem).

Page 2 — How it applies here
----------------------------

- Use cases: generate/validate two‑pagers; curate video goldens; scaffold tests; open PRs with updated thresholds.
- Contract sketch (Agent.md‑style):
  - Goal: “Maintain PinchFSM goldens”
  - Inputs: new MP4s, config schema
  - Tools: ffmpeg, replay harness CLI, JSON validators
  - Success: updated traces + metrics; PR with PASS/FAIL report
- Caution: human‑in‑the‑loop approval for threshold changes; keep agents confined to repo ops.
- Next step: write a minimal Agent.md for “Replay Manager” and a LangGraph flow to run replay and emit a report.
