/**
 * TLDR: TelemetryManager — Normalize and buffer telemetry events and export low-PII diagnostics for QA/CI (TREQ-010). Default: 480p @ 30FPS.
 *
 * Executive summary (5W1H):
 *  - Who: Managers and QA telemetry consumers in demos and CI.
 *  - What: Normalize telemetry envelopes, buffer them, and export to window.__tectangleTelemetry and optional sinks.
 *  - When: On manager events (camera:start, landmark:smoothed, predictive:ttc, tectangle:gesture) and on flush triggers.
 *  - Where: Mobile / Chromebook demos and deterministic ESM tests.
 *  - Why: Provide low-PII observability for debugging and deterministic test assertions.
 *  - How: Accept envelopes via record(), normalize shape, buffer and flush on timer or explicit call.
 *
 * Top 3 immediate responsibilities:
 *  - Normalize and buffer telemetry envelopes with canonical fields (ts, manager, event, frameId, detail, tags).
 *  - Provide flush() and exportToWindow() APIs and write to window.__tectangleTelemetry for local inspection.
 *  - Support deterministic buffering and seeded sampling for CI/golden-trace alignment.
 *
 * API summary:
 *  - async init(), start(), stop(), destroy()
 *  - record(envelope), flush(), exportToWindow()
 *  - setParams(params), getState()
 *  - addEventListener(name, cb), removeEventListener(name, cb)
 *
 * Test protocol summary:
 *  - Unit: send synthetic manager envelopes and assert buffer contents; exportToWindow writes normalized records with frameId alignment.
 *  - Smoke: run demo with telemetry enabled and assert telemetry contains expected keys for camera.start, landmark:smoothed, tectangle:gesture.
 *  - Exact asserts: exported records contain manager,event,frameId,ts and tags; no raw images or PII.
 *
 * EARS Acceptance Criteria:
 *  - TREQ-010 — When managers emit events, the TelemetryManager shall normalize envelopes and append them to window.__tectangleTelemetry (low-PII only).
 *  - TREQ-011 — When the buffer reaches configured flush threshold or flush() is invoked, the system shall export buffered telemetry to the configured sink and clear the buffer.
 *
 * UI_METADATA:
 *  { tabId: 'telemetry', title: 'Telemetry', order: 10 }
 *
 * Usage snippet:
 *  // telemetry.init().then(()=>telemetry.start()); telemetry.record({ manager:'CameraManager', event:'camera:start', frameId:null });
 *
 * Header generated from: August Tectangle Sprint/foundation/docs/TECTANGLE_EARS_CANONICAL_2025-08-27T034212Z.md (2025-08-27T03:42:12Z)
 */
