// Updated: 2025-08-29T23:30:00Z
import assert from "assert";
import EventBus from "../../src/EventBusManager.js";
import LandmarkRawManager from "../../src/LandmarkRawManager.js";
import LandmarkSmoothManager from "../../src/LandmarkSmoothManager.js";

describe("LandmarkSmoothManager — Kalman tests moved", function () {
  beforeEach(function () {
    try {
      if (typeof EventBus.clear === "function") EventBus.clear();
    } catch (e) {}
  });

  it.skip("Kalman fingertip acceptance moved to PredictiveLatencyManager — placeholder (skipped)", function () {});
});
