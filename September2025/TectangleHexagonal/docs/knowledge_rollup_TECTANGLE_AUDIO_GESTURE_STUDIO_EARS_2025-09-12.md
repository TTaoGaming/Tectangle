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

# Logic Rollup — TECTANGLE_AUDIO_GESTURE_STUDIO_EARS

Source: Knowledge backup 20250912/TECTANGLE_AUDIO_GESTURE_STUDIO_EARS.md

## Executive summary

Start with a log-only audio sink that turns gestures into note events, quantized to a tempo grid. Keep WebAudio behind a flag for later.

## OPTIONS

- Adopt: Map tectangle:gesture → audio:note with optional quantization.
- Adapt: Log-only sink for offline DAW import.
- Invent: Full audio engine.

## PICK

- Adapt — start with log sink.

## SLICE

- Add AudioSink adapter that writes JSONL with {note,on,off,velocity}; later wire WebAudio behind a flag.

## LOGICS

- Schema: audio:note {ts, note, velocity, on:boolean, channel=1}.
- Quant: beatMs=60000/bpm; q=round((ts+offset)/beatMs)*beatMs; swing/humanize optional.
- Mapping: pinch start → note on; pinch end → note off.

Tiny pseudocode

```js
function toNote(env){ const t=q(env.ts); return { ts:t, note:60, velocity:96, on:env.detail.type==='start' } }
```

KPIs

- Round-trip accuracy: quantized note timestamps within ±10ms of grid.
