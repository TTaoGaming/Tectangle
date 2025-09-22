---
id: ww-2025-091
owner: @TTaoGaming
status: active
expires_on: 2025-10-05
guard: ci:test hex:overlay:verify
flag: FEATURE_GSOS_APPBAR
revert: remove App Bar components and disable flag
---
# Webway: GSOS App Bar + WinBox singletons

## Goal

Implement a minimal, Android-like app bar (dock) with draggable icons and an App Library. Ensure each app opens as a singleton WinBox window using a shared template. Keep wallpaper camera autostart. Stubs remain clearly labeled.

## Constraints

- License: WinBox (MIT), Material Web (Apache-2.0) — compatible (source: defaults)
- Dependencies: 1 small helper module max, otherwise reuse existing (source: defaults)
- Perf: UI interactions < 200ms (source: defaults)
- Privacy/Security: no telemetry leakage; no secrets (source: defaults)
- CI: must keep tests green (source: message)

## Current Map

- GSOS v1 has a basic dock and singleton registry. Camera wallpaper autostarts; stubs exist for SDK/API/etc. (source: message)

## Timebox

20 minutes initial slice; tighten after guard passes. (source: defaults)

## Research Notes

- Tests: Jest e2e; MP4 replay; iframe camera hooks (source: message)
- Flags: GSOS_WALLPAPER, FEATURE_GSOS_OPEN_ON_LOAD, FEATURE_GSOS_REQUIRE_WINBOX (source: message)
- WinBox + Material: eager load + short preload await stabilizes UX (source: message)

## Tool Inventory

- npm scripts: hex:overlay:verify, test:e2e (source: codebase)
- Tasks: various HFO heartbeats and hex tiers (source: codebase)
- Assets: node_modules/winbox/dist/winbox.bundle.js, CSS (source: codebase)

## Options (Adopt-first)

1. Baseline — Keep current dock; formalize singleton template API (how: extract cardTemplate.js, wire registry)
   - Trade-offs: fastest; minimal UI change
2. Guarded extension — New App Bar + App Library modal; wire template; flags `FEATURE_GSOS_APPBAR`, `FEATURE_GSOS_APPLIB`
   - Trade-offs: moderate scope; reversible; clearer UX
3. Minimal adapter — Wrap existing app openers to the template without moving UI; defer App Library
   - Trade-offs: lowest risk; less UX improvement

## Recommendation

Option 2 to deliver a visible UX improvement with flags and clear rollback.

## First Slice

- Implement cardTemplate.js with getOrCreate(appId, opts, mount)
- Use it for Camera app and one stub app
- Add app bar MVP with in-memory reorder and icon clicks

## Guard & Flag

- Guard: `npm run -s hex:overlay:verify` must pass in CI
- Flag: `FEATURE_GSOS_APPBAR=1` default on; `FEATURE_GSOS_APPLIB=1` optional

## Industry Alignment

- Desktop web launchers often use dock + singleton windows; WinBox is a lightweight precedent (source: defaults)
- Material Web components for modal/search align with Google guidance (source: defaults)

## Revert

- Remove app bar and library modules; flip flags off; keep wallpaper camera default ON

## Follow-up

- TTL check: 2025-10-05 — confirm guards still pass and adoption is sticky
- Additional notes: seat router + Events wiring next

