---
title: "Project Timeline & Canonicalization Report"
created_at: "2025-09-06"
source: "September2025/Tectangle/docs/Project_Timeline_Summary_2025-09-06.md"
author: "auto-generated"
human_verified: false
---
# Project Timeline & Canonicalization Report — Tectangle & PinchFSM

Author: auto-generated  
Date: 2025-09-06  
Purpose: One‑page executive timeline, per‑file timestamps, project progress map, and canonicalization plan to make the workspace reliable.

TLDR
- I scanned the workspace and extracted timestamps from major docs and archives. The active work cluster is concentrated in early September 2025 (PinchFSM two‑pagers, Tectangle triage and HOPE_NOTEBOOK entries). The "Knowledge backup 20250417" contains older reference material (Apr 2025). Immediate recommendation: apply the Exploit quick fix (guard bootstrap), capture golden traces, create a canonical Knowledge hub, and run an inventory+classification pass to mark Gold / Reference / AI‑slop.

Summary of findings
- Deterministic pinch design ready: palm‑gated index↔thumb pinch with One‑Euro smoothing, knuckle‑span normalization, hysteresis and FSM emitting pinch:down/pinch:up — see [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1).
- Fast path (Exploit) is documented: guard bootstrap, reuse [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1) and add a demo bridge — see [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1).
- Prototypes exist (modular index) demonstrating MediaPipe → OneEuro smoothing → press detection and in‑page key mapping — see [`September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md`](September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md:1).
- A Keyboard Bridge protocol exists for remote/native bridges — see [`September2025/Tectangle/prototype/landmark-smooth/modular-index/docs/keyboard-bridge-protocol.md`](September2025/Tectangle/prototype/landmark-smooth/modular-index/docs/keyboard-bridge-protocol.md:1).
- The repo already uses golden traces and smoke harness concepts — see [`September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md:1).

Quick chronology (high level)
- April 2025: Knowledge backups and reference lit (folder `Knowledge backup 20250417`; example: [`Knowledge backup 20250417/4_RECTANGLE_GUIDE.md`](Knowledge backup 20250417/4_RECTANGLE_GUIDE.md:1) — Last Updated: Apr 15, 2025).
- August 2025: Foundation spec drafts, manager deep dives, EARS specs and Tectangle long‑term phases (many docs under `August Tectangle Sprint/` and `archive-2025-09-01T19-13-05Z/`).
- 2025‑09‑01 → 2025‑09‑04: Consolidation activities — HOPE_NOTEBOOK entries and GameBoard updated (see [`September2025/Tectangle/HOPE_NOTEBOOK.md`](September2025/Tectangle/HOPE_NOTEBOOK.md:1)).
- 2025‑09‑04 → 2025‑09‑05: PinchFSM two‑pagers, Video Goldens, Rapier two‑pager, tests and CI notes.
- 2025‑09‑06: Current triage and decision docs; consolidated pinch and diagnostics produced.

Per‑project progress snapshot
- Tectangle (core manager architecture)
  - State: Planning → Active triage. Key artifacts: [`September2025/Tectangle/Agent.md`](September2025/Tectangle/Agent.md:1), [`September2025/Tectangle/HOPE_NOTEBOOK.md`](September2025/Tectangle/HOPE_NOTEBOOK.md:1), [`September2025/Tectangle/GameBoard.md`](September2025/Tectangle/GameBoard.md:1).
  - Recent activity: bootstrap triage, decision to Exploit; timestamps early Sep 2025.
  - Risk: bootstrap fragility and CJS/ESM import issues; mitigation: guarded awaits + tolerant bootstrap, nightly snapshots.
- PinchFSM (gesture detection & POC)
  - State: Prototype → Deterministic POC. Key artifacts: [`September2025/PinchFSMHumanVlad/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md:1), [`September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md:1).
  - Recent activity: golden trace strategy, trace generator TODO, modular‑index prototype for OneEuro smoothing.
  - Risk: divergence between tests (replay) and live demo (bootstrap/asset/race issues); mitigation: headless demo smoke tests + golden‑trace CI.
- Foundation / August Tectangle Sprint
  - State: Archive + reference. Many manager deep dives and EARS specs in August 2025.
  - Recommendation: use as reference material; canonicalize essential specs into Knowledge hub.

Per‑file timestamp snapshot (selected high‑value files)
- [`September2025/Tectangle/Agent.md`](September2025/Tectangle/Agent.md:1) — CreatedAt: 2025-09-01T22:45:56.847Z, Version: 0.5  
- [`September2025/Tectangle/HOPE_NOTEBOOK.md`](September2025/Tectangle/HOPE_NOTEBOOK.md:1) — Entries timestamps: 2025-09-04T06:16:00Z, 2025-09-04T14:59:00Z  
- [`September2025/Tectangle/GameBoard.md`](September2025/Tectangle/GameBoard.md:1) — CreatedAt: 2025-09-01T22:45:56.847Z; LastUpdated: 2025-09-04T06:26:35.797Z  
- [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1) — Algorithm + FSM + telemetry (high value)  
- [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1) — Exploit decision grid (high value)  
- [`September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md`](September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md:1) — Prototype README  
- [`September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md:1) — Timestamp: 2025-09-05T00:05:00Z  
- [`September2025/PinchFSMHumanVlad/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/PinchFSM_Deterministic_2025-09-05.md:1) — Timestamp: 2025-09-05T00:00:00Z  
- Knowledge backup: [`Knowledge backup 20250417/4_RECTANGLE_GUIDE.md`](Knowledge backup 20250417/4_RECTANGLE_GUIDE.md:1) — Last Updated: 2025-04-15

Signal‑to‑noise classification (initial pass)
- Gold (high value, canonical):
  - [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1)  
  - [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1)  
  - [`September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md:1)
