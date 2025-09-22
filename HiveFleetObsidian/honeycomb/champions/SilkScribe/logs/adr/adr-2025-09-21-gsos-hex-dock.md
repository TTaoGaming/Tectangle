# ADR | 2025-09-21T00:00:00Z | ww-2025-128

Context: GSOS dock currently linear; user wants hexagonal layout. Must remain reversible and guarded by a flag. Avoid overlapping legacy bars and keep CI guards green.
Decision: Add FEATURE_GSOS_HEX_DOCK (default ON) and implement hex dock using CSS clip-path with staggered rows; fallback to existing rectangular dock when disabled. Promote card metadata for glyph/title centralization.
Consequences: Minimal CSS/JS; no new deps; improved UX. Future work: keyboard navigation, order persistence, snapshot updates if visual guard expands.
Links: [Webway note](../../../../scaffolds/webway_hexagonal_dock_gsos.md)
