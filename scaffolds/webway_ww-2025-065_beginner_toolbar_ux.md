---
id: ww-2025-065
+owner: @tommy
status: active
expires_on: 2025-10-10
guard: ci:test v7 drawer-open via toolbar button smoke
flag: PANEL_BTN
revert: remove toolbar button + flag; keep drawer FAB
---
# Webway: Beginner-first toolbar button for drawer

## Goal
Make v7 obvious and operable for first-time users ("a 5-year-old can start"): add a visible toolbar button that opens the bottom drawer, alongside the existing FAB, with copy that clearly instructs "Open Panel" and an optional one-tap "Play Pinch" starter path.

## Constraints
- License: MIT (source: defaults)
- Deps: No new runtime deps; reuse existing CSS tokens (source: repo)
- Perf: Zero-cost idle; event-only handlers (source: defaults)
- Privacy/Security: No telemetry; no secrets (source: defaults)
- CI: Keep v7 closed-drawer snapshot stable; add a non-visual smoke for toolbar open (source: message)

## Current Map
- v7 has: toolbar (Start/Stop/Play Pinch/Play Idle), right side panel (default), and optional bottom drawer with FAB in drawer mode; Kalman tray relocates in drawer mode. Drawer only visible when `?panel=drawer` (source: repo).

## Timebox
- 20 minutes (source: defaults)

## Research Notes
- Ready sentinel: `#e2eReady[data-ready="1"]` requires P1 lock + Dino echo >= 1 (source: file)
- Drawer controls: `#fabDrawer`, `#bottomDrawer` (source: file)
- Seat cards (side): `#p1Card*`, `#p2Card*`; Drawer cards `*_d` mirrored now (source: file)

## Tool Inventory
- Tests: Jest+Puppeteer visual snapshot (closed) and smokes (drawer open) (source: repo)
- Tasks: Start static server 8091; run tests (source: repo)

## Options (Adopt-first)
1. Always show a toolbar "Open Panel" button that toggles the drawer. FAB remains for redundancy.
   - Trade-offs: Easiest for beginners; slight duplication; minimal layout risk.
2. Show toolbar button only in drawer mode (when `?panel=drawer`) to avoid duplication in side-panel mode.
   - Trade-offs: Fewer controls, but requires URL param awareness.
3. Unify into a single toolbar "Panel" button that toggles side panel vs. drawer depending on mode.
   - Trade-offs: Slightly more logic; clean UX.

## Recommendation
Option 2 now (button only in drawer mode), to keep default visuals unchanged and avoid new controls when the side panel is visible. Option 3 is a natural follow-up.

## First Slice
- Add a toolbar button labeled "Open Panel" that appears only in drawer mode (`?panel=drawer`) under feature flag `PANEL_BTN`.
- Clicking toggles the drawer open/close (same behavior as FAB), no visual baseline changed.
- Add a smoke test: navigate with `?panel=drawer&panel_btn=1`, click the toolbar button, assert drawer becomes visible.

## Guard & Flag
- Guard: New jest smoke for toolbar button; existing v7 snapshot remains closed and green.
- Flag: `PANEL_BTN` via URL param `panel_btn=1` (default off in tests; on for demos).

## Industry Alignment
- MD3 surfaces + redundant affordances improve novice success; explicit label beats iconography (source: defaults)

## Revert
- Remove the toolbar button and `panel_btn` flag; FAB remains. No data migration.

## Follow-up
- Option 3: Single "Panel" that chooses side vs drawer automatically.
- Add "Start with Demo" one-tap path that runs Play Pinch and opens panel for first-run.
