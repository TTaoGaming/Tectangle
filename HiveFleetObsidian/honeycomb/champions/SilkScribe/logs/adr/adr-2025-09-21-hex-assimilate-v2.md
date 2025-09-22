# ADR | 2025-09-21T00:10:00Z | ww-2025-102

Context: v2 demo needs to integrate into Hex architecture without risky refactors; HUD label flicker needs mitigation.

Decision: Add a minimal Hex registry and a v2 adapter that registers the existing runtime; add a stable alignment cache to reduce cross-contamination in HUD labels.

Consequences: Enables gradual strangler adoption; small additional files; prepares for future SDK/ports.

Links: [Webway note](../../../../scaffolds/webway_hex_assimilate_v2.md)
