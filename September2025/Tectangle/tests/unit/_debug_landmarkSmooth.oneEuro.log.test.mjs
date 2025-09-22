import EventBus from "../../src/EventBusManager.js";
import LandmarkRawManager from "../../src/LandmarkRawManager.js";
import LandmarkSmoothManager from "../../src/LandmarkSmoothManager.js";

describe("DEBUG LandmarkSmoothManager — oneEuro log", function () {
  beforeEach(function () {
    try {
      if (typeof EventBus.clear === "function") EventBus.clear();
    } catch (e) {}
  });

  it("prints raw vs smoothed sequences", function (done) {
    this.timeout(5000);

    const rawMgr = new LandmarkRawManager({
      eventBus: EventBus,
      useMediaPipe: false,
      maxLandmarks: 21,
    });

    const smooth = new LandmarkSmoothManager({
      eventBus: EventBus,
      enableOneEuro: true,
      oneEuroParams: { minCutoff: 0.01, beta: 0.0, dCutoff: 1.0 },
      enableKalman: false,
      enableBoneClamps: false,
      maxLandmarks: 21,
    });

    const received = [];
    const unsub = EventBus.addEventListener("landmark:smoothed", (env) =>
      received.push(env && env.detail ? env.detail : env)
    );

    smooth.start();

    const noise = [
      0.02, -0.015, 0.01, -0.012, 0.005, -0.007, 0.003, -0.001, 0.002, -0.002,
      0.004, -0.003, 0.006, -0.004, 0.001, -0.005, 0.008, -0.006, 0.002, -0.009,
      0.003, -0.002, 0.005, -0.001, 0.0, 0.002, -0.003, 0.004, -0.002, 0.001,
    ];
    const frames = noise.length;
    const baseX = 0.5,
      baseY = 0.5;

    for (let f = 0; f < frames; f++) {
      const landmarks = [];
      for (let i = 0; i < 21; i++) {
        let x = baseX;
        if (i === 0) x = baseX + noise[f];
        landmarks.push([Number(x.toFixed(6)), baseY, 0]);
      }
      const payload = {
        landmarks,
        frameId: f + 1,
        timestamp: Date.now() + f * 33,
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
        console.log(
          "DEBUG_RAW_SEQ:",
          noise.map((n) => (baseX + n).toFixed(12)).join(",")
        );
        const smoothSeq = received
          .slice(0, frames)
          .map((r) => r.landmarks[0][0]);
        console.log(
          "DEBUG_SMOOTH_SEQ:",
          smoothSeq.map((v) => Number(v).toFixed(12)).join(",")
        );

        for (let i = 0; i < frames; i++) {
          console.log(
            `FRAME ${i}: RAW=${(baseX + noise[i]).toFixed(12)} SMOOTH=${
              smoothSeq[i] === undefined
                ? "undef"
                : Number(smoothSeq[i]).toFixed(12)
            }`
          );
        }

        function variance(arr) {
          const mean = arr.reduce((s, v) => s + Number(v), 0) / arr.length;
          return (
            arr.reduce(
              (s, v) => s + (Number(v) - mean) * (Number(v) - mean),
              0
            ) / arr.length
          );
        }
        const rawSeq = noise.map((n) => baseX + n);
        const rawVar = variance(rawSeq);
        const smoothVar = variance(smoothSeq);
        console.log(`DEBUG_VARS: rawVar=${rawVar} smoothVar=${smoothVar}`);

        unsub && unsub();
        done();
      } catch (err) {
        unsub && unsub();
        done(err);
      }
    }, 50);
  });
});
