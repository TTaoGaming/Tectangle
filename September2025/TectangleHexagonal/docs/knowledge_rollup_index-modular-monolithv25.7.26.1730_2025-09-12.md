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

# Logic Rollup — index-modular-monolith (v25.7.26)

Source: Knowledge backup 20250912/index-modular-monolithv25.7.26.1730.html

Quick reference

- Executive summary
- LOGICS

## Executive summary

Use the historic modular monolith index as a truth source to measure drift against today’s Hex/manager boundaries. Tag events with module_area and run a one-off drift script that outputs a JSONL report; fix only high-impact seams first.

## OPTIONS

- Adopt: Tag events with module_area to validate boundaries.
- Adapt: Generate drift report only.
- Invent: Restructure modules immediately.

## PICK

- Adapt — measure first.

## SLICE

- Emit module_area tag; one-off script compares monolith index vs manager owners; output JSONL drift report.

## LOGICS

- Tagging: on manager registration, set owner_module and emit as tags.module_area on envelopes.
- Mapping: parse index into {manager->moduleArea} baseline.
- Drift rule: drift if env.tags.module_area !== baseline[moduleOwner(manager)].
- Report: JSONL rows {ts, manager, event, module_area, baseline_area, severity}.
- Severity: high if cross-cutting concerns (e.g., domain in UI, IO in domain).

Tiny pseudocode

```js
function checkDrift(env, baseline) {
	const area = env.tags?.module_area, base = baseline[env.manager];
	if (area && base && area !== base) writeJsonl({ ts: env.ts, manager: env.manager, event: env.event, module_area: area, baseline_area: base });
}
```

KPIs

- Drift rate < 5% of total events; high-severity drifts reduced to zero within 2 slices.
