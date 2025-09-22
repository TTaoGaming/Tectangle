---
id: ww-2025-002
owner: @TTaoGaming
status: active
expires_on: 2025-10-06
guard: lab:getStats exposes calibration mapping; feature behind flag
flag: FEATURE_HEX_CALIBRATE_HAND_ID
revert: remove folder/flag
---

# Webway: Hand ID Calibration via Pinch-Hold

Goal: Let users assign stable IDs to hands (neutral → U1/U2) with simple pinch-hold gestures, without changing core routing.
Proven path: Pinch-hold with hysteresis and dwell used in many gesture UIs; integrates non-invasively with the existing Hand ID Lab.
Files touched: dev/hand_id_lab.html; src/adapters/hand_calibration.mjs
Markers: WEBWAY:ww-2025-002:
Next steps: Wire mapping into controller routing (adapter) so Hx → controllerId honors calibration when flag is on.
