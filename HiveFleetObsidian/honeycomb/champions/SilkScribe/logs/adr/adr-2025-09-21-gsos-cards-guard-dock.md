# ADR | 2025-09-21T00:00:00Z | ww-2025-130

Context: Cards guard saw zero cards due to late `__gso.getCards` exposure after async preload.
Decision: Harden the e2e guard to wait for a non-empty registry and assert dock clicks open WinBox windows (skip camera when hidden).
Consequences: More robust CI; slight test duration increase; option to later expose an earlier hook remains.
Links: [Webway note](../../../../scaffolds/webway_gsos_cards_guard_dock.md)
