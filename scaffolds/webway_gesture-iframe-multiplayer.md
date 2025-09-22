---
id: ww-2025-095
owner: @TTaoGaming
status: active
expires_on: 2025-10-04
guard: ci:smoke-gesture-iframe-multiplayer (SelectsPred ≥ 1 per seat in <5s; lead_ms ≥ configured)
flag: FEATURE_IFRAME_MULTIPLAYER_BUS, FEATURE_GESTURE_TASKS_BRIDGE, FEATURE_KALMAN_LOOKAHEAD
revert: remove demo/bus + flags
---
# Webway: Local multiplayer gestures for iframed one-button mini games

## Goal
Ship an offline demo where one camera drives multiple iframed mini games on the same page. Each player claims a seat; gestures map to one-button input (select down/up). Include short-horizon prediction (lookahead) and optional tempo-quantized taps.

## Constraints
- License: MediaPipe Tasks (Apache-2.0) only; no cloud (source: defaults)
- Deps: +1 small lib (Tasks Vision); reuse in-repo Kalman/ports (source: defaults)
- Perf: ≤200 ms to event; prediction can emit earlier (source: defaults)
- Privacy: local models/WASM, no telemetry by default (source: defaults)
- CI: existing smokes must pass; add focused iframe bus smoke (source: repo)

## Current Map
- Landmarks/gesture: @mediapipe/tasks-vision already in use; local model paths (source: files)
- Prediction: Kalman 1D + TOI ports (`src/core/kalman1d.js`, `src/ports/toiKalmanPort.js`) (source: repo)
- Seating: seat lock and adapters; iframe bridge planned in ww-2025-004 (source: webway)
- Tests: jest-puppeteer + MP4 goldens; static server tasks on 8080/8091 (source: package.json/tasks)

## Timebox
20 minutes to wire minimal bus + smoke; iterate later.

## Research Notes
- MediaPipe Gesture Recognizer: stable labels (Closed_Fist, Open_Palm, Pinch) with scores (source: docs)
- Fan-out: BroadcastChannel('gesture-bus') for same-origin; postMessage for directed or cross-origin (source: standards)
- Event model: Align to WebXR selectstart/selectend semantics for parity (source: W3C)
- Musical quantization: use AudioContext.currentTime as clock; snap to nearest subdivision at BPM (source: web)
- XR/VR standards: WebXR Hand Input; VRM avatars for optional player rendering later (source: standards)

## Tool Inventory
- Vision: @mediapipe/tasks-vision (HandLandmarker, GestureRecognizer), local models/WASM (source: files)
- Filters: kalman1d, One-Euro optional (in-repo) (source: repo)
- Bus: BroadcastChannel + postMessage fallback (source: standards)
- Target: Iframe mini games listening for Select/SelectPred events (source: repo pattern)
- Tests: jest-puppeteer smokes; static server on 8080/8091 (source: tasks)

## Options (Adopt-first)
1. Baseline — Parent runs GestureRecognizer and publishes Select events to iframes via BroadcastChannel. No prediction.
   - Trade-offs: Simple, lowest latency; no lookahead or tempo alignment.
2. Guarded extension — Add Kalman lookahead to synthesize SelectPred with lead_ms; reconcile on actual Select; WebXR-like event names.
   - Trade-offs: Slight complexity; needs thresholds/hysteresis; measurable latency win.
3. Minimal adapter — Optional tempo quantizer: delay non-critical Select to nearest 1/4 or 1/8 note using AudioContext time; keep prediction path for responsiveness.
   - Trade-offs: Adds bounded delay by design; feature-flagged for rhythm games.

## Recommendation
Option 2 first (Gesture Tasks + Kalman lookahead behind flags), then layer Option 3 for rhythm games.

## First Slice
- Create `src/adapters/iframeGestureBus.mjs` → createGestureBus({seating}) that publishes `{seat,label,phase,ts,lead_ms}` via BroadcastChannel('gesture-bus'). // WEBWAY:ww-2025-095
- Parent demo page with two same-origin iframes; map `Closed_Fist` down to Select/SelectPred by seat. // WEBWAY:ww-2025-095
- Use existing Kalman port to compute short-horizon crossing for lead_ms; expose toggle.

## Guard & Flag
- Guard: ci:smoke-gesture-iframe-multiplayer — headless loads demo, simulates labels for 2 seats via `__gtSim`, expects ≥1 SelectPred per seat in <5s and lead_ms ≥ configured.
- Flags: FEATURE_IFRAME_MULTIPLAYER_BUS, FEATURE_GESTURE_TASKS_BRIDGE, FEATURE_KALMAN_LOOKAHEAD.

## Industry Alignment
- Standard: WebXR select semantics; BroadcastChannel/postMessage for multi-frame comms (source: standards)
- SOTA: MediaPipe Tasks for commodity gesture labels; anticipatory input with Kalman/One-Euro (source: docs)

## Revert
Delete bus adapter + demo; disable flags; single-frame path unchanged.

## Follow-up
- TTL: if guard flaky after 7 days, reduce lead_ms or tune q/r.
- Add cross-origin adapter; evaluate SharedWorker for shared vision later.
