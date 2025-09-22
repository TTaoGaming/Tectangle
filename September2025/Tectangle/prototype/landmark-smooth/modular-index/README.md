Modular Index — Landmark smoothing demo (prototype)

Overview
- Minimal browser-native demo that:
  - Starts/stops camera
  - Runs MediaPipe Hands to produce 21 landmarks per hand
  - Applies per-landmark One-Euro smoothing
  - Assigns stable controller IDs via wrist-based kinematic clamp
  - Computes palm-facing gating
  - Detects simple index-finger "press" (orientation-gated) and toggles an in-page "A" key

Files created
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/index.html`
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/src/camera-manager.js`
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/src/media-pipeline.js`
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/src/smoothing-manager.js`
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/src/kinematic-clamp.js`
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/src/palm-gating.js`
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/src/fingertip-filter.js`
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/src/gesture-mapper.js`
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/docs/keyboard-bridge-protocol.md`
- `September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md`

Quick start
1. Serve the folder with a static server (example using Python):
   - Open a terminal in this directory (the folder that contains this README) and run:
     python -m http.server 8000
2. Open http://localhost:8000/index.html in a modern browser (Chrome/Edge recommended).
3. Click "Start" and allow camera permission.

What to look for
- The page shows two canvases: left = raw landmarks, right = One‑Euro smoothed landmarks.
- The in-page "A" key (in the top controls) will highlight while an index-finger press is detected.
- A debug overlay on the smoothed canvas displays controller IDs and a palm-facing marker.
- Key events are logged to the browser console as objects (keydown / keyup) for quick inspection.

Notes
- MediaPipe libraries are loaded from CDN; an internet connection is required when first loading.
- This is a prototype demonstration only — no native keyboard bridge server is implemented here.
- The smoothing logic is implemented in `src/smoothing-manager.js` and is based on a One‑Euro filter.

Development
- Code is organized as plain ES modules under `src/`. Files are intentionally small and documented for replacement.
- TODO: Integrate improved predictive models (KaIman) and optionally add a WebSocket keyboard bridge.

Confirmations
- Only the files listed above were created under `modular-index/`.
- No files outside `modular-index/` were modified.

End.