---
id: ww-2025-104
owner: @ttao
status: active
expires_on: 2025-10-12
guard: ci:test keymap wrist-compass JSON schema + visual smoke
flag: FEATURE_KEYMAP_WRISTCOMPASS
revert: remove feature flag and files under src/hex/keymap/
---
# Webway: KeyMap + WristCompass (4 pinches/hand)

## Goal

Define and persist a user-editable keymap that combines wrist orientation (quaternion/compass) with four pinches per hand to emit keyboard/MIDI mappings; provide a simple Wrist Compass visual editor and import/export JSON.

## Constraints

- Offline-first, no telemetry out; settings via LocalStorage (hex adapter) initially.
- Keep CPU/GPU light for mid-range Chromebooks/phones.
- Backward compatible with existing settings; versioned schema.

## Current Map

- Settings hex exists with LocalStorage adapter (namespace + defaults).
- HUD and v2 demo expose hand states; ReplayLandmarks hex available for deterministic inputs.
- No formal keymap schema or Wrist Compass editor yet.

## Timebox

20 minutes (defaults)

## Research Notes

- Wrist orientation can be derived from palm normal + wrist vector (source: MediaPipe landmarks) (source: message)
- User wants 4 pinches/hand then wrist-orientation mapping to keys/MPE (source: TommyNotesSeptember2025.txt)
- Deterministic replay via ww-2025-103 helps test mappings headlessly (source: scaffolds/webway_ww-2025-103-replay-landmarks-hex.md)

## Tool Inventory

- Jest-Puppeteer e2e; http-server tasks; Settings hex; ReplayLandmarks hex (source: repo)

## Options (Adopt-first)

1. Baseline — Static JSON schema + import/export + read-only Wrist Compass.
   - Trade-offs: Fast to land; no live editing; good for CI guard.
2. Guarded extension — Add minimal editor (sliders for compass sectors, dropdown keys) with preview via ReplayLandmarks.
   - Trade-offs: Slight UI work; big UX win; reversible behind flag.
3. Minimal adapter — Emit both Keyboard and WebMIDI events via mapping layer.
   - Trade-offs: Adds cross-browser concerns; can be optional.

## Recommendation

Option 2: small visual editor plus JSON import/export. Keyboard first; MIDI later.

## First Slice

- Schema v1: { version: 1, sectors: 4x4, perHand: {L,R}, perPinch: index/middle/ring/pinky → keyCode }.
- Wrist Compass: divide yaw into N sectors (start with 4). Show current sector; allow assignment.
- Persist under settings namespace hex.settings.keymap.v1; add import/export buttons.

## Guard & Flag

- Guard: unit test asserts schema versioning + import/export round-trip; e2e smoke renders compass and applies one mapping.
- Flag: FEATURE_KEYMAP_WRISTCOMPASS gates UI; mapping runtime can default OFF when flag is false.

## Industry Alignment

- Game keybind UIs and MIDI mapping UIs commonly use sector/slot editors; JSON export is standard.

## Revert

- Delete keymap files and remove the feature flag usage; settings fallback to defaults.

## Follow-up

- Add WristCompass pinch telemetry panel and a “test tone” via WebAudio when a mapping fires.
