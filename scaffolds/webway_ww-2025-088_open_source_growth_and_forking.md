---
id: ww-2025-088
owner: @webcartographer
status: active
expires_on: 2025-10-20
guard: ci:oss-health (lint+unit green; CONTRIBUTING present; LICENSE present; CODE_OF_CONDUCT present)
flag: FEATURE_OSS_GROWTH
revert: remove note + logs; revert doc stubs if added
---
# Webway: Long‑term OSS growth and forkability

## Goal

Articulate durable open‑source goals so the project can grow, be adopted, and be safely forked: clear license, contribution guide, modular boundaries, test gates, and release/versioning discipline.

## Constraints

- License clarity and third‑party compliance (MediaPipe Tasks, etc.) (source: message)
- Minimal governance that doesn’t slow small slices (source: defaults)
- Keep CI green, fast, and helpful (source: defaults)

## Current Map

- Active Webways and SRL/ADR logs; tests and e2e present; feature flags isolate slices. Some docs exist (README, scaffolds). (source: repo)

## Timebox

20m planning/logs; 60–90m to add doc stubs and check guards. (source: defaults)

## Research Notes

- Forkability thrives on: permissive licensing, clean module seams, clear contributor docs, and small, verifiable slices (tests/golds). (source: message)
- Release hygiene: changelog, semver tags, feature flags to stage changes. (source: message)

## Tool Inventory

- CI (npm scripts, jest/puppeteer), lints, Silk Scribe indices, Webways. (source: repo)

## Options (Adopt‑first)

1. Doc baseline — Ensure LICENSE/CONTRIBUTING/CODE_OF_CONDUCT exist; add fork/branch/release guidance to README.
   - Trade‑offs: fastest, immediate clarity.
2. Governance guard — Add `ci:oss-health` that verifies docs and runs lint+unit.
   - Trade‑offs: small effort, strong baseline.
3. Modular release — Introduce packages for adapters (gesture tasks, sidecars) with independent semver.
   - Trade‑offs: more structure; pays off with adoption.

## Recommendation

Options 1+2 now; plan Option 3 as usage grows.

## First Slice

- Add CONTRIBUTING.md and CODE_OF_CONDUCT.md stubs aligned with project values; verify LICENSE headers and third‑party attributions.
- Update README with: project intent, flags, how to run demos/tests, how to propose changes, and how to fork.

## Guard & Flag

- Guard: `ci:oss-health` — checks files exist and CI passes.
- Flag: `FEATURE_OSS_GROWTH` used only to scope doc references when integrating in UI (optional).

## Industry Alignment

- Healthy OSS projects document contributor pathways and keep a crisp release surface. (source: message)

## Revert

- Remove stubs if undesired; keep license clarity intact.

## Follow‑up

- Add a CHANGELOG.md and automate release notes from conventional commits.
- Consider a CLA/lightweight DCO.
