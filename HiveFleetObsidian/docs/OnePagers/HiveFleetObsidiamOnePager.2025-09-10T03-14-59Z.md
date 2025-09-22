# Hive Fleet Obsidiam - Executive One‑Pager
Generated: 2025-09-10T03-14-59Z

Purpose
A memetic ship to sail state-action space: coordinate multiple expert personas and agent swarms (MCTS + probes) while keeping a human-in-the-loop for decisions and rollback.

Core thesis
- Hexagonal core (ports & adapters): keep domain logic pure and swappable.
- Short deterministic turns (TTAO: Think → Test → Adapt → Observe) run a council of four seats: Exploit, Explore, Pivot, Reorient.
- Safety & provenance: feature flags, golden traces, and a one-line Scribe for auditable decisions.

Architecture
- Board (state-action map): holds Problem/Metric/Constraint/Horizons and supports stigmergic traces.
- Council & Champions: small council generates proposals; winners turn into spiderling tasks or reversible Exploit steps.
- Orchestrator: schedules/collects proposals (Contract‑Net or blackboard), timeboxes turns, enforces guardrails.
- Spiderlings: lightweight worker probes for micro‑tests and replay (idempotent).
- Knowledge & Goldens: replayable traces and history for deterministic verification.

Champion summaries
- Thread Sovereign (Exploit): decisive, safety-first; issues one small reversible change to move today's metric. See [`HiveFleetObsidian/honeycomb/champions/ThreadSovereign/docs/kilo_mode.ThreadSovereign.2025-09-09.md`](HiveFleetObsidian/honeycomb/champions/ThreadSovereign/docs/kilo_mode.ThreadSovereign.2025-09-09.md:1).
- Faultline Seeker (Explore): risk‑first explorer; designs 1-3 micro‑tests to falsify the riskiest assumptions. See [`HiveFleetObsidian/kilocode/modes20250908-stale/FaultlineSeeker.mode.md`](HiveFleetObsidian/kilocode/modes20250908-stale/FaultlineSeeker.mode.md:1).
- Prism Magus (Pivot): keeps the goal and reframes the approach (A/B, method swap); persona & plan in [`HiveFleetObsidian/honeycomb/champions/PrismMagus/docs/persona.md`](HiveFleetObsidian/honeycomb/champions/PrismMagus/docs/persona.md:1).
- Web Cartographer (Reorient): maps the web/knowledge and proposes proven patterns; see [`HiveFleetObsidian/honeycomb/champions/WebCartographer/docs/persona.md`](HiveFleetObsidian/honeycomb/champions/WebCartographer/docs/persona.md:1).

Decision loop (one turn)
1) Gate: snapshot board (Problem / Metric / Constraint / Horizons).
2) Parallel seats: Explorer/Pivot/Reorient propose options (micro-tests, reframes, patterns).
3) Decide: Thread Sovereign picks one reversible Exploit or delegate to spiderlings.
4) Steward adds guardrail if needed; Scribe appends JSONL to [`HiveFleetObsidian/history/hive_history.jsonl`](HiveFleetObsidian/history/hive_history.jsonl:1).

Tools & quick commands (core repo)
- Start counsel: `npm run hive:start`
- Health & smoke: `npm run hive:status`, `npm run hive:smoke`, `npm run hive:smoke:frozen`
- Reindex & map: `npm run hive:smith`, `npm run hive:cartography`
- Append memory: `HiveFleetObsidian/tools/append_history.ps1` and inspect [`HiveFleetObsidian/history/hive_history.jsonl`](HiveFleetObsidian/history/hive_history.jsonl:1)

Notable scripts and artifacts
- `HiveFleetObsidian/tools/web_cartographer.mjs` - generates `cartography/web_map.md` + `web_map.json`.
- `HiveFleetObsidian/tools/pinch_core_portable.mjs` - deterministic pinch core.
- `HiveFleetObsidian/tools/start.mjs` - bootstrap orchestration.
- `HiveFleetObsidian/docs/AiChatHiveFleetObsidian.md` - full design and implementation notes (architecture, TTAO, LangGraph skeleton).

Evidence (files consulted to synthesize this one‑pager)
- [`HiveFleetObsidian/README.md`](HiveFleetObsidian/README.md:1)
- [`HiveFleetObsidian/docs/AiChatHiveFleetObsidian.md`](HiveFleetObsidian/docs/AiChatHiveFleetObsidian.md:1)
- [`HiveFleetObsidian/honeycomb/champions/ThreadSovereign/docs/kilo_mode.ThreadSovereign.2025-09-09.md`](HiveFleetObsidian/honeycomb/champions/ThreadSovereign/docs/kilo_mode.ThreadSovereign.2025-09-09.md:1)
- [`HiveFleetObsidian/kilocode/modes20250908-stale/FaultlineSeeker.mode.md`](HiveFleetObsidian/kilocode/modes20250908-stale/FaultlineSeeker.mode.md:1)
- [`HiveFleetObsidian/honeycomb/champions/PrismMagus/docs/persona.md`](HiveFleetObsidian/honeycomb/champions/PrismMagus/docs/persona.md:1)
- [`HiveFleetObsidian/tools/web_cartographer.mjs`](HiveFleetObsidian/tools/web_cartographer.mjs:1)

Next steps (recommended)
1) Approve: I will write this MD to `docs/OnePagers/HiveFleetObsidiamOnePager.2025-09-10T03-14-59Z.md` and create four per‑hero one‑pagers (ThreadSovereign, FaultlineSeeker, PrismMagus, WebCartographer) in the same folder.
2) Or alternative: I deliver drafts in‑chat for review before writing files.
3) After writing, we can run `node HiveFleetObsidian/tools/web_cartographer.mjs` to surface dangling links and hubs.

Scribe
{"ts":"2025-09-10T03:14:59Z","role":"orchestrator","action":"wrote-exec-onepager","delta":"files:summary;next:hero-onepagers","tags":["orchestrator","onepager"]}