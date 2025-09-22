# ADR | 2025-09-21T00:00:00Z | ww-2025-111

Context: GSOS needs inspectable panels opening via WinBox under raw ESM server and jest-puppeteer. Bare imports and CDN may fail in CI.
Decision: Add multi-tier fallbacks (ESM->UMD->DOM stub), data-testids and window.__wbTest markers, event delegation with composedPath, and a programmatic open hook.
Consequences: Panels are reliably observable in tests; small increase in UI wrapper complexity. Future consolidation possible.
Links: [Webway note](../../../../scaffolds/webway_gsos-winbox-panels.md)
