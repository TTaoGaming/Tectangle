---
id: ww-2025-064
owner: @tommy
status: active
expires_on: 2025-10-03
guard: ci:test v7 drawer-open smoke
flag: PANEL_DRAWER
revert: remove drawer-open smoke test, revert WEBWAY markers
---
# Webway: v7 drawer-open smoke + card mirror

## Goal
Add a headless smoke that opens the bottom drawer in v7 and asserts P1 card telemetry updates, without changing default closed-drawer snapshot baseline. Mirror seat cards into drawer cards for consistency.

## Constraints
- license: MIT (source: defaults)
- deps: no new runtime deps (source: message)
- perf: no heavier than existing v7 loop; drawer closed by default (source: message)
- privacy/security: no telemetry; no secrets (source: defaults)
- ci: tests must pass; baselines stable (source: message)

## Current Map
- v7 has MD3 bottom drawer, FAB opener, scrim, and seat cards in side panel. Drawer is closed by default; Kalman tray can be moved into drawer in drawer mode. (source: repo)

## Timebox
- 20 minutes (source: defaults)

## Research Notes
- Selector inventory: #fabDrawer, #bottomDrawer, #p1CardBadge_d, #p1CardHand_d in drawer; side panel has #p1CardBadge etc. (source: file)
- Ready sentinel: #e2eReady[data-ready="1"] requires P1 lock and Dino echo >=1. (source: file)

## Tool Inventory
- npm scripts: visual snapshot via jest+puppeteer; E2E server via http-server tasks. (source: repo)
- Tasks: Start local static server 8091; Run hex unit tests; visual suites. (source: repo)

## Options (Adopt-first)
1. Baseline-only — keep closed drawer snapshot and skip drawer-open validation.
	- Trade-offs: Low coverage; drawer regressions slip.
2. Guarded extension — add separate smoke to open drawer and assert card values; do not capture snapshot.
	- Trade-offs: Adds coverage with minimal flake; no baseline churn.
3. Minimal adapter — snapshot drawer-open state on mobile viewport with coarse size guard.
	- Trade-offs: Higher flake risk; baseline maintenance overhead.

## Recommendation
Option 2 because it validates behavior without baseline drift and keeps flakes low.

## First Slice
- Mirror renderHud updates into drawer cards. Add test v7_drawer_open_smoke.test.js to click FAB, open drawer, and assert P1 badge/hand/fsm non-empty.

## Guard & Flag
- Guard: jest+puppeteer smoke passes on CI with SITE_BASE and E2E_PORT set.
- Flag: PANEL_DRAWER via URL param panel=drawer; default remains closed.

## Industry Alignment
- Mobile bottom sheets (MD3) and non-visual smoke assertions for stability. (source: defaults)

## Revert
- Delete test file and remove drawer card mirroring. No data migration.

## Follow-up
- Optional mobile viewport visual snapshot once UI stabilizes.
- Add mini timing sparkline per seat in drawer.
