# PinchFSM — Two‑Pager (Video Golden Masters — Timestamped)

Timestamp: 2025-09-04T23:58:00Z  
Location: [`September2025/PinchFSM/docs/PinchFSM_TwoPager_VideoGoldens_2025-09-04T23-58-00Z.md`](September2025/PinchFSM/docs/PinchFSM_TwoPager_VideoGoldens_2025-09-04T23-58-00Z.md:1)  
MCP tools used: sequential thinking

---

## Page 1 — Executive summary (video‑first)


Purpose

- Replace fragile manual webcam testing with deterministic offline golden masters derived from short video clips. Use those goldens to validate the PinchFSM logic layer (timing, gating, hysteresis, quantization) and prevent regressions.

Success metrics (for golden test harness)

- Deterministic replay: identical events on repeated runs.
- Timing error: median absolute Strike time error ≤ 40 ms (initial target), 90th percentile ≤ 100 ms.
- False positives ≤ 5% on gated clips.
- Reproducible artifact outputs: locked landmark trace JSONs, locked golden timestamps JSONs, and overlay videos/reports.

Golden input files (seed set)

- [right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch.mp4](right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch.mp4:1) — expected: one detectable Strike/Lift.
- [right hand palm oriented to my left index and thumb pinch should be GATED.mp4](right hand palm oriented to my left index and thumb pinch should be GATED.mp4:1) — expected: no Strike (gated).

Why video first

- Video frames + stored per‑frame landmark traces are fully replayable and avoid model/non‑determinism at test time.
- Video annotations define ground‑truth impact timestamps using a physical event (index fingertip approach → pause/minimum → recede) rather than a subjective UI action.

Impact timestamp (ground‑truth) definition)

- P_t = normalized pinch distance = dist(index_tip, thumb_tip) / knuckleSpan (index_mcp & pinky_mcp).
- Impact (Strike) time t\* is the frame where:
  - dP/dt changes from negative (approach) to positive (recede), AND
  - P_t\* is a local minimum, AND
  - prior approach speed and local minimum depth exceed configurable thresholds to avoid micro‑noise.
- Lift can be defined as the frame where dP/dt or P crosses the exit threshold (configurable).

Core deterministic harness (offline)

- VideoManager: read video → deterministic frame timestamps.
- LandmarkProducer: run landmark model once and store per‑frame landmarks JSON (recommended) to ensure determinism.
- AnnotationManager: run auto‑detect impact candidates on the stored traces and emit candidate timestamp JSON for quick human verification.
- PinchFSMRunner: deterministic offline FSM that consumes the same traces & smoothing parameters and emits events (Strike/Lift, Anchored).
- Comparator/Reporter: compare FSM events to locked goldens, compute metrics (timing errors, FP/FN), and render overlay videos with ground‑truth vs predicted markers.
- CI integration: replay locked traces and fail if thresholds breached.

Deterministic invariants (must enforce)

- Use stored landmark traces as the canonical test input (avoid re-running the detection model during CI unless determinism can be guaranteed).
- Use frame index → ms mapping using the video fps (do not rely on system clocks).
- Pin third‑party model versions and smoothing params used to produce traces.

Controls & config (small, human‑friendly)

- controllerId, hand (L/R), knuckleSpanCm.
- cameraProfile: [backend, resolution, fps].
- filterPreset: OneEuro presets (fast/normal/conservative) + advanced params.
- hysteresis: T_enter/T_exit slider; timing {debounceMs, anchorHoldMs, heldIntervalMs}.
- detection thresholds: approachSpeedThreshold, minDepthPx (or normalized), pauseFrames.
- quantization block (opt‑in): bpm, grid, quantStrength, swing, humanizeMs, snapWindowMs.

Phase‑1 acceptance (video harness)

- Locked landmark trace JSONs for both seed videos.
- Locked golden timestamps JSONs (Strike/Lift) for each video, with verification metadata (author/time).
- Deterministic PinchFSMRunner that consumes traces and outputs event JSONs.
- Comparator report showing metrics for the seed set, plus an overlay video for visual verification.

