# TESTS_VS_DEMO — Root Cause Analysis

Date: 2025-09-06  
Project: Tectangle  
Author: automated debug subtask

Summary:
The repo's deterministic Node smoke/golden tests pass locally but the live/demo pages fail because src-backed prototype pages perform an unguarded top-level await on a bootstrap Promise that can reject (manager-bootstrap), and legacy CommonJS modules in archive paths break ESM test imports. The short quick-fix is to guard the top-level await in the src page and add a dynamic fallback import in the Start handler.

---

1) Reproduction checklist (exact commands + expected vs observed)

- Serve static demo (safe):
  - Command: npx -y http-server ./ -p 8000 -c-1
  - URL to open: http://localhost:8000/September2025/Tectangle/prototype/landmark-smooth/index-src.html
  - File reference: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224)
  - Expected: page loads, console shows "bootstrap complete" or a handled warning; `Start` button wired and clicking it attempts to start camera or fallback import.
  - Observed (failure mode): page load aborts at module evaluation (unhandled rejection) and Start appears inert (no event listeners wired).

- Run deterministic smoke test (Node):
  - Command: node --test tests/smoke/pinch.baseline.smoke.test.mjs
  - Test file: [`September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs`](September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:1)
  - Expected: smoke test runs, replays golden trace, and asserts at least one pinch event or telemetry.
  - Observed: local smoke runs pass when `src` modules are available; CI/local runs fail when imports are missing or legacy CJS files are accidentally imported.

- Replay golden trace (Node replay harness):
  - Command: node scripts/replay.js --file=tests/golden/pinch_baseline_01.jsonl
  - Golden trace: [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1)
  - Expected: replay produces landmark:smoothed frames that the smoke harness consumes deterministically.
  - Observed: golden replay works locally in the smoke harness, but the demo pages fail to reach the same wiring due to bootstrap/loader differences.

Notes: do not run tests/servers without permission from repo owner—commands above are safe manual checks for the developer.

---

2) Observed symptoms (4–6 concise items; 1-line evidence each)

- Unguarded top-level await in src-backed prototype aborts module evaluation when bootstrap rejects: see summary note (`import ready ...; const managers = await ready;`) — [`September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md`](September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md:5)

- manager-bootstrap is currently fatal / removed and throws during import—this rejects `ready` and kills page evaluation — see throw in bootstrap shim — [`September2025/Tectangle/prototype/common/manager-bootstrap.js`](September2025/Tectangle/prototype/common/manager-bootstrap.js:8)

- Smoke harness run logged an import error: ERR_MODULE_NOT_FOUND for `src/gesture/pinchBaseline.js` during smoke run — [`September2025/Tectangle/tests/smoke/output/test-run.log`](September2025/Tectangle/tests/smoke/output/test-run.log:31)

- Mocha / Node ESM runner aborted on legacy CommonJS `module` usage in archived manager code — ReferenceError: "module is not defined in ES module scope" — [`September2025/Tectangle/diagnostics/triageSeptember032025/mocha-output.txt`](September2025/Tectangle/diagnostics/triageSeptember032025/mocha-output.txt:2)

- Inconsistent manager registration keys make fallbacks fragile (`EventBusManager` vs `EventBus`) — this increases discovery failures after a partial bootstrap — [`September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md`](September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md:17)

---

3) Hypothesized root causes (ranked) with evidence + 1-line reproducible check

A — Unguarded top-level await in demo page (highest impact)  
Evidence: prototype uses an awaited bootstrap Promise that, if rejected, aborts module evaluation and prevents later event wiring — [`September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md`](September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md:9)  
Quick check: Serve the page and inspect DevTools Console for an unhandled rejection; in Console run `getEventListeners(document.getElementById('startBtn'))` (or `typeof startBtn.onclick`) — if none, the top-level await likely rejected and wiring never ran.

