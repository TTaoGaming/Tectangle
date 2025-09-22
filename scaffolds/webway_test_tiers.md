---
id: ww-2025-012
owner: @TTaoGaming
status: active
expires_on: 2025-10-09
guard: npm run -s hex:tier:repeat
flag: FEATURE_TEST_TIERS
revert: remove folder/flag
---

# Webway: Tiered test cadence for Hex SDK v5

Goal: Add fast repeatable checks and stagger heavy tests to reduce dev friction while keeping drift guards.
Proven path: Use existing scripts — hex:verify:fast/full, SDK offline smokes, telemetry goldens, visual snapshots, and jest e2e.
Files touched: package.json (scripts: hex:tier:repeat|commit|hourly|daily|weekly)
Markers: WEBWAY:ww-2025-012:

- WEBWAY:ww-2025-012: repeat → hex:verify:fast + sdk idle/pinch smokes + guard
- WEBWAY:ww-2025-012: commit → hex:verify:full + SDK smokes + guard
- WEBWAY:ww-2025-012: hourly → commit tier + telemetry goldens + appshell smoke
- WEBWAY:ww-2025-012: daily → hex:verify:daily bundle
- WEBWAY:ww-2025-012: weekly → full jest e2e + visual snapshots + rich export

Next steps:

- Wire CI to run hex:tier:commit on PRs and hex:tier:daily nightly.
- Optional: add TTL enforcement check that warns when expired.
