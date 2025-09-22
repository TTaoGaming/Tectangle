# Code scan summary — 2025-09-07

Scanned 10647 files — managers: 1228, prototypes: 0, tests: 1532, golden_traces: 45, mediapipe_hits: 5128, opencv_hits: 79.

Detected phases and mapping:

- Phase‑0 (core managers): [`CameraManager.js`](September2025/Tectangle/src/CameraManager.js:1), [`LandmarkRawManager.js`](September2025/Tectangle/src/LandmarkRawManager.js:1), [`LandmarkSmoothManager.js`](September2025/Tectangle/src/LandmarkSmoothManager.js:1)

- Registry & infra: [`ManagerRegistry.js`](September2025/Tectangle/src/ManagerRegistry.js:1), [`EventBusManager.js`](September2025/Tectangle/src/EventBusManager.js:1)

Prototypes — ready vs needs work:

- Ready/demoable: [`prototype/camera-manager/index.html`](September2025/Tectangle/prototype/camera-manager/index.html:1), [`prototype/landmark-smooth/index.html`](September2025/Tectangle/prototype/landmark-smooth/index.html:1)

- Needs attention: [`KinematicClampManager.js`](September2025/Tectangle/src/KinematicClampManager.js:1) (planning/headers present)

Immediate quick wins:

1. Add per‑manager README and API snippets (e.g. [`CameraManager.js`](September2025/Tectangle/src/CameraManager.js:1)).
2. Add focused unit tests for plausibility checks (see [`KinematicClampManager.js`](September2025/Tectangle/src/KinematicClampManager.js:1)).
3. Provide a single smoke harness entrypoint that runs deterministic synthetic traces (see [`package.json`](package.json:1)).

Medium‑term tasks:

1. Refactor to hexagonal architecture: isolate ports/adapters and wire via ManagerRegistry ([`ManagerRegistry.js`](September2025/Tectangle/src/ManagerRegistry.js:1)).
2. Integrate golden traces into CI and automate golden verification (see PinchFSM scripts in [`September2025/PinchFSM/package.json`](September2025/PinchFSM/package.json:1)).
3. Formalize adapter layer for keyboard/WebMIDI/WebSocket to simplify demos and POC adapters.

Notes & risk areas:

- Media libraries: MediaPipe/Human usage in prototypes & PinchFSM (see PinchFSM package.json).
- Archive folders present (archive-*/archive-stale) — historical material included in scan.
- CI indicators: root package.json contains smoke/e2e/test scripts referencing mocha/jest/puppeteer.

Representative evidence:
- [`CameraManager.js`](September2025/Tectangle/src/CameraManager.js:1)
- [`pinchFsm.mjs`](September2025/PinchFSM/src/fsm/pinchFsm.mjs:1)
- [`prototype/landmark-smooth/index.html`](September2025/Tectangle/prototype/landmark-smooth/index.html:1)