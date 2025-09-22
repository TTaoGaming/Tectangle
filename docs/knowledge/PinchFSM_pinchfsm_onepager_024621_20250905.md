---
title: "PinchFSM One-Pager"
created_at: "2025-09-05T02:46:21Z"
source: "September2025/PinchFSM/docs/archive/PinchFSM_OnePager_2025-09-05T02-46-21Z.md"
author: "auto-generated"
human_verified: false
---
PinchFSM — One‑Page Plan (2025‑09‑05T02:46:21Z)
===============================================

```yaml
title: "PinchFSM — One‑Page Plan (2025‑09‑05T02:46:21Z)"
doc_type: one-pager
timestamp: 2025-09-05T02:46:21Z
tags: [PinchFSM, plan]
summary: "Robust, test‑first pinch with knuckle‑normalized metric, palm gating, hysteresis, and 2D Kalman; visual overlay and golden tests."
source_path: "September2025/PinchFSM/docs/PinchFSM_OnePager_2025-09-05T02-46-21Z.md"
```

Timestamp: 2025-09-05T02:46:21Z  
Location: September2025/PinchFSM/docs/PinchFSM_OnePager_2025-09-05T02-46-21Z.md

---

Plain‑language summary

- Test‑first index‑thumb pinch with knuckle‑span normalization, palm gating, hysteresis, 2D Kalman prediction, and specific visualization.

Highlights

- Requirements: normalize by knuckle span; palm gate; thresholds with hysteresis; anchor after hold; release on exit or gate false.
- Defaults: T_enter≈0.15, T_exit≈0.24; debounce 50 ms; hold 300 ms; latency target < 100 ms.
- Testing: golden replay dataset, unit/integration tests, telemetry counters, CI gating.
