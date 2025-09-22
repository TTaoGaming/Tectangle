---
id: ww-2025-131
owner: @you
status: active
expires_on: 2025-10-05
guard: jest --config jest.config.e2e.cjs --testPathPattern winbox_factory_consistency.test.js
flag: FEATURE_GSOS_REQUIRE_WINBOX
revert: revert cardTemplate factory edits + remove test
---
# Webway: WinBox factory standardization

## Goal

Make all app windows consistent in look and behavior via a centralized WinBox factory and enforce with a CI guard.

## Constraints

- No extra heavy deps; leverage existing jest+puppeteer.
- Keep compatibility with stub fallback when WinBox isn’t available.

## Current Map

- Some panes used inconsistent classes/styles; stub vs real divergence.

## Timebox

20 minutes (source: defaults)

## Research Notes

- WinBox supports a class option; we can standardize root/body classes and content style (source: file)

## Tool Inventory

- cardTemplate.js factory; jest-puppeteer e2e (source: file)

## Options (Adopt-first)

1. Baseline: central factory with theme object (real + stub).
   - Trade-offs: Minimal; good coverage.
2. Guarded: add e2e asserting markers and classes.
   - Trade-offs: Slight runtime cost (~3s).
3. Adapter: CSS module for theme injection later.
   - Trade-offs: More work; defer.

## Recommendation

Option 2 to lock consistency with a small CI test.

## First Slice

- Add DEFAULT_THEME and apply to createWinBox/createStubWinbox. Add e2e guard.

## Guard & Flag

- Guard: winbox_factory_consistency.test.js
- Flag: FEATURE_GSOS_REQUIRE_WINBOX (optional stricter CI)

## Industry Alignment

- Centralized component factories + CI guardrails (source: defaults)

## Revert

- Remove theme bits; delete test; revert cardTemplate changes.

## Follow-up

- Expose theme injection API if different skins are needed.
