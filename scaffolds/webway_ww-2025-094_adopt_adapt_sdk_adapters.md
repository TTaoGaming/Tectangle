---
id: ww-2025-094
owner: @TTaoGaming
status: active
expires_on: 2025-10-04
guard: npm run -s hex:tier:commit
flag: FEATURE_ADOPT_BRIDGE_V1
revert: remove folder/flag
---
# Webway: Adopt-first adapters — MediaPipe + SDK + UI + Engine

## Goal

Adopt proven components (MediaPipe Tasks Gesture Recognizer, Material Web shell, optional Phaser/PlayCanvas scene) and add only small adapters (InputAdapter, GateFSM, UIAdapter) to wire them into the Hex SDK bus. Ship a reversible first slice behind a flag with a measurable CI guard.

## Constraints

- License: MIT project; MediaPipe Tasks is Apache-2.0 (source: defaults)
- Privacy: no telemetry beyond local JSONL export; no network (source: defaults)
- Security: no secrets; serve local WASM/assets via http-server (source: defaults)
- Deps budget: 1 small lib max; prefer zero new deps (xstate optional later) (source: defaults)
- CI: existing tiers must pass; add a guard on SDK smokes (source: package.json)

## Current Map

- Vision: @mediapipe/tasks-vision is already installed and used via Hex ports (source: package.json, src/ports/mediapipe.js)
- SDK: Hex SDK v7 demos and event bus present in dev pages (source: September2025/TectangleHexagonal/dev/)
- UI: Material-like shells used in v6/v7 demos; no hard dependency on MUI (source: tests/golden-master refs)
- Engines: Phaser/PlayCanvas considered; not yet wired by default (source: ObsidianBlackboard.md)

## Timebox

- timebox_minutes=20 (source: defaults)

## Research Notes

- MediaPipe Tasks Gesture Recognizer (labels + scores + landmarks) suitable for web, local WASM (source: repo + @mediapipe/tasks-vision)
- Existing tests and smokes: hex:smoke:sdk:* and telemetry goldens provide guards (source: package.json)
- Prior Webways align with adopting MediaPipe and wiring UI/engines via small adapters (source: scaffolds/webway_ww-2025-083..093)
- XState referenced for FSM clutch; not required for slice one (source: docs/TDD.md, TODO files)

## Tool Inventory

- Scripts/guards: hex:tier:repeat|commit|hourly|daily; hex:smoke:sdk:*; hex:guard:sdk; hex:overlay:verify (source: package.json)
- Static server: http-server tasks (source: VS Code tasks)
- Mediapipe port: September2025/TectangleHexagonal/src/ports/mediapipe.js (source: depcruise)
- Demos: demo_fullscreen_sdk_v7_material.html (source: dev)

## Options (Adopt-first)

1. Baseline — MediaPipe → SDK bus direct
   - How: Minimal InputAdapter wraps GestureRecognizer stream → emits {label, score, ts, hand} to SDK bus; threshold + debounce only.
   - Trade-offs: Fastest path; no state model; risk of chattiness without FSM.
2. Guarded extension — Add GateFSM clutch (tiny)
   - How: GateFSM (Open→Primed→Armed→Fired→Cooldown) with hysteresis; optionally XState later. UIAdapter surfaces toggles in Material shell.
   - Trade-offs: Slight complexity; better determinism; still small.
3. Minimal engine adapter — Sample Phaser scene consumer
   - How: EventBridge adapter maps SDK events to Phaser input hooks; demo behind flag; no engine commitment.
   - Trade-offs: Demo-only; adds example value without coupling core.

## Recommendation

Option 2. Adopt MediaPipe stream with a tiny GateFSM, keep XState optional for future tests. Provide a sample engine consumer as a demo (Option 3) but not core.

## First Slice

- Files (new):
  - src/adapters/gestureTasksAdapter.mjs — lazy-loads @mediapipe/tasks-vision; exposes onGesture({label, score, ts, hand}).
  - src/controllers/gateFsm.js — minimal clutch FSM (no external dep) with hysteresis and hold timeout.
  - dev/demo_fullscreen_sdk_v8_material.html — enable FEATURE_ADOPT_BRIDGE_V1 to mount adapters and surface toggles.
- Wiring: Hook adapters into existing SDK bus in v7 demo variant under flag.
- Tests: Reuse hex:smoke:sdk:idle/pinch; add a tiny unit for gateFsm transitions later.

## Guard & Flag

- Guard: hex:tier:commit must pass (includes unit + contract + smokes + guard)
- Flag: FEATURE_ADOPT_BRIDGE_V1 (env or query param) — defaults off

## Industry Alignment

- Standard: MediaPipe Tasks (Gesture Recognizer) for discrete gestures (source: mediapipe docs in repo)
- State-of-the-art: Small FSM debouncing + lookahead for low-latency UX; Material Web scaffolds for mobile-first controls (source: defaults/repo)

## Revert

- Remove demo v8 file and adapters; delete FEATURE_ADOPT_BRIDGE_V1 usage; no API changes to core.

## Follow-up

- Add XState model tests for GateFSM; wire inspector only in dev.
- Optional: Engine sample (Phaser) to validate event contract.
- TTL check: 2025-10-04 — promote flag or expire.
