# ADR | 2025-09-19T00:00:00Z | ww-2025-083

Context: We want quick demos mapping hand gestures to game inputs on phones. We already emit XR-like select; need pre-trained gestures and a simple adapter.

Decision: Adopt MediaPipe Tasks Gesture Recognizer for basic gestures mapped to keyboard events; keep XR emu; add VRM retarget next. Guard behind FEATURE_GESTURE_TASKS_BRIDGE.

Consequences: Faster demo path, less custom glue. Small deps, reversible via flag.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-083_adoptable_gesture_to_game.md)
