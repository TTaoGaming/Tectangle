---
id: ww-2025-120
owner: @you
status: active
expires_on: 2025-10-05
guard: npm run -s hex:overlay:verify
flag: FEATURE_GSOS_AUTOSTART_ON_CLIP
revert: remove folder/flag
---
# Webway: GSOS autostart forwarding on clip

## Goal
Ensure GSOS forwards autostart=1 to camera iframes when a clip= is provided via query, keeping deterministic golden playback without manual clicks.

## Constraints
- Privacy: no additional telemetry. (source: defaults)
- Security: no secrets; client-only. (source: defaults)
- CI: all existing guards must pass. (source: defaults)
- Deps: no new libs. (source: defaults)

## Current Map
GSOS forwards top-level query params to camera iframes (v13/v2). If clip is present but autostart is omitted, playback may stall awaiting user gesture. Wallpaper is opt-in to avoid camera contention. (source: message)

## Timebox
20 minutes. (source: defaults)

## Research Notes
- v13 console honors clip and autostart query params. (source: codebase)
- GSOS already forwards params; slight logic added to auto-append autostart=1 when clip is present. (source: codebase)

## Tool Inventory
- npm scripts: hex:overlay:verify, hex:smoke:golden. (source: package.json)
- Static server tasks at 8080/8091 for e2e. (source: tasks)

## Options (Adopt-first)
1. Baseline — Document manual ?autostart=1 usage.
   - Trade-offs: Fragile CI if omitted.
2. Guarded extension — Append autostart=1 when clip present, behind FEATURE_GSOS_AUTOSTART_ON_CLIP flag (default ON).
   - Trade-offs: Minimal code path; reversible via flag.
3. Minimal adapter — Add top-level ?AUTO=1 alias translated to autostart=1 for child iframes.
   - Trade-offs: Adds another param surface; low benefit.

## Recommendation
Option 2 because it is minimal, reversible, and aligns with CI determinism.

## First Slice
- In gesture_shell_os_v1.html, when building iframe src: if clip present and no autostart/auto param, append autostart=1 when FEATURE_GSOS_AUTOSTART_ON_CLIP is enabled.

## Guard & Flag
- Guard: hex:overlay:verify must remain green.
- Flag: FEATURE_GSOS_AUTOSTART_ON_CLIP (default ON; disable with ?FEATURE_GSOS_AUTOSTART_ON_CLIP=0).

## Industry Alignment
- Media sites commonly auto-play test fixtures under explicit flags. (source: defaults)
- Keeps user-gesture policies respected for real camera paths. (source: defaults)

## Revert
- Remove the flag use and the src augmentation logic.

## Follow-up
- Add one-click "Open v13 Fullscreen" shell control.
- TTL check on 2025-10-05 to confirm continued need.