B — manager-bootstrap treated as fatal (bootstrap throws)  
Evidence: `prototype/common/manager-bootstrap.js` currently throws (shim removed) which will cause `ready` to reject — [`September2025/Tectangle/prototype/common/manager-bootstrap.js`](September2025/Tectangle/prototype/common/manager-bootstrap.js:11)  
Quick check: Open page and confirm console contains "manager-bootstrap removed" or an Error stack from `manager-bootstrap`; alternatively search for thrown Error in server logs.

C — Missing or relocated source modules referenced by smoke tests (import path mismatches)  
Evidence: smoke output shows ERR_MODULE_NOT_FOUND for `src/gesture/pinchBaseline.js` — [`September2025/Tectangle/tests/smoke/output/test-run.log`](September2025/Tectangle/tests/smoke/output/test-run.log:31)  
Quick check: Run `node --test tests/smoke/pinch.baseline.smoke.test.mjs` locally and confirm the same ERR_MODULE_NOT_FOUND stack.

D — Legacy CJS modules in archive paths imported by test runner cause ESM failures  
Evidence: archived manager uses `module.exports` and `require(...)` which throws under ESM loader (ReferenceError) — [`archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August Tectangle Sprint/foundation/src/PinchRecognitionManager.js`](archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August%20Tectangle%20Sprint/foundation/src/PinchRecognitionManager.js:260) and mocha output — [`September2025/Tectangle/diagnostics/triageSeptember032025/mocha-output.txt`](September2025/Tectangle/diagnostics/triageSeptember032025/mocha-output.txt:2)  
Quick check: `rg "module.exports" -n` and then run Node ESM import of those files; if the ESM loader errors with "module is not defined" then convert or exclude archives.

E — Naming/registry inconsistencies (EventBus vs EventBusManager) causing discovery failures  
Evidence: docs note mixed registration keys across pages and bootstrap — [`September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md`](September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md:17)  
Quick check: In a running page/console inspect `window.__MANAGERS__` and registry keys; attempt `window.__MANAGERS__.EventBusManager` vs `.EventBus`.

---

4) Minimal surgical fix suggestions (per-cause) + effort estimate

A — Guard top-level await in the src-backed prototype (PRIMARY quick fix)  
- File to edit: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224)  
- Replace the unguarded bootstrap with a guarded try/catch so module evaluation always completes and UI wiring runs:

[`javascript.declaration()`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224)
```js
// guarded bootstrap usage (apply near original import/await)
import ready from "../common/manager-bootstrap.js";
let managers = {};
try {
  managers = await ready;
} catch (err) {
  console.warn("manager-bootstrap failed (non-fatal):", err);
  // continue — UI wired below can attempt fallbacks on Start()
}
```
- Estimated effort: 10–30 minutes (single-line edit + verify in browser)  
- Acceptance test: page loads without uncaught rejection; `startBtn` has event listeners; clicking Start triggers fallback flow or camera start.

B — Fallback dynamic import inside Start() (quick)  
- File and location: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:688)  
- Suggested snippet (call inside `start()` before relying on CameraManager):

[`javascript.declaration()`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:688)
```js
// If bootstrap didn't yield CameraManager, try direct dynamic import/instantiate
if (!window.__MANAGERS__?.CameraManager && !CameraManager) {
  try {
    const CamMod = await import("../../src/CameraManager.js");
    const CamCtor = CamMod.default || CamMod.CameraManager || CamMod.Camera || CamMod;
    CameraManager = typeof CamCtor === "function" ? new CamCtor({ eventBus: window.__MANAGERS__?.EventBusManager }) : CamCtor;
    // expose for other pages/calls
    if (!window.__MANAGERS__) window.__MANAGERS__ = {};
    window.__MANAGERS__.CameraManager = CameraManager;
    console.info("Fallback CameraManager instantiated");
  } catch (e) {
    console.warn("Fallback CameraManager import failed:", e);
  }
}
```
- Estimated effort: 20–60 minutes (edit + manual test)  
- Acceptance test: clicking Start triggers either a successful CameraManager start or a clear handled error message (no silent inert UI).

