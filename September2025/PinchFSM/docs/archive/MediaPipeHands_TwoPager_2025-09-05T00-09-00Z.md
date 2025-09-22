MediaPipe Hands — Executive Two‑Pager
====================================

```yaml
title: "MediaPipe Hands — Executive Two‑Pager"
doc_type: two-pager
timestamp: 2025-09-05T00:09:00Z
tags: [MediaPipe, hands, landmarks]
summary: "Direct landmark solution for web/native pipelines; use when Human’s broader stack isn’t required."
source_path: "September2025/PinchFSM/docs/two-pagers/MediaPipeHands_TwoPager_2025-09-05.md"
```

Timestamp: 2025-09-05T00:09:00Z  
Location: September2025/PinchFSM/docs/two-pagers/MediaPipeHands_TwoPager_2025-09-05.md

---

Page 1 — What/Why
-----------------

- High‑quality hand landmark detection (21 points) in web and native.
- Pros: strong accuracy and adoption.
- Cons: packaging/runtime differences; CDN vs npm varies by setup.

Page 2 — How it applies here
----------------------------

- Use web solution (CDN) for minimal demo or npm packages for bundling.
- Extract points (4,5,8,17) and apply the same FSM pipeline.
- Consider TFLite or Mediapipe Tasks for native/mobile later.
- Next step: drop‑in demo page that logs P and events; treat as fallback to Human.
