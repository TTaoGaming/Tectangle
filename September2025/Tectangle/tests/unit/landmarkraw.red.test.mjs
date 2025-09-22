import assert from "assert";
import EventBus from "../../src/EventBusManager.js";
import LandmarkRawManager from "../../src/LandmarkRawManager.js";

describe("LandmarkRawManager — red: config + camera:frame -> landmark:raw", function () {
  beforeEach(function () {
    try {
      if (typeof EventBus.clear === "function") EventBus.clear();
    } catch (e) {}
  });

  it("accepts landmarkraw.setConfig and publishes landmarkraw.config, then produces landmark:raw (21 landmarks) honoring config", function (done) {
    this.timeout(2000);

    // Explicitly construct manager for the test environment
    const mgr = new LandmarkRawManager({
      eventBus: EventBus,
      useMediaPipe: false, // deterministic path for unit test
      maxLandmarks: 21,
    });

    const configs = [];
    const landmarks = [];

    const unsubConfig = EventBus.addEventListener("landmarkraw.config", (env) =>
      configs.push(env && env.detail ? env.detail : env)
    );
    const unsubLand = EventBus.addEventListener("landmark:raw", (env) =>
      landmarks.push(env && env.detail ? env.detail : env)
    );

    // Publish config via manager API to ensure config echo behavior
    const cfg = { maxLandmarks: 21, modelComplexity: 1 };
    mgr.setConfig(cfg);

    // Simulate a camera frame that deterministic path will convert into landmarks
    const frame = { frameId: 1, width: 640, height: 480 };
    // manager._onCameraFrame accepts either envelope or detail
    mgr._onCameraFrame({ detail: frame });

    // Allow a tick for publishes
    setTimeout(() => {
      try {
        // config echo should have been published
        assert.ok(
          configs.length >= 1,
          "expected at least one landmarkraw.config published"
        );
        // landmark:raw should be published with 21 landmarks
        assert.ok(
          landmarks.length >= 1,
          "expected at least one landmark:raw published"
        );
        const p = landmarks[0];
        assert.ok(Array.isArray(p.landmarks), "landmarks should be array");
        assert.strictEqual(
          p.landmarks.length,
          21,
          "expected 21 landmarks from deterministic path"
        );
        // payload should include config echo
        assert.ok(p.config, "payload should include config");
        unsubConfig && unsubConfig();
        unsubLand && unsubLand();
        done();
      } catch (err) {
        unsubConfig && unsubConfig();
        unsubLand && unsubLand();
        done(err);
      }
    }, 50);
  });
});
