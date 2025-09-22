---
id: ww-2025-049
owner: @TTaoGaming
status: active        # active|ready|done|expired
expires_on: 2025-10-09   # auto-expire TTL
guard: design_audit + ui_canary (CI)
flag: FEATURE_UI_M3_CANON
revert: remove folder/flag
---
# Webway: Material Design 3 Canon for Tectangle Hexagonal
Goal: Adopt Material Design 3 as the UI canon for active demos (v4+) and catch obvious UI drift automatically.
Proven path: v4 Material demo + token validator + design audit + UI canary in CI.
Files touched: dev/design/m3.tokens.json, dev/design/m3.tokens.css, tests/golden-master/v4_design.audit.test.js, dev/design/validate_tokens.mjs, dev/design/scan_ui_m3_canon.mjs, .github/workflows/design_audit.yml, README.md, agent.me, dev/demo_fullscreen_sdk_v4_material.html
Markers: WEBWAY:ww-2025-049:
Next steps: Add pixel-diff (jest-image-snapshot) and axe-core a11y checks; migrate legacy pages by removing LEGACY_UI tag and importing tokens.
