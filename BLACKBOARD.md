# Obsidian Blackboard (Root)

## Note — 2025-09-21T23:59:00Z

- WEBWAY: ww-2025-109 — PalmClutch pathfinder. Policy: ignore hands until Open_Palm; on Open_Palm, seat and begin calibration. Build a gesture language atop FSMs: key-like "press" gestures become PRIMED when plausible, then FIRE on state change with velocity confirmation and a 1D Kalman lookahead for Z. Open_Palm acts as the clutch.
- Calibration during Open_Palm: sample pixel span and user-provided knuckle span to derive absolute Z; track over time; fuse wrist orientation to correct camera intrinsics. Maintain bone-ratio checks.
- Next: wire PalmClutch FSM in GestureShell OS (flagged), expose seats P1..P4 actors in inspector, and log telemetry to JSONL.
- Links: Webway note `scaffolds/webway_palm-clutch-kalman-z-calibration.md`; SRL/ADR under Silk Scribe for ww-2025-109.

## Note — 2025-09-21T08:00:00.5927671Z

- Focus shift: working on GestureShell OS now. Reverting recent experimental wiring in the older v2 camera demo to keep that app stable. Any XState-based gating will live under GestureShell OS going forward.
- Action: revert WEBWAY:ww-2025-098 per-seat FSM hooks in `September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html`.
- Next check: 2025-09-22.

## Seats P1–P4: ghost + gating (2025-09-20)

- HUD/landmarks now tinted by seat: P1 red, P2 blue, P3 amber, P4 green.
- Seat claim requires sustained Open_Palm; no inflation while any seat is awaiting reacquire (within lossGraceMs).
- When a seated hand is occluded: we keep last smoothed pose as a ghost and show an anchor hint; seat persists and snaps to the nearest unseated hand within snapRadius when it reappears near the anchor.
- Gesture/detector alignment: GestureRecognizer results are matched to detector hands via nearest wrist to avoid cross-contamination.
- Shell seats window: enable with `?shell=1`, open “Seats” to view live P1–P4 keys.

Problem

- Wire the Gesture->Touch controller using adopt-first adapters on Hex v7 while enforcing the new TDD playbook before touching UI shells.

Metric

- Guard scripts stay green: `hex:verify:fast` -> PASS per `September2025/TectangleHexagonal/out/idle.v13.golden.summary.json`.
- SDK facade smoke stays green: `hex:smoke:sdk:idle` -> PASS per `September2025/TectangleHexagonal/out/idle.sdk.smoke.summary.json`.
- Dual-seat enriched telemetry stays green: `hex:smoke:sdk:pinch` -> PASS per `September2025/TectangleHexagonal/out/enriched.v13.golden.twohands.summary.json`.
- New Vitest suites (GateFSM, Predictor, TouchSynth) and Playwright golden replay pass (`pnpm test`, `pnpm test:golden`).

Tripwire

- Any guard or new Vitest/Playwright run flips to failure.
- Adapters land without WEBWAY markers or without updating `docs/TDD.md` schemas when knobs change.

Revert Path

- Flip experimental FEATURE_* flags off; remove adapters guarded by `WEBWAY:ww-2025-094`; fall back to the frozen v13 console bundle (`archive-stale/tectanglehexagonal_freeze_2025-09-17T08-32-43Z/`).

Champion

- @you (handoff-ready; SRL/ADR linked below).

Plan

- [x] Capture baseline guards and adoption ADR (2025-09-20).
- [ ] Phase A: implement GateFSM, Predictor, TouchSynth units under `/controllers`, make Vitest suites red -> green.
- [ ] Phase B: stand up XState model tests matching the playbook paths.
- [ ] Phase C: build Playwright MP4 replay harness, diff against `tap_1p.golden.jsonl` and `hold_drag_1p.golden.jsonl`.
- [ ] Phase D: gate IHC/SDK integration behind feature flag after tests and goldens are green.

Status

- Active. Next check-in: 2025-09-23 or sooner if guards fail.

Headful note (2025-09-21)

- Jest-Puppeteer headful produced the most reliable MP4 replays for v2. Use:
  - npm run -s hex:e2e:v2:idle:jsonl
  - npm run -s hex:e2e:v2:pinch:jsonl
- JSONL outputs land under HiveFleetObsidian/reports/telemetry with timestamps for audit.

Links

- TDD playbook: `docs/TDD.md`
- Webway: `scaffolds/webway_stigmergy-blackboard.md`
- SRL: `HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/srl/2025-09-20_hex_adoption_bridge.md`
- ADR: `HiveFleetObsidian/honeycomb/champions/SilkScribe/logs/adr/adr-2025-09-20-gesture-touch-controller-tdd.md`

Appendix 2025-09-20

- Phase A/B/C tasks mirrored in `TODO_today.md`; update status boxes as Vitest and Playwright suites come online.
- Immediate demo target: reuse `gesture_tasks_offline_v3.html` to visualize PREPARE/DOWN/HOLD events via the new bus before touching Dino or SDK facades.

## Daily To Do — 2025-09-20

- [ ] Run composite guard locally (server 8080): `npm run -s hex:guard:openpalm+camera`
- [ ] Harden camera state check (increase sample window if flakey); keep HEADLESS=0 if needed
- [ ] Gate new tests behind WEBWAY flag and document revert in webway_ww-2025-095
- [ ] Convert remaining node:test placeholders to Mocha pending tests (align with mocha runner)
- [ ] If Open_Palm seconds are near zero, adjust OPENPALM_THRESH or swap a steadier golden
