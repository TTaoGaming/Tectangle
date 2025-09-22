# ADR | 2025-09-19T00:00:00Z | ww-2025-059

Context: v6 demo needs Dino P1 instance autostarted and echoing valid P1 pinches as Space; tests must verify lock + echo visually.
Decision: Add a feature-flagged autostarted iframe for Dino, attach sidecar on first P1 lock and synthesize a Space press; add a visual snapshot test with byte-size baseline.
Consequences: Clear seat mapping; ready sentinel tied to echo; low risk due to flag; enables later P2 instance without cross-contamination.
Links: [Webway note](../../../../scaffolds/webway_v6_dino_p1_autostart.md)
