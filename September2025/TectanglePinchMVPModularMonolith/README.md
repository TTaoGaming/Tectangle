# Tectangle — Pinch Piano MVP

This README is optimized for working with an AI coding assistant in VS Code. It explains what the single‑file demo does, the architectural seams to preserve, and exactly how to run, test, and extend it toward a hexagonal design with CI.

---

## Quick start

1. Save the canvas HTML as `index.html` in an empty folder.
2. Open the folder in VS Code.
3. Run a static server:
   ```bash
   npm i -D http-server puppeteer
   npx http-server . -p 8080
   ```
4. Open `http://localhost:8080/index.html` in Chrome.
5. Click **Start camera** and allow permission.

**Notes**
- WebMIDI requires Chrome (secure context or `localhost`).
- KeyboardEvents are in‑page only; use WebMIDI for audible notes.

---

## What the app does (today)

- Uses **MediaPipe Hands (CDN)** to track 21 landmarks per hand (up to two hands).
- Runs a **Pinch core** (FSM + OneEuro + palm‑gate + kinematic clamp + speculative down) **per hand**.
- Emits events: `pinch:down`, `pinch:hold`, `pinch:up`.
- Bridges events to:
  - In‑page **KeyboardEvents** (`Z` for Right/C4, `X` for Left/D4)
  - **WebAudio** beep
  - **WebMIDI** NoteOn/Off (first available output)
- Shows a **virtual keyboard** that lights up on **down/hold/up**.
- Records **golden JSONL** (downloadable) for deterministic replays and CI.
- Provides `window.__replayGolden(frames)` to **replay goldens headlessly** (no camera).

**Goal fit**: This is the “Exploit” path MVP; it demonstrates a reliable palm‑gated pinch that triggers key down/hold/up both visually and via MIDI.

---

## Controls (purpose & tips)

- **Start camera**: toggles camera & tracking.
- **Palm gate** + **Palm cone (°)**: only accept pinches when palm normal faces camera within the cone (defaults to 30°). Use this to cut off false pinches from side‑on poses.
- **Speculative down**: emits a provisional `pinch:down` when TOI is near future (−40…120 ms). Good for snappier feel; will cancel if not confirmed.
- **Enter threshold**: normalized distance to *enter* pinch. Lower is more sensitive.
- **Exit threshold**: normalized distance to *exit* pinch. Higher is stickier (longer holds).
- **OneEuro: minCutoff, beta, dCutoff**: smoothing knobs. Increase `beta` for responsiveness; increase `minCutoff` to reduce jitter.
- **Audio beep / WebMIDI**: feedback options. MIDI targets the first output device.
- **Calibration wizard**: quick open/close to estimate knuckle span. Stored in query param and per‑hand localStorage.
- **Download golden JSONL**: exports replayable trace for tests.

---

## Virtual keyboard mapping

- **Right hand** → key `Z` → MIDI **C4**.
- **Left hand** → key `X` → MIDI **D4**.

Tiles light on **down**, show a subtle glow while **held**, and clear on **up**.

---

## File layout (single‑file modular monolith)

All logic lives in `index.html`:
- **Adapters**: MediaPipe source, WebAudio, WebMIDI, Overlay/HUD, Golden recorder
- **Domain core**: `createPinchFeature(cfg)`
- **Orchestrator**: wires adapters ↔ core (one core per hand)
- **Headless test hook**: `window.__replayGolden(frames)`

These seams map directly to future hexagonal ports.

---

## Architectural invariants (for AI assistants)

When asking an AI assistant to change code, **keep these stable** unless you intend to update tests and call sites:

- **Events**: `pinch:down`, `pinch:hold`, `pinch:up` (shape `{type, t, speculative?, dur?}`)
- **Headless hook**: `window.__replayGolden(frames)` must exist and accept frames with `{t, norm}` (at minimum). It should drive the core without a camera.
- **Golden format**: JSONL; first line is `{"meta":{...}}`. Subsequent lines may include `t`, `norm`, `state`, `gate`, `event`, `hand`, `spec`.
- **IDs & classes** used by the UI: `#cam`, `#overlay`, `#startStop`, `#enter`, `#exit`, `#cone`, `#palmGate`, `#speculative`, `.key[data-key]` (`Z`/`X`).
- **Two cores** keyed by `hand` in `cores: Map<"Left"|"Right", ...>`.

If the assistant proposes a large refactor, require **golden parity** and keep the replay hook compatible.

---

## Running headless tests locally (no camera)

1. Start the server in one terminal:
   ```bash
   npx http-server . -p 8080
   ```
2. Create `tests/golden/pinch_baseline_01.jsonl` by downloading a golden from the UI and saving it to that path.
3. Create `tests/smoke/headless-demo-smoke.js` with a replay/assertion harness (see snippet in the chat or ask the assistant to generate it).
4. Run the smoke:
   ```bash
   node tests/smoke/headless-demo-smoke.js
   ```

