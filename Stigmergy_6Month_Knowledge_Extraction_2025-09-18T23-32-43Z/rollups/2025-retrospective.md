<!--
STIGMERGY ROLLOVER
Generated: 2025-09-17
Source: scripts/loc_by_root.py, metrics/commits_per_day.csv
-->

# 2025 Archive Retrospective (Jan–Sep)

## High-Level Totals
- Text/code files analysed (<=1 MB, audio/assets skipped): **6,388**
- Aggregate lines of code & docs: **1,279,459**
- Extension mix: `.js` 796k, `.html` 202k, `.md` 101k, `.json` 66k, `.css` 43k, `.ts` 41k, `.tsx` 29k (others <1k).
- Commits since 2025-03-01 (from existing metrics): **284** across a 32-day streak ending 2025-09-17, peaking at 25 commits/day (2025-09-16).

## Monthly Production Rhythm (UTC modified timestamps)
| Month 2025 | Lines touched | Primary Focus |
|------------|---------------|----------------|
| January    | 259,961 | Tectangle monolith build-out (`Tectangle/`, `React ECS` experiments). |
| February   | 400,813 | Drumpad iterations, ECS scaffolds, opencv integrations. |
| March      | 8,353   | Light edits—mostly documentation & cleanup. |
| April      | 371,376 | Replit V0.4 restart, migration scripts, Tailwind/TanStack wiring. |
| June       | 147,164 | Handsfree camera-MPE production cleanups, gesture instrument mobile build. |
| July       | 76,817  | Follow-up ECS refactors, asset curation. |
| August     | 14,021  | Knowledge-hub prep, doc consolidation. |
| September  | 954     | Stigmergy hub bootstrapping & analytics. |

> Months with high throughput align with new monolith spins and migration pushes; low points indicate planning/document-only windows rather than inactivity.

## Workstreams by Top-Level Root
| Root | Lines | Notes |
|------|-------|-------|
| `Tectangle Project folder/` | **997,088** | 15+ drumpad/ECS variants, Replit port, opencv/tooling and historic monoliths. |
| `handsfree/` | 144,979 | Camera-MPE production, gesture instrument, interactive projector variants. |
| `Spatial Anchor MPE v25.7.10/` | 79,261 | TAGS modular monolith backup & current camera builds. |
| `Tectangle code backups/` | 45,526 | Early ModularDrumpad snapshots (useful for diffing regressions). |
| `hope-ai/` | 6,059 | Orchestration scripts, methodology docs. |
| `Knowledge backup 20250417/` | 4,218 | Early knowledge drops (srly documentation). |

## AI-Assisted Highlights
- **Large Index Monoliths:** 19k-line camera-MPE builds (`handsfree` & `Spatial Anchor`) plus 6k-line gesture instrument confirm repeated large-scale porting efforts.
- **Re-initialised Repo:** `Tectangle-Drumpad/` git metadata was corrupted (missing refs). Archived as `.git_broken/` and reinitialised (`git init`) with remote set to `origin` for fresh commits.
- **Handsfree Repo:** Still intact but on detached `57610e7`; contains untracked workspace files worth either committing or ignoring.

## Next Steps
1. Decide whether to re-clone historical repos (e.g., `replitTectangleDrumpad`) to recover legacy commit graph. `.git_broken/` holds the partial metadata if needed.
2. Use `python scripts/loc_by_root.py` after future sprints to keep month-over-month trendlines updated.
3. Continue filling `archive_todo.md` and subsystem blackboards as each legacy pocket is mined.
## Restart Syndrome Trace
- Detected **24** distinct project roots with their own `package.json` (active frameworks, React/ECS, Replit ports). This approximates the number of full restarts/fresh scaffolds captured in the archive.
- Key clusters:
  - `Tectangle Project folder/` contains 11 of the restarts (multiple Drumpad and ECS variations).
  - `handsfree/handsfree` holds the gesture-instrument and interactive-projector scaffolds.
  - `Spatial Anchor MPE v25.7.10` & `Tectangle code backups/` add modular monolith and archival spins.
- Large index monoliths (>6k LOC) spotted in seven builds (see `scripts/large_index_scan.py`), marking major rewrite milestones.
## Additional Roots (Hope AI & Knowledge Backup)
- `hope-ai/`: ~16.6k LOC across archive/tools/memory-bank; fuels collaboration protocols and will travel with Stigmergy as the meta-layer.
- `Knowledge backup 20250417/`: 4.2k lines of drumpad/MDP reference guides—already linked into `expression_systems` and `pinch_stability` boards for heuristic reuse.
- `Tectangle code backups/`: 45.5k lines (Jan–Apr 2025) of ModularDrumpad + OpenCV glue, captured via `scripts/loc_tct_backups_summary.py`.
