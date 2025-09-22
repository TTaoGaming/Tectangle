# ADR | 2025-09-21T00:00:00Z | ww-2025-096

Context: v1 camera demo stabilized; need a safe path to add mapper/smoothing/dual-viz and future FSM/UI without breaking tests.
Decision: Create v2 page cloning v1 and reuse hex modules (viewport mapping, One Euro smoothing, draw). Add GestureRecognizer to reflect top label as state; introduce a smoke test that mocks camera via MP4 and asserts FPS>0 + overlay ink. Track via Webway ww-2025-096.
Consequences: Isolated iteration surface with trivial revert; slightly more files; enables fast adoption and CI guard.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-096_v2_camera_dual_viz.md)
