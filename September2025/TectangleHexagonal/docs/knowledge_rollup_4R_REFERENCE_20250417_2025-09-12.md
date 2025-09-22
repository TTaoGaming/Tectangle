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

# Logic Rollup — 4R_REFERENCE_20250417

Source: Knowledge backup 20250912/4R_REFERENCE_20250417.md

Quick reference

- Executive summary
- LOGICS

## Executive summary

Operationalize 4R as guardrails. Requirements map to contracts and acceptance checks; Risks to telemetry tags and watchdog rules; Roadmap to reversible slices; Rules to PR checklist and runtime enforcement. Outcome: safer, auditable changes to core logic without blocking iteration.

## OPTIONS

- Adopt: Encode 4R (Requirements/Risks/Roadmap/Rules) as acceptance gates (contracts, telemetry, watchdog).
- Adapt: Translate 4R into a DoD checklist per PR affecting logic.
- Invent: New governance toolchain.

## PICK

- Adopt — zero deps, immediate leverage, reversible.

## SLICE

- Add watchdog: enforce envelope fields/tags; emit watchdog:violation (alert-only).
- Add PR checklist referencing 4R; require risk note for behavior changes.
- Tag telemetry with risk_level when applicable.

## LOGICS

- Required envelope fields: ts, manager, event; optional: frameId, tags; no PII in detail.
- Risk tagging: tags.risk_level ∈ {low,medium,high}; required when behavior changes.
- Change notes: PR must include R4 context linking requirement and rule.
- Watchdog rules: schema validation; missing tags for high-risk emit watchdog:violation.

Tiny pseudocode

```js
function validateEnvelope(env) {
	const required = ['ts','manager','event'];
	if (required.some(k => env[k] == null)) return violation('missing_fields');
	if (env.tags?.risk_level === 'high' && !env.tags?.change_id) return violation('missing_change_id');
}
```

Metrics/acceptance

- 0 schema violations over 1000 events.
- 100% of behavior-changing PRs include 4R section.
