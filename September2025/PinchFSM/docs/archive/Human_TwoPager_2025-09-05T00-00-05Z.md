# @vladmandic/human — Executive Two‑Pager

Timestamp: 2025-09-05T00:00:05Z
Location: `September2025/PinchFSM/docs/Human_TwoPager_2025-09-05T00-00-05Z.md`

---

## Page 1 — What/Why

- Human is a JS/TS computer‑vision toolkit (hands, face, pose, gestures) with browser/Node backends; dynamic model loading; unified API.
- Pros: single config, many models, demos; MIT license. Cons: perf varies by backend/device; some gesture rules may need tuning.
- Fit: fast prototyping of hands/landmarks; browser‑friendly.

## Page 2 — How it applies here

- Enable hands (and optional gestures). Use `human.video(...)` and read `human.result.hands`.
- Compute P = dist(4,8)/dist(5,17); palm gating; hysteresis; One Euro/Kalman; optional TOI.
- Outputs: Strike/Lift + optional WebMIDI; replay traces for CI; pin model versions.
- Next step: minimal config + loop that logs P and events.
