---
id: ww-2025-116
owner: @TTaoGaming
status: active
expires_on: 2025-10-05
guard: ci:test e2e: gsos hex editor opens + hot-swap no-throw
flag: FEATURE_GSOS_LIVE_HEX_EDIT
revert: remove card + unset flag
---
# Webway: GSOS live hex edit (in-UI)

## Goal

Expose selected hex modules inside GSOS and allow safe, reversible in-UI editing with hot-swap and telemetry, without breaking the static ESM runtime.

## Constraints

- Static server context (no bundler) (source: message)
- Keep v2 stable; GSOS is integration surface (source: message)
- Timebox: small reversible slice; low deps budget (<= 1 small lib) (source: defaults)
- Privacy/security: no external telemetry; offline-capable (source: defaults)
- CI must pass; preserve e2e smokes/screens (source: defaults)

## Current Map

- GSOS bottom bar renders Cards via `initShell` (source: September2025/TectangleHexagonal/src/ui/shell/shell_os.js)
- Apps registered in `gesture_shell_os_v1.html`; optional Cards naming flag (source: September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html)
- XState inspector + MediaPipe + Seats + Settings Cards exist (source: message)
- No live code editing surface yet; static ESM with dynamic imports and WinBox stubs (source: message)

## Timebox

20 minutes (source: defaults)

## Research Notes

- Import Maps + es-module-shims enables runtime module override in static ESM (source: docs/defaults)
- Monaco Editor provides rich code UX; CodeMirror 6 is lighter (source: industry)
- esbuild-wasm can compile TS/JS in-browser and emit ESM for hot-swap (source: industry)
- WebContainers run Node/Vite in-browser; heavier but powerful HMR (source: industry)

## Tool Inventory

- Static servers on 8080/8091 (tasks) (source: package/tasks)
- Jest + Puppeteer e2e with screenshot guard (source: tests)
- WinBox wrapper and Material Web loader (source: src/ui)
- Feature flags infra via `window` (source: src/app/featureFlags.js)

## Options (Adopt-first)

1. Baseline — Import Map Override + es-module-shims (5W1H)
   - Who: GSOS devs toggling flags in local UI
   - What: Override specific hex module URLs with data: or blob: ESM; reload via dynamic `import()` cache-bust
   - When: During local development in GSOS; no backend
   - Where: New "Card: Hex Editor" with text area + Apply
   - Why: Zero bundler; smallest dependency (1 tiny polyfill)
   - How: Add `<script async src="https://unpkg.com/es-module-shims@1"></script>` + `importmap` shim; write edited code to Blob URL; update import map entry; `await import(newURL)` to hot-swap; persist draft in localStorage
   - Trade-offs: No typecheck; module graph hygiene required; limited to ESM boundaries

2. Guarded extension — Monaco + esbuild-wasm in-browser
   - Who: Power users editing TS/JS hexes
   - What: Monaco code editor with esbuild-wasm compile to ESM, then hot-swap as in Option 1
   - When: When richer UX and TS support needed
   - Where: "Card: Hex Editor" with file picker of discoverable hex modules
   - Why: Better DX and error feedback; still offline
   - How: Lazy-load `monaco-editor` (CDN) + `esbuild-wasm` (WASM); compile -> Blob -> import map swap; keep under FEATURE_GSOS_LIVE_HEX_EDIT flag
   - Trade-offs: Larger payload; WASM init latency; more moving parts

3. Minimal adapter — WebContainers (StackBlitz) + Vite-in-browser
   - Who: Advanced sessions requiring full HMR and npm deps
   - What: Run a Vite dev server inside the browser; edit files with Monaco; HMR updates GSOS
   - When: Workshop/demo modes; not for default lightweight runs
   - Where: "Card: Dev Sandbox" opening a WebContainer pane bound to repo snapshot
   - Why: Maximum power with zero local setup
   - How: Load `@stackblitz/web-container`; mount FS; start Vite; proxy iframe/app into GSOS WinBox
   - Trade-offs: Heavy; sandbox limits; license review; not ideal for CI

## Recommendation

Option 1 now for smallest reversible slice; keep Option 2 as follow-up for DX; defer Option 3 to workshops only.

## First Slice

- New Card: "Hex Editor" behind FEATURE_GSOS_LIVE_HEX_EDIT
- UI: select a known hex module (e.g., `src/controllers/gateFsm.js` clone), textarea editor, Apply button
- Engine: es-module-shims import map override -> Blob URL -> dynamic import -> swap registry/actor as needed
- Persist: store drafts in localStorage keyed by module path

## Guard & Flag

- Guard: e2e smoke opens "Hex Editor" and applies a trivial console.log patch without exceptions; screenshot of Card
- Flag: FEATURE_GSOS_LIVE_HEX_EDIT

## Industry Alignment

- Standard: Import Maps (WHATWG) + es-module-shims polyfill (source: industry)
- State-of-the-art: Monaco + esbuild-wasm; WebContainers (StackBlitz) (source: industry)

## Revert

Remove the Card/module override code and unset FEATURE_GSOS_LIVE_HEX_EDIT; no source files modified by default.

## Follow-up

- Add Monaco + esbuild-wasm for TS support (Option 2)
- Add live actor reload hooks for XState actors with safe teardown
- Add small unit to validate import map swap + module version label in UI
