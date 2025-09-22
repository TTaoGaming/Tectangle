# Adapters-Only Offline Tool Virtualization Stack

## Goal
Build a fully offline PWA that turns hand gestures into virtual tools and mini-games by composing existing boxes; minimal custom code, research-grade logging.

## Adapters Path
- **InputAdapter**: MediaPipe Tasks-Vision (GestureRecognizer / HandLandmarker) → {label, score, landmarks} stream.
- **GateAdapter**: XState clutch (Open → Primed → Armed → Fired → Cooldown) with K-frame debounce + hysteresis.
- **BindingAdapter**: JSON config maps gestures to tool actions (button, switch, knob, timer).
- **UIAdapter**: Material Design 3 components + WinBox windows over the camera feed.
- **TelemetryAdapter**: log XState transitions + landmarks to JSONL (IndexedDB, export button).
- **PWAAdapter**: Workbox precaches app shell + .task model + WASM for true offline.

## Recommended Libraries
- MediaPipe Tasks-Vision (local WASM/*.task).
- XState (or Robot3 if size is critical).
- Material Web (M3) + WinBox.js for floating tool panels.
- Workbox for service worker precaching.
- Optional: ONNX Runtime Web (WebGPU) when custom detectors are needed.

## Constraints & Defaults
- Camera 480p@30; skip every other frame on slow devices.
- Keep WASM/model paths stable for MediaPipe loaders.
- Dim preview / throttle FPS when thermals rise.
- Everything on-device; logs export only on user action.

## Quick Start (Weekend)
1. Scaffold PWA shell with Workbox; verify offline mode.
2. Wrap GestureRecognizer into InputAdapter.
3. Drop XState clutch; expose thresholds via settings window.
4. Define tools via JSON bindings; each tool is a WinBox template.
5. Add telemetry adapter + download button.
6. Test airplane-mode workflow end-to-end.

## References
- https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer/web_js?utm_source=chatgpt.com
- https://stately.ai/docs/?utm_source=chatgpt.com
- https://m3.material.io/develop/web?utm_source=chatgpt.com
- https://developer.chrome.com/docs/workbox?utm_source=chatgpt.com
- https://onnxruntime.ai/docs/tutorials/web/?utm_source=chatgpt.com
