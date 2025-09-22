# TODO — 2025-09-21 — GSOS UI Simplification: Android-like App Bar + WinBox Card Template

Owner: you (@TTaoGaming)

Status: planned

Scope: GestureShell OS v1 (GSOS) UI chrome only — no pipeline rewrite

## Goal

Make GSOS feel like a simple phone launcher: a clean Android-like app bar at the bottom with draggable app icons and an app library. Tapping an icon opens a single WinBox window (singleton) per app, styled with Material Web. Camera should be immediate (wallpaper) and the Camera app window should be consistent with the template, not bespoke. Stubs must be clearly labeled.

## Non-Goals

- Rewriting MediaPipe or recognition pipeline
- Replacing WinBox/Material with another windowing/styling system

## Deliverables

1. App Bar (Android-like)

- Bottom bar with app icons; draggable reordering; persists order (localStorage)
- Long-press/add from library; remove via context/long-press
- Progressive disclosure: no cards auto-open; wallpaper remains auto

1. App Library (grid)

- Material modal with searchable/filterable grid of available apps
- Add/remove apps to the bar; reset default layout

1. WinBox Card Template (singleton)

- A shared helper for all apps to create/open a WinBox window
- Consistent titlebar, dimensions, testid, Material content region, and cleanup
- Real vs stub marking: `data-winbox-type="real|stub"` and visible stub badge

1. Camera Card (fixed)

- Re-implement Camera app using the template
- No bespoke DOM; iframe + standard toolbar where needed

1. Material + WinBox reinforcement

- Eager-load WinBox CSS/JS; await Material preload briefly before window mounts
- Status helpers exposed for diagnostics (`__gso.winboxStatus`, `__gso.materialReady`)

1. Telemetry surface (minimum)

- Events card shows live stream of frame/gesture/seat events

1. E2E guards

- Open from bar → singleton enforced (re-click focuses existing) ✔
- App Library open/close; add/remove app; reorder persists per-session
- Camera app opens via template and loads harness in iframe
- Real-vs-stub markers present; stub shows visible badge

## Acceptance Criteria

- Visual: App bar aligns center-bottom; Material tokens/colors; icons consistent size
- Interaction: Drag-reorder works; App Library add/remove works; re-click focuses
- Function: Every app uses the same template (SDK, API, Events, XState, MediaPipe, Perf, Models, Flags, Settings, Docs, Camera)
- Diagnostics: `__gso.winboxStatus().hasReal === true` (when WinBox is available)
- Stubs: Windows with placeholders show a visible "Stub" badge and data attribute
- Tests: e2e suite passes with new guards

## Implementation Plan

 A) Components & Files

- src/ui/components/appBar.js — app bar (icons, DnD, persistence)
- src/ui/components/appLibrary.js — Material modal (searchable grid)
- src/ui/components/cardTemplate.js — getOrCreateCardWindow(app, opts, mount)
- src/ui/shell/shell_os.js — wire components and registry; deprecate legacy dock

 B) Registry & Singleton

- `__gso._wb` registry for windows (already present); expose focus and close helpers
- cardTemplate enforces singleton + onclose cleanup; uniform testid

 C) Styling

- Ensure WinBox CSS loaded; add minimal Material wrappers (md-elevation, md-divider)
- Use Material icons or emoji fallbacks for app glyphs

 D) Camera Card

- Use template; mount iframe; standard note/status area; remove bespoke wrappers

 E) Telemetry (Events card)

- Subscribe to `window.__cam` and XState event bus; append tailing list (bounded)
- Provide copy/export

 F) Flags

- `FEATURE_GSOS_APPBAR=1` (default on)
- `FEATURE_GSOS_APPLIB=1` (default on)
- `FEATURE_GSOS_REQUIRE_WINBOX=0` (opt-in to warn if missing)

 G) E2E

- tests/e2e/gsos_appbar_singleton.test.js
  - Click icon twice → only one window exists
  - Drag-reorder persists within session
- tests/e2e/gsos_camera_card_template.test.js
  - Open Camera → template DOM present; data-winbox-type; iframe loads v2
- tests/e2e/gsos_app_library.test.js
  - Open App Library; add/remove app; app bar reflects changes

## Risks & Mitigations

- Risk: WinBox not served in some environments → keep stub fallback, add visible banner if `FEATURE_GSOS_REQUIRE_WINBOX=1`
- Risk: Material load race → small await; fallback renders without blocking
- Risk: DnD persistence complexity → start with session-only; persist later if needed

## Rollback

- Remove App Bar and App Library components; restore prior dock if required
- Keep wallpaper camera default ON (unchanged)

## Milestones (timebox)

- M1 (today): Card template + Camera migration + App Bar MVP + Events basic wiring
- M2 (+1 day): App Library + reorder persistence + tests
- M3 (+1 day): Polish (badges, icons), docs, and guards

## Notes

- All windows created via template must include `data-testid` and `data-winbox-type` attributes
- Stubs must include a visible badge/notice inside the window body
- Camera app is priority #1 for migration
