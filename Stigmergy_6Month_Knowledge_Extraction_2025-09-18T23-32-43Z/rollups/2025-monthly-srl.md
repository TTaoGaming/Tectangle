<!--
STIGMERGY REVIEW HEADER
Status: Draft
Generated: 2025-09-17T16:45Z
Source Metrics: scripts/loc_by_root.py, loc_spatial_anchor.py, loc_hope_ai.py, metrics/commits_per_day.csv
-->

# 2025 Monthly SRL Rollup

## Metrics Summary
| Month | LOC touched | Distinct files | Notes |
| --- | ---: | ---: | --- |
| 2025-01 | 259,961 | 959 | ARUCO prototype ? monolith |
| 2025-02 | 400,706 | 3,484 | React/TanStack + ECS migration |
| 2025-03 | 12,265 | 80 | ModularDrumpad cleanup |
| 2025-04 | 374,281 | 1,398 | Replit V0.4 + knowledge dump |
| 2025-05 | 0 | 0 | Planning pause |
| 2025-06 | 307,195 | 288 | Handsfree production cleanup |
| 2025-07 | 114,092 | 130 | TAGS archival |
| 2025-08 | 14,021 | 85 | Hope AI toolkit iteration |
| 2025-09 | 1,910 | 31 | Stigmergy hub & analytics |

> Structure per month: **Plan/Focus ? What Worked ? Challenges ? Carry-Forward Experiments/ADRs**. Weekly detail lives in `2025-weekly-srl.md`; daily logs are in `rollups/2025-XX-daily-srl.md`.

