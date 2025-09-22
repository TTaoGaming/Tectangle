# ADR | 2025-09-21T00:00:00Z | ww-2025-129

Context: GSOS needs consistent UI without hand-coded widgets. Material Web and WinBox are already integrated via helpers and CSS.
Decision: Standardize on Material Web + WinBox; preload Material, wait briefly before mounting, use dynamic panel imports with stigmergy inline fallbacks. Add WEBWAY markers to document the reversible path.
Consequences: Cards guard remains green; UI consistency improves; future panels can replace stubs with zero break risk.
Links: [Webway note](../../../../scaffolds/webway_gsos_material_winbox_standard.md)
