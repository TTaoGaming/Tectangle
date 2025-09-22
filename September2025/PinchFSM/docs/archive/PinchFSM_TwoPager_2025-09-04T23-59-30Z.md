# PinchFSM — Two‑Pager (Deterministic vNext)

Timestamp: 2025-09-04T23:59:30Z  
Location: `September2025/PinchFSM/docs/PinchFSM_TwoPager_2025-09-04T23-59-30Z.md`

---

## Page 1 — Complete one‑pager (what we ship and how it feels)

Purpose

- Deliver a reliable, low‑latency thumb–index pinch mapped to Strike/Lift velocities for games and music, with deterministic behavior and clear guardrails to avoid regressions.

Success metrics

- False‑trigger rate ≤ 5% in normal use; perceived latency ≤ ~60 ms (pipeline ≤ 100 ms).
- Deterministic FSM transitions with reproducible outputs under fixed inputs.

Core loop (minimal, precise)

- Landmarks: use Human/MediaPipe indices — thumb_tip=4, index_tip=8, index_mcp=5, pinky_mcp=17.
- Normalize: K = dist(5,17), D = dist(4,8), P = D/K. Compute dP/dt per frame.
- Palm gate: require palm‑facing‑camera using wrist/index_mcp/pinky_mcp plane (3D normal or 2D heuristic). Gate must be true to enter/maintain pinch.
- Hysteresis thresholds (defaults, configurable): T_enter=0.15, T_exit=0.24, debounce=50 ms, anchorHold=300 ms.
- FSM (Open → Possible → Pinch → Anchored):
  - Open→Possible when P < T_enter and palmGate true (start debounce / prediction window).
  - Possible→Pinch emit Strike when debounce passes or TOI predicts impact within window.
  - Pinch→Anchored when held ≥ anchorHold (optional continuous control state).
  - Any→Open when P > T_exit or palmGate false; emit Lift.

Predictive timing and smoothing (deterministic)

- Apply One Euro filter (presets: fast/normal/conservative) to landmarks and/or P. Optionally use a tiny 2D constant‑velocity Kalman for fingertip look‑ahead (1 frame).
- TOI (time‑of‑impact): bias Strike earlier on smooth approach so perceived timing matches physical touch.
- Musical quantization (optional for Strike scheduling only): bpm, grid (1/32→1/2), quantStrength (0–100%), swing (0–100%), humanizeMs (0–20), snapWindowMs. Keep humanize=0 in CI for determinism.

Outputs and mapping (Day‑1)

- Emit events: Strike (noteOn) with velocity from |dP/dt| near entry; Lift (noteOff) with velocity from |dP/dt| near exit.
- Adapters: Keyboard events for games; WebMIDI for music. Continuous MPE dims off by default (future).
- Optional: Wrist orientation bins (yaw/pitch) → keybank selection (feature‑flagged).

Controls & config (low cognitive load)

- controllerId, hand (L/R), knuckleSpanCm (optional calibration).
- cameraProfile: backend (WebGL/WebGPU/WASM), resolution, fps.
- thresholds: T_enter, T_exit, debounceMs, anchorHoldMs, heldIntervalMs.
- filters: OneEuro preset or advanced {minCutoff, beta}; Kalman on/off.
- quantization: {enabled, bpm, grid, quantStrength, swing, humanizeMs, snapWindowMs}.

Tiny contract (for implementers)

- Inputs: per‑frame hand landmarks (x,y[,z]), frame index/time, config.
- Outputs: ordered event list [{tMs, type: Strike|Lift, velocity, confidence}] and UI state.
- Error modes: no hand detected, low confidence, palmGate false, unstable K; system must not emit Strike.
- Success criteria: produces the expected events and timings under locked traces (see Page 2) and passes CI replay thresholds.

Acceptance (Phase‑1)

- Emits Strike/Lift with stable hysteresis and palm gating; optional Anchored after hold.
- Minimal overlay: index↔thumb line with green/red ticks (T_enter/T_exit) and predicted‑tip ray; PASS/FAIL indicator when in replay mode.

---

## Page 2 — Deterministic testing, schemas, and near‑term steps

Why determinism (video goldens + traces)

- Webcam tests are flaky; instead, produce and lock per‑frame landmark traces from short MP4s and run all logic offline against those traces. Fix model versions and filter params used to create traces.

Deterministic invariants

- Use stored traces as canonical CI input; do not re‑infer landmarks during CI.
- Derive timing from frame index and fps (no wall clock). Pin all model/filter versions.
- humanizeMs=0 and fixed seeds where applicable; identical inputs → identical outputs.

Replay harness architecture (offline)

- VideoManager → canonical frame timestamps.
- LandmarkProducer → one‑time model run to create data/goldens/VIDEO_NAME.landmarks.json.
- PinchFSMRunner → consumes traces + config; emits events JSON.
- Comparator/Reporter → compares to locked goldens, computes timing error and FP/FN, renders optional overlay video and PASS/FAIL.

Ground‑truth impact definition (Strike)

- P_t = D/K over time; t* is the frame where dP/dt flips sign (approach→recede) and local min depth exceeds thresholds (to ignore micro‑noise). Lift is when P crosses T_exit or dP/dt sustained away.

Minimal JSON schemas (concise)

- Landmarks trace
  - [{ frame: number, tMs: number, hand: "L"|"R", points: [{ id: number, x: number, y: number, z?: number }] }]
- Events
  - [{ tMs: number, type: "Strike"|"Lift", velocity: number, confidence: number }]
- Config (subset)
  - { thresholds: { T_enter: number, T_exit: number, debounceMs: number },
  filters: { oneEuro: { preset?: string, minCutoff?: number, beta?: number }, kalman?: { enabled: boolean } },
      quant?: { enabled: boolean, bpm: number, grid: string, quantStrength: number, swing: number, humanizeMs: number, snapWindowMs: number } }

Phases (near term)

- P0 — Lock traces & goldens: generate landmarks JSONs for two seed MP4s; agree golden Strike/Lift times; wire offline PinchFSMRunner and Comparator; produce report.
- P1 — Minimal viz + CI: Tailwind overlay (ticks, ray, timeline), PASS/FAIL summary; add replay job to CI with thresholds (median abs error ≤ 40 ms, p90 ≤ 100 ms, FP ≤ 5%).
- P2 — Robustness: triply‑gated pinch (ratio + velocity + joint‑angle), multi‑hand overlap filter, telemetry counters.

Options to approve now

1) Option A — P0 replay harness only (fastest deterministic core).  
2) Option B — P0 + minimal Tailwind overlay/timeline (reviewable).  
3) Option C — P0 + viz + quantized Strike outputs (raw + quantized timelines).

Risks & mitigations

- Model variance → lock traces; re‑generate only on explicit update PRs.
- Scale normalization instability (K small) → clamp K, require palmGate true, drop low‑confidence frames.
- Latency perception → TOI look‑ahead and optional Strike quantization (opt‑in; disabled in CI).

End.
