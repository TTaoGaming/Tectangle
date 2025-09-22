PinchFSM — Deterministic vNext
==============================

```yaml
title: "PinchFSM — Deterministic vNext"
doc_type: two-pager
timestamp: 2025-09-05T00:00:00Z
tags: [PinchFSM, determinism, FSM, OneEuro, TOI, quantization]
summary: "Deterministic pinch detection with hysteresis, palm gating, look‑ahead TOI, and CI replay on stored landmark traces."
source_path: "September2025/PinchFSM/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md"
```

Timestamp: 2025-09-05T00:00:00Z  
Location: September2025/PinchFSM/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md

---

Page 1 — What we ship and how it feels
--------------------------------------

- Purpose: reliable, low‑latency thumb–index pinch mapped to Strike/Lift with deterministic behavior.
- Success metrics: false‑trigger ≤ 5%; perceived latency ≤ ~60 ms (pipeline ≤ 100 ms).
- Core loop: indices (4,8,5,17); P = D/K; palm gate; hysteresis (0.15/0.24); debounce 50 ms; anchorHold 300 ms.
- FSM: Open → Possible → Pinch → Anchored; Any → Open on exit/gate false.

Prediction & smoothing

- One Euro presets; optional 2D CV Kalman; TOI to bias Strike earlier; quantization (Strike only) with humanize=0 in CI.

Outputs & config

- Emit Strike/Lift (+ velocity from |dP/dt|); adapters: Keyboard/WebMIDI; wrist → keybank (flagged).
- Config: controllerId, hand, knuckleSpanCm, cameraProfile, thresholds, filters, quantization.

Page 2 — Deterministic testing & next steps
-------------------------------------------

- Goldens + traces; timing from frame index/fps; fixed seeds.
- Replay harness: VideoManager, LandmarkProducer, PinchFSMRunner, Comparator/Reporter.
- Ground truth: local min near approach→recede; Lift on T_exit.
- JSON schemas: landmarks/events/config subset.
- Phases: P0 lock traces; P1 viz + CI; P2 robustness.
- Risks: model variance, unstable K, latency perception → mitigations listed.
