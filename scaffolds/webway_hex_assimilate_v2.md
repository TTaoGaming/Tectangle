---
id: ww-2025-102
owner: @TTaoGaming
status: active
expires_on: 2025-10-06
guard: jest e2e (shell + settings persist) remain green
flag: none
revert: remove src/hex/* and HTML registration; revert HUD alignment cache
---
# Webway: Assimilate V2 into Hex + HUD Alignment Patch

## Goal

Begin strangler assimilation of the v2 demo into a Hex registry with a small adapter; reduce HUD label cross-contamination with a stable alignment cache.

## Constraints

- No breaking changes to v2 demo; additive only.
- Keep tests green.

## Current Map

- v2 runtime (`window.__cam`) unmanaged; HUD labels can flicker/cross-contaminate.

## Timebox

- 25 minutes.

## Research Notes

- Stable IDs present from tracker; leverage as cache keys.

## Tool Inventory

- jest-puppeteer e2e; existing shell/dark/persist tests.

## Options (Adopt-first)

1. Full refactor to Hex now — risky; broad blast radius.
2. Minimal registry + adapter — safe strangler; chosen.
3. No-op; defer until SDK — delays assimilation.

## Recommendation

Option 2 to safely accumulate hex APIs.

## First Slice

- Add `src/hex/hexRegistry.js` and `src/hex/cameraV2Hex.js`.
- Register from v2 HTML after runtime creation.
- Add alignment cache.

## Guard & Flag

- Guard: existing e2e stay green.
- Flag: none.

## Industry Alignment

- Strangler fig; ports/adapters.

## Revert

- Delete hex files, remove registration import, drop alignment cache.

## Follow-up

- Expand hex API to expose telemetry bus; start keyboard mapping hex.
