/**
 * TLDR: GestureLooperManager — Repeat incoming gesture events on a configurable loop/quantization schedule; supports live repeat and simple sequencing (POC). Default runtime target: 480p @ 30FPS.
 *
 * Executive summary (5W1H):
 *  - Who: UI, KeyboardManager, Playback/Sequencer and QA.
 *  - What: Accept canonical gesture events (tectangle:gesture), optionally quantize timing (via QuantizationManager), and re-emit them on a loop or sequence; expose start/stop/record toggles for live looping.
 *  - When: Runs after gesture detection and optional quantization; can be active during performance mode.
 *  - Where: Mobile / Chromebook demos and manual/recorded performance sessions.
 *  - Why: Provide an easy way to layer repeated gestures for musical performance and testing.
 *  - How: Subscribe to EventBus 'tectangle:gesture' events, optionally pass through QuantizationManager for grid alignment, and schedule re-emission using setTimeout/requestAnimationFrame with simple sequence memory.
 *
 * Top responsibilities:
 *  - Capture gesture events, store minimal representation (type, anchor, mappedKey, ts), and schedule repeats at configured interval or quantized beats.
 *  - Expose simple API: startLoop, stopLoop, setInterval, addToSequence, clearSequence.
 *  - Publish looper events 'gesture_looper:started' / 'gesture_looper:stopped' and 'gesture_looper:emit' for UI & telemetry.
 *
 * API summary:
 *  - init(params), startLoop(), stopLoop(), addToSequence(gesture), removeFromSequence(idx), setInterval(ms)
 *  - addEventListener(name, cb), removeEventListener(name, cb)
 *
 * Test protocol summary:
 *  - Unit: feed synthetic 'tectangle:gesture' events and assert repeat scheduling and EventBus re-emissions.
 *  - Edge: verify stop clears pending emits; quantized emits align to provided quantization timestamps.
 *
 * EARS Acceptance Criteria:
 *  - TREQ-121 — When GestureLooperManager.startLoop() is invoked with a non-empty sequence, the system shall re-emit stored gestures at the configured interval or quantized timestamps and publish 'gesture_looper:emit' on each re-emission.
 *  - TREQ-121a — When GestureLooperManager.stopLoop() is called, the system shall immediately cancel scheduled re-emissions and publish 'gesture_looper:stopped'.
 *
 * UI_METADATA:
 *  { tabId: 'looper', title: 'Gesture Looper', order: 7 }
 *
 * Usage snippet:
 *  // const looper = new GestureLooperManager(); await looper.init(); looper.addToSequence(gesture); looper.startLoop();
 *
 * Header generated from: August Tectangle Sprint/foundation/docs/TECTANGLE_EARS_CANONICAL_2025-08-27T034212Z.md (2025-08-27T03:42:12Z)
 */