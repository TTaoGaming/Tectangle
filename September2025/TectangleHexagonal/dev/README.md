<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Launch the associated prototype and capture findings
- [ ] Ensure onboarding guidance is still accurate
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Dev Prototypes Index

Hands-on pages under `dev/` are harnesses for experiments, visualizations, or integration spikes. This inventory captures what each page does today, highlights obvious breakage or duplication, and calls out the next action before we promote anything to canon.

Note: Until migrated to Material tokens, add `<!-- LEGACY_UI: to migrate to M3 tokens -->` at the top of each page. Canon page: `demo_fullscreen_sdk_v4_material.html`.

## Inventory and Actions

| Prototype | Focus | Notes | Recommended Action |
| --- | --- | --- | --- |
| `index.html` | Pinch Piano main dev shell | Wires `src/app/main.js` with video upload, telemetry, golden hooks. | **Keep** � treat as baseline harness when promoting to canonical app.
| `hand_id_lab.html` | Direct MediaPipe -> tracker visualizer | Reads `window.__lastHands`, but the port exports `__hexLastHands`, so tracker overlay silently drops to raw landmarks. | **Fix** seam to use the correct global (or call `createHandTrackerT1` once and reuse the shared seam).
| `hand_tracker_t1_lab.html` | Tracker overlay via embedded pinch app | Works against `__hexLastHands`; largely overlaps the canned prototype. | **Merge** with `canned_hand_id_test_prototype.html` and keep only one tracker lab.
| `canned_hand_id_test_prototype.html` | Tracker stats + continuity bars | Superset of the T1 lab; used by the calibration sidecar. | **Keep** as canonical tracker harness; fold any unique bits from `hand_tracker_t1_lab` here.
| `hand_calibrate_sidecar.html` | U1 mapping via pinch-hold | Depends on the canned tracker lab, custom pinch metric in page. | **Keep**, but backfill TODOs to surface mapping through the real adapter and persist calibration.
| `controller_router_lab.html` | Seat lock verification (P1/P2) | Exercises `ControllerRouter`; already used by lock-in scripts. | **Keep** and tighten telemetry (surface `handId` once events carry it).
| `fingertip_sphere.html` | Fingertip sphere scaled by palm width | Self-contained visualization with automation hook. | **Keep**.
| `ghost_hysteresis.html` | Ghost vs actual hysteresis tube | Drives lookahead telemetry, exposes counters for automation. | **Keep**, ensure it shares thresholds with the core before canon promotion.
| `ghost_predictive_pinch_dino.html` | Ghost hysteresis driving Dino game | Wraps `ghost_hysteresis` in an iframe and injects Space. | **Review** after ghost flow hardens � may supersede `pinch_dino.html`.
| `pinch_dino.html` | Baseline Pinch->Dino bridge | Simpler bridge without ghost lookahead. | **Decide** whether to keep alongside ghost variant or collapse into one page.
| `pinch_flappy.html` | Pinch->Flappy bridge | Mirrors Dino page but targets `vendor/flappy`. | **Keep** if Flappy remains our two-player demo; otherwise archive with Dino decision.
| `predictive_tube_demo.html` | Physics lookahead tubes | Standalone physics lookahead UI with recording support. | **Keep**, but align config naming with main core before promotion.
| `lab_rings.html` | Animated floating rings | Pure renderer demo; no hand input. | **Optional** � keep for visual polish prototyping or move to `/vendor` if not part of core story.
| `ring_index_demo.html` | Hex lattice ring driven by hand | Uses MediaPipe to render index finger ring. | **Keep**; could evolve into HUD module tests.
| `toi_demo.html` | TOI predicted vs actual visual | Uses `createPinchCore` directly for timing experiments. | **Keep**, but ensure metrics match the golden harness once TOI offsets land.

> **Note:** The tracker labs appear twice in git history. Keeping only one canonical page will simplify docs, tests, and calibration flows.

## Immediate Clean-Up Checklist
- Update `hand_id_lab.html` to read `window.__hexLastHands` (or import the tracker) so the HUD reflects real tracker output.
- Merge `hand_tracker_t1_lab.html` into `canned_hand_id_test_prototype.html` (or vice versa) and delete the redundant file after porting any missing UI pieces.
- Decide whether both Dino bridges are necessary once ghost pinch becomes default; if not, retire the redundant iframe.
- Confirm each arcade bridge (`pinch_flappy.html`, `pinch_dino.html`, `ghost_predictive_pinch_dino.html`) still works in CI by pointing `run_video_collect_golden.js` at the same MP4 inputs.

## Path to �Canon�
1. Pick the harnesses we trust (likely `index.html`, `controller_router_lab.html`, tracker lab, `ghost_hysteresis.html`, `toi_demo.html`).
2. Fix the seams above so they share the same tracker IDs, telemetry hooks, and feature flags.
3. Promote those harnesses into CI (smoke + golden replays), then archive or vendor the rest of the experiments.
