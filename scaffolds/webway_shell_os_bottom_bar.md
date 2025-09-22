---
id: ww-2025-097
owner: @copilot
status: active
expires_on: 2025-10-05
guard: jest-puppeteer e2e v2_shell_os.smoke
flag: FEATURE_SHELL_OS
revert: remove shell init + test
---
# Webway: Shell OS bottom bar for v2

## Goal

Bottom app bar with buttons that open WinBox-based panels; verify via Jest-Puppeteer.

## Constraints

- No telemetry added; CDN allowed for WinBox fallback.
- Minimal dependency footprint; progressive enhancement with Material Web.

## Current Map

- `initShell` renders plain buttons then upgrades to Material.
- v2 page mounts shell by default; Seats and Settings open WinBox.

## Timebox

20m

## Research Notes

- Added data-testid hooks for bar/buttons (source: src/ui/shell/shell_os.js)
- WinBox host now falls back to CDN UMD if ESM missing (source: src/ui/winBoxHost.js)

## Tool Inventory

- jest-puppeteer (source: package.json)
- http-server task 8091 (source: tasks)

## Options (Adopt-first)

1. Baseline – DOM bar + window.open fallback
   - Trade-offs: simple, reliable; less native look.
2. Guarded extension – WinBox windows with CDN fallback
   - Trade-offs: extra network; robust in tests.
3. Minimal adapter – Only Material buttons
   - Trade-offs: no windows.

## Recommendation

Option 2 for robustness and UX.

## First Slice

- Auto-mount shell; Seats/Settings buttons; test selector hooks; CDN fallback.

## Guard & Flag

- Guard: e2e test v2_shell_os.smoke passes.
- Flag: FEATURE_SHELL_OS (implicit; can remove to revert).

## Industry Alignment

- Progressive enhancement; testable UI hooks.

## Revert

- Revert initShell mount and remove e2e test.

## Follow-up

- Add app icons; settings persistence; app registry.