**Pass criteria**: No page errors; at least one `pinch:down` and `pinch:up` in the correct order.

---

## Run a local video and collect a golden (automated)

1. Start the server:
   ```bash
   npx http-server . -p 8080
   ```
2. Run the Puppeteer helper with your MP4 path:
   ```bash
   node tests/smoke/run_video_collect_golden.js "right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch.mp4"
   ```
   Options:
   - Override thresholds: `ENTER=0.40 EXIT=0.60 node tests/smoke/run_video_collect_golden.js video.mp4`
   - Target a custom URL: `DEMO_URL=http://localhost:8080/index.html ...`
3. Output:
   - Golden JSONL saved to `tests/out/video_golden.jsonl`
   - Console prints a telemetry snapshot (downs/ups, mean latency, specCancel%)

You can also run videos manually in the UI via the new "Load video file" control (no camera permission needed). Goldens download via the button.

---

## Adding GitHub Actions CI (smoke)

Create `.github/workflows/pinch-smoke.yml`:
```yaml
name: pinch-smoke
on:
  pull_request:
    paths:
      - 'index.html'
      - 'tests/**'
      - '.github/workflows/**'
  push:
    branches: [ main ]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm i -D http-server puppeteer
      - run: npx http-server . -p 8080 & sleep 2
      - run: node tests/smoke/headless-demo-smoke.js
```

**PR rule of thumb**: If you touch gesture/core logic, attach an updated golden and note threshold changes.

---

## Golden JSONL schema (stable & diff‑friendly)

- Line 1: `{ "meta": { "sha": "...", "device": "...", "fps": 30|60|"rAF", "cfg": {"enter":0.30,"exit":0.42,"cone":30} } }`
- Subsequent lines: Any combination of:
  - `t` (ms),
  - `norm` (normalized distance),
  - `state` (FSM state),
  - `gate` (boolean),
  - `event` ("down"|"up"),
  - `hand` ("Left"|"Right"),
  - `spec` (boolean speculative down).

Keep keys short and numeric values at low precision (2–4 decimals) for clean diffs.

---

## Common tasks (ask your AI like this)

**Add a palm‑cone meter arc**
- *Prompt*: “In `index.html`, inside the Overlay module, draw a small arc gauge in the top‑right that turns green when palm angle ≤ cone and gray otherwise. Use `HUD.setPalmAngle()` to get the latest angle and read the cone from `#cone`.”

**Persist per‑hand calibration**
- *Prompt*: “When calibration completes, detect handedness and store spans into `localStorage` keys `tectangle.span.Left` and `tectangle.span.Right`. On start, prefer per‑hand span; fall back to query `fixedSpan`, then MCP distance.”

**Add WebMIDI output selector**
- *Prompt*: “Replace the simple `MidiOut` with a dropdown to choose outputs. Populate options from `navigator.requestMIDIAccess().outputs`. Persist the selection to localStorage. Update send() to route to the chosen output.”

**Introduce a KF for TOI**
- *Prompt*: “Add a 1‑state Kalman filter on normalized distance velocity to stabilize TOI. Keep it optional behind `enableKF` and maintain existing behavior when disabled.”

**Split into hexagonal modules**
- *Prompt*: “Extract `PinchCore` (pure TS module) with ports: `Landmarks`, `Clock`, `Emitter`, `Telemetry`. Keep the `__replayGolden()` hook working by providing an adapter that feeds frames into the core and bridges events to the existing UI.”

---

## Acceptance criteria (MVP)

- Two hands supported; each maps to distinct key & MIDI note.
- Virtual keyboard tiles reflect down/hold/up reliably.
- Mean down latency (HUD) is stable; SpecCancel% < 8% on typical lighting.
- Golden replay smoke passes locally and in CI.
- `__replayGolden()` remains compatible after changes.

---

## Troubleshooting

- **No landmarks / blank overlay**: Make sure camera permission is granted and page is served via HTTP (not `file://`).
- **WebMIDI missing**: Use Chrome on `localhost` (or HTTPS). Toggle WebMIDI in the Controls.
- **Jittery or sticky pinches**: Increase OneEuro `minCutoff` (less jitter) or adjust thresholds (`enter` lower for sensitivity, `exit` higher for stickier holds).
- **False pinches off‑plane**: Tighten the palm cone or ensure the palm faces the camera.
- **CI fails**: Re‑record a golden after intentional threshold changes; check console errors in the headless run.

---

## Roadmap (short)

- Guided calibration (per hand) with on‑screen tips.
- Palm‑cone meter overlay and green “ready” indicator.
- WebMIDI output selector + velocity mapping.
- KF for TOI and optional velocity clamping.
- Split into hexagonal adapters with parity tests against goldens.
