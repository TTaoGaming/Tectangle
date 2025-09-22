---
id: ww-2025-001
owner: @TTaoGaming
status: active
expires_on: 2025-10-08
guard: mocha unit: sdk_entry_shape.test.mjs
flag: SPATIAL_SDK_SIMPLE
revert: remove folder/flag
---

# Webway: Simple Spatial SDK entry

Goal: Provide a single, easy import for the spatial input SDK while preserving DI and hex boundaries.
Proven path: Wrap existing HexInput facade (September2025/TectangleHexagonal/src/sdk/hexInputFacade.js).
Files touched: src/index.js; package.json; September2025/TectangleHexagonal/tests/unit/sdk_entry_shape.test.mjs
Markers: WEBWAY:ww-2025-001:
Next steps: Expand docs with code sample; add richer comparator guard when available.

## Adoption precedents (one-button → many)

- One-button canon: Flappy Bird, Chrome Dino, Canabalt, Alto-like tap; microgames: WarioWare-style. Reference: [abagames one-button](https://abagames.github.io/joys-of-small-game-development-en/restrictions/one_button.html)
- Emulators (strangler-fig): Keyboard/mouse/touch adapters; start with a single key (Space/Enter) then extend to multi-surface.
- Deterministic harness: JSONL replays + golden summaries; size-only guard now, field-aware later.

## One-button excellence (Phase 0)

- Pinch v0: Orientation-gated (palm-forward), sticky FSM, TtC predict-then-verify; velocity/accel for trigger/release; joint-angle as third vote.
- Smoothing: One-Euro slider (deterministic scale), outlier clamps; per-user calibration for knuckle span.
- Telemetry: Per-event CSV/JSONL, TOI_pred vs TOI_actual, confidence; Side Panel shows Pinch Stats.
- Guard: two smokes (positive pinch; gated negative) + comparator; unit tests for FSM edges.

Feature flag: FEATURE_ONE_BUTTON_EXCELLENCE
Guard: mocha smoke/assertions + JSONL smokes

## Keyboard mapping config (Phase 1)

- Goal: Wrist quaternion buckets × 4 pinches/hand → keys/MPE; user-configurable JSON map; export/import.
- API sketch: sdk.updateKeymap({ wristBuckets:[UP,RIGHT,DOWN,LEFT], hand:{ left:{index:"A"...}, right:{...} } })
- Visual: Wrist Compass + per-finger glyphs; quick-edit overlay; dead-zones and screen-edge guards.

Feature flag: FEATURE_KEYMAP_WRIST_QUAT
Guard: unit tests for mapping resolution; smoke that asserts key events per bucket/pinch.

## Missing pieces (shortlist)

- Calibration persistence (per-user span), richer comparator (field-level tolerances).
- Dead-zones near anchors/edges; same-space hand guard; error simulators for occlusion/mirror-hand.
- Side Panel consolidation; single Start/Stop/Export; remove floating HUD leftovers.
- CameraManager startup log + alignment check; smoothing lag tuning; sticky FSM + TOI params exposed.

## Strangler-fig path

- Start one-button via keyboard emulator (Space). Add mouse/touch adapters behind flags. Keep goldens deterministic. Expand to 4-pinches once v0 feels perfect.
