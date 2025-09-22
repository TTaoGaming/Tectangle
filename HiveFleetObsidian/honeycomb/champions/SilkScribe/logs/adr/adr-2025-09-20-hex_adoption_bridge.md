# ADR | 2025-09-20T18:00:00Z | ww-2025-094

Context: Hex v7/v13 stack already supplies consoles, telemetry exporters, and golden MP4 harnesses; new pinch work risks over-writing stable shells and duplicating CI if we rewrite core logic.
Decision: Treat new gesture improvements as adapters on top of the frozen shell; keep MediaPipe Tasks + existing SDK facade as the source of truth, inject clutch/lookahead/keyboard mapping via thin modules marked with WEBWAY:ww-2025-094 and guarded by existing hex:verify/hex:smoke scripts.
Consequences: Rapid adoption without regression; adapters can be reverted by flag if experiments fail; outstanding Mocha CJS issue remains isolated until addressed separately.
Links: [SRL](../srl/2025-09-20_hex_adoption_bridge.md) | [Webway](../../../scaffolds/webway_stigmergy-blackboard.md)

