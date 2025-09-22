PinchFSM — Deterministic vNext
==============================

Metadata
--------

- title: PinchFSM — Deterministic vNext
- doc_type: two-pager
- timestamp: 2025-09-05T00:00:00Z
- tags: [PinchFSM, determinism, FSM, OneEuro, TOI, quantization]
- summary: Deterministic pinch detection with hysteresis, palm gating, look-ahead TOI, and CI replay on stored landmark traces.

Page 1 — What we ship and how it feels
--------------------------------------

Purpose

- Reliable, low-latency thumb–index pinch mapped to Strike/Lift velocities, with deterministic behavior and guardrails to avoid regressions.

Success metrics

- False-trigger ≤ 5%; perceived latency ≤ ~60 ms (pipeline ≤ 100 ms).
- Deterministic FSM transitions and outputs under fixed inputs.

Core loop (precise and minimal)

- Landmarks: thumb_tip=4, index_tip=8, index_mcp=5, pinky_mcp=17.
- Normalize: K = dist(5,17), D = dist(4,8), P = D/K. Compute dP/dt per frame.
- Palm gate: require palm-facing-camera via wrist/index_mcp/pinky_mcp plane.
- Hysteresis (defaults): T_enter=0.15, T_exit=0.24, debounce=50 ms, anchorHold=300 ms.
- FSM (Open → Possible → Pinch → Anchored):
  - Open→Possible when P < T_enter and palmGate true (start debounce/prediction window).
  - Possible→Pinch emit Strike when debounce passes or TOI predicts impact within window.
  - Pinch→Anchored when held ≥ anchorHold (optional continuous control).
  - Any→Open when P > T_exit or palmGate false; emit Lift.

Prediction and smoothing (deterministic)

- One Euro presets; optional tiny 2D constant-velocity Kalman (≈ 1 frame look-ahead).
- TOI: bias Strike earlier on smooth approach to match touch perception.
- Quantization (optional Strike scheduling only): bpm, grid, quantStrength, swing, humanizeMs; humanize=0 in CI.

Outputs and mapping (Day‑1)

- Emit Strike/Lift with velocity from |dP/dt| near entry/exit.
- Adapters: Keyboard (games), WebMIDI (music). Wrist orientation bins → keybank (feature-flagged).

Controls & config (small)

- controllerId, hand (L/R), knuckleSpanCm (optional calibration).
- cameraProfile: backend, resolution, fps.
- thresholds: T_enter, T_exit, debounceMs, anchorHoldMs, heldIntervalMs.
- filters: OneEuro preset or {minCutoff, beta}; Kalman on/off.
- quantization: {enabled, bpm, grid, quantStrength, swing, humanizeMs, snapWindowMs}.

Tiny contract

- Inputs: per-frame landmarks (x,y[,z]), frame index/time, config.
- Outputs: [{tMs, type: Strike|Lift, velocity, confidence}] and UI state.
- Error modes: no hand/low confidence/palmGate false/unstable K → must not emit Strike.

Acceptance (Phase‑1)

- Stable hysteresis + palm gating; optional Anchored after hold.
- Minimal overlay: index↔thumb line, green/red ticks (T_enter/T_exit), predicted-tip ray; PASS/FAIL in replay mode.

Page 2 — Deterministic testing and next steps
--------------------------------------------

Why determinism (video goldens + traces)

- Webcam tests are flaky. Produce and lock per-frame landmark traces from short MP4s; run all logic offline against those traces. Pin model/filter versions.

Deterministic invariants

- Stored traces as canonical CI input; timing from frame index/fps; fixed seeds; humanizeMs=0.

Replay harness (offline)

- VideoManager → canonical timestamps.
- LandmarkProducer → data/goldens/VIDEO_NAME.landmarks.json.
- PinchFSMRunner → consumes traces+config; emits events JSON.
- Comparator/Reporter → compares to goldens; metrics and overlay PASS/FAIL.

Ground-truth Strike

- P_t = D/K; t* at dP/dt sign flip (approach→recede) and local min depth above thresholds.
- Lift when P crosses T_exit or sustained recede.

JSON schemas (concise)

- Landmarks: [{ frame, tMs, hand: "L"|"R", points: [{ id, x, y, z? }] }]
- Events: [{ tMs, type: "Strike"|"Lift", velocity, confidence }]
- Config subset: thresholds, filters (OneEuro/Kalman), quant (disabled in CI)

Phases (near term)

- P0 — Lock traces & goldens for two seed MP4s; wire PinchFSMRunner + Comparator; report.
- P1 — Minimal viz + CI job and thresholds (median ≤ 40 ms, p90 ≤ 100 ms, FP ≤ 5%).
- P2 — Robustness: triply-gated pinch, multi-hand filter, telemetry.

Risks & mitigations

- Model variance → lock traces.
- Unstable K (small) → clamp, require palmGate, drop low-confidence frames.
- Latency perception → TOI look-ahead; optional quantization (off in CI).

End.
