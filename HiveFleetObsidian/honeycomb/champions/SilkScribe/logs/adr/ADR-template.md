---
adr_id: ADR-<NNN>
title: <short decision title>
status: Proposed | Accepted | Superseded | Rejected
date: <YYYY-MM-DD>
owners: [Tom Tai]
tags: [architecture, decision, HFO]
guard: SIM_TRIPWIRE: <objective fail conditions>
flag: FEATURE_FLAG: <flag name if gated>
ttl: <ISO date if temporary>  # optional (e.g., 2025-10-11)
context: |
  <why we're deciding; constraints; goals>
decision: |
  <the decision in 1-3 bullets>
consequences: |
  <positive/negative outcomes; risks>
alternatives_considered:
  - <Alt A + why not>
  - <Alt B + why not>
metrics: 
  success:
    - <measurable target 1>
    - <measurable target 2>
  tripwires:
    - <auto-revert rule 1>
    - <auto-revert rule 2>
rollout_plan: |
  <phased steps; flags; canaries; revert>
notes: |
  <links, refs, follow-ups>
---
