<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Log decisions in TODO_2025-09-16.md
-->

---
id: ww-2025-005
owner: @TTaoGaming
status: active
expires_on: 2025-10-07
guard: unit:pinchCore-span-ema + smoke:toi-enter-cross
flag: spanEmaEnabled
revert: remove folder/flag
---

# Webway: Span EMA + clamp normalization

Goal: Stabilize normalized pinch distance by smoothing MCP span with EMA and clamping to a rolling-median band to resist foreshortening spikes/dips.
Proven path: EMA with alpha = 1 - exp(-dt/tau); median clamp window ~90 samples; floor 0.75×median, ceil 1.25×median.
Files touched: src/core/pinchCore.js
Markers: WEBWAY:ww-2025-005:
Next steps:

- Add warm-up gate: delay pinch enters until median has 10+ samples or 250ms elapsed.
- Add small per-frame rate limit on span changes (optional).
