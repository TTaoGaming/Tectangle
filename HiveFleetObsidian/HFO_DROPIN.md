# Hive Fleet Obsidian - Drop‑In Guide (for LLMs + Humans)

Quick Start (Commands)
- One‑liner (bring fleet up): `npm run hfo:up`
- Status: `npm run hive:status`
- Start (summon→verify→frozen→map→turn→chat→heartbeat): `npm run hive:start`
- Turn (save counsel JSON + chat + scribe): `npm run hive:turn:save`
- Chat (counsel‑of‑4, conversational): `node HiveFleetObsidian/tools/moe_chat.mjs --prompt "Your goal"`
- Strict chat (deterministic review): `node HiveFleetObsidian/tools/moe_chat.mjs --prompt "Review" --strict --rounds 2`
- Sovereign's decisive step (JSON): `node HiveFleetObsidian/tools/thread_sovereign_decide.mjs`
- Prism pivot options (plain): `node HiveFleetObsidian/tools/prism_plan_pivot.mjs "Aim here"`

Startup Behavior (Counsel‑of‑4 by default)
- On start, the Counsel‑of‑4 chat launches in Mentor Workshop style (short, plain paragraphs). A one‑line help banner shows controls.
- Turn JSON is saved and linted (shape PASS required). Frozen smoke must PASS before shipping.

Chat Controls
- `--prompt "..."` - your question now
- `--tone casual|formal` - friendlier vs crisper phrasing (default: casual)
- `--rounds 1|2` - add a second pass (Prism proposes another option; Sovereign makes a final call) (default: 2)
- `--strict` - deterministic review lane (always 4 seats, 2 lines/seat, no intros; single final guardrail)
- `--seed text` - freeze variety (optional)

Board (edit this first)
`HiveFleetObsidian/BOARD.current.txt`
- Fill: Problem, Metric, Constraint, Horizons, Current.
- If missing/stale, start refreshes it quietly and nudges you to refine.

Voices (Core 4)
- Thread Sovereign (Exploit, Earth): "Decide. Strike the decisive seam. Record."
- Faultline Seeker (Explore, Fire): risk‑first micro‑tests; stop on signal.
- Prism Magus (Pivot, Water): keep the aim; change the path (method/horizon/constraint/resource/analogy).
- Web Cartographer (Reorient, Air): show the map; name the seam; smallest next path.

Private Champion Chats (focused helpers)
- Sovereign (decisive step, JSON): `node HiveFleetObsidian/tools/thread_sovereign_decide.mjs`
- Prism (pivot options, plain): `node HiveFleetObsidian/tools/prism_plan_pivot.mjs "Aim here"`
- Use group chat for context, then drill into a single champion with these helpers.

Modes (enforced)
- Default: Mentor Workshop - conversational, short paragraphs, minimal repetition.
- Strict (review): deterministic counsel‑of‑4, 2 lines/seat, one final guardrail, no intros.

Plain Language Glossary
`HiveFleetObsidian/honeycomb/plain_language_glossary.json` - short definitions (OODA, decisive point, port, adapter, frozen smoke, ADR).

Health & Evidence
- Smoke: `npm run test:smoke`
- Freeze expectations: `npm run hive:freeze:verify`
- Daily report + scribe: `npm run hive:daily`
- Heartbeat (shape + chat + smith + frozen): `npm run hive:heartbeat`

Artifacts to Read
- Latest chat: `HiveFleetObsidian/reports/chats/chat_*.txt`
- Latest turn: `HiveFleetObsidian/reports/turns/turn_*.json`
- History: `HiveFleetObsidian/history/hive_history.jsonl`
- Core Principles: `HiveFleetObsidian/honeycomb/CORE_PRINCIPLES.md`
- Fleet Manifest: `HiveFleetObsidian/honeycomb/fleet_manifest.json`

Drag‑and‑Drop
Use `npm run hive:pack` → `./HiveFleetObsidian_portable` and share this guide + the nest.

