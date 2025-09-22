# ADR | 2025-09-20T00:00:00Z | ww-2025-094

Context: V3 offline gesture page needed a simpler, fullscreen-first view with clear intent gating and minimal visuals.
Decision: Introduce FEATURE_HAND_TRANSITIONS_V3 with per-hand Open_Palm→Closed_Fist lock and add L/R sparklines; request fullscreen via `?fs=1` or Start.
Consequences: Fewer accidental fist triggers; clearer debugging through pulses. Minimal diff and easy revert via flag.
Links: [Webway note](../../../../scaffolds/webway_gesture-v3-openlock-sparklines.md)
