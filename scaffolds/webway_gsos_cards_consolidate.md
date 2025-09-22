---
id: ww-2025-118
owner: @ttao
status: active
expires_on: 2025-10-05
guard: npm run -s hex:overlay:verify
flag: FEATURE_GSOS_CARDS_NAMING
revert: remove Camera card block and restore duplicate HTML
---
# Webway: GSOS Cards consolidation and Camera promotion

## Goal

Consolidate GSOS Cards into a single page, promote Camera to a proper Card that is fully clickable, and default to Card naming.

## Constraints

- Respect hex boundaries; use ports-level flag accessor.
- No new heavy deps; reuse existing v2 camera demo.
- Keep e2e stable and maintain Material preload guard.

## Current Map

- GSOS had duplicate HTML with a v2 clone; Camera demo not clickable.
- Existing Cards (XState, MediaPipe, Seats, Settings) are present.

## Timebox

20 minutes (source: defaults)

## Research Notes

- camera v2 located at September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html (source: codebase)
- featureFlagsPort exists for ports-level access (source: message)
- Silk Scribe logs index present (source: codebase)

## Tool Inventory

- npm scripts: hex:overlay:verify, static servers 8080/8091 (source: package.json)
- jest-puppeteer e2e (source: repo)
- WinBox stubs for tests (source: codebase)

## Options (Adopt-first)

1. Baseline — Keep duplicate HTML and patch click handling
   - Trade-offs: brittle; two sources of truth.
2. Guarded extension — Add Camera card (iframe to v2) and remove duplicate HTML
   - Trade-offs: slight iframe styling; clean consolidation.
3. Minimal adapter — Extract camera module and embed directly
   - Trade-offs: larger refactor; risks regressions.

## Recommendation

Option 2 because it’s reversible, minimal, and fixes clickability immediately.

## First Slice

- Add Camera Card (iframe to v2)
- Default FEATURE_GSOS_CARDS_NAMING=true
- Switch flag import to ports
- Remove duplicate HTML clone

## Guard & Flag

- Guard: hex:overlay:verify
- Flag: FEATURE_GSOS_CARDS_NAMING

## Industry Alignment

- Shell UI uses windows/cards with embedded apps via iframes or adapters.

## Revert

Delete Camera card block and re-add the removed HTML clone section.

## Follow-up

- Add Calibration Card for Open Palm FSM
- Per-seat filter indicators in MediaPipe Card
