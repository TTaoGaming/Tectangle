# Two‑Pager Checklist — Tech + Next Actions

Timestamp: 2025-09-05T00:00:20Z
Location: `September2025/PinchFSM/docs/TwoPager_Checklist_2025-09-05T00-00-20Z.md`

Purpose

- Index all executive two‑pagers we’ve created, list concrete next actions, and propose additional tech papers to complete the landscape.

Existing two‑pagers (summary + next actions)

1) PinchFSM — Core Plan (`PinchFSM_TwoPager_2025-09-04T23-45-00Z.md`)
   - Summary: 4‑state FSM, palm gating, knuckle normalization, smoothing, quantization options.
   - Next: choose test runner; wire minimal demo; finalize thresholds; add unit tests.

2) PinchFSM — Deterministic vNext (`PinchFSM_TwoPager_2025-09-04T23-59-30Z.md`)
   - Summary: deterministic behavior, Strike/Lift velocities, configs, tiny contract.
   - Next: select Option A/B/C for P0 harness + viz.

3) PinchFSM — Video Goldens (`PinchFSM_TwoPager_VideoGoldens_2025-09-04T23-58-00Z.md`)
   - Summary: video→traces→offline runner; CI replay and PASS/FAIL gates.
   - Next: lock traces for two seed MP4s; author golden JSON; implement comparator.

4) Rapier — Tech→Application (`Rapier_TwoPager_2025-09-04T23-59-55Z.md`)
   - Summary: physics engine, joints, CCD/TOI; hybrid with FSM; hand rig plan.
   - Next: P0 physics spike with kinematic wrist/thumb/index; contact events.

5) Three.js (`ThreeJS_TwoPager_2025-09-04T23-59-56Z.md`)
   - Summary: rendering/scene graph; overlays and rigs.
   - Next: small scene scaffold + overlay lines/ticks.

6) Jest (`Jest_TwoPager_2025-09-04T23-59-58Z.md`)
   - Summary: batteries‑included runner.
   - Next: add 3 FSM tests (enter/held/lift) and coverage.

7) Mocha (`Mocha_TwoPager_2025-09-04T23-59-57Z.md`)
   - Summary: flexible minimal test stack.
   - Next: decide Jest vs Mocha; implement single happy‑path FSM test.

8) Human (`Human_TwoPager_2025-09-05T00-00-05Z.md`)
   - Summary: unified CV toolkit for hands.
   - Next: minimal hand loop; log P; pick backend; pin model versions.

9) MediaPipe Hands (`MediaPipeHands_TwoPager_2025-09-05T00-00-06Z.md`)
   - Summary: direct hand landmarks.
   - Next: fallback demo; evaluate perf vs Human.

10) Agents (Agent.md, CrewAI, LangGraph) (`Agents_TwoPager_2025-09-05T00-00-07Z.md`)
    - Summary: meta‑automation for docs, goldens, CI helpers (not runtime).
    - Next: draft Agent.md for Replay Manager; prototype LangGraph flow to run replay + emit report.

New two‑pagers to add (suggested)

- Piano Genie (Magenta) — ML model for piano‑like mapping; evaluate latency and determinism.
- Magenta/Project Magenta — broader ML music tools; rule‑based vs ML trade‑offs.
- 4‑Pad Drum Starter — basic sampler + gesture mapping (deterministic), no ML.
- WebMIDI + SoundFont — simple sound pipeline for Strike/Lift testing.
- tflite‑web or MediaPipe Tasks — native/mobile path and offline models.
- Playwright — E2E + video capture for golden masters.
- Vitest — alternative to Jest/Mocha with Vite integration.

Feature ideas to capture

- Wrist→middle‑knuckle orientation bins → keymaps (up/left/right/down); 4×4 per hand grids.
- Per‑hand persistent IDs (Joy‑Con‑style pairing): controllerId + hand = stable identity; persisted.
- Controller 1: palm‑toward + index pinch‑and‑hold → anchor; then radial menu or 2D joystick (touchscreen emulator) to drag/release. Later phase.
- Anchor flow + gesture modes behind feature flags; keep P0 single pinch reliable first.
- Deterministic baseline: always gate merges via the video golden replay job.

Immediate priorities (recommended)

1) Choose Jest vs Mocha; add 3 FSM unit tests.  
2) Approve Option A/B/C for P0 replay harness.  
3) Implement minimal Human loop and compute P with logs (no UI polish yet).  
4) Write two‑pagers for Piano Genie + 4‑Pad Drum Starter to clarify music path.

End.
