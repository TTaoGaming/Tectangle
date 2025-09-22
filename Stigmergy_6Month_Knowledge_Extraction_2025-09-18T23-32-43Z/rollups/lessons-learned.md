<!--
STIGMERGY LESSONS LEARNED
Generated: 2025-09-17T16:50Z
Data Sources: daily/weekly/monthly SRL, git_log_summary.py, manifest, blackboards
-->

# Lessons Learned (Jan–Sep 2025)

## Quantitative Signals
| Repo | Commits (all) | Commits since 2025-01-01 | Lines + (since) | Lines - (since) | Notes |
| --- | ---: | ---: | ---: | ---: | --- |
| handsfree/handsfree | 1,059 | 124 | 24,315,600 | 12,110 | Vendor bundles + production cleanup; huge diffs point to bundled dependencies. |
| Tectangle Project folder/Tectangle-Drumpad-ReplitV04292025 | 400 | 400 | 109,586 | 25,217 | Replit migration burst (2025-04-22?29). |
| Spatial Anchor MPE.../TAGS-MVP-Modular-Monolith-backup | 1 | 1 | 55,374 | 0 | Snapshot of production anchor monolith. |

> Large line counts (esp. handsfree) stem from checked-in vendor/build artifacts. Future work should keep dependencies external or via package managers.

## Recurring Failure Patterns
- **Restart Syndrome:** 24 distinct `package.json` roots + repeated monolith files; restarts often lacked ADRs. *Mitigation:* “ADR-before-restart” rule now captured in SRL/Plan.
- **Git Drift & Repo Corruption:** Drag-and-drop copies (e.g., `Tectangle-Drumpad`) broke `.git` history. *Mitigation:* Always clone/move via git; keep `.git_broken/` only as archive.
- **Telemetry Debt:** Across Jan–Jun, telemetry/testing repeatedly deferred. *Mitigation:* backlog captured in `telemetry_sync`; integrate instrumentation early in hex agents.
- **Asset Bloat:** Sample packs & vendor libs inflated diffs (handsfree 24M LOC added). *Mitigation:* externalise assets, use storage service or LFS, record ADRs for asset strategy.
- **Documentation Gaps:** Many high-change weeks lacked SRL/ADR; knowledge drifted until Stigmergy hub. *Mitigation:* Daily SRL + weekly rollups now in place.

## Success Vectors
- **Event-Driven Pipelines:** camera-MPE, TAGS monolith, and ECS drumpads validated event-first architecture; informs current distributed hex design.
- **Knowledge Consolidation:** `Knowledge backup 20250417` + Hope AI toolkit created portable heuristics and collaboration workflows.
- **Production Cleanup:** June handsfree sprint demonstrated effective Boy-Scout refactor and documentation practices.
- **Analytics Automation:** September hub established repeatable scripts (`loc_by_root.py`, `generate_rollup.py`, `git_log_summary.py`).

## Learning Themes to Carry Forward
1. **SRL Discipline:** Maintain daily (`rollups/2025-XX-daily-srl.md`), weekly, and monthly logs; tie each significant decision to an ADR.
2. **ADR Coverage:** Backfill outstanding ADRs (Jan, Feb, Apr, Jun, Jul, Aug, Sep) using new rollups; use them to gate restarts and architecture changes.
3. **Telemetry & Testing:** Prioritise instrumentation/testing in next sprints—recurring gap across months.
4. **Asset Hygiene:** Never bundle large vendor libs into repos; rely on package management or dedicated storage.
5. **Git Hygiene:** Clone to move; commit frequently; avoid detached HEAD during production refactors.
6. **Cross-Agent Communication:** Use Hope AI toolkit + blackboards to ensure parallel agents consume the same SRL/ADR knowledge.

## Immediate To-Do (Before Next Migration)
- Draft ADRs summarising the major migrations (React ECS, Replit port, handsfree cleanup, TAGS monolith).
- Implement telemetry/test backlog in the distributed hex architecture plan.
- Keep automation scripts with the hub when moving repositories; re-run after each relocation.
- Confirm `.history/` remains archived separately (not part of active code).

This document, together with the SRL layers and manifest, equips any AI/human collaborator to understand past failures, reuse proven patterns, and avoid repeating costly restarts.
