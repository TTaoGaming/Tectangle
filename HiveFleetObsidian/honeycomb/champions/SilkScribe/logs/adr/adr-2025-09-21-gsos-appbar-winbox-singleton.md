# ADR | 2025-09-21T00:00:00Z | ww-2025-091

Context: Need a consistent app launcher (app bar) and singleton WinBox windows using a shared template; keep wallpaper camera ON; maintain green tests.
Decision: Adopt App Bar + App Library, enforce singletons via cardTemplate.js, migrate Camera first, guard with hex:overlay:verify and flags FEATURE_GSOS_APPBAR/APPLIB.
Consequences: Cleaner UX, reversible via flags; small scope; requires minimal new module and e2e guards.
Links: [Webway note](../../../../scaffolds/webway_gsos-appbar-winbox-singleton.md)
