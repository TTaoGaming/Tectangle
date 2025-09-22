<!--
STIGMERGY SUMMARY HEADER
Source: archive-august-3-2025-physics-cleanup/
Generated: 2025-09-18T02:20Z
-->

# Archive (Aug 3 2025 Physics Cleanup) Summary

## Core Components
- `archive-clean-hand-tracking/` – production-ready MediaPipe + Three.js baseline with status panels, FPS metrics, and error recovery.
- `archive-hand-tracking-system/` – modularized pipeline (DependencyLoader, HandTrackingModule, Visualization3D, KeyboardBridge, UI) with Jest infrastructure, manifests, and offline asset loaders.
- `foundation/` – legacy game loop (118k LOC) plus `audioManager`, `SpeechManager`, and step1 physics playground preserved for reference.

## Key Learnings
1. **Offline Dependency Loader** – JSON manifest + progress reporting (docs/dependency-loader-guide.md) enables CDN-free operation, version checks, caching, and EventBus notifications; ideal template for Hex offline bundles.
2. **Testing Upgrade** – Test report confirms full migration to Jest + JSDOM with module mocks (MediaPipe, Three.js, DOM). All eight core modules are "READY FOR TESTING" with snapshot coverage instructions.
3. **Clean Hand Tracking Baseline** – Minimal app (`app.js`) demonstrates best practices: coordinate transforms, layered status UI, event hooks, and configuration block for hand tracking tuning.
4. **Physics Playground Artifacts** – `step1-physics-basic-test.html` and `hand-track-3d-pinch-keyboard/` provide Oimo physics integration checkpoints, pinch-triggered key mapping, and reproducible cleanup tests.
5. **Automation Scripts** – `download-mediapipe-files.js` and dependency loader utilities ensure consistent offline setup; include CLI instructions for future field deployments.

## Action Hooks
- Promote DependencyLoader manifest to Hex asset-loading ADR; reuse progress events for telemetry dashboards.
- Port Jest + JSDOM setup into Hex monorepo to standardize browser-side testing.
- Use Clean Hand Tracking configuration defaults as baseline for Hex skeleton visualizer; keep FPS/status UI as template.
- Extract pinch-to-keyboard mappings from `hand-track-3d-pinch-keyboard` for integration tests in pinch stability module.

## Follow-On Tasks
- Map dependency manifest entries into `offline-dependencies/` strategy ADR.
- Evaluate `foundation/game.js` sections worth distilling (audio manager, speech overlays) before archiving permanently.
- Run `test-comprehensive.js` to capture baseline metrics once running in active dev environment.
