import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import defaultBus from "../../src/EventBusManager.js";
import { init as pinchInit, start as pinchStart, stop as pinchStop, setConfig as pinchSetConfig } from "../../src/gesture/pinchBaseline.js";

test("smoke: pinch baseline detects pinch from golden trace", async () => {
  // Isolate bus state between runs
  defaultBus.clear();

  const pinches = [];
  const telemetry = [];

  const unsubPinch = defaultBus.addEventListener("pinch:down", (env) => {
    const detail = env && env.detail ? env.detail : env;
    pinches.push(detail);
    console.info("[smoke] pinch:down", detail);
  });

  const unsubTelemetry = defaultBus.addEventListener("telemetry:counter", (env) => {
    const detail = env && env.detail ? env.detail : env;
    telemetry.push(detail);
    console.info("[smoke] telemetry:counter", detail);
  });

  // init and start pinch baseline
  pinchInit();
  pinchSetConfig({ triggerThreshold: 0.03, releaseThreshold: 0.05, minConsecutiveFrames: 1 });
  pinchStart();

  // read golden trace
  const raw = await fs.readFile(new URL('../golden/pinch_baseline_01.jsonl', import.meta.url), 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);

  for (const line of lines) {
    try {
      const frame = JSON.parse(line);
      defaultBus.publish("landmark:smoothed", frame);
    } catch (e) {
      // ignore parse errors
    }
    // tiny processing window
    await new Promise((r) => setTimeout(r, 5));
  }

  // wait briefly to allow processing
  await new Promise((r) => setTimeout(r, 50));

  // stop and cleanup
  pinchStop();
  try { unsubPinch?.(); } catch (e) {}
  try { unsubTelemetry?.(); } catch (e) {}

  assert.ok(
    pinches.length > 0 ||
      telemetry.some((t) => t && t.metric === "telemetry.pinch.count"),
    `Expected pinch events or telemetry; got pinches=${pinches.length} telemetryCount=${telemetry.length}`
  );
});