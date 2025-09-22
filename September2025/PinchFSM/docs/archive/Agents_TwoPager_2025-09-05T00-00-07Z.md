# Agents (Agent.md, CrewAI, LangGraph) — Executive Two‑Pager

Timestamp: 2025-09-05T00:00:07Z
Location: `September2025/PinchFSM/docs/Agents_TwoPager_2025-09-05T00-00-07Z.md`

---

## Page 1 — What/Why

- Agent.md: a lightweight pattern/spec to describe autonomous agent tasks, tools, and constraints in a markdown contract.
- CrewAI: a Python framework for multi‑agent orchestration (roles, tasks, delegation) with tool integrations.
- LangGraph: a graph‑based orchestration library (LangChain ecosystem) for stateful, multi‑step LLM apps with deterministic control over flows.
- Fit: meta‑automation for docs generation, replay trace curation, and CI helper bots — not runtime gesture processing.

## Page 2 — How it applies here

- Use cases: generate/validate two‑pagers; curate video goldens (naming, metadata); scaffold tests; open PRs with updated thresholds.
- Contract sketch (Agent.md‑style):
  - Goal: “Maintain PinchFSM goldens”
  - Inputs: new MP4s, config schema
  - Tools: ffmpeg, replay harness CLI, JSON validators
  - Success: updated traces + metrics; PR with PASS/FAIL report
- Caution: human‑in‑the‑loop approval for threshold changes; keep agents confined to repo ops.
- Next step: define a minimal Agent.md for “Replay Manager” and a LangGraph flow to run replay and emit a report.
