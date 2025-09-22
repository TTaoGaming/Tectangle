---
id: ww-2025-092
owner: @TTaoGaming
status: active
expires_on: 2025-09-27
guard: tests/smoke (manual for now) – load v2 page and ensure telemetry rows > 10 in 10s
flag: FEATURE_GESTURE_TELEM_V2
revert: remove dev/gesture_tasks_offline_v2.html and disable FEATURE_GESTURE_TELEM_V2
---
# Webway: Gesture v2 – Offline Telemetry + Tiny FSM

## Goal

Add a v2 offline demo that shows rich, live telemetry from MediaPipe Tasks Gesture Recognizer and a small FSM that turns gesture labels into deterministic events (e.g., Closed_Fist → Select). Keep it offline and demo-friendly.

## Constraints

- Offline only (local ESM/WASM + local model). (source: repo)
- Minimal UI, no new deps beyond tasks-vision. (source: defaults)
- CI must remain green; change is demo-only. (source: defaults)

## Current Map

- v1 page exists: `dev/gesture_tasks_offline.html` (Closed_Fist → Space). (source: file)
- Main port still CDN-based; demo path is fully offline. (source: analysis)

## Timebox

20 minutes (source: defaults)

## Research Notes

- MediaPipe provides gesture labels and scores and multiple candidates per frame (gestures[0]/i.e., top-3) (source: tasks-vision).
- We can compute dt/fps client-side to surface perf. (source: repo)
- Tiny FSM gives sticky behavior and debounced mapping to sidecar Dino. (source: message)

## Tool Inventory

- http-server task @ 8091 (source: tasks)
- tasks-vision ESM/WASM in node_modules (source: package.json)
- Local model: `assets/models/gesture_recognizer.task` (source: file)

## Options (Adopt-first)

1. Baseline Telemetry – Table with ts/dt/fps/label/score/candidates; debounced select.
   - Trade-offs: Simple, low-risk; no persistence beyond JSONL export.
2. Guarded FSM – Add enter/exit hysteresis thresholds; emit trigger/release events.
   - Trade-offs: More logic but deterministic; single gesture only for now.
3. Minimal Adapter Hook – Expose a small event bus (`enqueueEvent`) for other managers.
   - Trade-offs: Future wiring needed to unify with hex managers.

## Recommendation

Option 2 now (baseline + FSM) to unlock reliability and clearer demos.

## First Slice

- New page `dev/gesture_tasks_offline_v2.html` with telemetry table + FSM (Closed_Fist → Select). Feature flag: FEATURE_GESTURE_TELEM_V2.

## Guard & Flag

- Guard: Manual smoke – Start camera; verify >10 telemetry rows in ~10s; Select increments on Closed_Fist.
- Flag: FEATURE_GESTURE_TELEM_V2.

## Industry Alignment

- Anticipatory/sticky input with simple FSMs is standard in games and HCI. (source: defaults)
- MediaPipe Tasks is Apache-2.0 and suitable for offline demos. (source: defaults)

## Revert

Remove `dev/gesture_tasks_offline_v2.html` and references; disable FEATURE_GESTURE_TELEM_V2; no code path changes required elsewhere.

## Follow-up

- Wire telemetry to a reusable SDK facade and record to JSONL with playback.
- Extend FSM to multiple gestures and add palm/orientation gates.
- Add a CI smoke to open the page headlessly and assert row count.
