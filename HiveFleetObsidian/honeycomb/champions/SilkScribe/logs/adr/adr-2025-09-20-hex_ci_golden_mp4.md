# ADR | 2025-09-20T00:00:00Z | ww-2025-092

Context: Hex architecture and golden MP4 are core priorities; we need deterministic, reversible CI.
Decision: Adopt tiered CI—PR runs hex:tier:commit; nightly runs full hex:goldens and visual snapshots. Add HEX_CI_STRICT to force full suite in PR when needed.
Consequences: Faster PR feedback with a strict-mode escape hatch; nightly surfaces visual regressions.
Links: [Webway note](../../../../scaffolds/webway_hex-ci-golden-mp4.md)
