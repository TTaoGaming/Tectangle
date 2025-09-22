# ADR | 2025-09-19T00:00:00Z | ww-2025-064

Context: v7 introduces an MD3 bottom drawer. We want coverage without destabilizing visual baselines.

Decision: Add a headless smoke that opens the drawer via the FAB and asserts P1 drawer card telemetry (badge, hand, fsm) is populated. Mirror side panel card updates into drawer cards.

Consequences: Drawer regressions will be caught behaviorally; visual baselines remain unchanged by default. Minimal risk of flake since no screenshot is taken.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-064_v7_drawer_open_smoke.md)
