# Stigmergy Blackboard — Coordination Hub

## Purpose

- Coordinate engines and demos via adopt-first strategy; stop reinventing, compose proven pieces.

## North-star goals (plain language)

- Ship reliable pinch/open/fist interactions across devices with minimal custom ML.
- Reuse MediaPipe Tasks + our Hex SDK v7 facade for telemetry; keep UI in IHC v13 shell, iterate in V14 behind flags.
- Add controller persistence + lookahead + FSM as small adapters, not core rewrites.

## Current map (what exists)

- Gesture tasks offline v3: `September2025/TectangleHexagonal/dev/gesture_tasks_offline_v3.html` (MediaPipe Tasks in-page; clips; offline repeatability)
- SDK v7 demos: `demo_fullscreen_sdk_v7_material.html` (facade, events, materials UI)
- Integrated Hand Console
  - V13 (FROZEN, Tailwind shell baseline): `dev/integrated_hand_console_v13.html`
  - V14 (ACTIVE research head): `dev/integrated_hand_console_v14.html` (flags: FEATURE_ANGLE_VELOCITY, FEATURE_ANGLE_JERK, FEATURE_PREDICTOR_FUSION)
- Rich telemetry + exporters + smokes: see package scripts under “hex:*” (tests, exports, goldens)

## Adoptable precedents (keep, compose)

- MediaPipe Tasks GestureRecognizer (web): robust canned gestures; portable; test coverage
- Hex SDK v7: telemetry facade with replay/smoke harnesses and goldens
- IHC v13 shell: responsive, consistent UI; V14 for gated research toggles

## Smallest safe next slice

1) Keep V13 as shell, feed it SDK v7 + MP Tasks outputs
2) Gate lookahead predictors and angle velocity/jerk under flags in V14; measure vs goldens
3) Add a minimal controller persistence + FSM adapter emitting stable events to games

## Guards (measurable)

- Pass: `hex:verify:fast` and `hex:smoke:v13:quick`
- Optional: `hex:smoke:gesture:offline`, `hex:telemetry:golden:*`, `hex:guard:rich`

## Links

- Webway note: `scaffolds/webway_stigmergy-blackboard.md`
- SRL: `HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/srl/2025-09-20_stigmergy_blackboard.md`
- ADR: `HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/adr/adr-2025-09-20-stigmergy-blackboard.md`
- Main Stigmergy Blackboard: `/ObsidianBlackboard.md`
