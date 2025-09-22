# HFO Ship - Portable Knowledge + History Bundle

## Purpose

- Self-contained, copy/pasteable folder for HiveFleetObsidian (HFO).
- Local indices, rollups, ADR links, and verification gates.

## Quickstart (Windows PowerShell)

- npm i (top-level) if missing node_modules
- node HiveFleetObsidian/tools/hfo_ship_index.mjs
- node HiveFleetObsidian/tools/hfo_ship_rollup.mjs

## What's inside

- knowledge/: core purpose and scribe notes
- historythread/: daily/weekly rollups (NOT-PRODUCTION-READY by default)
- ship/: portable docs, manifest, and local indices

## Verification stance

- Everything is NOT-PRODUCTION-READY unless verified via Verification Port.
- See HiveFleetObsidian/ship/VERIFICATION_PORT.md

## Portability

- No heavy deps; pure Node scripts. Outputs are content-only.
- Safe to copy to another workspace at HiveFleetObsidian/.
