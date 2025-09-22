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

# Logic Rollup — HTML_LIT_REFERENCE_20250417

Source: Knowledge backup 20250912/HTML_LIT_REFERENCE_20250417.md

Quick reference

- Executive summary
- LOGICS

## Executive summary

Provide a DOM-only DevPanel to inspect canonical envelopes without framework lock-in. Sampling and filtering ensure low overhead; a future Lit version can be swapped in as an adapter.

## OPTIONS

- Adopt: DevPanel (DOM-only) subscribes to EventBus to render envelopes.
- Adapt: Lit-based panel later.
- Invent: New UI kit.

## PICK

- Adopt (DOM-only) — avoids new deps now.

## SLICE

- Add DebugPanel module (no framework); mount via ?debugPanel=1; filter by manager/event.

## LOGICS

- Panel contract: init({container, sampleHz=10, filters:{manager,event}}).
- Data: ring buffer 200 events; render virtualized list.
- Safety: redaction applied before render (reuse MDP logics).

Tiny pseudocode

```js
setInterval(()=>render(buffer.slice(-N)), 1000/sampleHz);
```

KPIs

- <1ms render for last 50 events; no dropped frames at 60Hz app.
