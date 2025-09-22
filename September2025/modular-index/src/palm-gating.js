// palm-gating.js
// Compute a simple palm-facing estimate using a palm normal derived from
// landmarks [0 (wrist), 5 (index_mcp), 17 (pinky_mcp)].
//
// API:
//   import { computePalmFacing } from './palm-gating.js';
//   const { angleDeg, facing } = computePalmFacing(landmarks, { thresholdDeg: 50 });
//
// Notes:
// - Landmarks expected in MediaPipe format: array of {x,y,z} (normalized coords).
// - Uses cross product of (indexMcp - wrist) x (pinkyMcp - wrist) to estimate palm normal.
// - By convention MediaPipe z is negative toward the camera; we measure angle between
//   the palm normal and camera-forward vector (0,0,-1). Facing==true when angle < thresholdDeg.
// - This is intentionally simple and robust-ish; if the normal can't be computed due to
//   degenerate geometry we fallback to a heuristic based on centroid->index vector.

export function computePalmFacing(landmarks = [], opts = {}) {
  const thresholdDeg = opts.thresholdDeg ?? 50;
  if (!Array.isArray(landmarks) || landmarks.length < 18) {
    return { angleDeg: null, facing: false };
  }

  const get = (i) => {
    const p = landmarks[i] || { x: 0, y: 0, z: 0 };
    return { x: Number(p.x || 0), y: Number(p.y || 0), z: Number(p.z || 0) };
  };

  const wrist = get(0);
  const idx = get(5); // index_mcp
  const pinky = get(17); // pinky_mcp

  const v1 = { x: idx.x - wrist.x, y: idx.y - wrist.y, z: idx.z - wrist.z };
  const v2 = { x: pinky.x - wrist.x, y: pinky.y - wrist.y, z: pinky.z - wrist.z };

  // cross product v1 x v2
  const nx = v1.y * v2.z - v1.z * v2.y;
  const ny = v1.z * v2.x - v1.x * v2.z;
  const nz = v1.x * v2.y - v1.y * v2.x;

  const norm = Math.hypot(nx, ny, nz);

  let angleDeg = null;
  let facing = false;

  if (norm > 1e-9) {
    // camera-forward vector (pointing out of screen toward camera) = (0,0,-1)
    // compute angle between normal and cameraForward
    const cameraZ = { x: 0, y: 0, z: -1 };
    const dot = nx * cameraZ.x + ny * cameraZ.y + nz * cameraZ.z; // equals -nz
    const cosTheta = dot / norm; // cameraZ is unit length
    const clamped = Math.max(-1, Math.min(1, cosTheta));
    angleDeg = (Math.acos(clamped) * 180) / Math.PI;
    facing = angleDeg < thresholdDeg;
  } else {
    // fallback: estimate with vector from palm centroid to index mcp
    const centroid = palmCentroid(landmarks);
    const pVec = { x: idx.x - centroid.x, y: idx.y - centroid.y, z: idx.z - centroid.z };
    const pNorm = Math.hypot(pVec.x, pVec.y, pVec.z);
    if (pNorm > 1e-9) {
      // angle between pVec and cameraZ: if pointing toward camera, then facing
      const dot = pVec.x * 0 + pVec.y * 0 + pVec.z * -1;
      const clamped = Math.max(-1, Math.min(1, dot / pNorm));
      angleDeg = (Math.acos(clamped) * 180) / Math.PI;
      facing = angleDeg < thresholdDeg;
    } else {
      angleDeg = null;
      facing = false;
    }
  }

  return { angleDeg, facing };
}

// helper: simple palm centroid used in fallback above
export function palmCentroid(landmarks = []) {
  const indices = [0, 5, 9, 13, 17]; // wrist + mcp points
  let sx = 0,
    sy = 0,
    sz = 0,
    count = 0;
  for (const i of indices) {
    const p = landmarks[i];
    if (!p) continue;
    sx += Number(p.x || 0);
    sy += Number(p.y || 0);
    sz += Number(p.z || 0);
    count++;
  }
  if (count === 0) return { x: 0, y: 0, z: 0 };
  return { x: sx / count, y: sy / count, z: sz / count };
}