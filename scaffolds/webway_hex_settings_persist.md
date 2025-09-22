---
id: ww-2025-101
owner: @TTaoGaming
status: active
expires_on: 2025-10-05
guard: jest e2e: v2_settings_persist.test.js
flag: HEX_SETTINGS_PERSIST
revert: remove src/app/settingsService.js, src/adapters/localStorageSettingsAdapter.js; strip Settings wiring; delete e2e test
---
# Webway: Hex Settings Port + Persistence

## Goal

Adaptable, hex-friendly Settings port with local persistence for WinBox apps; prove via e2e persistence test.

## Constraints

- No backend; browser-only; minimal deps. (source: defaults)
- Keep reversible; behind flag HEX_SETTINGS_PERSIST. (source: message)

## Current Map

- v2 demo has WinBox Settings without persistence. (source: codebase)

## Timebox

- 20 minutes. (source: defaults)

## Research Notes

- Reused existing feature flag utility. (source: file)
- Reused seat config cues for defaults. (source: file)

## Tool Inventory

- jest-puppeteer e2e; tasks: hex tier/run. (source: codebase)

## Options (Adopt-first)

1. Baseline — Inline localStorage in Settings UI.
   - Trade-offs: Fast but not reusable.
2. Guarded extension — Hex service + localStorage adapter.
   - Trade-offs: Slightly more files; reusable for other apps. Chosen.
3. Minimal adapter — URLSearchParams only.
   - Trade-offs: No persistence across reloads without query reuse.

## Recommendation

Option 2 for reuse across future WinBox apps.

## First Slice

- settingsService + localStorage adapter, wire to v2 Settings, add e2e.

## Guard & Flag

- Guard: tests/e2e/v2_settings_persist.test.js must pass.
- Flag: HEX_SETTINGS_PERSIST (default on; set to 0/false to disable).

## Industry Alignment

- Ports/adapters pattern; local-first UX. (source: defaults)

## Revert

- Delete service/adapter/test; remove UI wiring; no data migration.

## Follow-up

- Add schema version bump logic; iconography for shell; per-app schemas.
