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

# Logic Rollup — 4_RECTANGLE_GUIDE

Source: Knowledge backup 20250912/4_RECTANGLE_GUIDE.md

Quick reference

- Executive summary
- LOGICS

## Executive summary

Use the four-rectangle framing to visualize and constrain UI vs. domain seams. Render a debug overlay tied to canonical events; keep domain pure, UI observational. Toggle via query param to avoid coupling.

## OPTIONS

- Adopt: Map “four rectangles” to ports/adapters and event surfaces; add overlay.
- Adapt: Use rectangles only in debug docs.
- Invent: New layout/runtime.

## PICK

- Adopt — complements Hex seams without code churn.

## SLICE

- Add debug overlay toggle rendering rectangles; subscribe to canonical events.
- Document which managers publish within each rectangle; link from README.

## LOGICS

- Overlay contract: {rects:[{id,name,bounds}], feeds:[{rectId, event, sampleRateHz}]}
- Toggle: ?overlay=rects; keyboard shortcut alt+R.
- Back-pressure: cap overlay to 15 FPS; decimate events via sampleRateHz per feed.
- No domain write: overlay subscribes only; zero mutation.

Tiny pseudocode

```js
function subscribeFeeds(bus, feeds) { feeds.forEach(f => bus.on(f.event, rateLimit(f.sampleRateHz, draw))); }
```

Metrics/acceptance

- Overlay adds <2ms/frame cost at 60Hz off; <0.5ms when on with decimation.
