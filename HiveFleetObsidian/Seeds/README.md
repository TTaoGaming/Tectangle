## HiveFleet Obsidian Seeds

Deterministic "seeds" define each persistent champion role: identity, mission boundary, exact IO contract, center-of-gravity kernel, safety rails, algorithms, mnemonic equipment, and a stepwise procedure whose success criteria can be machine‑checked. A seed is the single source of truth for prompt modes, tooling generation, lint, and documentation.

---
## Role Taxonomy (Approach Verbs)
Each champion owns exactly one primary verb (no overlap):
* EXPLORE - Faultline Seeker: Rapidly surface and classify a real fault (or declare Cold) with minimal probes.
* EXPLOIT - Thread Sovereign: Safely lock in one reversible performance / reliability gain with pre‑validated rollback.
* PIVOT - Prism Magus: Reframe stuck work into diverse reversible pilots and pick the winner with quantified confidence.
* REORIENT - Web Cartographer: Retrieve precedents, score reuse leverage, overlay deltas, emit a reversible first slice.
* RECORD - Silk Scribe: Append canonical SRL memory lines and maintain rolling horizons for compounding learning.
* ROUTE - Orchestrator: Single front door; verify safety triad, choose champion, emit minimal reversible micro‑plan.

Guiding philosophy (applies to all): Prefer Adopt > Adapt > Invent. Always bias to reversible, minimal, observable steps with explicit stop conditions.

---
## File Layout
```text
Seeds/
  agent_role_seed.schema.json     # JSON Schema (draft-07) authoritative spec
  AgentRoleSeed.template.yaml     # Up-to-date scaffold (aligns with schema)
  faultline_seeker.seed.yaml      # EXPLORE
  thread_sovereign.seed.yaml      # EXPLOIT
  prism_magus.seed.yaml           # PIVOT
  web_cartographer.seed.yaml      # REORIENT
  silk_scribe.seed.yaml           # RECORD
  orchestrator.seed.yaml          # ROUTE
  archive/                        # Historical frozen versions
  README.md                       # This document
```

All current seeds use the schema format.

---
## Schema Fields (Concise Map)
Core required: version, metadata, identity, lineage, mission, io, policies, procedure.
Important optional/extended: center_of_gravity, equipment, triggers, scope, glossary_plain, failure_modes, quality_gates, invocation, implementations, notes_patched_weaknesses.
### Motif Linting

Run `npm run hive:seeds:motif:lint` to enforce exclusivity of core metaphors (mirror, heat, thread, ledger, web, router, rollback). The script:

1. Scans `center_of_gravity.name` and every `equipment[].name`.
2. Ensures exclusive tokens only appear in their owning role.
3. Emits warnings (non-fatal) for other overlapping tokens not in the ignore set.

Extend by editing `motif_validator.mjs` (exclusive map / ignore set). Add more sources (e.g., motto) if thematic drift increases.


### center_of_gravity

Structured kernel anchoring the role:

```yaml
center_of_gravity:
  name: <Concise technical kernel>
  description: <Input focus → transformation → output in plain technical language>
  algorithms: [<algorithm tokens>]
  inputs: [<key input field names>]
  outputs: [<key output field names>]
```

Rules:

1. Name is technical (avoid pure metaphor without algorithmic signal).
2. Description states flow: dominant input set → core transformation principle → primary result artifact(s).
3. algorithms list must be subset of lineage.research or equipment.maps_to.
4. inputs/outputs are field name literals from io.* definitions.
5. Procedure should reference at least one listed algorithm (future lint will enforce).

---
 
## Champion Seed Essence (Reference Cards)

Each card captures: Mission (boundary), Kernel (center_of_gravity), Core Algorithms, Equipment shorthand, Typical Handoffs, Failure Highlights.

 
### Faultline Seeker (EXPLORE)
 
Mission: Surface a real fault fast with ≤3 safe micro‑probes; emit minimal repro + heat level or declare Cold.
Kernel: Heat Cascade - Adaptive multi‑probe search escalating from hypothesis framing to targeted mutation until a reproducible heat classification emerges.
Core Algorithms: adaptive branch search; coverage-guided fuzzing; invariant contract challenge; differential shadow compare; heat scale classification.
Equipment: Ember Cape (branch search); Seed Crucible (coverage fuzz); Brand Iron (contract challenge); Shadow Lens (shadow diff).
Primary Outputs: classification, heat_score, repro, evidence, next.
Typical Handoff: To Thread Sovereign if Warm+ or Hot for exploitation.
Failure Risks: False heat (env noise); unstable repro; over‑minimization; stale shadow.

 
### Thread Sovereign (EXPLOIT)
 
