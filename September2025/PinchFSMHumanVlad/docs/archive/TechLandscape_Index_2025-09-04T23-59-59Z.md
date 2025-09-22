# Tech Landscape — Executive Two‑Pager Series (Index + Checklist)

Timestamp: 2025-09-04T23:59:59Z
Location: `September2025/PinchFSM/docs/TechLandscape_Index_2025-09-04T23-59-59Z.md`

Purpose

- Track short executive two‑pagers for key technologies. Page 1 = What/Why; Page 2 = How it applies here. Use this index to prioritize next steps.

Checklist (initial set)

- [x] Jest — unit testing runner, snapshots, coverage (canonical: docs/two-pagers/Jest_TwoPager_2025-09-05T00-02-05Z.md)
- [x] Mocha (+ Chai/Sinon) — flexible test framework (canonical: docs/two-pagers/Mocha_TwoPager_2025-09-05.md)
- [x] Three.js — rendering and scene graph for hand rig/overlays (canonical: docs/two-pagers/ThreeJS_TwoPager_2025-09-05.md)
- [x] @vladmandic/human — unified CV toolkit (hands/gestures) (canonical: docs/two-pagers/Human_TwoPager_2025-09-05.md)
- [x] MediaPipe Hands — direct hand landmark solution (canonical: docs/two-pagers/MediaPipeHands_TwoPager_2025-09-05.md)
- [x] Agents: Agent.md, CrewAI, LangGraph — orchestration/automation (canonical: docs/two-pagers/Agents_TwoPager_2025-09-05.md)
- [ ] Other candidates (TBD): Playwright, Vitest, WebGPU adapters, tflite‑web

Core project two‑pagers (canonical)

- [x] PinchFSM — Deterministic vNext (docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md)
- [x] Video Goldens — Replay Harness (docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md)
- [x] Rapier — Tech → Application (docs/two-pagers/Rapier_TwoPager_2025-09-05.md)
- [x] Flappy Bird P0 — Pinch→Jump (docs/two-pagers/FlappyBirdP0_TwoPager_2025-09-05T00-01-40Z.md)

Files

- Legacy originals are archived under docs/archive/*.md. Use the canonical docs/two-pagers/*.md versions above.

Prioritization (suggested)

1) Choose a test runner (Jest or Mocha) and wire tiny FSM tests.
2) Decide Human vs MediaPipe Hands for P1 (the other as fallback).
3) Three.js for overlay/rig visualization.
4) Agents stack for meta‑automation (docs, replay curation), not runtime.

Next steps

- Select the test runner and add 1–2 unit tests.
- Prototype hands pipeline choice and lock a baseline.

End.
