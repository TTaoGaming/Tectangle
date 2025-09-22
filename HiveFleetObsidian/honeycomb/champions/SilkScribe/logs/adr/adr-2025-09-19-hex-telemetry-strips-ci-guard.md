# ADR | 2025-09-19T01:05:00Z | ww-2025-066

Context: Telemetry strips (sparkline, thresholds) live as ad hoc code in v7 demo; UI changes drift without architectural guard.
Decision: Adopt forward-only guard: add WEBWAY markers + HEX_TELEM_STRIPS flag today; next slice adds adapter contract and lint/test checks; migrate v7 to adapter.
Consequences: No runtime change now; documentation and CI discipline enable consistent UX and easier refactors.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-066_hex_telemetry_strips_ci_guard.md)
