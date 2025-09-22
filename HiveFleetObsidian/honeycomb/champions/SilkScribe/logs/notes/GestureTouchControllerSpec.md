# Gesture→Touch Controller – Adapters Spec

## Goal
Use MediaPipe gestures to emulate touch events (down/up/move/hold/drag/double-tap) with predictive hints and CI golden replays. Deploy as offline PWA.

## Pipeline
Camera → MediaPipe → InputAdapter (t, label, scores, landmarks) → GateFSM (O-P-O clutch via XState) → Predictor sidecar → TouchSynth (XState touch semantics) → Event bus → Tools/UI → Telemetry JSONL.

## TouchSynth (XState)
- States: IDLE, DOWN, HOLD, DRAG, UP, CANCEL.
- Timers: tap <160 ms & <8 px; double-tap Δ <250 ms; hold ≥500 ms; drag threshold 12 px.
- Events emitted: POINTER_DOWN/UP/MOVE, TAP, DOUBLE_TAP, HOLD_START/END, DRAG_*.

## Predictor Sidecar
- Ring buffer (150–250 ms) of score_fist.
- Estimate threshold crossing, emit PREPARE_DOWN early (response_lead_ms), confirm within confirm_window_ms via GateFSM K-frame check.
- Optional quantization (Tone.js) for PREPARE events.

## Controls/Config (config/controller.json)
- response_lead_ms, confirm_window_ms, hold_ms, double_tap_ms, drag_threshold_px, tap_max_ms, quantize_on/off, bpm, grid.

## Telemetry & Goldens
- JSONL columns: t_ms, type, x, y, player, label, score, fsm_state, predicted, fps.
- Golden MP4 + .golden.jsonl pairs; tolerances ±30 ms, ±5 px.
- CI: replay fixtures with Puppeteer/Playwright, diff JSONL; upload diffs + new JSONL + annotated MP4 if failing.

## Repo Layout
controllers/ (InputAdapter, GateFSM, Predictor, TouchSynth, Bus)
tools/ (Button, Slider, Timer, etc.)
ui/ (Material Web shell, WinBox windows)
telemetry/ (store/export, golden utils)
fixtures/ (*.mp4, *.golden.jsonl)

## Immediate Steps
1. Define config/controller.json.
2. Implement TouchSynth XState chart with timers.
3. Build predictor sidecar + PREPARE/CANCEL path.
4. Create golden replay runner; establish first fixture.
5. Wire event bus to tools (Button, Knob, Slider, Timer).
6. Integrate into offline shell (Workbox precache, Material UI).

## References
- https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js?utm_source=chatgpt.com
- https://stately.ai/docs/?utm_source=chatgpt.com
- https://m3.material.io/develop/web?utm_source=chatgpt.com
- https://developer.chrome.com/docs/workbox?utm_source=chatgpt.com
- https://onnxruntime.ai/docs/tutorials/web/?utm_source=chatgpt.com
