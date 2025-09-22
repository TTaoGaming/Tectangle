# Vendoring MediaPipe assets

Place the following files under `vendor/mediapipe/`:

- models/hand_landmarker.task
- wasm/vision_wasm_internal.wasm
- wasm/vision_wasm_internal_simd.wasm (optional)
- wasm/vision_wasm_internal_threaded_simd.wasm (optional)

Notes

- Use exact versions from @mediapipe/tasks-vision that match this repo's package.json.
- We prefer local file:// URLs to avoid CDN drift and ensure deterministic builds.