Mission: Lock in one reversible gain: highest scored cut, safely proven, instantly rewindable.
Kernel: Reversible Gain Planner - Scores reversible improvement candidates then executes guarded stepwise rollout with shadow diff and pre‑validated rollback.
Core Algorithms: value bandit scoring; greedy cut planner (A*-like); flagged canary rollout; shadow dual-run diff; rollback rehearsal.
Equipment: Loom Abacus; Thread Spear; Woven Shield; Shadow Spindle; Rewind Dragline.
Primary Outputs: headline, why, steps, guardrail, rollback.
Typical Handoff: Back to Silk Scribe (record) or Web Cartographer (if structural path emerges).
Failure Risks: Mis-specified tripwire; unstable baseline; stale rollback path.

 
### Prism Magus (PIVOT)
 
Mission: Hold the goal node; reframe path. Simulate, prune, and recommend best reversible pilot (with fallback).
Kernel: Mirror Reframe Engine - Generates structural reframings, simulates counterfactual outcomes, prunes to diverse reversible pilots, selects winner with confidence.
Core Algorithms: representation refactor; constraint swap; counterfactual monte carlo; contextual bandits (thompson); pareto prune + diversity.
Equipment: Mirror Mask; Tide Compass; Constraint Frame; Flow Shears; Ripple Basin.
Primary Outputs: frames, pilots, pick.
Typical Handoff: Thread Sovereign for exploitation of chosen pilot; Silk Scribe for SRL logging.
Failure Risks: Non-distinct pilots; drift between simulation & reality; constraint breach.

 
### Web Cartographer (REORIENT)
 
Mission: Reorient via precedent: adopt or adapt a proven pattern, overlay gaps, and lay first WebWays slice.
Kernel: Precedent Overlay Engine - Retrieves proven patterns, scores reuse leverage, overlays target on current map, extracts reversible strangler slice & scaffold.
Core Algorithms: proven pattern retrieval; leverage ladder scoring; dependency impact propagation; progressive strangler slicing; delta overlay mapping.
Equipment: Pattern Telescope; Leverage Scale; Impact Compass; Strangler Lattice; Overlay Lens.
Primary Outputs: map_summary, options, pick, webways, first_slice.
Typical Handoff: Thread Sovereign (implement slice) or Prism Magus (if reframing needed).
Failure Risks: Reinventing prematurely; oversized first slice; mis-scored leverage.

 
### Silk Scribe (RECORD)
 
Mission: Persist each SRL event and emit next review horizon so lessons compound predictably.
Kernel: Horizon Ledger - Appends canonical SRL events, derives retrieval tags, maintains rolling horizon summaries for next review.
Core Algorithms: append-only srl logging; horizon rollup synthesis; temporal tag search.
Equipment: Ledger Quill; Horizon Loom; Recall Lantern.
Primary Outputs: srl_line, next_review, tags.
Typical Handoff: All roles feed Scribe; Scribe output informs planning retros.
Failure Risks: Mutation of past lines; missing imperative lesson; rollup drift.

 
### Orchestrator (ROUTE)
 
Mission: Produce a champion delegation: minimal reversible plan, safety triad intact, SRL note emitted.
Kernel: Safety Triad Router - Verifies metric, tripwire, rollback then routes problem to correct champion with ≤3 reversible steps.
Core Algorithms: routing arbitration; safety triad verification; deterministic micro planning.
Equipment: Conductor Baton; Safety Seal; Timeline Gauge. (Uses 'revert path' instead of 'rollback' to reserve rollback motif for Thread Sovereign.)
Primary Outputs: plan, guardrail, delegate, srl.
Typical Handoff: To targeted champion (EXPLORE/EXPLOIT/etc.).
Failure Risks: Missing rollback path; champion mismatch; vague tripwire.

---
 
## Designing a New Seed (Checklist)

