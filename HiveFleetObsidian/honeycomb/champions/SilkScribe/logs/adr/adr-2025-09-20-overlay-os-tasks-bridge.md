# ADR | 2025-09-20T00:00:00Z | ww-2025-095

Context: Overlay OS already has a BroadcastChannel bus and synthetic two-hand feed; MediaPipe offline v3 demo shows recognizer and landmarker working with local models.
Decision: Add a feature-flagged publisher that loads GestureRecognizer (+optional HandLandmarker) and publishes overlay:landmarks and overlay:fsm. Keep synthetic feed default for CI determinism.
Consequences: Real data integration is one toggle away; small runtime cost for Tasks init when enabled. Hand Viz now colors by handedness and shades by gesture label.
Links: [Webway note](../../../../scaffolds/webway_overlay_os_tasks_bridge.md)
