# ADR | 2025-09-19T00:00:00Z | ww-2025-063

Context: SDK v7 clones v6, adds bottom drawer skeleton; need a mobile-friendly, MD3-aligned UI with live seat visuals to tune pinch→echo.

Decision: Adopt Bottom Sheet First. Keep drawer closed by default; enable via panel=drawer; move seat-based strips and timing sparkline into drawer. Retain desktop side panel.

Consequences: Minimal risk; improved clarity on phones; slight JS for drawer interactions; tests unaffected (closed by default) with one new smoke for drawer-open state.

Links: [Webway note](../../../../scaffolds/webway_v7_mobile_ui_overhaul.md)