- Reference (useful, keep): manager deep dives, EARS specs, modular‑index README, HOPE_NOTEBOOK entries.
- Likely AI‑slop (needs verification): duplicated or near‑duplicate two‑pagers in `docs/archive/` — flag for human review and manual deduplication.

Canonicalization plan (recommended)
1) Inventory & classify (Immediate, 1–2 hours)
   - Produce a single machine‑readable inventory: `docs/doc_inventory.json` containing path, header timestamp (if present), file size, word count, first‑line excerpt, and an MD5 hash. This catalog enables deterministic selection of the latest artifact.  
   - Suggested CLI: `node ./scripts/generate_doc_inventory.js --out docs/doc_inventory.json`
2) Gold selection & consolidation (1 day)
   - From the inventory, select 10–20 Gold docs (pinch plan, decision docs, HOPE_NOTEBOOK entries, Video Goldens, GameBoard, Agent.md). Move them into `docs/knowledge/` with normalized headers and canonical filenames: `<project>_<doc_slug>_YYYYMMDD.md`.  
   - Example canonical path: [`September2025/Tectangle/docs/knowledge/Pinch_Feature_Plan_20250906.md`](September2025/Tectangle/docs/knowledge/Pinch_Feature_Plan_20250906.md:1)
3) Archive & prune (0.5 day)
   - Move duplicates, AI‑generated slop, and old unused notes to `archive-stale/` with a snapshot manifest.
4) Add metadata & header checks (CI) (1 day)
   - Enforce header schema (YAML): title, timestamp, author, generated_by (optional), human_verified (bool). Add `.github/workflows/header-check.yml` running `node scripts/check_headers.js`.
5) CI gating: golden‑trace & demo smoke (1–2 days)
   - Add headless demo job that loads key demo pages and verifies wiring/console events. Require `BACKUP-CREATED:` line in PR body and golden‑trace update when core managers change.

Proposed immediate 7‑step plan (next 7 days)
1. Create `docs/doc_inventory.json` (scripts) and run across repo (today).  
2. Select Gold docs (10) and move into `docs/knowledge/` with normalized headers (1 day).  
3. Apply quick Exploit code patch: guard bootstrap in the prototype (1–2 hours).  
4. Generate one golden trace and run smoke test; confirm parity (1 day).  
5. Add header‑check CI job and snapshot script (1–2 days).  
6. Start canonicalization PR with snapshot manifest and Gold doc list (1 day).  
7. Draft phased hexagonal refactor spec for core + adapters (2–3 days).

Notes about restarts, AI edits, and preventing loss
- Root causes of frequent restarts: ad‑hoc edits, AI‑generated diffs lacking human‑verified headers, and missing snapshots. Mitigation: require snapshot/backup and header checks before automated edits; require tests + golden trace when editing managers. Use branch‑per‑experiment, daily automated snapshots, and small focused PRs to lower blast radius.

Longer‑term architecture recommendation
- Start with Exploit (quick wins) while preparing Option C (Hexagonal) as canonical long‑term architecture. Build the Hexagonal core in small increments using Strangler Fig: create ports for event bus, landmarks input, telemetry, and synthetic output; implement MediaPipe/Human as adapters. This lets you run parallel AI agent swarms against adapters without destabilizing the core.

Appendix — Selected files with timestamps & short notes
- [`September2025/Tectangle/Agent.md`](September2025/Tectangle/Agent.md:1) — Agent descriptor; HOPE Notebook integration. (2025‑09‑01)  
- [`September2025/Tectangle/HOPE_NOTEBOOK.md`](September2025/Tectangle/HOPE_NOTEBOOK.md:1) — Notebook with HOPE entries and tool reports. (2025‑09‑04)  
- [`September2025/Tectangle/GameBoard.md`](September2025/Tectangle/GameBoard.md:1) — GameBoard state snapshot. (2025‑09‑01 / LastUpdated 2025‑09‑04)  
- [`September2025/Tectangle/docs/pinch_feature_plan.md`](September2025/Tectangle/docs/pinch_feature_plan.md:1) — algorithm + FSM + telemetry (high value)  
- [`September2025/Tectangle/docs/pinch_mvp_decision.md`](September2025/Tectangle/docs/pinch_mvp_decision.md:1) — Exploit decision grid (high value)  
- [`September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md`](September2025/Tectangle/prototype/landmark-smooth/modular-index/README.md:1) — prototype quickstart  
- [`September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md`](September2025/PinchFSMHumanVlad/docs/two-pagers/VideoGoldens_TwoPager_2025-09-05.md:1) — golden master strategy  
- [`September2025/PinchFSMHumanVlad/docs/TODO_mediapipe_trace_generator.md`](September2025/PinchFSMHumanVlad/docs/TODO_mediapipe_trace_generator.md:1) — trace generator plan  
- [`Knowledge backup 20250417/4_RECTANGLE_GUIDE.md`](Knowledge backup 20250417/4_RECTANGLE_GUIDE.md:1) — older reference (Apr 2025)

Open questions (to resolve during canonicalization)
- Do you want me to create `docs/knowledge/` and migrate the Gold docs there, or do you prefer a different canonical path?  
- Which 10–20 docs should be marked Gold? I propose starting with the files listed in the Appendix above.  
- Do you want automated snapshot creation to run on PR creation (CI) or leave snapshots manual for now?

Final recommendation (short)
- Immediate: run inventory + classify, apply the Exploit quick fix, capture a golden trace and run the smoke harness. Then create the Gold knowledge hub and CI header checks so future AI edits are safe.

End of report.