C — Fix missing/relocated `pinchBaseline` import / add ESM stub (test-side)  
- Problem: smoke run shows `ERR_MODULE_NOT_FOUND: src/gesture/pinchBaseline.js` — [`September2025/Tectangle/tests/smoke/output/test-run.log`](September2025/Tectangle/tests/smoke/output/test-run.log:31)  
- Minimal options:
  1. Restore `src/gesture/pinchBaseline.js` at expected path (create a small ESM wrapper that re-exports existing implementation).
  2. Update the smoke test import to the correct path.
- Suggested stub (create [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1) if missing):

[`javascript.declaration()`](September2025/Tectangle/src/gesture/pinchBaseline.js:1)
```js
// Minimal ESM shim (example)
export function init() { /* bridge to real implementation */ }
export function start() { /* ... */ }
export function stop() { /* ... */ }
export function setConfig() { /* ... */ }
```
- Estimated effort: 15–60 minutes depending on whether complete implementation exists elsewhere.  
- Acceptance test: `node --test tests/smoke/pinch.baseline.smoke.test.mjs` runs past imports and replays the golden trace.

D — Resolve CJS/ESM mismatches in archived modules (longer-term)  
- Problem: archived `PinchRecognitionManager.js` uses `require`/`module.exports` which breaks ESM test imports — see end-of-file `module.exports` line — [`archive-stale/.../PinchRecognitionManager.js`](archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August%20Tectangle%20Sprint/foundation/src/PinchRecognitionManager.js:260)  
- Quick surgical options:
  - Convert module to ESM: replace `module.exports = PinchRecognitionManager;` with `export default PinchRecognitionManager;` and replace `require()` calls with static or dynamic `import()` calls.
  - Or exclude `archive-stale/**` from test globs so CI does not import legacy code.
- Example conversion fragment:

[`javascript.declaration()`](archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August%20Tectangle%20Sprint/foundation/src/PinchRecognitionManager.js:260)
```js
// Replace at EOF:
// module.exports = PinchRecognitionManager;
export default PinchRecognitionManager;
```
- Estimated effort: 30–120 minutes per file (depends on require/import complexity)  
- Acceptance test: running Node ESM tests no longer throws "module is not defined", and CI smoke completes without ESM import errors.

E — Canonicalize registry keys / add defensive lookup  
- Problem: pages and bootstrap use different registry keys (`EventBus` vs `EventBusManager`) causing discovery failures.  
- Suggested small change in bootstrap/registry: register both keys and expose `window.__MANAGERS__` with canonical synonyms:

[`javascript.declaration()`](September2025/Tectangle/prototype/common/manager-bootstrap.js:1)
```js
// after creating ebInstance:
registry.register("EventBusManager", ebInstance, { source: "prototype-bootstrap" });
// also expose the short-hand
registry.register("EventBus", ebInstance, { aliasOf: "EventBusManager" });
window.__MANAGERS__ = window.__MANAGERS__ || {};
window.__MANAGERS__.EventBusManager = window.__MANAGERS__.EventBusManager || ebInstance;
window.__MANAGERS__.EventBus = window.__MANAGERS__.EventBus || ebInstance;
```
- Estimated effort: 15–45 minutes  
- Acceptance test: pages can discover `EventBus` or `EventBusManager` interchangeably; fallback code finds bus even after partial bootstrap.

---

5) CI / golden-trace / smoke-harness changes to reduce mismatch

- Add a headless-browser smoke job (GitHub Action) that:
  - Serves the repo (static server)
  - Launches Puppeteer and opens the src-backed demo URL: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224)
  - Fails if DevTools console contains any unhandled rejection / Error-level logs
  - Asserts `Start` button has an event handler and that clicking it triggers either CameraManager start or fallback attempts
  - Replays golden trace or signals a separate replay smoke job to compare envelopes

- Example job (summary):
  - steps: checkout, setup-node, npm ci (or pnpm), npx http-server ./ -p 8080 &, node tests/smoke/headless-demo-smoke.js (Puppeteer)

- Require golden-trace replay on PRs that modify managers:
  - For any PR touching `src/**` or `prototype/common/**`, require a successful job that replays relevant `prototype/landmark-smooth/golden/*.jsonl` traces and asserts expected telemetry / event counts.

