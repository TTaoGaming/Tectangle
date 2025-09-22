<!--
STIGMERGY SUMMARY HEADER
Source: offline-dependencies/
Generated: 2025-09-18T03:50Z
-->

# Offline Dependencies Summary

- Contains the full MediaPipe Hands bundle (hands.js/binarypb, packed assets, wasm variants, full/lite TFLite models) plus Three.js builds and supplementary physics libs (`oimo.min.js`, `cannon.min.js`, `fullik.min.js`).
- Includes `mediapipe-master/` mirror, `piano-genie-clone/`, and vendor assets referenced by MVP and physics cleanup demos.
- Houses documentation such as `modular-blueprint.md` detailing dependency strategies.

**Action Hooks**
1. Use this folder with `mvp/dependency-checker.html` to validate offline readiness before shipping Hex builds.
2. When moving the hub, ensure path consistency so scripts relying on `/offline-dependencies/` continue working.
