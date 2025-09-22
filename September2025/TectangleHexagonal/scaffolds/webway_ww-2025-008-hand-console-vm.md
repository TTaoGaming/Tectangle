---
id: ww-2025-008
owner: @you
status: active
expires_on: 2025-10-08
guard: unit test handConsoleViewModel.test.mjs snapshot shape + landmark passthrough
flag: FEATURE_HAND_CONSOLE_VM
revert: remove folder/flag
---
# Webway: Hand Console ViewModel Unification

Goal: Provide a single pure aggregation layer for pinch/orientation/flex/velocity/seat + landmarks to feed all Integrated Hand Console variants (V4–V6) without duplicating per-page logic.

Proven path: ViewModel + Renderer Ports (mirrors existing createAppShell separation) aggregated via `createHandConsoleViewModel`.

Files touched:
- src/ui/createHandConsoleViewModel.js (new)
- dev/integrated_hand_console_v4.html (flagged wiring)
- dev/integrated_hand_console_v6.html (flagged wiring)
- tests/unit/handConsoleViewModel.test.mjs (guard)

Markers: WEBWAY:ww-2025-008

Next steps:
1. Migrate any additional signal types (future: dwell, flick, calibration spans) into the VM.
2. Replace direct per-page seat & pinch logs in legacy pages once confidence high.
3. Add replay harness snapshot assertion (optional) for deterministic replays.
4. Graduate: rename flag to FEATURE_HAND_CONSOLE_VM_V1 and update docs.

Revert path: delete new files + flag usage (pages fallback to legacy code path). Minimal risk.
