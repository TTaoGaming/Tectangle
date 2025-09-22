/**
 * TLDR: WatchdogManager — Alert-only observer that validates EventBus envelopes and surfaces telemetry violations (TREQ-WD-001..003). Default: 480p @ 30FPS runtime assumptions.
 *
 * Executive summary (5W1H):
 *  - Who: Developers, QA harnesses and infra owners monitoring manager telemetry and contracts.
 *  - What: Passively observe EventBus envelopes and window CustomEvents, validate canonical envelope shape and manager registration, and emit alert telemetry without blocking (alert-only).
 *  - When: Runs during dev/CI and optionally at runtime when enabled; inspects envelopes as they are published.
 *  - Where: Subscribes to EventBusManager and observes DOM CustomEvents in mobile/Chromebook demos and test harnesses (target runtime: 480p @ 30FPS).
 *  - Why: Detect unregistered managers, malformed envelopes, and telemetry contract violations early to prevent silent failures and to improve traceability.
 *  - How: Run rule checks on envelopes, publish 'watchdog:violation' for issues and expose local listener API for UI/automation.
 *
 * Top 3 immediate responsibilities:
 *  - Subscribe to EventBusManager and observe window.CustomEvent dispatches (non-invasive).
 *  - Validate envelope shape, manager registration and landmark shapes; publish 'watchdog:violation' telemetry for violations.
 *  - Register itself in ManagerRegistry for discoverability and provide local listeners for violations.
 *
 * API summary:
 *  - async init(), start(), stop(), destroy()
 *  - setParams({ alertOnly, allowedManagers, maxLandmarks })
 *  - getState()
 *  - addEventListener(name, cb), removeEventListener(name, cb)
 *  - observeFrame(frame:Object) // convenience diagnostic entry
 *  - Events: 'watchdog:violation', 'watchdog:observed'
 *
 * Test protocol summary:
 *  - Unit: publish canonical and malformed envelopes to EventBus and assert 'watchdog:violation' produced for malformed/unregistered managers and no violation for well-formed registered manager envelopes.
 *  - Exact asserts: violation payload.detail.reason equals expected reason strings (e.g., 'invalid_envelope', 'unregistered_manager', 'malformed_landmark').
 *
 * EARS Acceptance Criteria:
 *  - TREQ-WD-001 — When an envelope violates basic contract rules, WatchdogManager shall emit 'watchdog:violation' with reason and original envelope.
 *  - TREQ-WD-002 — When operating in alert-only mode, WatchdogManager shall not block or mutate events (no remediation), only emit alerts.
 *  - TREQ-WD-003 — WatchdogManager shall register in ManagerRegistry for discoverability upon init().
 *
 * UI_METADATA:
 *  { tabId: 'watchdog', title: 'Watchdog', order: 5 }
 *
 * Usage snippet:
 *  // import watchdog from './WatchdogManager.js'; await watchdog.init(); watchdog.start(); watchdog.addEventListener('watchdog:violation', p => console.warn(p));
 *
 * Header generated from: August Tectangle Sprint/foundation/docs/TECTANGLE_EARS_CANONICAL_2025-08-27T034212Z.md (2025-08-27T03:42:12Z)
 */