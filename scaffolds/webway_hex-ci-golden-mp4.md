---
id: ww-2025-092
owner: @TTaoGaming
status: active
expires_on: 2025-10-01
guard: "npm run -s hex:verify:full && npm run -s hex:goldens"
flag: HEX_CI_STRICT
revert: remove folder/flag
---
# Webway: Hex CI + Golden MP4 Guardrail

## Goal

Institutionalize hexagonal architecture checks and golden master MP4 validation in CI so every slice ships with reproducible video-based assertions and boundary lint, keeping demos honest and reversible.

## Constraints

- CI must pass locally and in PRs; Windows dev, Node >=18 (source: file:package.json)
- No flaky E2E; prefer offline MP4/JSONL replays (source: defaults)
- Deps budget: reuse existing scripts; avoid new runners (source: defaults)
- Privacy/security: no external calls in CI (source: defaults)

## Current Map

- Scripts exist: hex:lint-arch, hex:test:unit, hex:validate, hex:validate:goldens, hex:goldens, hex:tier:* (source: file:package.json)
- Golden preparation and verification present for idle/twohands (source: package.json + September2025/TectangleHexagonal/tools)
- Idle/no-lock smoke: tests/smoke/quick_count_hands_idle.smoke.mjs (source: file)

## Timebox

timebox_minutes=20 (source: defaults)

## Research Notes

- Boundary lint uses dependency-cruiser config (source: hex-boundary.cjs)
- Golden export/guard uses JSONL size/shape comparisons (source: tools/*)

## Options (Adopt-first)

1. Baseline — PR gate task
   - What: Gate PRs on hex:verify:full and hex:goldens; surface reports as artifacts.
   - Trade-offs: Slower PRs but deterministic.

2. Guarded extension — Visual snapshots
   - What: Add hex:visual:snapshot in nightly; keep PR gate lean.
   - Trade-offs: Storage/time costs.

3. Minimal adapter — Quick smoke tier
   - What: Run hex:tier:commit in PR; daily runs handle full suite.
   - Trade-offs: May miss rare regressions until daily.

## Recommendation

Option 3 for PRs, Option 2 nightly; keep Option 1 available via manual check.

## First Slice

- Introduce HEX_CI_STRICT flag to optionally run full suite; default PR runs hex:tier:commit.

## Guard & Flag

- Guard: hex:verify:full + hex:goldens must pass in strict runs.
- Flag: HEX_CI_STRICT enables strict mode in CI workflow (future wiring).

## Industry Alignment

- Golden master testing and architecture lint are standard guardrails for refactors in hexagonal systems.

## Revert

- Disable HEX_CI_STRICT or revert CI workflow step.

## Follow-up

- Wire GitHub Actions workflow; cache Puppeteer assets; publish artifacts.
