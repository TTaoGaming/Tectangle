---
id: ww-2025-001
owner: @TTaoGaming
status: active
expires_on: 2025-10-06
guard: e2e:no-pinch-crossover — teleports<6; reassigns<4; frames>30
flag: FEATURE_HEX_HAND_TRACKER_T1
revert: remove folder/flag
---
# Webway: Tier‑1 Hand Tracker (NN + inertia + side prior)

Goal: Stabilize per-hand identity (H1/H2 → controllerId) for local multiplayer and cleaner routing.

Proven path: Nearest‑neighbor on wrist with velocity inertia and short occlusion memory (SORT‑lite pattern), as used in the `dev/hand_id_lab.html` demo.

Files touched: `src/ports/mediapipe.js`, `src/adapters/hand_event_router.mjs`, `September2025/TectangleHexagonal/dev/hand_id_lab.html`

Markers: WEBWAY:ww-2025-001:

Next steps:

- Implement tracker behind FEATURE_HEX_HAND_TRACKER_T1 with params: occlusionMemory=200 ms; maxJump≈0.18; teleport>0.42.
- Emit `{ handId, controllerId }` in the port and surface in router; update HUD in hand_id_lab.
- Add e2e: no‑pinch crossover → teleports<6, reassigns<4, frames>30; wire guard to CI.

Notes

- Keep core pure; all ID logic lives in ports/adapters.
- Inline one‑line markers in changed files: `// WEBWAY:ww-2025-001: <short note>`.
- Revert by removing WEBWAY markers and disabling the `FEATURE_HEX_HAND_TRACKER_T1` flag.