1. Identity: element (symbolic grouping), archetype (narrative clarity), approach (unique verb), motto (memorable constraint lens).
2. Mission: One crisp sentence (verb + boundary + success condition).
3. center_of_gravity: Name + description (input → transform → output) + algorithms subset + explicit inputs/outputs arrays.
4. Lineage: 2-4 mythic analogs (for narrative anchor), 4-7 research algorithm tokens (canonical primitives).
5. IO Contract: Each field (name, type, required, description) + realistic example block.
6. Equipment: Every research primitive appears in at least one equipment maps_to; no ornamental duplicates.
7. Policies: Guardrails (always true constraints) vs Stop Rules (trigger immediate halt / handoff).
8. Procedure: 5-7 steps, verb-object names, deterministic success_criteria (objective signals, thresholds, counts, sets, or structural presence tests).
9. Failure Modes: High leverage risks summarised in neutral technical phrasing.
10. Quality Gates: Machine-checkable booleans or threshold specs; future harness will evaluate.
11. Invocation.one_line: Parameterized form consumed by adapters / orchestrator.
12. Glossary Plain: Only if term is coined and not obvious; define once, no metaphor.
13. notes_patched_weaknesses: Document rationale for structural changes between versions.
14. Archive previous version before committing major edits.
15. Run validation & lint (see below).

---
 
## Success Criteria Heuristic Lint

Script: `HiveFleetObsidian/tools/lint_success_criteria.mjs` (heuristics: max length, objective signals, avoid pure vagueness). Extend by adding patterns for numeric comparators, set cardinalities, explicit enumerations.

Upcoming lint ideas (roadmap):

* center_of_gravity algorithms referenced in ≥1 step.
* Unused research algorithm detection.
* Duplicate or near‑duplicate equipment mapping collapse suggestion.
* Approach enum enforcement and mismatch detection.

---
 
## Equipment & Algorithm Mapping Rules

* Each algorithm token should have: (a) appearance in lineage.research, (b) mapped equipment mnemonic, (c) at least one procedure step usage (directly or via center_of_gravity algorithms list).
* Avoid synonyms; create a canonical alias if convergence needed (future alias map).
* Use lowercase descriptive tokens (e.g. `coverage-guided fuzzing`).

---
 
## Procedure Authoring Patterns

Prefer laddered flow: Frame → Plan → Act → Verify → Package / Route.
Success criteria patterns:

* Structural: "All required output fields present".
* Quantitative: "Path length ≤ 5 actions".
* Stability: "Repro stable 2 consecutive runs".
* Safety: "0 tripwire breaches over ≥5m window".
Explicit failure fallback conditions live in stop_rules, not success_criteria.

---
 
## Validation & Tooling

Run validation:

```bash
npm run hive:seeds:validate
```
Outputs PASS/FAIL per seed; non‑zero exit halts CI on structural regressions.

Run success criteria lint (example command if script wired):

```bash
node HiveFleetObsidian/tools/lint_success_criteria.mjs
```

---
 
## Versioning & Archive Discipline

* Bump metadata.version (date or semver) on meaningful contract changes (IO, mission, kernel, guardrails, procedure flow).
* Copy old file into `archive/` with suffix `.v<old-version>.yaml` before editing.
* Summarize modifications in `notes_patched_weaknesses` (why the change lowers cognitive load / increases determinism).

---
 
## Glossary Plain Style Guide

* ≤120 chars.
* First word a noun or imperative verb.
* No narrative metaphors (that's for equipment names only).
* Define novel system terms only (skip standard CS/ML vocabulary).

---
 
## Template Sync

`AgentRoleSeed.template.yaml` stays aligned with schema fields. When schema changes: (1) update schema, (2) revise template, (3) update this README section, (4) regenerate or lint seeds as needed.

---
 
## Roadmap (Next Enhancements)

* Algorithm alias / overlap matrix + pruning.
* Center-of-gravity reference lint.
* Approach enum enforcement in schema (closed set).
* Pattern catalog & leverage scoring harness.
* Probe budget registry (EXPLORE) & pivot pack registry (PIVOT).
* Automated prompt emission tests (golden snapshots).

---
Maintainers: Update this README whenever schema fields, approach taxonomy, or lint capabilities evolve. Treat seeds as living contracts-optimize for clarity, determinism, and minimal surface area.
