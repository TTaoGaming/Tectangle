---
id: ww-2025-128
owner: @tommy
status: active
expires_on: 2025-10-05
guard: npm run -s hex:overlay:verify
flag: FEATURE_GSOS_HEX_DOCK
revert: remove dock hex code + disable flag
---
# Webway: GSOS Hexagonal Dock

## Goal

Adopt-first: introduce a hexagonal dock layout for GSOS app cards, behind a feature flag and with a clean revert path, without breaking existing guards.

## Constraints

- License: WinBox (MIT), Material Web (Apache-2.0); add no new deps.
- Perf: <= 200ms extra render cost at load; no layout thrash.
- Privacy/Security: no telemetry, no external calls.
- CI must pass; tests and visual guard remain stable or updated deliberately.
- Timebox: 20 minutes.

## Current Map

- GSOS has a linear dock with rectangular icons; cards open WinBox singletons.
- Overlapping legacy shell bars have been gated in camera pages.

## Timebox

20 minutes (defaults).

## Research Notes

- Staggered hex rows via CSS clip-path and flex rows are simplest (source: defaults).
- Feature gating via URLSearchParams FEATURE_GSOS_HEX_DOCK (source: codebase).
- Cards registry already exists and provides canonical order (source: repository).

## Tool Inventory

- npm scripts: hex:overlay:verify; jest+puppeteer guard (source: package.json).
- Dev page: September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html (source: repo).
- Silk Scribe logs index for SRL/ADR updates (source: HFO logs).

## Options (Adopt-first)

1. Baseline — keep rectangular dock, add no-op flag
   - Trade-offs: zero risk; no UX improvement.
2. Guarded extension — render hex dock via CSS clip-path and flex rows, behind FEATURE_GSOS_HEX_DOCK (default ON)
   - Trade-offs: minor CSS; reversible; accessible; minimal code.
3. Minimal adapter — wrap current dock in hex grid container and progressively enhance when Material is ready
   - Trade-offs: slightly more complexity; similar UX.

## Recommendation

Option 2: Flagged hex layout with clip-path honeycomb rows; simplest and reversible.

## First Slice

- Add CSS for .hex-icon and .hex-dock rows; render via FEATURE_GSOS_HEX_DOCK with fallback to existing dock.
- Promote card metadata (title, glyph) in one place.

## Guard & Flag

- Guard: hex:overlay:verify and existing cards guard.
- Flag: FEATURE_GSOS_HEX_DOCK (default ON; disable via ?FEATURE_GSOS_HEX_DOCK=0).

## Industry Alignment

- Honeycomb layouts via CSS clip-path are common and dependency-free.

## Revert

- Remove hex CSS block and JS branches; set FEATURE_GSOS_HEX_DOCK=0 default.

## Follow-up

- Add keyboard navigation between hex neighbors.
- Persist dock order in localStorage.
