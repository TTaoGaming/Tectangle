# ADR | 2025-09-21T00:00:00Z | ww-2025-112

Context: UX prefers "cards" naming over "panels" for GSOS windows; we use WinBox windows and Material content. Need minimal code changes and reversibility.

Decision: Introduce FEATURE_GSOS_CARDS_NAMING flag and helper labels to render titles as "Card: \<Name\>" instead of "Hex: \<Name\>". Keep APIs stable and make it reversible by toggling the flag.

Consequences: No breaking change; tests unchanged (data-testids remain). Designers can flip naming without code migrations; future docs favor "cards" nomenclature.

Links: [Webway note](../../../../scaffolds/webway_gsos-cards.md)
