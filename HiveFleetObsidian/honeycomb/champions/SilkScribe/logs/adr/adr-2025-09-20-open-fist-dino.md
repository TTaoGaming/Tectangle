# ADR | 2025-09-20T04:50:00Z | ww-2025-084

Context: We need a quick, tryable demo that maps an obvious gesture to a game input on commodity webcams without new dependencies.
Decision: Keep a minimal heuristic (thumb–pinky span vs wrist-center ratio with hysteresis) to trigger Space for Dino; mark with WEBWAY and add a plan to introduce a smoke test.
Consequences: Fast to ship and demo; potential false positives under extreme poses; clear path to upgrade to MediaPipe Tasks recognizer. No new deps; easy revert.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-084_open_fist_dino.md)
