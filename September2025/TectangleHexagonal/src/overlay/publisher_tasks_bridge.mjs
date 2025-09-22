// WEBWAY:ww-2025-095 Tasks bridge → overlay bus
// Purpose: Load MediaPipe Tasks (GestureRecognizer + optional HandLandmarker)
// and publish overlay:landmarks and overlay:fsm to the in-page bus.
// Feature-gated from overlay_os_v1.html via FEATURE_TASKS_BRIDGE.

import { createClutchFSM } from './fsm_clutch.mjs';

// Small helper to safely access window.performance in tests
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export async function startTasksPublisher({ videoEl, bus, maxHands = 2, enableLandmarks = true } = {}) {
  if (!videoEl || !bus) throw new Error('publisher_tasks_bridge: missing videoEl or bus');

  const nmBase = '/node_modules/@mediapipe/tasks-vision';
  const wasmBase = `${nmBase}/wasm`;
  const GESTURE_MODEL = '/September2025/TectangleHexagonal/assets/models/gesture_recognizer.task';
  const HAND_MODEL = '/September2025/TectangleHexagonal/assets/models/hand_landmarker.task';

  let recognizer = null;
  let handLandmarker = null;
  let running = true;

  // Per-hand FSMs keyed by index (0→P1, 1→P2)
  const fsms = new Map();
  const getFSM = (idx) => {
    if (!fsms.has(idx)) fsms.set(idx, createClutchFSM({ now }));
    return fsms.get(idx);
  };

  try {
    const visionPkg = await import(`${nmBase}/vision_bundle.mjs`);
    const { FilesetResolver, GestureRecognizer } = visionPkg;
    const filesetResolver = await FilesetResolver.forVisionTasks(wasmBase);
    recognizer = await GestureRecognizer.createFromOptions(filesetResolver, {
      baseOptions: { modelAssetPath: GESTURE_MODEL },
      runningMode: 'VIDEO',
      numHands: Math.min(2, Math.max(1, maxHands)),
    });
    if (enableLandmarks) {
      try {
        const { HandLandmarker } = visionPkg;
        handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: HAND_MODEL },
          runningMode: 'VIDEO',
          numHands: Math.min(2, Math.max(1, maxHands)),
        });
      } catch (e) {
        console.warn('WEBWAY:ww-2025-095: hand landmarker unavailable', e?.message || e);
        handLandmarker = null;
      }
    }
  } catch (e) {
    console.error('WEBWAY:ww-2025-095: failed to initialize tasks', e);
    throw e;
  }

  async function step() {
    if (!running) return;
    try {
      const ts = now();
      const res = await recognizer.recognizeForVideo(videoEl, ts);

      // Build per-hand overlay payload
      const hands = [];
      const fsmOut = { P1: { primed: false, armed: false, score: 0 }, P2: { primed: false, armed: false, score: 0 } };

      const count = Array.isArray(res?.gestures) ? Math.min(res.gestures.length, 2) : 0;
      let landmarksRes = null;
      if (handLandmarker) {
        try { landmarksRes = await handLandmarker.detectForVideo(videoEl, ts); } catch {}
      }

      for (let i = 0; i < count; i++) {
        const gi = res.gestures[i] || [];
        const top = gi[0] || null;
        const label = top?.categoryName || '—';
        const score = typeof top?.score === 'number' ? top.score : 0;
        const handed = res?.handednesses?.[i]?.[0]?.categoryName; // 'Left' | 'Right' | undefined

        // Derive scores for clutch: open vs fist when available
        // If top label is Open_Palm or Closed_Fist we use it; otherwise keep zeros
        const openScore = label === 'Open_Palm' ? score : 0;
        const fistScore = label === 'Closed_Fist' ? score : 0;
        const fsm = getFSM(i);
        const stepRes = fsm.step({ open: openScore, fist: fistScore });

        const key = i === 0 ? 'P1' : 'P2';
        fsmOut[key] = { primed: !!stepRes.primed, armed: !!stepRes.armed, score: Math.max(openScore, fistScore) };

        const lms = Array.isArray(landmarksRes?.landmarks) ? (landmarksRes.landmarks[i] || []) : [];
        hands.push({ label: key, handedness: handed, gesture: { label, score }, landmarks: lms });
      }

      // Publish
      bus.publish('overlay:landmarks', { hands });
      bus.publish('overlay:fsm', fsmOut);
    } catch (e) {
      // Keep errors from breaking the loop; log occasionally
      if (console && console.debug) console.debug('WEBWAY:ww-2025-095 step error', e?.message || e);
    } finally {
      if (running) requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);

  return {
    stop() { running = false; },
  };
}
