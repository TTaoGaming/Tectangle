import { test } from "node:test";
import assert from "node:assert/strict";
import CameraManager from "../../src/CameraManager.js";

test("camera device listing and selection emits device change and stops previous tracks", async () => {
  // deterministic mock devices
  const mockDevices = [
    { kind: "videoinput", deviceId: "front-1", label: "Front Camera" },
    { kind: "videoinput", deviceId: "back-1", label: "Back Camera" },
  ];

  // getUserMedia returns a simple stream-like object whose tracks can be "stopped"
  let callCount = 0;
  const stoppedFlags = [];
  const mockMediaDevices = {
    enumerateDevices: async () => mockDevices,
    getUserMedia: async (constraints) => {
      callCount++;
      const stopped = { val: false };
      stoppedFlags.push(stopped);
      return {
        getTracks() {
          return [
            {
              stop() {
                stopped.val = true;
              },
            },
          ];
        },
        // optional inspectable marker for tests
        _stoppedRef: stopped,
      };
    },
  };

  // simple EventBus spy
  const published = [];
  const mockEventBus = {
    publish(event, payload) {
      published.push({ event, payload });
    },
  };

  // Instantiate CameraManager with injected mocks (per architect plan)
  const cam = new CameraManager({
    mediaDevices: mockMediaDevices,
    eventBus: mockEventBus,
  });

  // 1) lists available video input devices
  const devices = await cam.getAvailableVideoDevices();
  assert(Array.isArray(devices), "devices should be an array");
  assert.strictEqual(devices.length, 2, "expected two video input devices");
  assert.strictEqual(
    devices[0].deviceId,
    "front-1",
    "first device id should be front-1"
  );
  assert.strictEqual(
    devices[1].deviceId,
    "back-1",
    "second device id should be back-1"
  );

  // 2) selecting devices requests streams and emits device change
  const stream1 = await cam.selectDevice("front-1");
  assert(
    stream1 && typeof stream1.getTracks === "function",
    "first stream should provide tracks"
  );

  // Select the other device; previous stream tracks should be stopped
  const stream2 = await cam.selectDevice("back-1");

  // ensure first returned stream's tracks were stopped (via our stoppedFlags array)
  assert.strictEqual(
    stoppedFlags[0].val,
    true,
    "previous stream tracks must be stopped"
  );

  // ensure EventBus published a device changed event for the second selection
  const deviceChanged = published.find(
    (p) =>
      p.event === "camera.device.changed" &&
      p.payload &&
      p.payload.deviceId === "back-1"
  );
  assert(
    deviceChanged,
    "EventBus should have published camera.device.changed for back-1"
  );
});
