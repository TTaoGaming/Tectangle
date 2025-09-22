<!--
STIGMERGY CHECKLIST HEADER
Status: Draft
Generated: 2025-09-18T00:00:00Z
Scope: Spatial Anchor MPE root extraction
-->

# Spatial Anchor MPE Root Extraction Checklist

Use this checklist to drive SRL/ADR harvesting across the Spatial Anchor MPE root. Every item should surface daily observations, fold into weekly/monthly rollups under `Stigmergy_6Month_Knowledge_Extraction_2025-09-17T08-32-43Z/rollups/`, and produce ADR coverage when architecture or workflow decisions emerge.

## Progress Log
- 2025-09-18T03:55Z - Catalogued loose standalone files (AI summary notes, cleanup summary, simple demos) and published hub summary.
- 2025-09-18T03:50Z - Catalogued `offline-dependencies/` bundle (MediaPipe/Three.js/Oimo assets) and published hub summary.
- 2025-09-18T03:45Z - Mined `hand-physics-playground/` managers + step1 demos and published hub summary.
- 2025-09-18T03:35Z - Recorded `.kiro/` steering/specs suite for ADR planning.
- 2025-09-18T03:34Z - Logged `.vscode/` workspace defaults for tooling parity.
- 2025-09-18T03:30Z - Documented `.history/` archival snapshots policy.
- 2025-09-18T03:25Z - Summarized `.github/` Copilot guardrails.
- 2025-09-18T03:15Z - Mined `mvp/` offline demos + physics plan and published hub summary.
- 2025-09-18T03:05Z - Recorded `.kilocode/` MCP configuration guardrails for reproducible AI orchestration.
- 2025-09-18T02:55Z - Mined TAGS working modular monolith (production bridges, diagnostic harness) and published hub summary.
- 2025-09-18T02:35Z - Mined TAGS-AI-Optimized (phased roadmap, Phase1 testing harness) and published hub summary.
- 2025-09-18T02:20Z - Documented August 3 physics cleanup root (offline dependency loader, Jest upgrade, pinch physics playground) and published hub summary.
- 2025-09-18T02:05Z - Summarized August Tectangle sprint roadmap and pinch telemetry contract for standalone reuse.
- 2025-09-18T02:00Z - Catalogued Hope AI toolkit (personality, tools, memory bank) and mirrored findings into expression board summary.
- 2025-09-18T01:40Z - Mined `archive/` documentation (TAGS modularization plans, pipeline wrappers, strangler strategy) and logged insights into SRL rollups.
- 2025-09-18T01:20Z - Knowledge mining status captured; SRL/ADR layers ready, awaiting first root sweep beyond git hygiene.
- 2025-09-18T01:05Z - Archived nested `.git` directories (renamed to `.git_archived`) to keep git tooling quiet while preserving metadata.
- 2025-09-18T00:55Z - Relocated checklist into the Stigmergy hub, seeded initial status notes, and flagged git pointer remediation for ADR.\n## Root Inventory Coverage
| Root Item | Daily SRL Logged | Weekly/Monthly Rollup Updated | ADR Capture | Git History Reviewed | Notes |
| --- | --- | --- | --- | --- | --- |
| `.github/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/dot-github-summary.md`; retain Copilot rules when relocating. |
| `.history/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/history-summary.md`; archival snapshots retained for reference only. |
| `.kilocode/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/kilocode-summary.md`; copy MCP config + guardrails when relocating. |
| `.kiro/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/kiro-summary.md`; strategy specs inform ADR prioritisation. |
| `.vscode/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/vscode-summary.md`; replicate Live Server port/spellings when relocating. |
| `archive/` | [x] | [x] | [ ] | [ ] | July 2025 TAGS modularization docs catalogued (module priorities, pipeline wrapper plans, strangler migration); fold key actions into Pinch/Telemetry ADR backlog.
| `archive-august-3-2025-physics-cleanup/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/archive-august-3-2025-physics-cleanup-summary.md`; captures offline dependency loader, Jest test infra, pinch physics playground. |
| `archive-working-TAGS-MVP-Modular-Monolith/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/archive-working-tags-mvp-modular-monolith-summary.md`; identifies production bridges, diagnostics, organization plan. |
| `August Tectangle Sprint/` | [x] | [x] | [ ] | [ ] | Sprint mined; see `knowledge_summaries/august-tectangle-sprint-summary.md` for roadmap/telemetry contracts; draft ADR next. |
| `hand-physics-playground/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/hand-physics-playground-summary.md`; step1 physics demos + managers queued for reuse. |
| `hope-ai/` | [x] | [x] | [ ] | [ ] | Toolkit summarized (`knowledge_summaries/hope-ai-root-summary.md`); expression board updated; ADR pending. |
| `mvp/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/mvp-root-summary.md`; dependency checker + physics plan queued for ADR. |
| `offline-dependencies/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/offline-dependencies-summary.md`; ensure bundle paths stay intact. |
| `Stigmergy_6Month_Knowledge_Extraction_2025-09-17T08-32-43Z/` | [x] | [x] | [ ] | [ ] | Hub relocated; checklist lives here; ADR on relocation still pending; git history untouched.
| `TAGS-AI-Optimized/` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/tags-ai-optimized-summary.md`; phased roadmap + Phase1 testing harness ready for reuse; ADR pending. |
| `Loose files (*.md/html)` | [x] | [x] | [ ] | [ ] | Summary in `knowledge_summaries/loose-files-summary.md`; consolidate key notes/demos into ADR backlog. |

## Git Repository Audit Targets
Track each repository below as you work through the checklist. Capture key commits, intent, and migration state in SRL/ADR docs.

- [ ] `handsfree/handsfree` (detached @ 79df12e): export production cleanup lessons and telemetry hooks.
- [ ] `Spatial Anchor MPE v25.7.10` (main @ b0d79dc): document modularization refactor; cross-link to TAGS boards.
- [ ] `Spatial Anchor MPE v25.7.10/TAGS-MVP-Modular-Monolith` (broken .git): decide whether to restore or archive; log outcome.
- [ ] `Spatial Anchor MPE v25.7.10/TAGS-MVP-Modular-Monolith-backup` (detached @ 0de457c): confirm snapshot integrity; tie into anchor ADRs.
- [ ] `Tectangle Project folder/*` repos (React/ECS, ModularDrumpad variants): map commits to monthly SRL stories.
- [ ] `hand-physics-playground/*` repos: `.git` folders archived; mine commit chronology from preserved clones if needed.

Add new rows as additional git roots surface (see `Stigmergy/.../metrics/git_repos.csv`).

## Knowledge Mining Snapshot
- Roots touched (SRL logged): 16 of 16 (100%).
- Roots fully mined with ADR + history review: 0.
- ADRs outstanding: git archival decision, hub relocation, archive knowledge linkage, Hope AI toolkit, August sprint roadmap, physics cleanup dependency loader, TAGS-AI-Optimized roadmap/test harness, working monolith bridge/test ADR, MCP tooling guardrail ADR, MVP offline dependency checker ADR, hand-physics playground bridge ADR, `.github` Copilot guardrail ADR.
- All roots mined; proceed to ADR backfill and git repo audits.

## SRL -> Weekly -> Monthly Flow Checklist
- [x] Daily SRL logging active for relocation, git archival work, and archive mining (`2025-09-daily-srl.md`).
- [x] Weekly rollup updated with checklist creation and git archival notes (`2025-weekly-srl.md`).
- [x] Monthly rollup reflects hub relocation, git archival action (`2025-monthly-srl.md`).
- [ ] ADRs queued for decisions above; create as mining proceeds.

## Immediate Actions
1. Backfill ADRs for each mined root (relocation, `.git_archived`, Hope AI, August sprint, physics cleanup loader, TAGS AI roadmap, working monolith bridges, MCP guardrail, MVP dependency checker, `.github` Copilot rules).
2. Draft ADRs for the hub relocation, `.git_archived` decision, Hope AI toolkit, August sprint modularization, physics cleanup dependency loader, and TAGS-AI-Optimized roadmap/test harness.
3. Map archive/physics cleanup-derived module priorities into subsystem blackboards (pinch, telemetry, expression).



























