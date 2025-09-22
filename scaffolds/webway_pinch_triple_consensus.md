---
id: ww-2025-003
owner: @you
status: active
expires_on: 2025-10-09
guard: none (dev only); follow-up: add smoke on goldens
flag: FEATURE_PINCH_TRIPLE_CONSENSUS_V1
revert: remove folder/flag
---

# Webway: Pinch triple-consensus (geom stabilized)

Goal: Stabilize pinch under bend by combining three independent signals (1D distance vs enter, kinematic v/a, and joint-angle velocity), both smoothed and predictive.

Proven path: NASA-style independent redundancy; distance and velocity consensus with angle velocity as a third channel.

Files touched: src/app/appShell.js, src/sdk/hexInputFacade.js

Markers: WEBWAY:ww-2025-003:

Next steps: Bind consensus.now/look to UI indicators; e2e assert majority pass on pinch goldens.
