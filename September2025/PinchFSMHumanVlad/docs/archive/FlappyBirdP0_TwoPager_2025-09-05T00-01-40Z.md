Flappy Bird P0 — Two‑Pager
==========================

```yaml
title: "Flappy Bird P0 — Deterministic Pinch → Jump"
doc_type: two-pager
timestamp: 2025-09-05T00:01:40Z
tags: [pinchfsm, video-goldens, rapier, threejs, human]
summary: "One‑button Flappy demo driven by deterministic pinch events from video‑golden traces; include Rapier for TOI prediction; avoid regressions via replay harness."
source_path: "September2025/PinchFSM/docs/two-pagers/FlappyBirdP0_TwoPager_2025-09-05T00-01-40Z.md"
```

Timestamp: 2025-09-05T00:01:40Z  
Location: September2025/PinchFSM/docs/two-pagers/FlappyBirdP0_TwoPager_2025-09-05T00-01-40Z.md

---

Page 1 — What/Why
------------------

- Goal: Ship a deterministic P0: 1‑button pinch (thumb→index) maps to Flappy “jump”. No webcam/manual testing; rely on video‑golden traces and offline replay.
- Why: Prevent regressions and rewrites by locking landmark traces and expected event timelines; make Strike timing feel right using TOI prediction and low‑lag smoothing.
- Scope (day‑0):
  - Inputs: two seed MP4s → per‑frame landmark traces (locked JSON).
  - Logic: PinchFSM with palm gating, knuckle normalization P = dist(4,8)/dist(5,17), hysteresis (T_enter/T_exit), debounce, optional TOI look‑ahead.
  - Rapier: tiny world for TOI between fingertip “shape casts” to predict contact; use as a bias for Strike timing.
  - Output: event JSON [{tMs, Strike|Lift, velocity}] + PASS/FAIL comparator; optional micro‑Flappy loop (DOM canvas) consuming these events.
- Success metrics:
  - Video A: 1 Strike within median abs error ≤ 40 ms from golden; Video B (gated): 0 Strikes.
  - Replay determinism: identical outputs for identical traces.

Page 2 — How it applies here (steps that fit today)
---------------------------------------------------

- Inputs & traces
  - Use your video‑goldens plan: extract fps/frameIndex → tMs; run Human once to generate traces; commit data/goldens/*.landmarks.json.
  - Lock metadata (model version, filter params) in a sidecar.
- PinchFSM core
  - Normalize: K = dist(5,17); P = dist(4,8)/K. Hysteresis: T_enter≈0.15, T_exit≈0.24; debounce≥50 ms; anchorHold later.
  - Palm gate: computed from wrist/index_mcp/pinky_mcp plane or heuristic; gate must be true for entry/maintain.
  - Velocity: dP/dt for Strike/Lift velocity.
- Smoothing + TOI
  - One Euro on P (and/or landmarks); minimal 2D Kalman optional.
  - Rapier: create two kinematic spheres for tips; compute motion vectors; use cast/ray to get TOI; if TOI < one frame, bias Strike to predicted contact for near‑zero perceived latency.
- Comparator + PASS/FAIL
  - Compare emitted events vs golden timestamps; metrics: median/p90 timing error, FP/FN counts.
  - Artifacts: overlay PNG/MP4 optional; JSON report required.
- Minimal Flappy stub (optional today)
  - A simple canvas bird that jumps on Strike and falls under gravity; ignore Lift for now; use fixed timestep loop; event queue consumes replay output.
- Acceptance (P0)
  - Data: two locked traces + golden times committed.
  - Logic: PinchFSMRunner + Rapier TOI bias emits stable events that pass thresholds.
  - Report: JSON PASS/FAIL with metrics; optional overlay.
- Next steps
  - Add on‑device webcam path later; expand to joystick/radial menu after P0 is stable.
