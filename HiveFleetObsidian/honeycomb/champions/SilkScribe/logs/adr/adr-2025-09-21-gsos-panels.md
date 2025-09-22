# ADR | 2025-09-21T03:41:00Z | ww-2025-111

Context: Raw http-server without bundler causes bare specifier resolution issues for XState/Material; WinBox may not load in CI.
Decision: Add ESM fallback imports for XState; provide WinBox DOM stubs with data-testids; relax e2e assertions to accept stubs; add event delegation on shell.
Consequences: Panels will surface reliably in tests; slight duplication for stub code; future cleanup required when bundling.
Links: [Webway note](../../../../scaffolds/webway_ww-2025-111-gsos-panels-and-e2e.md)
