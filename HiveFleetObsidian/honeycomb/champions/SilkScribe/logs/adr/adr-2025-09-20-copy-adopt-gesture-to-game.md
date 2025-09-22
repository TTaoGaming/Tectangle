# ADR | 2025-09-20T00:00:00Z | ww-2025-092

Context: We want a fast, reversible path to control existing HTML5 games with camera gestures, minimizing custom glue.

Decision: Adopt a baseline postMessage → KeyboardEvent bridge behind HEX_INPUT_BRIDGE; extend with pointer/touch adapters later. Track latency and correctness via existing smokes and overlay verify.

Consequences: Quick demos without porting games; same-origin and focus constraints apply. Reversible via flag; low dependency footprint.

Links: [Webway note](../../../../scaffolds/webway_copy_adopt_gesture_to_game.md)
