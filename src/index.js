// WEBWAY:ww-2025-001: Simple Spatial SDK entry
// Feature flag: SPATIAL_SDK_SIMPLE — set to '0' to disable exposing this entry
// This is a thin, stable entry that wraps the internal Hex facade without importing app internals.
// Contract (v0):
//   import { createSpatialInput } from 'tectangle-gesture-keyboard-mobile'
//   const sdk = createSpatialInput({ factories?: { createAppShell } })
//   sdk.startCamera(videoEl); sdk.startVideoUrl(videoEl, url); sdk.stop();
//   const off = sdk.on(evt => { /* pinch + seats events */ });
//   sdk.updatePinchConfig(part); sdk.getRichSnapshot(); sdk.getState();

import { HexInput } from "../September2025/TectangleHexagonal/src/sdk/hexInputFacade.js";
export { createTTIRecorder } from "../September2025/TectangleHexagonal/src/telemetry/pinch_tti.js";

export const FEATURE_FLAG_SPATIAL_SDK_SIMPLE = "SPATIAL_SDK_SIMPLE";

export function createSpatialInput(opts = {}) {
  // WEBWAY:ww-2025-001: forward to Hex facade (DI-friendly)
  if (typeof process !== 'undefined' && process.env && process.env[FEATURE_FLAG_SPATIAL_SDK_SIMPLE] === '0') {
    throw new Error('Simple Spatial SDK is disabled by feature flag');
  }
  return HexInput.create(opts);
}

export default { createSpatialInput, FEATURE_FLAG_SPATIAL_SDK_SIMPLE };
