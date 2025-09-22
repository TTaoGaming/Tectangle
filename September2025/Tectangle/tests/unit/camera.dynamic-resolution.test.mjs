// August Tectangle Sprint/tectangle-gesture-keyboard-mobile/tests/unit/camera.dynamic-resolution.test.mjs
//
// Red test: dynamic resolution + reconfigure
// Purpose: ensure CameraManager publishes camera:frame frames and supports live reconfigure({width,height,fps})
// TDD flow: this test should express the minimum observable behavior required by downstream pipeline consumers.

import assert from "node:assert";
import * as CameraMod from "../../src/CameraManager.js";

const CameraManager = CameraMod.default ?? CameraMod.CameraManager ?? CameraMod;

describe("CameraManager — dynamic resolution & reconfigure (red)", () => {
  it("red: emits camera:params and emits camera:frame that reflect reconfigure({width,height,fps})", async () => {
    // Minimal FakeEventBus capturing publishes and supporting subscribe/unsubscribe
    class FakeEventBus {
      constructor() {
        this.published = [];
        this.listeners = new Map();
      }
      publish(event, detail) {
        this.published.push({ event, detail });
        const listeners = this.listeners.get(event) || [];
        // call a shallow copy so listeners can unsubscribe safely
        for (const cb of listeners.slice()) {
          try {
            cb(detail);
          } catch (e) {
            /* swallow test-side listener errors */
          }
        }
      }
      subscribe(event, cb) {
        const arr = this.listeners.get(event) || [];
        arr.push(cb);
        this.listeners.set(event, arr);
        return () => {
          const list = this.listeners.get(event) || [];
          this.listeners.set(
            event,
            list.filter((x) => x !== cb)
          );
        };
      }
      on(event, cb) {
        return this.subscribe(event, cb);
      }
    }

    const bus = new FakeEventBus();

    // Helper to attempt typical constructor pattern but fallback to attaching bus post-construction.
    function createManager(initial = {}) {
      let instance;
      try {
        // preferred: constructor accepts options object
        instance = new CameraManager({
          eventBus: bus,
          width: initial.width,
          height: initial.height,
          fps: initial.fps,
        });
      } catch (e) {
        // fallback: no-arg constructor, attach eventBus
        instance = new CameraManager();
        if (typeof instance.setEventBus === "function") {
          instance.setEventBus(bus);
        } else {
          instance.eventBus = bus;
        }
        // seed initial params if reconfigure exists (best-effort, non-blocking)
        if (typeof instance.reconfigure === "function") {
          // intentionally do not await here in fallback; constructor-based setup preferred
          instance.reconfigure(initial).catch(() => {});
        }
      }
      return instance;
    }

    const initial = { width: 320, height: 240, fps: 10 };
    const manager = createManager(initial);

    // Start the manager if it exposes a start method
    if (typeof manager.start === "function") {
      await manager.start();
    }

    const getWidth = (p) => p?.width ?? p?.detail?.width ?? p?.frame?.width;
    const getHeight = (p) => p?.height ?? p?.detail?.height ?? p?.frame?.height;

    // Wait for initial camera:frame (deterministic via fake bus)
    const initialFrame = await new Promise((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error("timeout waiting for initial camera:frame")),
        1000
      );
      const unsub = bus.subscribe("camera:frame", (payload) => {
        clearTimeout(t);
        if (typeof unsub === "function") unsub();
        resolve(payload);
      });
    });

    assert.ok(initialFrame, "expected an initial camera:frame to be published");
    assert.strictEqual(
      getWidth(initialFrame),
      initial.width,
      "initial frame width should match initial params"
    );
    assert.strictEqual(
      getHeight(initialFrame),
      initial.height,
      "initial frame height should match initial params"
    );

    // Prepare to observe camera:params emitted after reconfigure
    const newParams = { width: 640, height: 480, fps: 5 };
    const paramsPromise = new Promise((resolve, reject) => {
      const t = setTimeout(
        () =>
          reject(
            new Error("timeout waiting for camera:params after reconfigure")
          ),
        500
      );
      const unsub = bus.subscribe("camera:params", (payload) => {
        clearTimeout(t);
        if (typeof unsub === "function") unsub();
        resolve(payload);
      });
    });

    // Act: call reconfigure and wait for camera:params
    if (typeof manager.reconfigure !== "function") {
      throw new Error("CameraManager.reconfigure is not implemented");
    }
    await manager.reconfigure(newParams);
    const paramsPayload = await paramsPromise;

    assert.ok(paramsPayload, "camera:params published after reconfigure");
    const paramsWidth = paramsPayload?.width ?? paramsPayload?.detail?.width;
    const paramsHeight = paramsPayload?.height ?? paramsPayload?.detail?.height;
    const paramsFps = paramsPayload?.fps ?? paramsPayload?.detail?.fps;
    assert.strictEqual(
      paramsWidth,
      newParams.width,
      "camera:params width after reconfigure"
    );
    assert.strictEqual(
      paramsHeight,
      newParams.height,
      "camera:params height after reconfigure"
    );
    if (typeof paramsFps !== "undefined") {
      assert.strictEqual(
        paramsFps,
        newParams.fps,
        "camera:params fps after reconfigure"
      );
    }

    // Wait for the next camera:frame after reconfigure and assert its resolution is updated.
    const nextFrame = await new Promise((resolve, reject) => {
      const t = setTimeout(
        () =>
          reject(
            new Error("timeout waiting for camera:frame after reconfigure")
          ),
        1500
      );
      let unsub = null;
      unsub = bus.subscribe("camera:frame", (payload) => {
        // Accept the next delivered frame (we allowed for immediate emission in reconfigure implementations)
        clearTimeout(t);
        if (typeof unsub === "function") unsub();
        resolve(payload);
      });
    });

    assert.ok(nextFrame, "expected a camera:frame after reconfigure");
    assert.strictEqual(
      getWidth(nextFrame),
      newParams.width,
      "frame width updated after reconfigure"
    );
    assert.strictEqual(
      getHeight(nextFrame),
      newParams.height,
      "frame height updated after reconfigure"
    );
  });
});
