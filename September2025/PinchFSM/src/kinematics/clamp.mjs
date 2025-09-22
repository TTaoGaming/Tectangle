// Kinematic clamp helper: flags or corrects wrist jumps beyond a threshold

export function clampWrist(current, previous, maxDelta = 0.15) {
  // current/previous: { x,y,z }
  if (!current || !previous) return { point: current, clamped: false };
  const dx = (current.x - previous.x);
  const dy = (current.y - previous.y);
  const dz = (current.z || 0) - (previous.z || 0);
  const d = Math.hypot(dx, dy, dz);
  if (!Number.isFinite(d)) return { point: current, clamped: false };
  if (d > maxDelta) {
    // strategy A: freeze to previous
    return { point: { ...previous }, clamped: true };
  }
  return { point: current, clamped: false };
}
