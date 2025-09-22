PinchFSM — Video Golden Masters (Replay Harness)
===============================================

```yaml
title: "PinchFSM — Video Golden Masters (Replay Harness)"
doc_type: two-pager
timestamp: 2025-09-05T00:05:00Z
tags: [testing, determinism, goldens, replay, CI]
summary: "Replace webcam flakiness with offline, locked landmark traces from MP4s; replay PinchFSM deterministically and gate CI."
source_path: "September2025/PinchFSM/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md"
```

Timestamp: 2025-09-05T00:05:00Z  
Location: September2025/PinchFSM/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md

---

Page 1 — Why and success
------------------------

- Purpose: determinism via stored traces; regressions blocked by PASS/FAIL.
- Metrics: median |Δt| ≤ 40 ms (Strike), p90 ≤ 100 ms; FP ≤ 5% on gated clips.
- Seed videos: camera‑facing pinch (1 Strike/Lift), palm‑gated (0 Strikes).

Core artifacts

- data/goldens/VIDEO_NAME.landmarks.json — per‑frame landmarks
- data/goldens/VIDEO_NAME.golden_times.json — locked Strike/Lift
- artifacts/VIDEO_NAME.overlay.mp4 — visual diff
- reports/VIDEO_NAME.comparison.json — metrics

Deterministic invariants

- Use stored traces; time from frame index and fps; pinned model/filter versions; humanizeMs=0.

Page 2 — Architecture and steps
-------------------------------

Architecture

- VideoManager → canonical timestamps
- LandmarkProducer → one‑time trace generation
- PinchFSMRunner → deterministic FSM on traces
- Comparator/Reporter → metrics + overlay

Steps

1) Extract frames + timestamps; generate traces for 2 seed MP4s.
2) Auto‑annotate candidate strikes (approach→min→recede); quick human verify; lock goldens.
3) Implement FSM runner + comparator; emit reports/overlays.
4) Add CI job with thresholds and PASS/FAIL.

Risks → mitigations

- Model variance → lock traces.
- Small K → clamp, require palmGate, drop low‑confidence.
- Perceived latency → TOI look‑ahead; quantization off in CI.

End.
