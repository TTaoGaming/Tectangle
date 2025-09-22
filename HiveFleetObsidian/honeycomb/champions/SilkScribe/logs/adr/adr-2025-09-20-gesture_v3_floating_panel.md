# ADR | 2025-09-20T00:00:00Z | ww-2025-094

Context: Need a clarity-first telemetry UI for v3 with an optional hand landmark overlay while keeping v2 stable and tests green.
Decision: Implement a floating, draggable, closable panel with score/state/hands canvases; add optional HandLandmarker-based dots overlay using local model; hide legacy visuals in v3; keep exports and headless hooks.
Consequences: Better UX without touching v2; slight perf cost when overlay is enabled; add follow-up for automated visual smoke and perf budget.
Links: [Webway note](../../../../scaffolds/webway_gesture_v3_floating_panel.md)
