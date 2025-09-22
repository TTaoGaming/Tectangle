---
id: ww-2025-063
owner: @TTaoGaming
status: active
expires_on: 2025-10-03
guard: ci:test v7 drawer closed baseline + smoke drawer open cards update
flag: panel=drawer
revert: remove note; stop using panel=drawer param
---
# Webway: v7 Mobile UI Overhaul (Bottom Drawer + Seat Cards)

## Goal

Deliver a mobile-first UI for SDK v7 using a Material 3-style bottom drawer as the primary surface, with clear P1/P2 seat cards and room for live visuals (strips, timing, charts) to tune pinch→echo behavior.

## Constraints

- deps_budget: 0 libs (Tailwind + existing M3 tokens only) (source: defaults)
- perf_budget_ms: overlay+UI < 200ms/frame; per-frame overlay < 2ms (source: defaults)
- privacy/security: no telemetry, no secrets (source: defaults)
- ci: keep current tests green; new tests added must pass (source: defaults)

## Current Map

- v7 cloned from v6; drawer skeleton exists behind `?panel=drawer` with FAB and P1/P2 cards; side panel remains for desktop.
- Hand overlay wired, but draw loop is minimal; visuals not emphasized in v7 yet.
- v7 snapshot test exists (baseline OK; drawer closed by default). (source: codebase)

## Timebox

20–40 minutes for first slice (drawer polish + cards + seat-based strips in-drawer). (source: defaults)

## Research Notes

- MD3 bottom sheet patterns: scrim, rounded top, handle, drag-to-close; FAB to open. (source: defaults)
- Tailwind + M3 tokens provide sufficient styling without adding component libs. (source: codebase)
- Visual snapshot tests can run at mobile viewport; keep drawer closed for baseline, add targeted drawer-open snapshots later. (source: message)

## Tool Inventory

- Tailwind via CDN; `design/m3.tokens.css`
- Puppeteer + Jest visual snapshot harness
- `createHandOverlay`, `createToiKalmanCV`, v6/v7 demos

## Options (Adopt-first)

1. Bottom Sheet First — keep single-screen layout; use bottom drawer for telemetry
   - What: Hide right side panel in mobile; FAB opens drawer with P1/P2 cards, seat-based strips, and timing sparkline. Desktop keeps side panel.
   - Trade-offs: Simple mental model; minimal code churn; good for phones.

2. Tabbed Mobile Nav — Capture / Telemetry / Settings
   - What: Bottom nav with three tabs; Capture shows overlay; Telemetry shows charts; Settings for thresholds. Drawer used for quick actions.
   - Trade-offs: More routing/state; clearer separation; bigger change.

3. Responsive Split — Drawer in portrait, side panel in landscape
   - What: CSS-driven switch; same components rendered in different containers. Drawer and side panel share content.
   - Trade-offs: Slight complexity; best multi-device experience.

## Recommendation

Option 1 now (Bottom Sheet First) to get immediate clarity with minimal risk; evolve toward Option 3 for responsive parity.

## First Slice

- Keep drawer closed by default; add `?panel=drawer` to enable.
- Move Kalman strips into drawer when in drawer mode; keep overlay visible.
- Add seat-based strips (P1/P2) and a tiny timing sparkline per seat inside drawer.
- Keep side panel for desktop; reuse same components.

## Guard & Flag

- Guard: v7 snapshot (drawer closed) must pass; add a smoke test that opens drawer and asserts P1/P2 cards update within 5s.
- Flag: Use `panel=drawer` query param; no global feature flag required.

## Industry Alignment

- Aligns with MD3 bottom sheet guidance and widely adopted mobile telemetry UIs (debug overlays in AR/CV apps). (source: defaults)

## Revert

- Remove `panel=drawer` usage; keep legacy side panel; delete drawer DOM block.

## Follow-up

- Add timing charts (sparkline), bias/jitter bars; add P2 Dino instance behind guard.
- Add mobile viewport snapshot (e.g., 390×844) to lock look/feel once stable.
