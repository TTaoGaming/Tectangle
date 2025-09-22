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

# Logic Rollup — REACT_REFERENCE_20250417

Source: Knowledge backup 20250912/REACT_REFERENCE_20250417.md

## Executive summary

Provide a tiny React hook that subscribes to EventBus without coupling domain logic to React. The domain remains pure ESM; React is an adapter only.

## OPTIONS

- Adopt: Provide tiny useEventBus hook example.
- Adapt: Document pattern only.
- Invent: React-specific managers.

## PICK

- Adopt — small snippet, no runtime dependency required.

## SLICE

- Add snippet doc showing subscribe/unsubscribe in effect; keep domain pure ESM.

## LOGICS

- Hook contract: useEventBus(event, handler) → returns unsubscribe.
- Safety: cleanup on unmount; passive listeners only.

Tiny pseudocode

```js
useEffect(()=>{ const off=bus.on(evt,fn); return ()=>off(); }, [evt,fn]);
```

KPIs

- No memory leaks (subscriptions == unsubscriptions over test run).