Outputs (test harness)

- data/goldens/VIDEO_NAME.landmarks.json (frame → landmarks)
- data/goldens/VIDEO_NAME.golden_times.json (locked Strike/Lift times)
- artifacts/VIDEO_NAME.overlay.mp4 (visual overlay with ground truth and predicted markers)
- reports/VIDEO_NAME.comparison.json (metrics & summary)

---

## Page 2 — Notes, sequential plan, and options


Near‑term prioritized steps (sequential thinking)

1. Extract frames + frame timestamps from both seed videos and store canonical metadata.
2. Run a specific landmark model once for each video, store per‑frame landmark traces (frame index, timestamp, landmarks).
3. Auto‑annotate candidate impact timestamps on traces using the approach→pause→recede rule.
4. Manual quick‑verify script/UI: present candidate timestamps overlaid on video frames for confirmation; lock golden timestamps.
5. Implement deterministic offline PinchFSMRunner that consumes the locked traces and emits events using the same smoothing/hysteresis config.
6. Run comparator to produce metrics and overlay videos; if thresholds fail, iterate on detection tuning.
7. Add locked traces + metrics to CI; run nightly/PR checks to catch regressions.

Annotation algorithm (high level)

- Smooth P_t with One Euro or small median window (same smoothing used by FSM).
- Compute dP/dt (frame‑to‑frame).
- Candidate t* where dP/dt crosses negative→positive and P_t* is local minimum.
- Verify approach magnitude and pause/minimum depth; if passes, mark t*.
- Allow manual override for edge cases; store verification metadata.

Testing strategy & regression prevention)

- Commit locked landmark traces and golden timestamps to repo (data/goldens/). Treat them as first‑class test fixtures.
- CI job: deterministic replay of landmarks → PinchFSMRunner → comparator assertion.
- Nightly regression replays with extended golden set later.
- For UI/visual wiring, keep a minimal Tailwind playback page that reads the trace JSONs and overlays landmarks and FSM state for reviewers (UI can be iterative later).

Manager architecture (reminder)

- Keep Manager interface deterministic: init(config) → start() → stop() → getState() → on(event).
- Key managers for this plan: VideoManager, LandmarkManager (trace producer), AnnotationManager, PinchFSMManager, ComparatorManager, UIManager (lightweight playback).

Phases (video‑first mapping)

- P0: Stabilize test harness — frames, stored landmarks, auto‑annotate, manual verify.
- P1: Game‑ready logic on stored traces — deterministic Strike/Lift, look‑ahead, wrist keybank mapping.
- P2: Robustness — triply‑gated detection, multi‑hand overlap, dead zones, telemetry.
- P3+: SDK/API, offline PWA, medical readiness as before.

Three options reinterpreted (video‑first)
1) Minimal+ (fastest): produce traces + locked goldens + basic PinchFSMRunner + UI playback for verification.
2) Detection‑First: focus on stronger gating in the annotation and PinchFSMRunner before building UI.
3) UI‑First: build a lightweight Tailwind playback + overlay that lets you visually inspect noisy Mediapipe data while traces/logic layer are developed.

Acceptance for the two seed videos)
- Video A (camera‑facing pinch): 1 locked Strike time; PinchFSMRunner prediction within median ≤ 40 ms.
- Video B (palm‑oriented gated): 0 Strikes; PinchFSMRunner predicts 0 events.

Developer notes (sequential thinking + MCP)
- Lock model versions and smoothing params in the golden trace metadata.
- Keep goldens small and focused (short clips) to make CI fast.
- Store both raw frame metadata and landmark traces so a future re‑run of landmark extraction can be validated against committed traces.

Next actions (pick one)
- A: I will prepare the first set of locked traces and golden timestamps for both videos (data/goldens/...). (fastest regression protection)
- B: I will produce a spec + Tailwind UI wireframe and the minimal playback HTML that reads locked traces (no code beyond playback).
- C: I will implement the deterministic PinchFSMRunner and comparator that runs against stored traces (code).

End of file content.
