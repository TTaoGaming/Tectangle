import assert from "assert";
import EventBus from "../../src/EventBusManager.js";
import LandmarkRawManager from "../../src/LandmarkRawManager.js";
import LandmarkSmoothManager from "../../src/LandmarkSmoothManager.js";

describe.skip("LandmarkSmoothManager — RED: Kalman fingertip acceptance (integration) - SKIPPED (Kalman removed from LandmarkSmoothManager)", function () {
  beforeEach(function () {
    try {
      if (typeof EventBus.clear === "function") EventBus.clear();
    } catch (e) {}
  });

  it("predicts fingertip short-term motion for latency compensation (Kalman)", function (done) {
    this.timeout(3000);

    const rawMgr = new LandmarkRawManager({
      eventBus: EventBus,
      useMediaPipe: false,
      maxLandmarks: 21,
    });

    const mgr = new LandmarkSmoothManager({
      eventBus: EventBus,
      enableOneEuro: false,
      enableKalman: true,
      kalmanParams: { qPos: 1e-6, qVel: 1e-4, rBase: 1e-4 },
      enableBoneClamps: false,
      maxLandmarks: 21,
    });

    const rec = [];
    const unsub = EventBus.addEventListener("landmark:smoothed", (env) => {
      rec.push(env && env.detail ? env.detail : env);
    });

    mgr.start();

    // simulate linear motion along x for fingertip index 8 (index finger tip)
    const frames = 15;
    const startX = 0.3;
    const dx = 0.01;
    const baseY = 0.5;
    const baseTs = Date.now();

    for (let f = 0; f < frames; f++) {
      const landmarks = [];
      for (let i = 0; i < 21; i++) {
        let x = startX;
        if (i === 8) x = startX + dx * f;
        landmarks.push([Number(x.toFixed(6)), baseY, 0]);
      }
      const payload = {
        landmarks,
        frameId: f + 1,
        timestamp: baseTs + f * 33,
        width: 640,
        height: 480,
        config: rawMgr._lastReceivedConfig || rawMgr._config,
      };
      try {
        EventBus.publish("landmark:raw", payload);
      } catch (e) {}
    }

    setTimeout(() => {
      try {
        assert.ok(
          rec.length >= frames,
          `expected at least ${frames} smoothed frames, got ${rec.length}`
        );
        const lastFrame = rec[rec.length - 1];
        const smoothed = lastFrame.landmarks[8]; // array [x,y,z]
        const expectedX = startX + dx * (frames - 1);
        const err = Math.abs(smoothed[0] - expectedX);
        assert.ok(
          err < 0.02,
          `Kalman did not track fingertip: err=${err}, expectedX=${expectedX}, smoothedX=${smoothed[0]}`
        );
        unsub && unsub();
        done();
      } catch (e) {
        unsub && unsub();
        done(e);
      }
    }, 100);
  });
});
