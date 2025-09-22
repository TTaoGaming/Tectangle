---
id: ww-2025-083
owner: @TTaoGaming
status: active
expires_on: 2025-09-27
guard: e2e: September2025/TectangleHexagonal/tests/e2e/gesture_tasks_bridge.smoke.test.js
flag: FEATURE_GESTURE_TASKS_BRIDGE
revert: remove FEATURE_GESTURE_TASKS_BRIDGE and adapter files
---
# Webway: Adoptable Gesture → Game adapters (simple, proven)

## Goal

Adopt existing open-source gesture stacks that already map hand gestures/pinches to game-friendly events (keyboard/select), so you can demo control on mid-range phones without rewriting your core pinch logic.

## Constraints

- Perf: <= 200 ms gesture→action (source: defaults)
- Deps: <= 1 small adapter per surface (tasks/xr/vrm) (source: defaults)
- Privacy: on-device only; no telemetry (source: defaults)
- Security: no secrets (source: defaults)
- CI: add a smoke e2e (source: defaults)

## Current Map

- You have a robust pinch with Kalman + hysteresis + angle/velocity + palm gating and a working v7 harness; XR emu smoke already green (ww-2025-082) (source: repo/message)

## Timebox

20 minutes adopt-first slice (source: defaults)

## Research Notes

- MediaPipe Tasks — Gesture Recognizer (Web): pre-trained hand gesture classifier + landmarks; web demo and JS API; easy to map to keyboard events. Demo: [developers.google.com/mediapipe/gesture_recognizer/web_js](https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer/web_js) (source: external)
- MediaPipe Hands — Landmarker (Web): fast 21-point hands; pair with lightweight recognizers like Fingerpose for custom gestures. Demo: [developers.google.com/mediapipe/hand_landmarker/web_js](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker/web_js) (source: external)
- Fingerpose (open source): simple, declarative hand gesture definitions used with TFJS Handpose/MediaPipe; many community examples. Repo: [github.com/andypotato/fingerpose](https://github.com/andypotato/fingerpose) (source: external)
- WebXR Hand Input samples: pinch → select/selectend conventions; works in AR/VR; sample repos with controllers/reticles. Demos: [immersive-web.github.io/webxr-samples](https://immersive-web.github.io/webxr-samples/) and [github.com/immersive-web/webxr-input-profiles](https://github.com/immersive-web/webxr-input-profiles) (source: external)
- three-vrm + Kalidokit: proven webcam→avatar retarget with finger curl; many demos show immediate, visual feedback. Demos: [pixiv.github.io/three-vrm](https://pixiv.github.io/three-vrm/) and [github.com/Yeemachine/kalidokit#demos](https://github.com/Yeemachine/kalidokit#demos) (source: external)
- Handsfree.js: pluginized wrapper around MediaPipe with gesture plugins and demos for cursor/game control. Site: [handsfree.js.org](https://handsfree.js.org/) (source: external)

## Tool Inventory

- Existing v7 harness + golden videos + Jest/Puppeteer; Dino bridge shows game mapping via keyboard Space (source: repo)
- New flags: FEATURE_GESTURE_TASKS_BRIDGE (sub: FEATURE_XR_EMU from ww-2025-082) (source: message)

## Options (Adopt-first)

1. Baseline — MediaPipe Gesture Recognizer → Keyboard
   - How: Load Tasks JS, recognize built-in gestures (e.g., Thumbs Up, Victory, Open Palm, Closed Fist) and map to keydown/keyup (Space/Arrow) for canvas games.
   - Trade-offs: Fastest path; limited to pre-trained set unless extended.
2. Guarded extension — WebXR Hand Input
   - How: Keep emitting selectstart/selectend on pinch (already in ww-2025-082), add a reticle. Works in XR headsets and with our emu for phones.
   - Trade-offs: Standard semantics; needs XR device for full effect (emu covers web-only demo).
3. Minimal adapter — VRM visual feedback (Kalidokit)
   - How: Add a VRM avatar; drive finger curls and basic pose from your existing landmarks/pinch for instant “see it” feedback.
   - Trade-offs: Small deps; strong demo impact.

## Recommendation

Option 1 + 2 now for minimum code and maximum reach; add Option 3 immediately after for compelling visuals.

## First Slice

- Add a Gesture Tasks adapter under FEATURE_GESTURE_TASKS_BRIDGE that:
  - Recognizes a single built-in gesture (Thumbs Up) and dispatches a keyboard Space down/up to the Dino iframe.
  - Expose a visible counter chip to confirm events, similar to XR emu counter.
- Add a puppeteer smoke asserting the counter increments with the golden pinch clip (we can simulate the gesture if needed for determinism).

### Demos to try now (no code)

- MediaPipe Gesture Recognizer Web Demo (camera required): see recognized gestures live and thresholds. [developers.google.com — Gesture Recognizer (Web)](https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer/web_js)
- WebXR Samples (hand input): open in Chrome/Edge (desktop or Android), use emulation or XR device. [immersive-web.github.io — WebXR samples](https://immersive-web.github.io/webxr-samples/)
- three-vrm + Kalidokit: webcam to avatar retarget quickstart demos. [VRM demo](https://pixiv.github.io/three-vrm/) | [Kalidokit demos](https://github.com/Yeemachine/kalidokit#demos)

## Guard & Flag

- Guard: e2e smoke at September2025/TectangleHexagonal/tests/e2e/gesture_tasks_bridge.smoke.test.js
- Flag: FEATURE_GESTURE_TASKS_BRIDGE

## Industry Alignment

- Standards: WebXR Hand Input “select” conventions; Web MIDI MPE for expressive mapping (optional next) (source: external)
- State-of-the-art: MediaPipe Tasks (Gesture Recognizer), three-vrm + Kalidokit (source: external)

## Revert

Remove FEATURE_GESTURE_TASKS_BRIDGE usage and adapter files. No data migration.

## Follow-up

- TTL check: expire if not integrated within 7 days.
- Add VRM avatar retarget for visual proof; optional Web MIDI MPE mapping for creative tools.
