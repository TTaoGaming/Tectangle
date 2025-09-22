---
id: ww-2025-020
owner: @assistant
status: active
expires_on: 2025-10-08
guard: smoke: verify_v10_boot
flag: FEATURE_RICH_SEAT_LOCK_V9,FEATURE_RICH_SEAT_LOCK_V10
revert: remove import path edits + delete this note
---
# Webway: SeatLock Adapter Path Fix
Goal: Unblock V7/V9/V10 consoles by resolving 404s on imports (seatLockRichAdapter + core app modules).
Proven path: Correct relative depth from dev/ to project root: use `../../../src/...` rather than `../src/...`.
Files touched: `integrated_hand_console_v7.html`, `integrated_hand_console_v9.html`, `integrated_hand_console_v10.html`.
Markers: WEBWAY:ww-2025-020
Next steps: If hex subproject gains its own copy, revert to relative `../src/` and remove this note.
