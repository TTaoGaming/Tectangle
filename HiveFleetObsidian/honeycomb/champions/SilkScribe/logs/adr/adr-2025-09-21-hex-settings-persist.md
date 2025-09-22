# ADR | 2025-09-21T00:00:00Z | ww-2025-101

Context: We need reusable settings across WinBox apps with minimal coupling and browser-only persistence.

Decision: Introduce a hex Settings port (settingsService.js) with a LocalStorage adapter, wire into v2 Settings UI, and guard via HEX_SETTINGS_PERSIST. Add an e2e that verifies values persist across reload.

Consequences: More reusable for future WinBox apps; localStorage is acceptable for demos; migration path needed for schema/version bumps.

Links: [Webway note](../../../../scaffolds/webway_hex_settings_persist.md)
