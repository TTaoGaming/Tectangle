# ADR | 2025-09-20T00:00:00Z | ww-2025-093

Context: v7 fullscreen demo already provides Kalman controls, seat magnets, XR emu, and P1 Dino sidecar; need local multiplayer and richer telemetry with tunable smoothing.
Decision: Implement P2 sidecar and dual telemetry; add OneEuro controls under FEATURE_ONEEURO_DUAL_TELEM with guard via existing goldens/smokes.
Consequences: Visible feature behind a flag; minimal risk; future slices wire spatial zones and persistence tests.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-093_local_multiplayer_dual_telemetry_oneeuro.md)
