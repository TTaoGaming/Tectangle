# ADR | 2025-09-21T00:00:00Z | ww-2025-116

Context: GSOS aims to expose hex modules for live editing in the UI. Static ESM context, no bundler by default, WinBox Cards, e2e smokes and screenshots are in place.

Decision: Adopt a lightweight import-map override approach (es-module-shims) to enable hot-swapping edited ESM modules from a new "Hex Editor" Card behind FEATURE_GSOS_LIVE_HEX_EDIT. Defer Monaco+esbuild-wasm for richer DX; keep WebContainers for workshop mode only.

Consequences: Small dependency with minimal surface; reversible and CI-friendly. Limited typing/error UX initially; must add safe teardown/reload hooks for XState actors. Future: add Monaco+esbuild-wasm if needed.

Links: [Webway note](../../../../scaffolds/webway_gsos-live-hex-edit.md)
