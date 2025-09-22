<!--
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
- [ ] Re-evaluate this artifact against current Hexagonal goals
- [ ] Validate references against knowledge manifests
- [ ] Log decisions in TODO_2025-09-16.md
-->

# Logic Rollup — modular-blueprint

Source: Knowledge backup 20250912/modular-blueprint.md

## Executive summary

Use the blueprint to assert manager ownership and reduce cross-module chatter. Start with tags and telemetry, then plan code moves once hotspots are evident.

## OPTIONS

- Adopt: Tag managers with module ownership.
- Adapt: Only update docs.
- Invent: Reshuffle code now.

## PICK

- Adopt — tags are reversible; code moves later.

## SLICE

- Add owner_module tag on manager registration; surface in telemetry to spot cross-boundary chatter.

## LOGICS

- Ownership map: ManagerName → owner_module.
- Chatter metric: edges[ownerA→ownerB]++ when events cross boundaries.
- Drift budget: each pair has a max edges/day threshold; alert when exceeded.

Tiny pseudocode

```js
if (env.tags?.module_area !== owner_module[env.manager]) edges.add(env.manager, env.tags?.module_area);
```

KPIs

- Top-3 cross-boundary edges reduced by 50% within two slices.
