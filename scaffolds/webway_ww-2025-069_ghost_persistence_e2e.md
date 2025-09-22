---
id: ww-2025-069
owner: @spatial-input
status: active
expires_on: 2025-10-05
guard: npm run -s hex:test:unit && npm run -s test:e2e
flag: seatmag
revert: remove WEBWAY markers; disable seatmag flags
---
# Webway: Ghost persistence e2e for P1

## Goal

Prove P1 never visually disappears when tracking is lost: render ghost with inertia and capture circle; autosnap on re-entry within radius. Keep behind flags and under tests.

## Constraints

- License: MIT-compatible only (source: defaults)
- Dependencies: no new runtime deps; tests only (source: defaults)
- Perf: overlay must remain <200ms/frame (source: defaults)
- Privacy/Security: no telemetry, no secrets (source: defaults)
- CI: all tiers must pass (source: defaults)

## Current Map

v7 demo wired to seat magnet manager behind flags (?seatmag=1&seatmag_auto=1). Overlay draws capture circles and ghosts using manager.getGhost prediction; Finger Atlas and unit tests green. (source: repo)

## Timebox

20 minutes (source: defaults)

## Research Notes

- Overlay had a brace duplication causing a syntax error; fixed and added WEBWAY markers. (source: repo)
- Manager supports inertial ghost via velocity decay; overlay consumes it. (source: repo)
- Test-only toggle seatmag_test_nodets allows simulating occlusion; overlay tracks ghostSeats each frame. (source: repo)

## Tool Inventory

- npm scripts: hex:test:unit, test:e2e, hive:heartbeat (source: package.json)
- Jest+Puppeteer e2e; Mocha unit tests (source: tests/)
- Feature flags: seatmag, seatmag_auto, FINGER_ATLAS (source: repo)

## Options (Adopt-first)

1. Baseline – Visual-only ghost with inertial prediction and capture circle; add e2e that toggles detections off and asserts ghostSeats contains P1.
   - Trade-offs: Simple; relies on overlay probe; no DOM-only assertion.
2. Guarded extension – Add data- attributes to overlay canvas/DOM for test selection of ghost state.
   - Trade-offs: Slightly invasive; clearer e2e selector.
3. Minimal adapter – Expose sdk probe for last-seen seat landmarks for tests only.
   - Trade-offs: Touches SDK surface; risk of leakage.

## Recommendation

Option 1 for lowest risk and fastest proof while feature remains behind flags.

## First Slice

- Fix overlay syntax; add WEBWAY markers. Done.
- Write e2e to: enable seatmag+auto, wait for P1, set seatmag_test_nodets=1, assert ghostSeats has P1, then simulate re-entry and assert snap event.

## Guard & Flag

- Guard: run unit + e2e suites; golden must stay green.
- Flag: seatmag, seatmag_auto, seatmag_test_nodets (tests only).

## Industry Alignment

- Persistent ghosting during occlusion mirrors VR hand UX in Quest/Index; inertial prediction aligns with common XR smoothing. (source: message)

## Revert

- Remove WEBWAY: ww-2025-069 markers; delete test-only toggles; keep manager intact.

## Follow-up

- TTL check: retire test-only toggle after DOM-attribute-based guard lands.
- Additional notes: consider physics backends (Rapier) for richer inertia, but keep optional.
