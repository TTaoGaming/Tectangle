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
id: ww-2025-004
owner: @TTaoGaming
status: active
expires_on: 2025-10-07
guard: e2e:controller_router_lockin
flag: HEX_IFRAME_PINCH_BRIDGE
revert: remove folder/flag
---

# Webway: Pinch → iframe bridge

Goal: Send pinch down/up as postMessage to parent so demo pages (e.g., Dino) can translate to key events without touching core.
Proven path: Existing postMessage plumbing in src/app/main.js; dino page listens for {source:'hex', type:'pinch-key'}.
Files touched: src/app/main.js, dev/pinch_dino.html
Markers: WEBWAY:ww-2025-004:
Next steps:

- Add tiny toggle UI in dev/index.html to enable/disable bridge (defaults to on).
- Consider routing per-seat to different keys inside game iframe.
