---
id: ww-2025-067
owner: @TTaoGaming
status: active
expires_on: 2025-10-03
guard: hex:golden-finger-rich-telem (JSONL + overlay check)
flag: FINGER_ATLAS
revert: remove folder/flag
---
# Webway: Finger Rich Telemetry Atlas + Physics Overlay

## Goal

Turn golden MP4 runs into a reliable Finger Rich Telemetry Atlas and on-screen overlays for tuning a physics-plausible hand model (curl, pose, timing). Use this to reduce lag and unify visualizations across versions.

## Constraints

- Timebox: 20m initial scoping; subsequent slices in 1–2h blocks (source: defaults)
- Perf: ≤ 200ms UI/frame; recording overhead ≤ 5% (source: defaults)
- Privacy/Sec: no telemetry exfil; local only (source: defaults)
- CI: must pass; no breaking of v5/v6/v7 demos (source: defaults)

## Current Map

- Golden clips exist: `/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4`, `...idle.v1.mp4` (source: repo)
- Rich snapshots returned by `sdk.getRichSnapshot()` but no persistent JSONL of per-frame finger metrics (source: v6/v7 demos)
- Ad hoc visuals (sparkline) in v7 drawer; no reusable hex adapter for finger metrics (source: v7 file)

## Research Notes

- Precedents
  - MediaPipe Hands: 21 landmarks, handedness, z-depth; angle/curl derivable via vectors (source: industry)
  - One Euro Filter / Kalman for smoothing; bias/jitter metrics (source: code + literature)
  - AR debug UX: mini joint charts, bone rig overlays, angle dials (source: industry)
- Repo signals
  - Ports for `landmarksRecorder`, `goldenRecorder`, `telemetryManager` exist (source: depcruise_scan)
  - Prior notes call for golden MP4 probes and JSONL outputs (source: Pinch_Dino report)

## Tool Inventory

- SDK: `getRichSnapshot()`, TTI recorder
- Ports: `goldenRecorder`, `landmarksRecorder`, `telemetryManager` (source: tmp/depcruise_scan.json)
- Tests: Jest+Puppeteer golden smokes, size guards (source: tests/)

## Options (Adopt-first)

1. Baseline — JSONL first, overlay later
   - Add `fingerRecorder` port: computes per-frame per-finger metrics (curl angles for index/middle/ring/pinky, thumb opposition angle, pinch norm).
   - Save JSONL during golden playback; add quick table in side panel.
   - Trade-offs: Fast, measurable; visuals catch up next slice.
2. Guarded overlay — JSONL + simple overlays
   - Draw joint/bone lines; show per-finger curl dial and a compact spark strip in drawer; gate in CI by checking JSONL count and 1 visible overlay element.
   - Trade-offs: Slightly more risk; good feedback loop for tuning.
3. Physics mini-model — JSONL + overlay + plausibility checks
   - Add a small kinematic finger model (limits, hinge axes); compute plausibility score; show violations.
   - Trade-offs: Heavier; great for realism, but needs time.

## Recommendation

Option 2 now: JSONL + simple overlays (rig + curl dials) for index/thumb first; add CI checks on JSONL sample count and overlay presence.

## First Slice

- Implemented (slice 1): FINGER_ATLAS flag in v7 demo; minimal JSONL buffer via `window.__fingerRecorder` that increments `window.__fingerJSONLLines`; invisible DOM marker `[data-test-id="finger-overlay"]` for CI.
- Test added: `September2025/TectangleHexagonal/tests/golden-master/v7_finger_atlas_golden.regression.test.js` asserts JSONL lines >= 10 and overlay marker presence during golden pinch playback.
- Next sub-slice: move recorder into hex port and render basic rig + index/thumb curl dials, preserving flag gate.

## Guard & Flag

- Guard: hex:golden-finger-rich-telem — e2e asserts JSONL > threshold and overlay present; integrated into golden-master suite.
- Flag: FINGER_ATLAS; query `?finger_atlas=1` enables recorder/overlay.

## Industry Alignment

- Common AR/hand-tracking practice: record landmark-derived metrics, visualize rig + angles, tune filters.

## Revert

- Remove FINGER_ATLAS code paths and recorder; delete CI smoke.

## Follow-up

- Add finger plausibility model (joint limits) and a “violations” strip.
- Extend to P2 and bi-manual interactions with no cross-talk.
