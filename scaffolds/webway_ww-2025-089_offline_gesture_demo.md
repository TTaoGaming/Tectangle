---
id: ww-2025-089
owner: @TTaoGaming
status: active
expires_on: 2025-10-05
guard: ci:hex-gesture-offline-smoke (page loads; model present; 1 synthetic select)
flag: FEATURE_GESTURE_TASKS_OFFLINE
revert: remove dev page + model + scripts
---
# Webway: Offline Gesture Recognizer demo (Hex)

## Goal

Run MediaPipe Tasks Gesture Recognizer fully offline inside the Tectangle Hex dev area, mirroring the online demo. Provide a simple page that shows label/score and can optionally trigger Space in the Dino iframe.

## Constraints

- License: MediaPipe Tasks (Apache-2.0) assets; hosted locally. (source: defaults)
- Dependencies: Reuse node_modules copy; NO new bundler. (source: defaults)
- Perf: Target TTI < 2s on localhost. (source: defaults)
- Privacy/Security: No telemetry; local model only. (source: defaults)
- CI: must pass existing suites. (source: defaults)

## Current Map

- Hex dev already includes CDN-based demos using tasks-vision. No local .task model yet. Static servers on 8080/8091. (source: codebase)

## Timebox

20 minutes (source: defaults)

## Research Notes

- `gesture_tasks_to_dino.html` uses CDN for bundle+model. (source: file)
- No `gesture_recognizer.task` in repo. (source: search)
- `http-server` serves node_modules, so local ESM path `/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs` works. (source: defaults)

## Tool Inventory

- npm scripts: `Start local static server 8080/8091` tasks. (source: codebase)
- Puppeteer/Jest harness available for smokes. (source: package.json)
- New tool: `tools/fetch_gesture_model.mjs` to fetch model. (source: this webway)

## Options (Adopt-first)

1. Baseline — CDN bundle+model (already present)
   - Trade-offs: Online only; fragile offline.
2. Guarded extension — Local ESM+wasm from node_modules; fetch model once into assets; page under dev/
   - Trade-offs: Slight path coupling to server root; simplest.
3. Minimal adapter — Wrap as `gestureTasksAdapter.mjs` behind flag for SDK ports
   - Trade-offs: More wiring; valuable later.

## Recommendation

Option 2: quickest reversible slice with clear guard.

## First Slice

- Add `dev/gesture_tasks_offline.html` using local ESM+wasm and model path.
- Add `tools/fetch_gesture_model.mjs`; wire `hex:gesture:model` script.
- Verify on <http://127.0.0.1:8080/September2025/TectangleHexagonal/dev/gesture_tasks_offline.html>

## Guard & Flag

- Guard: headless smoke ensures page loads and `window.__gtOfflineSim.fireOnce()` increments Selects.
- Flag: FEATURE_GESTURE_TASKS_OFFLINE (marker only in this slice).

## Industry Alignment

- MediaPipe Tasks Web offline deployment via local ESM/wasm is standard. (source: README)

## Revert

- Remove `dev/gesture_tasks_offline.html`, `assets/models/gesture_recognizer.task`, script `hex:gesture:model`.

## Follow-up

- Integrate as adapter behind existing SDK port.
- Add CI smoke to assert model presence and demo load.
