---
id: ww-2025-097
owner: @TTaoGaming
status: active
expires_on: 2025-10-04
guard: ci:smoke-zone-seating (2 seats recognized in <5s; correct seat triggers ≥1 Select)
flag: FEATURE_ZONE_SEATING, FEATURE_GESTURE_TASKS_BRIDGE, FEATURE_GESTURE_VIZ_V3
revert: remove demo page + flags
---
# Webway: Fullscreen Gesture Recognizer with zone-based seating + canvas visuals

## Goal
Use MediaPipe Tasks Gesture Recognizer full-screen to detect a small set of gestures with confidence, overlay simple canvas visuals (landmarks, labels, sparklines), and route inputs to mini games via zone-based seating (split screen L/R or T/B). Keep it offline and reversible.

## Constraints
- License: MediaPipe Tasks (Apache-2.0); no cloud (source: defaults)
- Deps: reuse @mediapipe/tasks-vision; no new heavy libs (source: defaults)
- Perf: ≤200 ms to event; prediction optional (source: defaults)
- CI: add a smoke that simulates labels and checks seat routing (source: repo)

## Current Map
- Tasks Vision already used (HandLandmarker); adding Gesture Recognizer is straightforward (source: repo)
- Kalman/TOI ports, hysteresis, seat logic exist; Dino runner demo present (source: repo)

## Timebox
20 minutes to ship a demo with two zones and simple overlay.

## Research Notes
- Gesture Recognizer expects video/canvas frames; returns gestures + confidences per hand (source: docs)
- Zone seating: normalizing x,y to screen space then threshold (x<0.5 => left seat; y<0.5 => top) (source: standards)
- Palm orientation gating: use handedness + landmarks (wrist→index orientation) or recognizer orientation fields if available (source: docs/heuristics)

## Tool Inventory
- Vision: @mediapipe/tasks-vision Gesture Recognizer + optional HandLandmarker for overlay (source: repo)
- Overlay: canvas 2D; optional @mediapipe/drawing_utils or custom edges (source: repo)
- Logic: hysteresis, Kalman lookahead (lead_ms), seat persistence (source: repo)
- Bus: BroadcastChannel (same-origin iframes) (source: standards)
- Tests: puppeteer smoke to assert seat routing and event emission (source: tasks)

## Options (Adopt-first)
1. Baseline — Fullscreen recognizer; map Closed_Fist to selectstart/selectend; split screen L/R; show minimal HUD.
   - Trade-offs: Fastest path; no prediction.
2. Guarded extension — Add Kalman lookahead (SelectPred), sparklines per seat, palm-orientation gating.
   - Trade-offs: Slightly more complexity; better feel/robustness.
3. Minimal adapter — Add BPM quantizer wrapper for rhythm; grid overlays to define custom zones.
   - Trade-offs: Intentional delay; feature-flagged.

## Recommendation
Option 2: baseline + lookahead + simple gating behind flags for a confident demo and better feel.

## First Slice
- Demo page `dev/zone_seating_fullscreen.html`: fullscreen video, canvas overlay, two zones; recognizer outputs labels+scores; route to seats via x<0.5; emit Select/SelectPred. // WEBWAY:ww-2025-097
- Add `src/adapters/zoneSeating.mjs` to compute seat from hand center; apply hysteresis/persistence. // WEBWAY:ww-2025-097
- Wire BroadcastChannel to iframes hosting Dino runner variants (top/bottom or left/right). // WEBWAY:ww-2025-097

## Guard & Flag
- Guard: ci:smoke-zone-seating loads demo, feeds synthetic positions/labels via `__gtSim`, expects ≥1 seat-correct Select per seat in <5s.
- Flags: FEATURE_ZONE_SEATING, FEATURE_GESTURE_TASKS_BRIDGE, FEATURE_GESTURE_VIZ_V3

## Industry Alignment
- WebXR select event semantics; lightweight overlays for explainability; Gesture Recognizer for production-ready labels.

## Revert
Delete demo and zoneSeating adapter; disable flags; single-seat path unchanged.

## Follow-up
- TTL: if zone routing noisy, add per-seat smoothing/persistence and palm-orientation gating thresholds.
- Later: configurable 2×2 zones, custom polygon zones, and tempo quantizer.
