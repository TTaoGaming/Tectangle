# ADR | 2025-09-20T00:00:00Z | ww-2025-094

Context: We have MediaPipe Tasks (@mediapipe/tasks-vision) already, Material-like demo shells, and Hex SDK v7 bus. Multiple engines (Phaser/PlayCanvas) are candidates. XState is referenced but not installed. We need to ship fast by adopting, not inventing.

Decision: Adopt MediaPipe Tasks Gesture Recognizer and add only small adapters: InputAdapter (stream wrapper), GateFSM (tiny clutch), UIAdapter (Material shell toggles). Behind FEATURE_ADOPT_BRIDGE_V1. Provide a demo page v8; keep engines as optional consumers (sample Phaser adapter later). Guard with existing hex:tier:commit and SDK smokes.

Consequences: Faster delivery with reversible slice; minimal code surface; clear revert by removing adapters and flag. Future: can swap GateFSM for XState and add model tests without changing the external bus.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-094_adopt_adapt_sdk_adapters.md)
