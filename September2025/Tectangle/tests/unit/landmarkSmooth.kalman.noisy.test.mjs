import assert from "assert";
import EventBus from "../../src/EventBusManager.js";
import LandmarkRawManager from "../../src/LandmarkRawManager.js";
import LandmarkSmoothManager from "../../src/LandmarkSmoothManager.js";

describe.skip("LandmarkSmoothManager — Kalman fingertip integration (deterministic noisy) - SKIPPED (Kalman moved to PredictiveLatencyManager)", function () {
  beforeEach(function () {
    try {
      if (typeof EventBus.clear === "function") EventBus.clear();
    } catch (e) {}
  });

  it("tracks 5 fingertips under deterministic jitter with Kalman + OneEuro (non-fingertips)", function (done) {
    this.timeout(5000);

    const rawMgr = new LandmarkRawManager({
      eventBus: EventBus,
      useMediaPipe: false,
      maxLandmarks: 21,
    });

    const smooth = new LandmarkSmoothManager({
      eventBus: EventBus,
      enableOneEuro: true, // OneEuro used for non-fingertips
      oneEuroParams: { minCutoff: 0.01, beta: 0.0, dCutoff: 1.0 },
      enableKalman: true,
      kalmanParams: { qPos: 1e-6, qVel: 1e-4, rBase: 1e-4 },
      enableBoneClamps: false,
      maxLandmarks: 21,
    });

    const rec = [];
    const unsub = EventBus.addEventListener("landmark:smoothed", (env) => {
      rec.push(env && env.detail ? env.detail : env);
    });

    smooth.start();

    const frames = 60;
    const startX = 0.3;
    const dx = 0.005;
    const baseY = 0.5;
    const baseTs = Date.now();

    let seed = 123456;
    function noiseAmp() {
      seed = (seed * 48271) % 2147483647;
      return ((seed % 1000) / 1000 - 0.5) * 0.02;
    }

    for (let f = 0; f < frames; f++) {
      const landmarks = [];
      for (let i = 0; i < 21; i++) {
        let x;
        if (i === 4 || i === 8 || i === 12 || i === 16 || i === 20) {
          x = startX + dx * f + noiseAmp();
        } else {
          x = startX + noiseAmp();
        }
        const y = baseY + noiseAmp() * 0.5; // small deterministic y-noise
        landmarks.push([Number(x.toFixed(6)), Number(y.toFixed(6)), 0]);
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
        const fingertipIndices = [4, 8, 12, 16, 20];
        const expectedX = startX + dx * (frames - 1);
        for (const idx of fingertipIndices) {
          const sm = lastFrame.landmarks[idx];
          const smX = Array.isArray(sm) ? sm[0] : sm.x;
          const err = Math.abs(smX - expectedX);
          assert.ok(
            err < 0.04,
            `Fingertip ${idx} err=${err} exceeds threshold for expectedX=${expectedX}, smoothedX=${smX}`
          );
        }
        unsub && unsub();
        done();
      } catch (e) {
        unsub && unsub();
        done(e);
      }
    }, 200);
  });
});
