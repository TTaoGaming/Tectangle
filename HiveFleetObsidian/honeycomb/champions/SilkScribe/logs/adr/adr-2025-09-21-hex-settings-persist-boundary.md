# ADR | 2025-09-21T00:00:00Z | ww-2025-101

Context: depcruise reported `no-import-app` where adapter imported app/featureFlags.
Decision: Invert dependency; inject a `flag` function into `createLocalStorageSettingsAdapter` with fallback, removing the app-layer import.
Consequences: Hex boundary lint passes; adapter remains reusable; calling code may optionally pass app flag util.
Links: [Webway note](../../../../scaffolds/webway_hex_settings_persist.md)
