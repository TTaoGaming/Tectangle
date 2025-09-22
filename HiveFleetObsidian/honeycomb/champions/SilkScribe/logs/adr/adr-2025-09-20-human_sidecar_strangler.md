# ADR | 2025-09-20T00:00:00Z | ww-2025-093

Context: We want to adopt Human features while retaining MediaPipe core via hex ports/adapters.
Decision: Introduce HEX_HUMAN_SIDECAR: load Human in sidecar; emit event taps for reliable gestures; no core API changes.
Consequences: Quick value for demos; incremental migration possible; CPU budget to monitor.
Links: [Webway note](../../../../scaffolds/webway_human-sidecar-strangler.md)
