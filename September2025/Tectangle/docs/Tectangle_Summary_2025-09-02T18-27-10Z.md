# Tectangle Manager Audit — 2025-09-02T18:27:10Z

**Top-line verdict**

The src-backed prototype fails to start because the page top-level awaits the prototype bootstrap Promise (manager-bootstrap) which can reject (or hang) when canonical manager modules (notably CameraManager) fail to import/instantiate. That unhandled rejection aborts module execution and prevents UI wiring, so clicking "Start" appears to do nothing. Evidence and fixes below.

**Findings (evidence)**

- Top-level bootstrap is awaited in the src-backed page (this blocks all subsequent wiring): [`import ready from "../common/manager-bootstrap.js";`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) and [`const managers = await ready;`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:225)

- manager-bootstrap treats CameraManager import/instantiation as fatal and will throw if it cannot create an instance: [`const CamMod = await import("../../src/CameraManager.js");`](September2025/Tectangle/prototype/common/manager-bootstrap.js:233) and [`if (!maybeInstance) { throw new Error("manager-bootstrap: CameraManager import succeeded but instance could not be created"); }`](September2025/Tectangle/prototype/common/manager-bootstrap.js:249)

- Because the await is unguarded, a rejected ready Promise prevents start-button wiring that occurs later: [`startBtn.addEventListener("click", start);`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:778)

- The working camera prototype uses a defensive local instantiation path (does not rely on bootstrap being successful): see [`const CamExport = pickExport(CamMod, [...]); const CamInstance = instantiateIfNeeded(CamExport, window.__MANAGERS__.EventBus);`](September2025/Tectangle/prototype/camera-manager/index-src.html:153)

- Inconsistent registration keys increase fragility: manager-bootstrap registers the bus as `"EventBusManager"` (`registry.register("EventBusManager", ...)`) while other pages sometimes use `"EventBus"` (`Registry.register("EventBus", ...)`) — see [`registry.register("EventBusManager", ebInstance, { source: "prototype-bootstrap" });`](September2025/Tectangle/prototype/common/manager-bootstrap.js:205) vs [`Registry.register("EventBus", EBInstance);`](September2025/Tectangle/prototype/camera-manager/index-src.html:135)

- CameraManager export shape is a default class with an instance start method (so callers must call instance.start(), not CameraManager.start): [`export default class CameraManager {`](September2025/Tectangle/src/CameraManager.js:115) and [`async start(options = {}) {`](September2025/Tectangle/src/CameraManager.js:162)

**Root cause**

The immediate root cause is the unguarded top-level `await ready` in the src-backed prototype combined with a strict/fatal behavior in `manager-bootstrap` when importing/instantiating critical modules (notably `CameraManager`). If the bootstrap fails (import 404, CORS, constructor error, or unresolved dependencies), the returned Promise rejects and the module execution aborts — event listeners are never registered and UI controls are inert. Secondary contributors: inconsistent manager registration/key names across pages (e.g., `EventBus` vs `EventBusManager`) make fallback discovery fragile.

**Recommended fixes (prioritized)**

1) Quick (low-risk) fix — catch bootstrap failures in the prototype page (high priority)

- Change the top-level await in [`prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224) to a guarded try/catch so the page always wires its UI and can attempt fallbacks.

- Replace:

  [`import ready from "../common/manager-bootstrap.js";`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224)
  [`const managers = await ready;`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:225)

- With (apply the small edit):

  ```js
  // new guarded bootstrap usage
  import ready from "../common/manager-bootstrap.js";
  let managers = {};
  try {
    managers = await ready;
  } catch (err) {
    console.warn("manager-bootstrap failed (non-fatal):", err);
    // continue — UI will wire and attempt local fallbacks
  }
  ```

- Acceptance criteria: page script no longer throws during module evaluation when bootstrap fails; `startBtn` is wired (inspect DOM), console shows a single handled warning, and clicking "Start" proceeds to fallback logic (see fix #2) or shows a clear error message rather than being inert.

2) Fallback at Start() — attempt direct dynamic import/construct if canonical instance missing (medium priority)

- Add a small fallback inside `start()` in [`prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:688) before the existing API check. Example snippet to add near the start() entry:

  ```js
  // If bootstrap didn't yield CameraManager, try direct dynamic import/instantiate
  if (!CameraManager) {
    try {
      const CamMod = await import("../../src/CameraManager.js");
      const Campicked = CamMod.default || CamMod.CameraManager || CamMod.Camera || CamMod;
      CameraManager =
        typeof Campicked === "function"
          ? new Campicked({ eventBus: EventBus, videoElement: video })
          : Campicked;
      // register discovery surfaces for later callers
      if (window.__MANAGERS__) window.__MANAGERS__.CameraManager = CameraManager;
      if (ManagerRegistry && ManagerRegistry.register) ManagerRegistry.register && ManagerRegistry.register("CameraManager", CameraManager);
    } catch (e) {
      console.warn("Fallback CameraManager import failed:", e);
    }
  }
  ```

