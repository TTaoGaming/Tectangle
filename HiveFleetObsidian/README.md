# Hive Fleet Obsidian (Semantic Ship)

Semantic ship: crew of champions, not a folder. Contracts + manifests drive adapters.
Ports: see `contracts/` (Verification, Orchestration). Indices: `navigation/`.
Manifests: `manifests/` (manifest.json, orchestration.json). Adapters: `adapters/`.
History: `historythread/`. Knowledge: `knowledge/`. ADRs: `../docs/adr/`.

Quickstart (Windows PowerShell)

- node HiveFleetObsidian/tools/hfo_prepare.mjs

Notes

- Everything is NOT-PRODUCTION-READY unless verified. See Verification Port.

Self-contained, drag-and-drop nest for status, knowledge capture, and smoke validation.

Requirements

- Node.js >= 18 (no other installs required)

Quick Start

- Start (sequential): `npm run hive:start` (summon → verify → status → frozen smoke → turn:save)
- Show status: `npm run hive:status`
- Re-index honeycomb: `npm run hive:smith` (use `:all` to include archives)
- Consolidate docs (dry run): `npm run hive:consolidate`
- Apply consolidation: `npm run hive:consolidate:apply`
- Replay smoke: `npm run hive:smoke` (frozen: `npm run hive:smoke:frozen`)
- Verify champion docs: `npm run hive:champions:verify`
- Map docs (full): `npm run hive:cartography`
- Map recent (14 days): `npm run hive:cartography:recent`

Knowledge & Memory

- Append one memory line (PowerShell): `HiveFleetObsidian/tools/append_history.ps1 -JsonLine '{"snapshot":"...","metric_delta":"...","lesson":"..."}'`
- History file: `HiveFleetObsidian/history/hive_history.jsonl`

Champions

- Status report: `node HiveFleetObsidian/tools/champions_status.mjs`
- Enforce PascalCase (archive snake_case): `npm run hive:archive_snake:apply`
- Seat mapping: `HiveFleetObsidian/honeycomb/SEAT_MAPPING.md`

Files

- `tools/status.mjs` - prints Board + last history
- `tools/bootstrap.mjs` - initializes + runs internal checks
- `tools/portable_replay_from_trace.mjs` - portable replay runner
- `tools/pinch_core_portable.mjs` - deterministic pinch core
- `landmarks/*.jsonl` - sample traces for smoke
- `history/hive_history.jsonl` - Silk Scribe memories (JSONL)
- `BOARD.current.txt` - 5-line working board

Notes

- External test runner/traces are auto-used if present; otherwise portable assets are used.
- Keep edits additive; everything is reversible.

Counsel of 4 (chat)

- Start: `npm start` (TTao + 4 seats + Scribe; saves artifacts)
- Save counsel turn (counsel + guardrail + history): `npm run hive:turn:save`

LLM Providers (optional)

- Set env and run `npm start` to power counsel with a real LLM:
  - GitHub Models (Copilot): set `GITHUB_TOKEN`, `HFO_LLM_PROVIDER=github`, `HFO_LLM_MODEL=gpt-4o-mini`
  - OpenAI: set `OPENAI_API_KEY`, `HFO_LLM_PROVIDER=openai`, `HFO_LLM_MODEL=gpt-4o-mini`
  - Anthropic: set `ANTHROPIC_API_KEY`, `HFO_LLM_PROVIDER=anthropic`, `HFO_LLM_MODEL=claude-3-5-sonnet`
  - Ollama (local): run Ollama; set `HFO_LLM_PROVIDER=ollama`, `HFO_LLM_MODEL=llama3:instruct`
- If no provider is set, chat still runs deterministically and artifacts are saved.

Paste-In Counsel (use your IDE's LLM without keys)

- Write strict JSON counsel in your IDE (see `HiveFleetObsidian/HiveFleetObsidian.agent.md` for the shape), then ingest:
  - File: `node HiveFleetObsidian/tools/moe_chat.mjs --council --counsel-file HiveFleetObsidian/inbox/counsel.json --rounds 1 --scribe`
  - Clipboard (PowerShell): `Get-Clipboard | node HiveFleetObsidian/tools/moe_chat.mjs --council --counsel-stdin --rounds 1 --scribe`
- Artifacts: turn JSON (provider: paste), chat transcript, Scribe history line.

VS Code Tasks (optional)

- `.vscode/tasks.json` includes: Start, Ingest (clipboard/file), Verify Only, Council (strict).
