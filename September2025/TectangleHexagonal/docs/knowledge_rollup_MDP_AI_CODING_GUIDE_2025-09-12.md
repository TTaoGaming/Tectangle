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

# Logic Rollup — MDP_AI_CODING_GUIDE

Source: Knowledge backup 20250912/MDP_AI_CODING_GUIDE.md

Quick reference

- Executive summary
- LOGICS

## Executive summary

Adopt test/harness patterns: deterministic seeds, fixture builders, and explicit contracts in tests. Prefer tiny, focused tests over end-to-end.

## OPTIONS

- Adopt: Mirror guide in test harness naming and fixtures.
- Adapt: Only adopt error-handling conventions.
- Invent: New harness.

## PICK

- Adopt — aligns with current smoke tests.

## SLICE

- Alias smoke tests to match guide sections; add tiny fixture generator for frames→JSONL with seeds in metadata.

## LOGICS

- Fixture: buildFrames(seed) → deterministic landmarks; include seed in metadata.
- Test contract: assert event envelope shape and specific fields; snapshot JSONL when stable.
- Retry/backoff: flaky tests limited to 1 retry with jitter.

Tiny pseudocode

```js
const fx = buildFrames(42); runHarness(fx).then(out => expect(out[0]).toMatchObject({manager:'PinchRecognitionManager'}));
```

KPIs

- Test runtime < 30s; deterministic outputs across runs.
