/**
 * TLDR: KeyboardManager — Phase‑0 radial menu mapping for controllerId; palm-facing gate; param schema for radial anchor & palm gate.
 *
 * Executive summary (5W1H):
 *  - Who: Integration layer mapping gestures to host keyboard or adapter endpoints.
 *  - What: Phase‑0 radial menu: map confirmed controller pinch gestures (palm facing) to radial menu entries using wrist→middle‑knuckle vector as 2D anchor.
 *  - When: On `adapter:mapped_key` or quantized `tectangle:gesture` events with controllerId.
 *  - Where: Mobile / Chromebook demos and ESM integration tests (Phase‑0).
 *  - Why: Provide deterministic, palm‑gated radial mapping for fast testing and low-runtime cost; later phases may add 3D anchors / quaternions or spatial anchors.
 *  - How: init({ targetIframeId, mappingPreset }), setMapping(), enable/disable, and emit delivery telemetry; headers expose PARAMS_SCHEMA for UI to render radial options.
 *
 * PARAMS_SCHEMA (schema-only + commented EXAMPLE_DEFAULTS):
 *  KEYBOARD_PARAMS_SCHEMA:
 *   {
 *     radialAnchor: "vector (wrist->middleKnuckle) used as 2D anchor",
 *     palmFacingRequired: "boolean",
 *     radialRadiusPx: "pixels",
 *     autoConfirmMs: "ms (0 = manual capture)"
 *   }
 *  // EXAMPLE_DEFAULTS (commented):
 *  // { radialAnchor:'wrist_to_middle', palmFacingRequired:true, radialRadiusPx:160, autoConfirmMs:0 }
 *
 * Top 3 immediate responsibilities:
 *  - Deliver same-origin KeyboardEvent when permitted; fallback to postMessage when cross-origin or blocked.
 *  - Honor debounceFrames, holdRepeatMs and auto-release safety timers to avoid stuck keys.
 *  - Expose mapping presets and UI hooks for runtime mapping adjustments and radial menu visuals.
 *
 * EARS Acceptance Criteria (Phase‑0 additions):
 *  - TREQ-118 — When `adapter:mapped_key` is produced with controllerId and palm-facing true, KeyboardManager shall deliver a same-origin `KeyboardEvent` if available; otherwise postMessage fallback to host overlay.
 *
 * UI_METADATA:
 *  { tabId: 'keyboard', title: 'Keyboard / Adapter', order: 7, configSchema: 'KEYBOARD_PARAMS_SCHEMA' }
 *
 * Usage snippet:
 *  // const km = new KeyboardManager({ mappingPreset:'radial1' }); km.init();
 *
 * Header generated from: August Tectangle Sprint/foundation/docs/TECTANGLE_EARS_CANONICAL_2025-08-27T034212Z.md (2025-08-27T03:42:12Z)
 */
