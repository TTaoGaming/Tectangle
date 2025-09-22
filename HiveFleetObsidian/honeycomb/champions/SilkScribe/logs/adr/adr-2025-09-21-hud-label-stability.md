# ADR | 2025-09-21T00:00:00Z | ww-2025-102

Context: HUD labels occasionally cross-contaminated when hands reorder; we added nearest-wrist alignment and a per-key cache. We need a test guard.

Decision: Expose __cam.getAlignedLabels() and add v2_hud_label_stability.test.js that runs with an idle MP4 captureStream shim to assert per-key label/handedness stability across samples.

Consequences: Small test-only surface on the dev page; fast, deterministic guard. Future work can migrate to __hex.replayLandmarks.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-102-hud-label-stability.md)
