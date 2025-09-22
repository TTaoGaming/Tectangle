Triage report: Landmark-smooth vs Landmark-raw
Date: 2025-09-03T23:58:00Z

Summary:
I loaded the local prototypes and captured screenshots + console logs. The "raw" prototype (`prototype/landmark-raw/index.html`) requested repo managers and appears to run, while the "src" prototype (`prototype/landmark-smooth/index-src.html`) is blocked by an unguarded top-level await that depends on the bootstrap Promise; if bootstrap rejects (for example when `CameraManager` import/instantiation fails) module execution aborts and UI wiring never happens so the Start button appears inert. Running the Mocha test suite aborted immediately due to an ES module/CJS compatibility error ("ReferenceError: module is not defined") originating from an archived legacy module, so the unit tests did not run.

Exact console errors observed:
- prototype page load: [error] Failed to load resource: the server responded with a status of 404 (Not Found) (observed for /favicon.ico) — see [`September2025/Tectangle/diagnostics/triage/landmark-smooth.console.log`](September2025/Tectangle/diagnostics/triage/landmark-smooth.console.log:1)
- Mocha run: ReferenceError: module is not defined in ES module scope at [`archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August Tectangle Sprint/foundation/src/PinchRecognitionManager.js`](archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August%20Tectangle%20Sprint/foundation/src/PinchRecognitionManager.js:260) — full run saved to [`September2025/Tectangle/diagnostics/triage/mocha-output.txt`](September2025/Tectangle/diagnostics/triage/mocha-output.txt:1)

Failing tests:
- Mocha aborted on import error; no unit tests were executed after the failure. See summary at [`September2025/Tectangle/diagnostics/triage/failing-tests.txt`](September2025/Tectangle/diagnostics/triage/failing-tests.txt:1) and the full Mocha output at [`September2025/Tectangle/diagnostics/triage/mocha-output.txt`](September2025/Tectangle/diagnostics/triage/mocha-output.txt:1).

Probable root cause(s) (with file references):
1) Unguarded top-level await in the src-backed prototype — the page does `const managers = await ready;` which rejects if bootstrap fails and aborts module execution. See [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) and analysis in [`September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md`](September2025/Tectangle/docs/Tectangle_Summary_2025-09-02T18-27-10Z.md:5).
2) `manager-bootstrap` treats `CameraManager` instantiation as fatal and throws on failure; this causes `ready` to reject and prevents UI wiring. See [`September2025/Tectangle/prototype/common/manager-bootstrap.js`](September2025/Tectangle/prototype/common/manager-bootstrap.js:233) (throw site ~line 249).
3) Mocha aborted due to legacy archive module using CommonJS `module` inside an ESM load; test runner stops on import. See the failing module at [`archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August Tectangle Sprint/foundation/src/PinchRecognitionManager.js`](archive-stale/archive-2025-09-01T19-13-05Z/root_contents/August%20Tectangle%20Sprint/foundation/src/PinchRecognitionManager.js:260).

Recommended next actions:
- Quick fix (fast, low-risk):
  - Guard the top-level bootstrap await in [`September2025/Tectangle/prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) with try/catch (or fallback dynamic import inside the Start handler) so the page always wires its UI and can attempt a direct `CameraManager` import when the user clicks Start. Example: wrap `await ready` in try/catch, log the bootstrap error, and continue to attach event listeners so the Start button remains responsive.
- Safe refactor (medium effort, lasting fix):
  - Make `prototype/common/manager-bootstrap.js` tolerant: never reject `ready` for prototype usage — resolve with a partial instances object and an `errors` array when some manager instantiation fails. Also canonicalize registry keys (e.g., register both `"EventBusManager"` and `"EventBus"`) so consumers are less fragile. After this refactor, re-run the prototypes and the test suite.

Artifacts produced (diagnostic files):
- [`September2025/Tectangle/diagnostics/triage/landmark-smooth.console.log`](September2025/Tectangle/diagnostics/triage/landmark-smooth.console.log:1)
- [`September2025/Tectangle/diagnostics/triage/landmark-raw.console.log`](September2025/Tectangle/diagnostics/triage/landmark-raw.console.log:1)
- [`September2025/Tectangle/diagnostics/triage/landmark-smooth.png`](September2025/Tectangle/diagnostics/triage/landmark-smooth.png:1)
- [`September2025/Tectangle/diagnostics/triage/landmark-raw.png`](September2025/Tectangle/diagnostics/triage/landmark-raw.png:1)
- [`September2025/Tectangle/diagnostics/triage/search-results.txt`](September2025/Tectangle/diagnostics/triage/search-results.txt:1)
- [`September2025/Tectangle/diagnostics/triage/mocha-output.txt`](September2025/Tectangle/diagnostics/triage/mocha-output.txt:1)
- [`September2025/Tectangle/diagnostics/triage/failing-tests.txt`](September2025/Tectangle/diagnostics/triage/failing-tests.txt:1)
- This triage report: [`September2025/Tectangle/diagnostics/triage/triage-report.md`](September2025/Tectangle/diagnostics/triage/triage-report.md:1)

End of report.