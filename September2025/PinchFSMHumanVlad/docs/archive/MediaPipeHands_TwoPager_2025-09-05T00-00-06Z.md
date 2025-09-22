# MediaPipe Hands — Executive Two‑Pager

Timestamp: 2025-09-05T00:00:06Z
Location: `September2025/PinchFSM/docs/MediaPipeHands_TwoPager_2025-09-05T00-00-06Z.md`

---

## Page 1 — What/Why

- MediaPipe Hands (Google) provides high‑quality hand landmark detection (21 points) in web and native pipelines.
- Pros: strong accuracy, widespread adoption; Cons: packaging/runtime differences; CDN vs npm varies by setup.
- Fit: direct landmark extraction when you don’t need the full Human toolkit.

## Page 2 — How it applies here

- Use web solution (CDN) for a minimal demo or npm packages for bundling. Extract points (4,5,8,17) and apply the same FSM pipeline.
- Consider TFLite or Mediapipe Tasks for native/mobile later.
- Next step: a drop‑in demo page that logs P and events; use as fallback to Human.
