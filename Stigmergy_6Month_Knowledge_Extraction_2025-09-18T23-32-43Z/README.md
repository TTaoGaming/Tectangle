<!--
STIGMERGY REVIEW HEADER
Status: First Pass Complete
Review started: 2025-09-17T08-32-43Z
Completed: 2025-09-18
Expires: 2025-09-24T08-32-43Z (auto-expire after 7 days)

Checklist:
- [ ] Update after each extraction loop
- [ ] Keep Plan/Manifest/Boards in sync
- [ ] Link new artifacts discovered during mining
-->

# Stigmergy 6-Month Knowledge Extraction Hub

Use this folder as the launch pad before touching legacy code or creating new Hex modules. Everything here points you to the latest plans, the mined knowledge, and the safety rails that keep pinch-to-dino work steady.

## Live Entry Point
- Review the current slice in [Plan.md](Plan.md) and confirm the objective for the session.
- Check source coverage in [import_manifest.md](import_manifest.md) so you know which archives fuel today's work.
- Jump to the subsystem blackboards (`blackboards/`) to extend findings while you code.
- Skim the newest SRL rollup in `rollups/` if you need a quick refresher on recent decisions.

## Essential Artifacts at a Glance
- **Runbook**: `Plan.md` (SRL loop, agreements, immediate TODOs).
- **Source Index**: `import_manifest.md` + `knowledge_summaries/` (per-root takeaways).
- **Working Memory**: `blackboards/` (`pinch_stability.md`, `telemetry_sync.md`, `anchor_interaction.md`, `expression_systems.md`).
- **Metrics & History**: `metrics/` outputs, `rollups/` daily/weekly/monthly SRL, and ADR stubs in `docs/adr/`.

## Lessons Ready to Apply Now
1. **Pinch -> Dino Jump Baseline**  
   - Pinch contract (`pinch_start/end/hold`, normalized distance, 1.0 minCutoff, beta 0, SLERP ~0.6) captured in [knowledge_summaries/august-tectangle-sprint-summary.md](knowledge_summaries/august-tectangle-sprint-summary.md).  
   - Wire those thresholds into `September2025/TectangleHexagonal/src/core/pinchCore.js` and verify with `September2025/TectangleHexagonal/tests/e2e/v5_dino_sidecar_smoke.test.js` before tuning new gestures.
2. **Offline + Telemetry Discipline**  
   - Dependency loader + progress hooks described in [knowledge_summaries/archive-august-3-2025-physics-cleanup-summary.md](knowledge_summaries/archive-august-3-2025-physics-cleanup-summary.md) and the MVP dependency checker ([knowledge_summaries/mvp-root-summary.md](knowledge_summaries/mvp-root-summary.md)).  
   - Reuse these patterns when packaging `September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html` so jump latency tests run without CDN surprises.
3. **Testing Harness Pull-Forward**  
   - Phase 1 Jest/JSDOM + golden master setup in [knowledge_summaries/tags-ai-optimized-summary.md](knowledge_summaries/tags-ai-optimized-summary.md) pairs well with our existing Puppeteer e2e suite.  
   - Lift the scripted flows into the Hex repo to keep pinch regressions deterministic.

## Common Pitfalls + CI Guards
- **Threshold drift**: lock pinch FSM values via unit (`September2025/TectangleHexagonal/tests/unit/pinchRecognition.fsm.red.test.mjs`) and e2e (`tests/e2e/v3_kalman_sidecar_dino.test.js`, `September2025/TectangleHexagonal/tests/e2e/v5_dino_sidecar_smoke.test.js`) tests. Add Jest snapshots for normalized distance buckets before merging.
- **Offline asset rot**: run the dependency checker before CI (`tests/smoke/run_v5_dino_p1_only.js`) and fail builds if any MediaPipe bundle is missing. Mirror loader manifests from the physics cleanup archive into `tests/smoke/verify_v10_boot.mjs` style checks.
- **Runaway refactors**: every significant change should create or update an ADR (see outstanding items in `Spatial Anchor Root Extraction Checklist.md`). Block PRs that touch hub paths without updating the relevant checklist.
- **Flaky Puppeteer flows**: stabilize with the retry harness from TAGS Phase 1 (see the scripts referenced in [knowledge_summaries/tags-ai-optimized-summary.md](knowledge_summaries/tags-ai-optimized-summary.md)). Configure `jest-puppeteer.config.cjs` to honor those retries when sidecar launch takes longer than 3s.

## Refresh Metrics & Rollups
```bash
python scripts/generate_rollup.py --git
python scripts/generate_rollup.py --root ..\September2025\TectangleHexagonal
```
Run the first command daily to update `metrics/` and `rollups/archive_overview.md`; use the second when analysing a different root snapshot.

## Update Cadence
- Touch this README whenever lesson priorities shift or new CI guards land.
- After each extraction loop: update the relevant blackboard, manifest row, and rollup entry.
- Before a release branch: confirm the pitfall list matches live CI checks and record any deltas in `TODO_today.md`.

Stay disciplined - plan the slice, extract with tests, log the knowledge, reflect, repeat.




