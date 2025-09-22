# ADR | 2025-09-20T00:00:00Z | ww-2025-097

Context: Need an immediately shippable demo: fullscreen gestures, simple overlay, split-screen seating, and keypress mapping to mini games.

Decision: Use MediaPipe Tasks Gesture Recognizer full-screen, overlay a canvas for explainability, and route by on-screen zones (L/R or T/B). Add optional Kalman lookahead and orientation gating behind flags.

Consequences: Faster time-to-demo; clear visuals; reversible by flags; future path to grid/polygon zones and rhythm quantizer.

Links: [Webway note](../../../../scaffolds/webway_zone-seating_fullscreen.md)
