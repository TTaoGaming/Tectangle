/**
 * TLDR: VisualManager — Minimal Three.js overlay manager to render fingertip knots and mapped-key highlights for demos (TREQ-119). Default: 480p @ 30FPS.
 *
 * Executive summary (5W1H):
 *  - Who: Demo UI, UIManager and QA/Manual testers.
 *  - What: Attach a lightweight WebGL/canvas overlay and render fingertip anchors, knuckle indicators and mapped-key highlights.
 *  - When: Subscribed to 'tectangle:gesture' and frame updates; updates per animation frame.
 *  - Where: Mobile / Chromebook demos and manual QA sessions (target runtime: 480p @ 30FPS).
 *  - Why: Provide visual feedback for calibration, gestures and mapping to assist tuning and manual verification.
 *  - How: Attach to a target DOM element, maintain a minimal scene, and expose update/clear APIs.
 *
 * Top 3 immediate responsibilities:
 *  - Create and manage overlay surface (canvas/WebGL) attached to a target element.
 *  - Render fingertip anchors, knuckle spans and mapped-key highlights in response to gesture events.
 *  - Expose simple tuning parameters and lightweight API for UIManager integration.
 *
 * API summary:
 *  - async init(targetElement)
 *  - attach(targetElement), detach()
 *  - start(), stop(), destroy()
 *  - renderFrame(frame) // optional direct frame render hook
 *  - setParams(params), getState()
 *  - Events: 'visual:ready', 'visual:error'
 *
 * Test protocol summary:
 *  - Unit: initialize with a headless/canvas test environment; assert attach creates a canvas, renderFrame updates draw calls (mocked).
 *  - Smoke: run in demo with synthetic gestures and assert anchors/highlights appear at expected screen coords.
 *  - Exact asserts: element contains canvas; 'visual:ready' emitted upon successful init.
 *
 * EARS Acceptance Criteria:
 *  - TREQ-119 — When `tectangle:gesture` or mapped key occurs, VisualManager shall update the overlay to show fingertip knots and highlight the mapped key.
 *  - Acceptance: Manual QA confirms overlay shows live knots, anchor highlights and responds to open/close from UIManager.
 *
 * UI_METADATA:
 *  { tabId: 'visuals', title: 'Visuals Overlay', order: 8 }
 *
 * Usage snippet:
 *  // import VisualManager from './VisualManager.js';
 *  // const v = new VisualManager(); await v.init(document.body); v.start();
 *
 * Header generated from: August Tectangle Sprint/foundation/docs/TECTANGLE_EARS_CANONICAL_2025-08-27T034212Z.md (2025-08-27T03:42:12Z)
 */

/**
 * VisualManager
 *
 * Minimal Three.js overlay to render 21 landmarks and a skeleton line.
 * - Subscribes to EventBusManager events for landmarks/gesture/ttc.
 * - Exposes attach/detach/start/stop/destroy/setParams/getState APIs.
 */
