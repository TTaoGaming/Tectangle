# ADR | 2025-09-20T00:00:00Z | ww-2025-069

Context: We require persistent hand presence (P1) even during brief occlusions to avoid UX flicker. The seat magnet manager already stores anchors and inertial ghosts.

Decision: Adopt overlay ghost rendering using manager.getGhost with friction; add test-only nodets toggle and ghostSeats probe to enable e2e verification under flags.

Consequences: No runtime dep changes; behavior gated via seatmag flags; tests can assert persistence without flaky DOM heuristics.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-069_ghost_persistence_e2e.md)
