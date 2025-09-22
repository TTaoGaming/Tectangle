import test from "node:test";
import assert from "node:assert/strict";
import defaultBus from "../../src/EventBusManager.js";
import KinematicClampManager from "../../src/KinematicClampManager.js";

test("smoke: kinematic plausibility end-to-end with default EventBus", async () => {
  // isolate bus state between runs
  defaultBus.clear();

  const fails = [];
  const passes = [];
  const telemetry = [];

  defaultBus.addEventListener("plausibility:physics.fail", (env) => {
    // env is the normalized envelope from EventBusManager; detail contains the payload
    const detail = env && env.detail ? env.detail : env;
    fails.push(detail);
    console.info(
      "[smoke] plausibility:physics.fail received sampleIndex=",
      detail.sampleIndex
    );
  });

  defaultBus.addEventListener("plausibility:physics.pass", (env) => {
    const detail = env && env.detail ? env.detail : env;
    passes.push(detail);
    console.info(
      "[smoke] plausibility:physics.pass received sampleIndex=",
      detail.sampleIndex
    );
  });

  defaultBus.addEventListener("telemetry:counter", (env) => {
    const detail = env && env.detail ? env.detail : env;
    telemetry.push(detail);
    console.info("[smoke] telemetry:counter", detail);
  });

  const manager = new KinematicClampManager({ eventBus: defaultBus });
  manager.setConfig({
    teleportNormalizedDistance: 0.05,
    minFingertipViolations: 1,
    maxNormalizedSpeedPerSecond: 0.01,
    aggregationWindowMs: 10,
  });
  manager.start?.();

  // helper to build frames with simple fingertip positions
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

  // Emit a normal sequence (should produce a pass)
  const wristA = [0.1, 0.5, 0];
  const middleA = [0.11, 0.5, 0];
  const fingertipA = [0.12, 0.5, 0];

  defaultBus.publish(
    "landmark:smoothed",
    makeFrame(0, wristA, middleA, fingertipA)
  );
  await new Promise((r) => setTimeout(r, 20));
  defaultBus.publish(
    "landmark:smoothed",
    makeFrame(1, wristA, middleA, fingertipA)
  );
  await new Promise((r) => setTimeout(r, 20));

  // Emit a teleport (should produce a fail)
  const wristB = [0.9, 0.5, 0];
  const middleB = [0.91, 0.5, 0];
  const fingertipB = [0.92, 0.5, 0];

  defaultBus.publish(
    "landmark:smoothed",
    makeFrame(2, wristB, middleB, fingertipB)
  );
  await new Promise((r) => setTimeout(r, 200));

  // Validate expected telemetry and events
  assert.ok(
    fails.length > 0,
    `Expected plausibility:physics.fail emitted (got ${fails.length})`
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

  assert.ok(
    passes.length > 0,
    `Expected plausibility:physics.pass emitted (got ${passes.length})`
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
