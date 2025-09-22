GPT‑5 Tectangle — Gesture Input Platform One‑Pager
=================================================

```yaml
title: "GPT‑5 Tectangle — Gesture Input Platform One‑Pager"
doc_type: one-pager
timestamp: 2025-09-04T23:30:00Z
tags: [platform, pinchfsm]
summary: "Blueprint combining PinchFSM architecture and Human docs to ship reliable pinch input now and evolve toward medical‑grade use."
source_path: "September2025/PinchFSM/docs/GPT5_Tectangle_OnePager_2025-09-04T23-30-00Z.md"
```

Timestamp: 2025-09-04T23:30:00Z  
Location: September2025/PinchFSM/docs/GPT5_Tectangle_OnePager_2025-09-04T23-30-00Z.md

---

Purpose & goals

- Ship low‑latency, reliable pinch → game actions with Human; add palm gating, hysteresis, knuckle‑normalization, smoothing/prediction, optional TOI and quantization.

Deterministic metric & thresholds

- Indices 4/8/5/17; P = D/K; T_enter≈0.15, T_exit≈0.24; debounce ≥50 ms; anchor hold 300 ms.

Testing & workflows

- Golden replay, unit tests, CI gates, telemetry; phased roadmap from game MVP to medical‑ready.
