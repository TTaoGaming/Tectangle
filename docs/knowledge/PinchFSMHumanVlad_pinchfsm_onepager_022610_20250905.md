---
title: "PinchFSM One-Pager"
created_at: "2025-09-05T02:26:10Z"
source: "September2025/PinchFSMHumanVlad/docs/archive/PinchFSM_OnePager_2025-09-05T02-26-10Z.md"
author: "auto-generated"
human_verified: false
---
PinchFSM — One‑Page Plan
========================

```yaml
title: "PinchFSM — One‑Page Plan"
doc_type: one-pager
timestamp: 2025-09-05T02:26:10Z
tags: [PinchFSM, plan]
summary: "Minimal browser PinchFSM: thumb‑index pinch → keydown/held/keyup with hysteresis; reuse OSS; test‑first."
source_path: "September2025/PinchFSM/docs/PinchFSM_OnePager_2025-09-05T02-26-10Z.md"
```

Timestamp: 2025-09-05T02:26:10Z  
Location: September2025/PinchFSM/docs/PinchFSM_OnePager_2025-09-05T02-26-10Z.md

---

Plain‑language summary

- Build a minimal browser‑based PinchFSM that detects a single thumb+index pinch and exposes a deterministic lifecycle: keydown, held, keyup. Start small, reuse OSS, and iterate through explicit phases.

Key requirements (selected)

- Request camera; emit keydown when normalized distance < T for ≥50ms; emit held every H while maintained; keyup when ≥T for ≥50ms; optional smoothing; unit tests in CI.

Phases summary

- Phase 0: references present; agree minimal plan; scaffold separate demo.
- Phase 1: minimal demo + FSM + tests + CI; acceptance: keydown/held/keyup with thresholds; desktop+mobile.
- Phase 2–5: robustness, integration, multi‑gesture, production packaging.

Stack (minimum)

- Hand tracking: Human (primary) or MediaPipe (CDN fallback). Smoothing: One Euro/Kalman. FSM: small custom module. UI: Tailwind + Canvas. Build: Vite. Tests: Vitest/Jest; Playwright optional.
