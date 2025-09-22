# ADR | 2025-09-20T18:45:00Z | ww-2025-094

## Context
- We now have a consolidated TDD playbook (`docs/TDD.md`) that specifies tooling, fixtures, schemas, and CI gates for the Gesture->Touch controller.
- The current Hex stack already delivers MediaPipe Tasks, Hex SDK v7, and IHC shells, but pinch adapters, predictive lookahead, and touch synthesis are still scattered across prototypes.
- Multiple demos (gesture_tasks_offline, Dino sidecars, SDK facades) exist; the priority is to wire them through a single adapter + bus contract while keeping existing guard scripts (`hex:verify:fast`, SDK smokes) green.

## Decision
Adopt the TDD playbook immediately and drive all new Gesture->Touch work through thin adapters that sit on top of the existing Hex facade. Implement controllers, predictor, and TouchSynth under `/controllers` with unit/model/golden coverage before touching UI shells. Treat Playwright golden replays as the promotion gate; no feature ships without green unit/model/golden tests and updated JSONL fixtures.

## Consequences
- Work for today is sequenced: create the GateFSM/Predictor/TouchSynth units, stand up XState model tests, wire the MP4 replay harness, then integrate with the IHC shell under a feature flag.
- Agents and humans share one source of truth (docs/TDD.md) for schemas, scripts, and acceptance criteria, reducing drift across demos.
- Golden fixtures become mandatory assets; we will regenerate them only via explicit scripts (`pnpm gen:golden ...`) and review diffs before committing.
- Legacy Mocha breakages stay quarantined; new Vitest/Playwright suites take precedence for the Gesture->Touch controller while we schedule cleanup for the archived CJS test set.

## Links
- TDD playbook: `docs/TDD.md`
- Blackboard: `BLACKBOARD.md`
- SRL (adoption bridge): `HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/srl/2025-09-20_hex_adoption_bridge.md`