## January 2025 ? Tectangle Monolith Foundations
- **Weekly SRL:** See [2025-weekly-srl.md](2025-weekly-srl.md#january)
- **Plan/Focus:** Stand up the initial Tectangle drumpad prototype (single-file monolith) and prove the pinch-to-sound loop.
- **What Worked:** Built a working monolith (~260k LOC touched) with reliable pinch detection and rendered UI variants; established the first OpenCV + MediaPipe toolchains.
- **Challenges:** Architecture tightly coupled; git history largely absent. Frequent restarts without ADRs.
- **Carry-Forward:** File ADR-Jan on deterministic pinch heuristics, capture reusable vision pipeline notes in `pinch_stability`, and ensure every prototype lives in a fresh, committed repo.

## February 2025 ? Drumpad/ECS Expansion
- **Weekly SRL:** See [2025-weekly-srl.md](2025-weekly-srl.md#february)
- **Plan/Focus:** Push toward modularity (React/TanStack/Tailwind) and experiment with ECS-based drumpads; integrate sample libraries.
- **What Worked:** High velocity (~401k LOC) on React/Tailwind scaffolds, multiple ECS proofs, and sample pack integration; early knowledge bundles created.
- **Challenges:** Restart syndrome intensified (many `package.json` roots); asset bloat from samples.
- **Carry-Forward:** Adopt ?ADR before restart,? separate media assets, and capture ECS lessons in `expression_systems`.

## March 2025 ? Light Touch & Cleanup
- **Weekly SRL:** See [2025-weekly-srl.md](2025-weekly-srl.md#march)
- **Plan/Focus:** Housekeeping, documentation, stabilising February?s experiments.
- **What Worked:** Cleaned key guides; captured pinch heuristics in the knowledge backup set.
- **Challenges:** Minimal net code change (12k LOC) with limited checkpoints; decisions undocumented.
- **Carry-Forward:** Formalise monthly retros (SRL log) and migrate written guides into the Stigmergy hub for portability.

## April 2025 ? Replit Migration & Monolith v2
- **Weekly SRL:** See [2025-weekly-srl.md](2025-weekly-srl.md#april)
- **Plan/Focus:** Port the monolith into Replit V0.4 (Tailwind/TanStack) and align the architecture with modular drumpad goals.
- **What Worked:** Major throughput (~374k LOC) producing `Tectangle-Drumpad` Replit project, Tailwind config, TanStack integration; heavy knowledge dump (MDP guides, HTML Lit references).
- **Challenges:** Drag-and-drop corrupted `.git`; restarts continued without ADRs; testing absent.
- **Carry-Forward:** File ADR-Apr on migration rationale, re-clone repos when moving, establish weekly SRL reviews, and prioritise telemetry/testing backlog.

## May 2025 ? Minimal Activity
- **Weekly SRL:** (No code days recorded; planning pause)
- **Plan/Focus:** Strategic reflection and planning.
- **What Worked:** Allowed reevaluation of the pipeline direction.
- **Challenges:** No commits or reflections; risk of knowledge drift.
- **Carry-Forward:** Even pauses should produce SRL notes and ADR updates to maintain context.

## June 2025 ? Handsfree Production Clean
- **Weekly SRL:** See [2025-weekly-srl.md](2025-weekly-srl.md#june)
- **Plan/Focus:** Turn the handsfree camera-MPE pipeline into a production-grade build (Boy Scout cleanup).
- **What Worked:** Massive cleanup documented in `PRODUCTION-CLEANUP.md`; orientation-aware MIDI mapping verified; modular pipeline established (~307k LOC).
- **Challenges:** Detached repo head with untracked files; telemetry still not wired.
- **Carry-Forward:** Capture ADR-June on event-driven telemetry, commit after each cleanup, and schedule telemetry/testing implementation.

## July 2025 ? Post-Cleanup Iterations
- **Weekly SRL:** See [2025-weekly-srl.md](2025-weekly-srl.md#july)
- **Plan/Focus:** Extend ECS/React drumpads and finalise TAGS modular monolith backup.
- **What Worked:** Production reference archived (29k LOC) with comprehensive documentation.
- **Challenges:** Duplicate archives; git still detached.
- **Carry-Forward:** Link TAGS lessons to `anchor_interaction`/`telemetry_sync` and file ADR-July on anchor architecture.

## August 2025 ? Knowledge Hub Prep
- **Weekly SRL:** See [2025-weekly-srl.md](2025-weekly-srl.md#august)
- **Plan/Focus:** Consolidate documentation and refine the Hope AI collaboration toolkit.
- **What Worked:** Hope AI patterns, tools, and memory-bank hardened; metrics scripts prototyped; manifest seeded.
- **Challenges:** Git corruption in older repos not yet fixed; SRL/ADR entries still missing.
- **Carry-Forward:** File ADR-Aug05 on collaboration methodology; ensure future migrations use clean clones.

## September 2025 ? Stigmergy Hub & Analytics
- **Weekly SRL:** See [2025-weekly-srl.md](2025-weekly-srl.md#september)
- **Plan/Focus:** Stand up the Stigmergy 6-month hub and run analytics to digest past work.
- **What Worked:** Created metrics scripts, updated blackboards, reinitialised broken repos, produced SRL/weekly/monthly rollups, documented root knowledge, relocated the Stigmergy hub into Spatial Anchor MPE with manifests intact, and drafted a root extraction checklist now embedded in the hub for ongoing archive mining, archiving nested `.git` directories to keep the repo quiet, mining `archive/` for TAGS modularization guidance (module priorities, pipeline wrappers, strangler migration cadence), documenting Hope AI collaboration toolkit DNA, capturing the August Tectangle sprint roadmap/telemetry contracts, extracting the August 3 physics cleanup root (offline dependency loader, Jest upgrade, pinch physics playground), mining TAGS-AI-Optimized for the phased roadmap + Phase1 testing toolkit, cataloguing the working TAGS modular monolith (production bridges, diagnostic harness, organization plan) capturing `.kilocode/` MCP guardrails, mining the MVP hand tracking bundle (dependency checker, physics plan), and documenting `.github/`, `.history/`, `.kiro/`, `.vscode/`, `hand-physics-playground/`, `offline-dependencies/`, and loose standalone files.
- **Challenges:** ADR backlog still large; `.history/` now intentionally archived-only.
- **Carry-Forward:** Maintain daily SRL onward, work through ADR backlog, rerun automation from the new repo root, execute the root checklist to backfill SRL/ADR coverage (recording the `.git` archival decision plus archive/hope-ai/August sprint/physics cleanup/TAGS-AI-Optimized/working monolith insights), and automate telemetry/testing rollout.

---

### Next Actions
1. Continue daily SRL entries (`rollups/2025-09-daily-srl.md` onward) and link each decision to ADRs/blackboards.
2. Draft the outstanding ADRs (Jan, Feb, Apr, Jun, Jul, Aug, Sep) using weekly/monthly summaries as evidence.
3. Before future planning cycles, rerun metrics scripts (`generate_rollup.py`, `loc_by_root.py`) and update weekly/monthly rollups.












