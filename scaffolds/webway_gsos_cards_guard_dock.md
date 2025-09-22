---
id: ww-2025-130
owner: @you
status: active
expires_on: 2025-10-05
guard: npm run -s hex:cards:guard
flag: FEATURE_GSOS_HEX_DOCK
revert: remove file + WEBWAY markers
---
# Webway: GSOS cards guard + dock opens WinBox

## Goal

Stabilize the cards registry CI guard and extend it to validate that each dock icon opens a WinBox window.

## Constraints

- No new heavy deps; reuse jest+puppeteer.
- Keep tests fast (<60s) and deterministic.
- Respect existing feature flags; camera icon may be hidden.

## Current Map

- __gso.getCards was attached late causing empty registry in guard.
- Hex dock default ON; camera icon hidden by default.

## Timebox

20 minutes (source: defaults)

## Research Notes

- __gso.getCards exposed after async imports; tests raced it (source: file)
- jest-puppeteer server config supports reuse via E2E_REUSE_HTTP (source: file)

## Tool Inventory

- npm script: hex:cards:guard (source: file)
- jest-puppeteer config + http-server (source: file)

## Options (Adopt-first)

1. Baseline – waitForFunction on getCards length>0 in guard.
   - Trade-offs: Minimal change; robust vs. init timing.
2. Guarded extension – also assert dock click → WinBox marker.
   - Trade-offs: Slightly longer test; high signal.
3. Minimal adapter – set __gso.getCards stub early then replace.
   - Trade-offs: More code churn; not needed now.

## Recommendation

Option 2 because it hardens CI against regressions without code churn.

## First Slice

- Update e2e test to wait for registry and click dock icons (skip camera) and wait for [data-testid="winbox-\<id\>"]

## Guard & Flag

- Guard: hex:cards:guard
- Flag: FEATURE_GSOS_HEX_DOCK

## Industry Alignment

- E2E guards assert public hooks and user flows with minimal dependency (source: defaults)

## Revert

- Remove WEBWAY markers and this note; keep prior guard behavior.

## Follow-up

- Consider exposing __gso.getCards earlier during GSOS boot for stricter contracts.
