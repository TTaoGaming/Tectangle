import assert from "assert";
import EventBus from "../../src/EventBusManager.js";
import LandmarkRawManager from "../../src/LandmarkRawManager.js";

describe("LandmarkRawManager — red: filters low-confidence MediaPipe results", function () {
  beforeEach(function () {
    // Clear EventBus ring buffer if available
    try {
      if (typeof EventBus.clear === "function") EventBus.clear();
    } catch (e) {
      // ignore
    }
  });

  it("does publish an empty canonical landmark:raw (landmarks:[]) when multiHandedness score is below minDetectionConfidence", function (done) {
    this.timeout(2000);
    // Construct manager explicitly so module remains pure
    const mgr = new LandmarkRawManager({
      eventBus: EventBus,
      useMediaPipe: true,
      videoElement: null,
      modelComplexity: 1,
      maxLandmarks: 21,
      maxNumHands: 1,
      minDetectionConfidence: 0.9,
      minTrackingConfidence: 0.5,
    });

    const received = [];
    const unsub = EventBus.addEventListener("landmark:raw", (env) => {
      const p = env && env.detail ? env.detail : env;
      received.push(p);
    });

    // Prepare fake MediaPipe results with low handedness score (0.2)
    const fakeLandmarks = Array.from({ length: 21 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
    }));
    const fakeResults = {
      multiHandLandmarks: [fakeLandmarks],
      multiHandedness: [{ score: 0.2 }],
    };

    // Directly call the manager's hands results handler
    try {
      mgr._onHandsResults(fakeResults);
    } catch (err) {
      // If manager throws, fail the test
      unsub && unsub();
      return done(err);
    }

    // Small async tick to allow publish to run
    setTimeout(() => {
      try {
        // Manager should publish one canonical envelope (landmarks: [])
        assert.strictEqual(
          received.length,
          1,
          `Expected 1 canonical envelope, got ${received.length}`
        );
        const payload = received[0];
        assert.ok(
          Array.isArray(payload.landmarks),
          "payload.landmarks must be an array"
        );
        assert.strictEqual(
          payload.landmarks.length,
          0,
          "payload.landmarks should be empty for filtered low-confidence"
        );
        // include handsCount for reference
        assert.strictEqual(typeof payload.handsCount, "number");
        unsub && unsub();
        done();
      } catch (err) {
        unsub && unsub();
        done(err);
      }
    }, 50);
  });
});
