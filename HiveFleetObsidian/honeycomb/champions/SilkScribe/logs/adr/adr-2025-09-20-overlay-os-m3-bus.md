# ADR | 2025-09-20T00:00:00Z | ww-2025-094

Context: Need M3-aligned UI and a professional-grade gating path to reduce false triggers while enabling modular windowed apps.
Decision: Adopt Material 3 tokens for Overlay OS and use BroadcastChannel as the intra-page bus. Add a clutch FSM with primed/armed gating and tests. Provide a synthetic two-hand feed until recognizer is wired.
Consequences: Clean, accessible UI; repeatable CI via unit+smoke; easy to revert by removing src/overlay and scripts.
Links: [Webway note](../../../../scaffolds/webway_overlay_os_m3_bus.md)
