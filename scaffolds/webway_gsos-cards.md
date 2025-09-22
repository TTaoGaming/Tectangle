---
id: ww-2025-112
owner: @you
status: active
expires_on: 2025-10-21
guard: npm run -s hex:overlay:verify
flag: FEATURE_GSOS_CARDS_NAMING
revert: toggle flag off
---
# Webway: GSOS Cards naming (vs Panels)

## Goal

Adopt "cards" naming in GSOS UI with the smallest reversible change.

## Constraints

- No breaking changes; tests must keep passing.
- Raw ESM static server environment.

## Current Map

- GSOS apps list titles show "Hex: …".
- WinBox windows and Material content already in place.

## Timebox

20 minutes (defaults)

## Research Notes

- Naming can be toggled at title level; data-testids independent.

## Tool Inventory

- WinBox host, Material Web, jest-puppeteer screenshots.

## Options (Adopt-first)

1. Hard rename to "Card" everywhere.
2. Flag-based label switcher at app titles (minimal change).
3. Theming with injected title prefix.

## Recommendation

Option 2 — flag-based label helper for reversibility.

## First Slice

- Add `FEATURE_GSOS_CARDS_NAMING` and label helper for app titles.

## Guard & Flag

- Guard: overlay verify
- Flag: FEATURE_GSOS_CARDS_NAMING

## Industry Alignment

- Progressive naming via feature flags is common for staged UX shifts.

## Revert

- Turn the feature flag off.

## Follow-up

- Align docs/screenshots terminology to "cards" when flag enabled.
