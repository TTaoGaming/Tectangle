/**
 * TLDR: UIManager — Bottom-drawer UI for manager configuration and discoverability.
 *
 * Executive summary (5W1H):
 *  - Who: Demo authors, QA and users tuning runtime managers.
 *  - What: Lightweight bottom drawer that enumerates registered managers (via ManagerRegistry) and exposes simple controls.
 *  - When: Initialized at demo startup or by tests; UI-driven setParams calls update manager behavior.
 *  - Where: Mobile/Chromebook demos and local/manual QA harnesses.
 *  - Why: Provide a simple, framework-free way to inspect and tweak manager params without editing code.
 *  - How: Read registry.list()/getMeta(), render tab bar and per-manager controls, and call manager.setParams on change.
 *
 * UI_METADATA:
 *  { tabId: 'ui', title: 'UI', order: 99 }
 *
 * Usage:
 *  // import UIManager from './UIManager.js';
 *  // const ui = new UIManager(); await ui.init(); ui.start();
 */
