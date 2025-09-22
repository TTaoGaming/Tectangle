---
id: ww-2025-031
owner: @tommy
status: active
expires_on: 2025-10-09
guard: npm run -s hex:verify:full
flag: FEATURE_SDK_FACADE_V0
revert: remove folder/flag
---

# Webway: SDK adoption layers (Base → Secondary → Tertiary)

Goal: Document and enable a minimal, boundary-clean facade for input with layered primitives up to anchors/TUI, with a simple revert.
Proven path: SDK facade v0 (DI-only) and index bone-chain normalization helper; goldens and unit tests green.
Files touched: September2025/TectangleHexagonal/README.md
Markers: WEBWAY:ww-2025-031:

Next steps:

- Add optional calibration on seat claim (knuckle span cm).
- Consider a facade-based smoke that replays golden clips and asserts lock + enriched presence.
