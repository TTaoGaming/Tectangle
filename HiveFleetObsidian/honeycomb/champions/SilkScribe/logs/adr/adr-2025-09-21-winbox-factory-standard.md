# ADR | 2025-09-21T00:00:00Z | ww-2025-131

Context: Visual inconsistency across windows (real vs stub) and between apps.

Decision: Introduce a WinBox factory with a shared theme and enforce via an e2e consistency test.

Consequences: Uniform look/behavior; small test cost; future theming can be added via injection.

Links: [Webway note](../../../../scaffolds/webway_winbox_factory_standard.md)
