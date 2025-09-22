# ADR | 2025-09-20T00:00:00Z | ww-2025-091

Context: We need a reversible, flagged path to control games (e.g., Dino) from gestures without changing core. V13 exposes shell.onEvent with pinch events; a Dino sidecar iframe is scaffolded.
Decision: Implement a HEX_INPUT_BRIDGE postMessage channel from shell.onEvent pinch to same-origin iframe translating to Space keydown/keyup. Keep off by default; enable via URL flag. Preserve idle golden (no locks, no pinch) guard.
Consequences: Fast demo and validation; limited to key-based games initially. Next steps: add pointer/touch adapter mapping fingertip to pointer events with hysteresis/persistence.
Links: [Webway note](../../../../scaffolds/webway_gesture-touch-emulation.md)
