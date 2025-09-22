import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import KinematicClampManager from "../../src/KinematicClampManager.js";

test("KinematicClampManager: publishes plausibility:physics.pass for small motion (green)", async () => {
  const bus = new EventEmitter();
  const passes = [];
  const telemetry = [];

  bus.on("plausibility:physics.pass", (p) => {
    passes.push(p);
    console.info("[diag] plausibility:physics.pass received");
  });
  bus.on("telemetry:counter", (c) => {
    telemetry.push(c);
    console.info("[diag] telemetry:counter", c);
  });

  const manager = new KinematicClampManager({ eventBus: bus });
  // Relax thresholds so normal small motion is considered pass
  manager.setConfig({
    teleportNormalizedDistance: 0.8,
    minFingertipViolations: 1,
    aggregationWindowMs: 10,
    maxNormalizedSpeedPerSecond: 1000,
  });
  manager.start?.();

  const makeHand = (x) => ({
    handIndex: 0,
    handedness: "Right",
    smooth: Array.from({ length: 21 }, (_, i) => [
      x + 0.001 * i,
      0.5 + 0.0001 * i,
      0,
    ]),
  });

  const f0 = { sampleIndex: 0, timestamp: Date.now(), hands: [makeHand(0.5)] };
  const f1 = {
    sampleIndex: 1,
    timestamp: Date.now() + 16,
    hands: [makeHand(0.501)],
  };

  bus.emit("landmark:smoothed", f0);
  await new Promise((r) => setTimeout(r, 10));
  bus.emit("landmark:smoothed", f1);
  await new Promise((r) => setTimeout(r, 200));

  assert.ok(
    passes.length > 0,
    "Expected plausibility:physics.pass to be emitted"
  );
  assert.ok(
    telemetry.some(
      (t) =>
        t &&
        (t.metric === "telemetry.plausibility.physics.pass.count" ||
          (typeof t.metric === "string" &&
            t.metric.includes("plausibility.physics.pass")))
    ),
    "Expected telemetry counter for pass"
  );
});

test("KinematicClampManager: publishes plausibility:physics.fail for synthetic teleport (green)", async () => {
  const bus = new EventEmitter();
  const fails = [];
  const telemetry = [];

  bus.on("plausibility:physics.fail", (p) => {
    fails.push(p);
    console.info(
      "[diag] plausibility:physics.fail received, reason=",
      p && p.reason
    );
  });
  bus.on("telemetry:counter", (c) => {
    telemetry.push(c);
    console.info("[diag] telemetry:counter", c);
  });

  const manager = new KinematicClampManager({ eventBus: bus });
  // Tight thresholds to ensure the synthetic jump triggers a fail
  manager.setConfig({
    teleportNormalizedDistance: 0.05,
    minFingertipViolations: 1,
    aggregationWindowMs: 10,
    maxNormalizedSpeedPerSecond: 0.01,
  });
  manager.start?.();

  const wristPrev = [0.1, 0.5, 0];
  const middlePrev = [0.11, 0.5, 0];
  const fingertipPrev = [0.12, 0.5, 0];

  const wristCurr = [0.9, 0.5, 0];
  const middleCurr = [0.91, 0.5, 0];
  const fingertipCurr = [0.92, 0.5, 0];

  const makeFrame = (sampleIndex, wrist, middle, fingertip) => {
    const smooth = [];
    for (let i = 0; i < 21; i++) {
      if (i === 0) smooth.push(wrist.slice());
      else if (i === 9) smooth.push(middle.slice());
      else if (i === 4) smooth.push(fingertip.slice());
      else smooth.push([0.5 + 0.001 * i, 0.5, 0]);
    }
    return {
      sampleIndex,
      timestamp: Date.now() + sampleIndex,
      hands: [{ handIndex: 0, handedness: "Right", smooth }],
    };
  };

  bus.emit(
    "landmark:smoothed",
    makeFrame(0, wristPrev, middlePrev, fingertipPrev)
  );
  await new Promise((r) => setTimeout(r, 10));
  bus.emit(
    "landmark:smoothed",
    makeFrame(1, wristPrev, middlePrev, fingertipPrev)
  );
  await new Promise((r) => setTimeout(r, 10));
  bus.emit(
    "landmark:smoothed",
    makeFrame(2, wristCurr, middleCurr, fingertipCurr)
  );
  await new Promise((r) => setTimeout(r, 200));

  assert.ok(
    fails.length > 0,
    `Expected plausibility:physics.fail to be emitted (got ${fails.length})`
  );
  assert.ok(
    telemetry.some(
      (t) =>
        t &&
        (t.metric === "telemetry.plausibility.physics.fail.count" ||
          (typeof t.metric === "string" &&
            t.metric.includes("plausibility.physics.fail")))
    ),
    "Expected telemetry counter for fail"
  );
});
