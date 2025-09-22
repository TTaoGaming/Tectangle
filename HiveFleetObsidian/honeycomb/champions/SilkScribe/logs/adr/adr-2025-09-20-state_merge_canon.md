# ADR | 2025-09-20T00:00:00Z | ww-2025-096

Context: Multiple sources (landmarks, labels, predictions, quantizer) must become one canonical stream per seat for reliability and iframe delivery.

Decision: Create a state merge adapter that normalizes timestamps, preserves provenance, and reconciles SelectPred→Select, emitting WebXR-style phases.

Consequences: Clear debugging via src fields; robust ordering; reversible via flag; small, testable surface.

Links: [Webway note](../../../../scaffolds/webway_state-merge-canon.md)
