# ADR | 2025-09-20T00:00:00Z | ww-2025-095

Context: Need local multiplayer where one camera drives gestures to multiple same-page iframes with minimal latency and predictable targeting.

Decision: Introduce a small iframe gesture bus using BroadcastChannel (same-origin) with optional postMessage fallback. Use MediaPipe Tasks Gesture Recognizer for labels and Kalman lookahead for SelectPred.

Consequences: Simple fan-out; measurable latency improvement with lead_ms; reversible via flags; aligns with existing Kalman and seating.

Links: [Webway note](../../../../scaffolds/webway_gesture-iframe-multiplayer.md)
