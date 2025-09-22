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

# Logic Rollup — mdp90a_REFERENCE_20250417

Source: Knowledge backup 20250912/mdp90a_REFERENCE_20250417.md

Quick reference

- Executive summary
- LOGICS

## Executive summary

Bake policy constraints into code headers, PR templates, and CI checks to prevent accidental PII or retention violations. Keep enforcement lightweight and reversible.

## OPTIONS

- Adopt: Add policy headers and privacy notes to telemetry code.
- Adapt: Central POLICY.md and link.
- Invent: Policy linter.

## PICK

- Adopt — lightweight, reversible.

## SLICE

- Add file headers in TelemetryManager noting PII posture and retention; add PR template checklist item for mdp90a.

## LOGICS

- Header template: policy:low-PII, retention:7d, export:prompted.
- PR template: checkboxes for PII fields, retention changes, network sinks.
- CI: grep fail on forbidden fields /(image|bitmap|pixels)/ and disallowed sinks unless flagged.

Tiny pseudocode

```js
if (/image|bitmap|pixels/i.test(JSON.stringify(detail))) fail('PII-like fields present');
```

KPIs

- Zero CI policy violations on main; PR checklist completion 100%.
