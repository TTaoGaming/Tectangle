---
id: ww-2025-129
owner: @TTaoGaming
status: active
expires_on: 2025-10-05
guard: npm run -s hex:overlay:verify && npm run -s hex:cards:guard
flag: FEATURE_GSOS_REQUIRE_WINBOX
revert: remove stigmergy stubs; disable flag; revert GSOS panels to prior state
---
# Webway: GSOS standardize on Material Web + WinBox

## Goal
Use Material Web and WinBox as first-class UI standards in GSOS so all cards render consistently with minimal custom UI code.

## Constraints
- Offline by default; no CDN. (source: defaults)
- Keep CI guards green. (source: defaults)
- Minimal dependencies; use existing `materialWeb.js` and WinBox. (source: codebase)

## Current Map
- GSOS cards already use `getOrCreateCardWindow`. Material preload exists but readiness can lag. (source: gesture_shell_os_v1.html)

## Timebox
20m (source: defaults)

## Research Notes
- Panels exist for mediapipe, seats, settings; others stubbed. (source: src/ui/panels)
- Material preload via `preloadMaterialDefaults()`; tests call `__gso.materialReady()`. (source: code)

## Tool Inventory
- `src/ui/materialWeb.js`, `src/ui/components/cardTemplate.js`, `src/ui/cards/registry.js`. (source: code)
- Jest+Puppeteer cards guard. (source: tests)

## Options (Adopt-first)
1. Baseline — keep stubs inline, just ensure Material preload and WinBox CSS.
   - Trade-offs: Fast; keeps tests green; still some inline UI.
2. Guarded extension — try dynamic imports of panels; fall back to stubs.
   - Trade-offs: Zero break risk; progressive adoption; minimal code.
3. Minimal adapter — central panel router module exporting `open*Panel` APIs.
   - Trade-offs: Larger refactor; postponable.

## Recommendation
Option 2 for progressive adoption with fallbacks.

## First Slice
- In GSOS: import Material preload early, await readiness longer, use dynamic panel imports for non-critical cards; keep stigmergy inline stubs as fallbacks.

## Guard & Flag
- Guard: `npm run -s hex:cards:guard` remains green; snapshots unchanged.
- Flag: `FEATURE_GSOS_REQUIRE_WINBOX` to enforce real WinBox in strict modes.

## Industry Alignment
- Material Web + Window manager pattern; dynamic import fallbacks. (source: message)

## Revert
- Remove new dynamic imports and stigmergy comments; lower material wait; disable flag.

## Follow-up
- Implement missing panels (sdk, api, events, perf, models, flags, docs) with Material components.