- Acceptance criteria: With this patch, clicking "Start" will try to import/construct CameraManager even if bootstrap failed; console should show either successful start or an informative error rather than silent inaction.

3) Defensive bootstrap (longer-term) — make manager-bootstrap tolerant (low priority but recommended)

- Edit [`prototype/common/manager-bootstrap.js`](September2025/Tectangle/prototype/common/manager-bootstrap.js:1) to avoid throwing a hard error when CameraManager import/instantiation fails. Convert the fatal throw into a logged warning and resolve `ready` with a partial instances object (and ideally an `errors` property).

- Replace the block:

  [`const CamMod = await import("../../src/CameraManager.js");`](September2025/Tectangle/prototype/common/manager-bootstrap.js:233)
  ...
  [`if (!maybeInstance) { throw new Error("manager-bootstrap: CameraManager import succeeded but instance could not be created"); }`](September2025/Tectangle/prototype/common/manager-bootstrap.js:249)

- With a guarded try/catch (example):

  ```js
  try {
    const CamMod = await import("../../src/CameraManager.js");
    const Campicked = pickExport(CamMod, ["default", "CameraManager", "Camera"]);
    // instantiate attempts ...
    // existing instantiate logic here...
    if (maybeInstance) {
      cameraInstance = maybeInstance;
      // ... register/expose ...
    } else {
      console.warn("manager-bootstrap: CameraManager module found but could not be instantiated (continuing)");
      cameraInstance = null;
    }
  } catch (err) {
    console.warn("manager-bootstrap: CameraManager import/instantiate failed (continuing):", err && err.message);
    cameraInstance = null;
  }
  ```

- Acceptance criteria: `bootstrapManagers()` resolves even if CameraManager fails; `ready` never rejects for common prototype failures; downstream pages should be able to detect missing managers and attempt their own fallbacks.

**Immediate next steps (exact tasks)**

- [ ] Apply fix #1 (guard the top-level await) in [`prototype/landmark-smooth/index-src.html`](September2025/Tectangle/prototype/landmark-smooth/index-src.html:224).
- [ ] Re-open the prototype in a browser served from the project root (see "How to test" below).
- [ ] If Start still does nothing, apply fix #2 (dynamic-import fallback) in the same file (edit `start()`).
- [ ] Optional: apply fix #3 in [`prototype/common/manager-bootstrap.js`](September2025/Tectangle/prototype/common/manager-bootstrap.js:233) to make bootstrap tolerant across prototypes.

**How to test (checklist / smoke test)**

1. Serve the repo root (so ../../src/* imports resolve). Example quick servers:
   - From the repo folder run: `npx http-server ./September2025/Tectangle -p 8080` or `python -m http.server 8000` (serve the Tectangle folder root).
2. Open the page: http://localhost:8080/prototype/landmark-smooth/index-src.html
3. Open DevTools → Console:
   - Expect either "manager-bootstrap: bootstrap complete — registered: [...]" or a handled warning "manager-bootstrap failed (non-fatal): ..." (not an unhandled rejection).
4. Verify Start wiring:
   - Before click: check that `document.getElementById("startBtn")` has an event listener (use inspector or try `typeof startBtn.onclick`).
   - Click "Start" — expected outcomes:
     - If CameraManager available: status changes to "running" and camera prompts or synthetic frames start.
     - If CameraManager missing: console shows fallback import attempt and a clear error message (not inert).
5. Sanity check working prototype: open [`prototype/camera-manager/index-src.html`](September2025/Tectangle/prototype/camera-manager/index-src.html:1) and press "Start Camera" — this page uses local instantiation and should log `camera:params`/`camera:frame` events to the page log.

**Notes on optional managers / exports**

- `LandmarkSmoothManager.js` is present and exported as default (`export default class LandmarkSmoothManager`) — bootstrap's optional import matches this shape. See [`src/LandmarkSmoothManager.js:120`](September2025/Tectangle/src/LandmarkSmoothManager.js:120).
- `EventBusManager` provides a default instance (`export default defaultBus`) and a named class (`export class EventBusManager`). Both shapes are handled by the bootstrap, but pages sometimes refer to either `"EventBus"` or `"EventBusManager"` keys — standardize to `EventBusManager` or canonicalize both keys in bootstrap to reduce fragility.

End of audit.