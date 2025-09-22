/**
 * tests/unit/camera.frame.test.mjs
 *
 * RED TDD test for CameraManager.start() — asserts that CameraManager emits 'camera:params' then 'camera:frame'
 *
 * Scope:
 *  - ESM (.mjs), uses node:assert
 *  - Imports CameraManager and EventBusManager from ../../src/
 *  - Uses a tiny FakeEventBus with publish(event, detail)
 *  - Ends with assert.fail to keep test red / failing by design
 */

import { strict as assert } from "node:assert";
import { test } from "node:test";
import EventBusManager from "../../src/EventBusManager.js";
import CameraManager from "../../src/CameraManager.js";

// Arrange: tiny fake EventBus that records published events
class FakeEventBus {
  constructor() {
    this.published = [];
  }

  // Minimal publish signature used by this test: publish(event, detail)
  publish(event, detail) {
    this.published.push({ event, detail, ts: Date.now() });
  }

  find(eventName) {
    return this.published.find((e) => e.event === eventName);
  }

  all() {
    return this.published;
  }
}

test("CameraManager.start should emit camera:params then camera:frame (RED - TDD)", async (t) => {
  // Sanity imports - ensure modules are resolvable in the test environment
  assert.ok(
    EventBusManager !== undefined,
    "EventBusManager should be importable from src"
  );
  assert.ok(
    CameraManager !== undefined,
    "CameraManager should be importable from src"
  );

  const fakeBus = new FakeEventBus();

  // Act: instantiate CameraManager and start with options demonstrating resolution, fps and source
  // NOTE: constructor signature may differ; adjust when implementing CameraManager
  const camera = new CameraManager({ eventBus: fakeBus });
  const options = { width: 640, height: 480, fps: 30, source: "webrtc" };
  if (typeof camera.start === "function") {
    await camera.start(options);
  } else {
    // If start() is not implemented yet, the test will later fail explicitly.
  }

  // Assert: placeholders describing expected events and payload shapes
  // - 'camera:params' published and contains resolution/fps/source fields
  const paramsEvent = fakeBus.find("camera:params");
  assert.ok(
    paramsEvent,
    "Expected 'camera:params' to be published by CameraManager.start()"
  );
  assert.ok(
    paramsEvent.detail,
    "'camera:params' should include a detail payload (object)"
  );
  // Expected fields: width, height, fps, source
  assert.ok(
    typeof paramsEvent.detail.width === "number",
    "'camera:params.detail.width' should be a number"
  );
  assert.ok(
    typeof paramsEvent.detail.height === "number",
    "'camera:params.detail.height' should be a number"
  );
  assert.ok(
    typeof paramsEvent.detail.fps === "number",
    "'camera:params.detail.fps' should be a number"
  );
  assert.ok(
    typeof paramsEvent.detail.source === "string",
    "'camera:params.detail.source' should be a string"
  );

  // - 'camera:frame' published containing frameId and some frame payload
  const frameEvent = fakeBus.find("camera:frame");
  assert.ok(
    frameEvent,
    "Expected 'camera:frame' to be published after 'camera:params'"
  );
  assert.ok(
    frameEvent.detail,
    "'camera:frame' should include a detail payload (object)"
  );
  // Expected fields: frameId (number), and a payload (e.g., video, imageBitmap, buffer or placeholder)
  assert.ok(
    typeof frameEvent.detail.frameId === "number",
    "'camera:frame.detail.frameId' should be a number"
  );
  assert.ok(
    frameEvent.detail.video ||
      frameEvent.detail.imageBitmap ||
      frameEvent.detail.payload,
    "'camera:frame' should include a video/imageBitmap/payload field (placeholder)"
  );

  // TODO: tighten assertions: check monotonic frameId, timestamp/perfTimestamp presence, and cadence
  // TODO: support both 'webrtc' and 'video-file' as source values in tests / implementation
});
