<!--
STIGMERGY REVIEW HEADER
Status: First Pass Complete
Review started: 2025-09-17T08-32-43Z
Completed: 2025-09-18
Expires: 2025-09-24T08-32-43Z (auto-expire after 7 days)

Checklist:
- [ ] Confirm inventory manifest published
- [ ] Run first extraction loop (pinch subsystem)
- [ ] Sync findings back into blackboard docs
-->

# Hexagonal Extraction Runbook — 2025-09-17T08-32-43Z

## Mission
Build a definitive knowledge bridge from six months of legacy work into the Tectangle Hexagonal architecture. Every extraction produces a tested hex module, an updated knowledge record, and telemetry hooks for future leverage.

## North Star
- Hex cores encapsulate true behaviour (pinch, anchor, stability, prediction).
- Documentation stays in sync via stigmergic notes + blackboard pages.
- Legacy artifacts are referenced, not forked; once ported, they are logged and retired.

## SRL Operating Loop (Plan -> Execute -> Reflect)
1. **Plan**
   - Pick one subsystem (e.g., pinch stability) from the backlog manifest.
   - Assemble cues from legacy docs/code into a subsystem blackboard entry.
   - Define a thin objective for the next session (one module + one test + doc touch).
2. **Execute**
   - Draft or port code into the appropriate hex layer (src/core, src/app, 	ests).
   - Instrument telemetry/flags as needed; keep deltas reviewable.
   - Capture findings inline (stigmergy headers) and in the subsystem blackboard.
3. **Reflect**
   - Run targeted tests; record outcomes and TODOs.
   - Update the global manifest with what was extracted, what remains, and blockers.
   - Schedule the next subsystem or deepen the current one if residual gaps remain.

## Immediate TODOs
- [ ] Maintain `./import_manifest.md` listing legacy sources + status.
- [ ] Spin up subsystem blackboards (pinch, anchor, telemetry, prediction).
- [ ] Automate heritage scanning (scripts/scan_legacy.mjs) to surface candidate modules.
- [ ] Refresh archive overview (`python scripts/generate_rollup.py --git`) before each planning session.
- [ ] Prioritise Pinch Stability as the first extraction (core + tests + doc).

## Working Agreements
- Every artifact touched gets a stigmergy header with expiry + checklist.
- No silent knowledge transfer—reference source path & commit intent in blackboards.
- Keep diffs narrow; feature flags guard risky behaviour.
- Telemetry first: wire counters on each new action stream.

## Reference Docs
- ../docs/game_bridge_profiles.md
- September2025/TectangleHexagonal/docs/TectangleHexagonal_BehaviorSnapshot.*
- Subsystem blackboards (`blackboards/`) track pinch, anchor, telemetry, and expression work.

## Communication Cadence
- Daily run summary in September2025/TectangleHexagonal/TODO_today.md.
- Weekly roll-up into TectangleHexagonal_BehaviorSnapshot with extraction velocity.

Stay disciplined: Plan the slice, extract with tests, log the knowledge, reflect, repeat.



