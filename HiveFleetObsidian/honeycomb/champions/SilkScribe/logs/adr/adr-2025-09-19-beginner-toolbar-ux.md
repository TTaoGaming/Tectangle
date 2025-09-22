# ADR | 2025-09-19T00:00:00Z | ww-2025-065

Context: Beginners miss the drawer affordance; side panel is default, drawer requires URL param and FAB click. We want an explicit, labelled toolbar control.

Decision: Add a toolbar button (flagged via panel_btn=1) that toggles the bottom drawer in drawer mode. Keep v7 snapshots unchanged (drawer closed). Add a smoke test for the button.

Consequences: Improves first-run success, zero visual baseline churn, minimal complexity.

Links: [Webway note](../../../../scaffolds/webway_ww-2025-065_beginner_toolbar_ux.md)
