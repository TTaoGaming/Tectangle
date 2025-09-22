---
id: ww-2025-096
owner: @web-cartographer
status: active
expires_on: 2025-10-05
guard: npm run -s hex:smoke:camera:wrist:v2
flag: FEATURE_V2_CAMERA_DUAL_VIZ
revert: remove v2 page + flag comments
---
# Webway: V2 camera wrist label with dual viz, mapper, and One Euro smoothing

## Goal
Introduce a v2 of the camera + landmarks + wrist label demo that fixes screen normalization and mirroring via a reusable viewport mapper, adds a One Euro–smoothed overlay alongside raw landmarks (dual viz), integrates GestureRecognizer so the UI state mirrors the top label, and keeps unit tests green with a smoke guard.

## Constraints
- License: MIT (source: package.json)
- Deps budget: reuse existing; no new runtime deps (source: defaults)
- Perf budget: 200ms/frame worst-case; maintain interactive 15+ FPS on goldens (source: defaults)
- Privacy: no telemetry by default; JSONL exports only in explicit smokes (source: message)
- Security: no secrets; offline ESM/WASM and local .task models (source: codebase)
- CI: must pass existing unit tests and new v2 smoke (source: message)

## Current Map
- v1 camera demo exists and was refactored to use hex modules (viewport mapping, smoother, draw).
- v2 page cloned for future FSM/UI without destabilizing v1: `September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html` (source: file)
- New smoke: `tests/smoke/wrist_label_camera_v2.smoke.mjs` with OUT summary (source: file)
- Stable ID hook exposed: `window.__cam.getStableIds()` (source: file)
- Key-aware smoother wired to stable per-hand keys (id/seat) to prevent cross-contamination: `src/processing/landmark_smoother.js` (source: file)
- New unit: `September2025/TectangleHexagonal/tests/unit/landmark_smoother.keys.test.mjs` (source: file)
- New smoke: `September2025/TectangleHexagonal/tests/smoke/wrist_label_ids_v2.smoke.mjs` (source: file)
- Scripts: `hex:smoke:camera:wrist:v2` added; unit tests via `hex:test:unit` are green (80 passing, 11 pending) (source: message, package.json)
- Golden MP4 for mocks: `videos/golden/golden.two_hands_idle.v1.mp4` (source: codebase)

## Timebox

20 minutes (source: defaults)

## Research Notes

- MediaPipe Tasks Vision ESM/WASM loaded from `@mediapipe/tasks-vision/vision_bundle.mjs` with local `.task` models (source: v2 page)
- Viewport mapper maps normalized [0..1] → canvas px with cover + mirror, preventing drift (source: src/vis/viewport_mapping.js)
- One Euro smoothing wraps per-hand/point/axis filters; dual viz toggled with "v" key (source: v2 page, src/processing/landmark_smoother.js)
- Draw helpers centralize styles and mapping (source: src/vis/draw_landmarks.js)
- Optional shell stub via Material Web + WinBox gated behind `?shell=1` (source: v2 page)

## Tool Inventory

- Local server: `npx http-server . -p 8080` or VS Code task "Start local static server 8080" (source: tasks)
- Tests: `npm run -s hex:test:unit`, `npm run -s test:smoke`, `npm run -s hex:smoke:camera:wrist:v2` (source: package.json)
- Goldens tooling: `hex:videos:prepare-goldens` (source: package.json)

## Options (Adopt-first)

1. Baseline — keep v1 only, iterate in place, no clone.
   - Trade-offs: fewer files but higher blast radius; harder to stage FSM/UI changes.
2. Guarded extension — add v2 page using shared hex modules and a smoke test.
   - Trade-offs: slight duplication but safer iteration; easy revert; preferred for staging.
3. Minimal adapter — gate new behaviors in v1 behind a feature flag.
   - Trade-offs: adds branching and runtime checks; can complicate v1.

## Recommendation

Option 2 because it isolates new UI/FSM experiments, keeps v1 stable, and gives us a clean guard (smoke) with a trivial revert path.

## First Slice

- Create v2 HTML cloning v1, import mapper/smoother/draw, enable dual viz + key toggle.
- Add GestureRecognizer so `state` mirrors top label.
- Add smoke harness for v2 that mocks getUserMedia via mp4 captureStream and asserts FPS>0 + ink.
- Add npm script `hex:smoke:camera:wrist:v2` to run the smoke.

## Guard & Flag

- Guard: `npm run -s hex:smoke:camera:wrist:v2` must succeed and write OUT summary.
- Guard (IDs): `npm run -s hex:smoke:camera:ids:v2` asserts non-empty and stable IDs on idle golden.
- Flag: FEATURE_V2_CAMERA_DUAL_VIZ (marker only; behaviors are in v2 page).

## Industry Alignment

- Standard practice: video to canvas mapping with cover/contain and mirroring (source: codebase)
- State-of-the-art: One Euro filter for real-time smoothing with tunable cutoff (source: prior modules/notes)

## Revert

Delete v2 page and its smoke test; remove `hex:smoke:camera:wrist:v2` script. No migration needed.

## Follow-up

- Promote v2 smoke into composite guard (or CI job) once stable.
- Add FSM and shell UI controls for smoothing params and viz modes.
- Extend smoke to validate state-vs-gesture for v2.
- Consider adding per-hand bone ratio signature checks for ID continuity.
- TTL check on 2025-10-05; either mark done or expire.
