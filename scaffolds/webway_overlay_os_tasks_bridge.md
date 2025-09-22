---
id: ww-2025-095
owner: @TTaoGaming
status: active
expires_on: 2025-10-01
guard: npm run -s hex:overlay:verify
flag: FEATURE_TASKS_BRIDGE
revert: set FEATURE_TASKS_BRIDGE=false; remove publisher module
---
# Webway: Overlay OS — MediaPipe Tasks bridge

## Goal
Emit real hand landmarks and gesture-derived clutch state into the Overlay OS bus. Keep synthetic feed for CI; add handedness and gesture-shaded colors to Hand Viz.

## Constraints

- Adopt-first: MediaPipe Tasks (@mediapipe/tasks-vision, Apache-2.0)
- Perf: keep UI responsive; no heavy allocations in loop
- Privacy/Security: local models only; no network
- CI: deterministic smoke via synthetic feed remains default

## Current Map

- Overlay OS (M3) + bus + synthetic two-hand feed working
- Hand Viz and Sparkline apps subscribed to bus

## Timebox

20 minutes (source: defaults)

## Research Notes

- gesture_tasks_offline_v3.html shows working recognizer + hand landmarker usage (source: repo)
- Models exist at assets/models/*.task (source: repo)
- BroadcastChannel bus stable; replay helps late subscribers (source: repo)
- Deterministic CI path added: overlay_os_v1.html honors ?auto to pre-open windows and set window.__overlayReady for smoke (source: repo)

## Tool Inventory

- @mediapipe/tasks-vision ^0.10.19 (source: package.json)
- Static server task on 8091 (source: tasks)
- Jest+Puppeteer smoke for overlay (source: tests)

## Options (Adopt-first)

1. Baseline — Keep synthetic feed; add color-by-handedness in Hand Viz.
   - Trade-offs: No real data yet; fully deterministic.
2. Guarded bridge — Add Tasks publisher behind FEATURE_TASKS_BRIDGE; reuse offline model assets.
   - Trade-offs: Heavier page init; guard off in CI by default.
3. SharedWorker fanout — Multi-tab bus; later if needed.
   - Trade-offs: Complexity; unnecessary now.

## Recommendation

Option 2: land the bridge behind a flag, keep synthetic default.

## First Slice

- publisher_tasks_bridge.mjs publishes overlay:landmarks and overlay:fsm
- Wire flag in overlay_os_v1.html; keep synthetic feed
- Update Hand Viz colors by handedness + gesture label

## Guard & Flag

- Guard: npm run -s hex:overlay:verify
- Flag: FEATURE_TASKS_BRIDGE

## Industry Alignment

- MediaPipe Tasks web API; BroadcastChannel IPC; Material 3 visuals

## Revert

Disable FEATURE_TASKS_BRIDGE; delete publisher module.

## Follow-up

- Threshold sliders for clutch FSM; expose to bus
- Add smoke that toggles bridge off and uses synthetic feed
- Consider enabling FEATURE_TASKS_BRIDGE by default for manual demos; keep off in CI
