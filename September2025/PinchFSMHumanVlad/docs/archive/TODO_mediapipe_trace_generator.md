PinchFSM — MediaPipe Trace Generator (TODO)
==========================================

Metadata
--------

- title: PinchFSM — MediaPipe trace generator
- doc_type: TODO report
- timestamp: 2025-09-05T00:28:00Z
- tags: [mediapipe, tasks-vision, hand-landmarker, wasm, ffmpeg, traces]
- scope: Use MediaPipe Hand Landmarker to produce deterministic landmark traces from MP4s; Node JS path preferred, Python fallback if Node is blocked.

Summary
-------

- Yes, we can use MediaPipe. The Replay/PinchFSM pipeline is input-agnostic. Swap LandmarkProducer from Human→MediaPipe while keeping the same timestamp policy and JSON schemas.

Two implementation paths
------------------------

Option A — JS (Node) using MediaPipe Tasks Vision (WASM)

- Package: `@mediapipe/tasks-vision` (HandLandmarker).
- Decode: ffmpeg → image2pipe (MJPEG) → pipe2jpeg → JPEG buffer.
- Canvas: `canvas` (node-canvas) to create `ImageData`/`Canvas` for the Tasks API.
- Init HandLandmarker with local model files (.tflite) and WASM binaries; set `baseOptions.modelAssetPath` and `wasmBasePath` to local file URLs for reproducibility.
- Call `detectForVideo(image, tMs)` per frame using canonical tMs = round((frameIndex/fps)*1000).
- Extract 21-point landmarks (same indices as MP Hands) and serialize to the existing Landmarks JSON schema.

Notes & risks (JS):

- Node support for Tasks-vision uses WASM and assumes DOM/canvas-like APIs; use node-canvas to polyfill image/canvas types.
- Ensure the correct WASM files for the version are locally available; pin package version and record in meta.
- If Tasks requires `HTMLImageElement`/`VideoFrame` types, convert JPEG → RGBA tensor → ImageData via `canvas`.

Option B — Python using MediaPipe Solutions/Tasks

- Packages: `mediapipe` (solutions) or `mediapipe-tasks` (preferred modern Tasks).
- Read frames with OpenCV (`cv2.VideoCapture`), compute canonical tMs = round((frameIndex/fps)*1000).
- Run HandLandmarker or Hands solution per frame; dump JSON per the schema and write sidecar meta with environment details.
- Pros: less friction; well-trodden examples. Cons: extra runtime dependency; CI needs Python.

Deterministic invariants (shared)
---------------------------------

- Timestamp policy: tMs = round((frameIndex / fps) * 1000); never use realtime clocks.
- Fixed fps: prefer container fps; if uncertain, force via ffmpeg `-vf fps=N` and record that in meta.
- No runtime smoothing for traces; hand-only; consistent resize handled by ffmpeg.
- Vendor models and WASM locally; pin versions in lockfiles and meta.

MediaPipe config (JS Tasks)
---------------------------

- HandLandmarker options:
  - numHands: 1
  - minHandDetectionConfidence: 0.6 (tune later)
  - minHandPresenceConfidence: 0.6
  - minTrackingConfidence: 0.6
  - runningMode: "VIDEO"
  - baseOptions: { modelAssetPath: "file:///.../hand_landmarker.task", delegate: "CPU" }
  - wasmBasePath: file:///.../tasks-vision/wasm/
- Keep any gesture/classifier heads off unless needed; stick to landmarks.

Output mapping
--------------

- Landmarks: 21 points with normalized x,y,z in image coordinates (MP standard): indices 4 (thumb_tip), 8 (index_tip), 5 (index_mcp), 17 (pinky_mcp).
- Convert to schema: points: [{ id, x, y, z?, score? }]. Include per-hand score if available.

Artifacts
---------

- `data/goldens/VIDEO_NAME.landmarks.json` — per-frame entries.
- `data/goldens/VIDEO_NAME.meta.json` — { mediapipe version, model name/checksum, wasm info, ffmpeg args, fps, width, height, frameCount, timestampPolicy, config snapshot }.

Skeleton plan (JS Node)
-----------------------

1) Dependencies: `@mediapipe/tasks-vision`, `canvas`, `pipe2jpeg`, `ffmpeg` on PATH.
2) Vendor model + wasm locally; set file:// paths. Pin package version.
3) Initialize HandLandmarker with runningMode: VIDEO.
4) Spawn ffmpeg to emit MJPEG at stable fps; pipe to pipe2jpeg.
5) For each JPEG:
   - Decode to RGBA via node-canvas → ImageData
   - Compute `tMs` from frameIndex/fps
   - `handLandmarker.detectForVideo(image, tMs)`
   - Serialize first hand landmarks; append to trace
6) On end: write landmarks.json + meta.json.

Skeleton plan (Python)
----------------------

1) Dependencies: `mediapipe`/`mediapipe-tasks`, `opencv-python`.
2) OpenCV read; read fps, width, height; loop frames.
3) For each frame: convert to RGB, detect, collect landmarks, tMs, frameIndex.
4) Write landmarks.json + meta.json.

Validation checklist
--------------------

- Model and wasm resolved from local file paths.
- Reported fps matches tMs math; frameCount consistent.
- Landmarks index/units verified (normalized coordinates in [0,1]).
- Meta includes exact package versions and model checksum.

Open TODOs
----------

- Decide which path (JS vs Python) to implement first.
- Pin `@mediapipe/tasks-vision` version and stash model/wasm locally.
- Implement generator CLI similar to Human path, reusing timestamp policy & schemas.
- Add tiny regression test to validate schema and P computation.
