import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import KinematicClampManager from "../../src/KinematicClampManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const GOLDEN = path.join(
  __dirname,
  "../golden-master/2 hands swap positions.jsonl"
);

test("KinematicClampManager - red: emits plausibility:physics.fail for crossing-hands golden master (diagnostic)", async () => {
  const bus = new EventEmitter();
  const fails = [];
  const alias = [];
  let lastSentSampleIndex = null;

  bus.on("plausibility:physics.fail", (p) => {
    fails.push({ payload: p, sampleIndex: lastSentSampleIndex });
    console.info(
      `[diagnostic] plausibility:physics.fail at sampleIndex=${lastSentSampleIndex}`,
      p && p.reason ? `reason=${p.reason}` : ""
    );
  });
  bus.on("landmark:physicsimplausible", (p) => {
    alias.push({ payload: p, sampleIndex: lastSentSampleIndex });
    console.info(
      `[diagnostic] landmark:physicsimplausible at sampleIndex=${lastSentSampleIndex}`,
      p && p.reason ? `reason=${p.reason}` : ""
    );
  });

  const manager = new KinematicClampManager({ eventBus: bus });
  if (typeof manager.setConfig === "function") {
    manager.setConfig({
      teleportNormalizedDistance: 0.8,
      maxNormalizedSpeedPerSecond: 10,
    });
  }
  manager.start?.();

  const raw = await fs.readFile(GOLDEN, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);

  for (const l of lines) {
    const env = JSON.parse(l);
    lastSentSampleIndex = env.sampleIndex ?? null;
    // publish the canonical envelope used in repo
    bus.emit("landmark:smoothed", env);
    // give manager a small window to process and emit diagnostic
    await new Promise((r) => setTimeout(r, 10));

    if (fails.length > 0 || alias.length > 0) break;
  }

  // wait briefly for any delayed emits
  await new Promise((r) => setTimeout(r, 200));

  if (fails.length > 0) {
    console.log(
      "Detected plausibility.fail samples:",
      fails.map((f) => f.sampleIndex)
    );
    console.log(
      "Sample payload (first):",
      JSON.stringify(fails[0].payload, null, 2)
    );
  }
  if (alias.length > 0) {
    console.log(
      "Detected deprecated alias samples:",
      alias.map((a) => a.sampleIndex)
    );
    console.log(
      "Alias sample payload (first):",
      JSON.stringify(alias[0].payload, null, 2)
    );
  }

  assert.ok(
    fails.length > 0 || alias.length > 0,
    `Expected plausibility:physics.fail or deprecated alias landmark:physicsimplausible to be emitted. found fail=${fails.length}, alias=${alias.length}`
  );
});