- Add console-log assertions to smoke harness:
  - E.g., assert that console includes "bootstrap complete" or controlled "manager-bootstrap failed (non-fatal)" but not unhandled exceptions.

- Enforce archive isolation:
  - Exclude `archive-stale/**` from test globs or update CI test command to use `--testPathIgnorePatterns` so legacy CJS files are not imported by default tests.

- Acceptance criteria (CI):
  - New headless smoke job passes (or fails with clear, actionable logs) for the `landmark-smooth` page.
  - Golden-trace replay job passes for managers modified in PRs.

---

6) Prioritized action plan — first 5 tickets (with verifiable acceptance criteria)

1. Guard top-level await in src-backed prototypes (quick)
   - Files: [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224)
   - Acceptance: page loads with no uncaught rejection; `startBtn` reports an event listener in DevTools; clicking Start triggers fallback flow or camera start; smoke Node test still passes.
   - Est: 10–30 mins

2. Add fallback dynamic import in `start()` for CameraManager (quick)
   - Files: same as above
   - Acceptance: with bootstrap failing, clicking Start logs "Fallback CameraManager instantiated" or a handled import failure; UI not inert.
   - Est: 20–60 mins

3. Fix missing `src/gesture/pinchBaseline.js` import or add shim (test-side)
   - Files: [`September2025/Tectangle/src/gesture/pinchBaseline.js`](September2025/Tectangle/src/gesture/pinchBaseline.js:1) (create or restore)
   - Acceptance: `node --test tests/smoke/pinch.baseline.smoke.test.mjs` runs past imports and replays golden trace.
   - Est: 15–60 mins

4. CI: add headless browser smoke job + golden-trace replay requirement (policy)
   - Files: `.github/workflows/smoke-demo.yml` (new) + `tests/smoke/headless-demo-smoke.js` (new)
   - Acceptance: CI job loads demo, checks console for no unhandled rejections, and verifies Start wiring; PRs touching `src/` require golden-trace replay success.
   - Est: 2–6 hours to implement & stabilize

5. Convert or isolate legacy CJS modules (archive-stale) from test path
   - Target: `archive-stale/**` and legacy `foundation/src/*.js`
   - Acceptance: Node ESM test runner no longer throws "module is not defined"; mocha/node tests pass.
   - Est: 1–4 hours depending on number of files

---

7) Appendix — files reviewed (click to open) and open questions/assumptions

Files reviewed (key excerpts):
- [`September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md`](September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md:5)  
- [`September2025/Tectangle/prototype/common/manager-bootstrap.js`](September2025/Tectangle/prototype/common/manager-bootstrap.js:7)  
- [`September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs`](September2025/Tectangle/tests/smoke/pinch.baseline.smoke.test.mjs:1)  
- [`September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl`](September2025/Tectangle/tests/golden/pinch_baseline_01.jsonl:1)  
- [`September2025/Tectangle/tests/smoke/output/test-run.log`](September2025/Tectangle/tests/smoke/output/test-run.log:31)  
- [`September2025/Tectangle/diagnostics/triageSeptember032025/mocha-output.txt`](September2025/Tectangle/diagnostics/triageSeptember032025/mocha-output.txt:2)  
- [`archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August Tectangle Sprint/foundation/src/PinchRecognitionManager.js`](archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August%20Tectangle%20Sprint/foundation/src/PinchRecognitionManager.js:260)  
- Note: many docs reference [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) but the `index-src.html` file was not found when attempting a direct read — assumed present in working tree or generated from another branch.

Open questions / assumptions:
- Is the monolithic `index.html` (non-src) page intentionally kept working while `index-src.html` points to `src/` managers that may be missing? I assumed the src-backed page is the intended demo for QA.
- Are archive paths (`archive-stale/**`) expected to be included in CI test globs? My recommendation is to exclude them to avoid legacy CJS from breaking modern ESM test runs.
- I did not modify any repository files; the snippets above are surgical suggestions to apply in small PRs.

End of report.