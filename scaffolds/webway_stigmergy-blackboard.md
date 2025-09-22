---
id: ww-2025-094
owner: @you
status: active
expires_on: 2025-10-01
guard: npm run -s hex:verify:fast
flag: FEATURE_UI_TW_SHELL
revert: remove folder/flag
---
# Webway: Stigmergy Blackboard Adoption

## Goal

Adopt-first synthesis: compose existing GestureRecognizer (MediaPipe Tasks), Hex SDK v7 facade, and IHC v13 shell to deliver reliable, low-latency pinch/open/fist interactions. Layer controller persistence, lookahead, and a tiny FSM as adapters, not core rewrites.

## Constraints

- License: MIT project; MediaPipe Tasks under Apache 2.0 — ensure notices and version pin.
- Deps budget: 1 small lib max (already using @mediapipe/tasks-vision).
- Perf: <= 200ms TTI and <10ms/frame overlay for mid-range devices.
- Privacy/Security: no telemetry exfil in demos; offline clips allowed.
- CI: tests and smokes must pass.

## Current Map

- Gesture tasks offline v3: `September2025/TectangleHexagonal/dev/gesture_tasks_offline_v3.html`
- SDK v7 demos: `September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html`
- IHC:
  - V13 FROZEN: `September2025/TectangleHexagonal/dev/integrated_hand_console_v13.html`
  - V14 ACTIVE: `September2025/TectangleHexagonal/dev/integrated_hand_console_v14.html`
- Rich exporters/smokes: see `package.json` hex:* scripts

## Timebox

20 minutes (defaults)

## Research Notes

- V12 is frozen; V13 is frozen as Tailwind UI baseline; V14 is active with research flags (source: September2025/TectangleHexagonal/README.md)
- IHC V14 flags include FEATURE_ANGLE_VELOCITY, FEATURE_ANGLE_JERK, FEATURE_PREDICTOR_FUSION (source: dev/integrated_hand_console_v14.html)
- MediaPipe GestureRecognizer provides canned gestures and options across platforms (source: mediapipe-master-referenceonly)
- Existing smokes: hex:smoke:v13:quick, hex:smoke:gesture:offline (source: package.json)

## Tool Inventory

- Scripts: hex:verify:fast, hex:smoke:v13:quick, hex:smoke:gesture:offline, hex:telemetry:golden:*, hex:export:rich, hex:guard:rich
- Pages: IHC v13/v14, SDK v7 demos, gesture_tasks_offline_v3
- Data: golden videos, JSONL exporters
- Silk Scribe: SRL/ADR logs + index

## Options (Adopt-first)

1. Baseline — Keep V13 shell, feed it SDK v7 + MP Tasks
   - How: glue adapter maps GestureRecognizer outputs to SDK telemetry fields; IHC consumes via existing VM.
   - Trade-offs: fastest to stable UI; minimal risk; avoids overfitting.
2. Guarded extension — Enable V14 flags for angle velocity/jerk and predictor fusion
   - How: flip flags per experiment; collect JSONL; compare to goldens.
   - Trade-offs: controlled complexity; measurable impact; reversible by flag.
3. Minimal adapter — Controller persistence + FSM
   - How: add thin module that smooths seat-lock and emits debounced pinch/open; expose lookahead shim.
   - Trade-offs: small bespoke logic; isolated; easy revert.

## Recommendation

Option 1 + 3: adopt V13 + SDK v7 now; land the persistence/FSM adapter. Use Option 2 flags in V14 for targeted gains and keep reversible.

## First Slice

- Wire MP Tasks recognizer outputs into SDK v7 facade (no UI change). Gate any new metrics behind flags.
- Run `npm run -s hex:verify:fast` and `npm run -s hex:smoke:v13:quick`.

## Guard & Flag

- Guard: hex:verify:fast must pass
- Flag: FEATURE_UI_TW_SHELL (already present); experimental flags only on V14

## Industry Alignment

- MediaPipe Tasks: standard cross-platform hand gestures (source: mediapipe docs in repo)
- Tailwind UI shell: common responsive approach for web UIs

## Revert

Remove the adapter and flip flags off; V13/V12 remain functional. Delete feature code marked with WEBWAY:ww-2025-094 in diffs.

## Follow-up

- TTL check: on 2025-10-01, confirm flags and guards; if stable, merge adapters into SDK facade.
- Additional notes: document adapter contract and add 2-3 unit tests on FSM transitions.

## Links

- Main Stigmergy Blackboard: `/ObsidianBlackboard.md`
