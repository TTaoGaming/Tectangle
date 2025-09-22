// Maps detected hands to stable controller IDs across frames using greedy nearest wrist matching

export class ControllerTracker {
  constructor(opts = {}) {
    const { swapThreshold = 0.10, staleMs = 1000 } = opts || {};
    this.swapThreshold = swapThreshold;
    this.staleMs = staleMs;
    this._last = new Map(); // id -> { wrist:[x,y,z], t }
    this._idByHanded = { Left: 'L0', Right: 'R0' };
  }

  // hands: [{ handedness: [{categoryName, score}], landmarks: [{x,y,z}], ... }]
  assign(hands, tMs) {
    const result = [];
    const candidates = hands.map((h) => ({
      handed: (h.handedness?.[0]?.categoryName) || 'Unknown',
      wrist: h.landmarks?.[0] || { x: 0, y: 0, z: 0 },
      ref: h,
    }));

    // initial assignment
    if (this._last.size === 0) {
      for (const c of candidates) {
        const id = this._idByHanded[c.handed] || (c.handed === 'Right' ? 'R0' : 'L0');
        this._last.set(id, { wrist: [c.wrist.x, c.wrist.y, c.wrist.z || 0], t: tMs });
        result.push({ id, handed: c.handed });
      }
      return result;
    }

    // greedy nearest by distance to last-known ids
    const ids = Array.from(this._last.keys());
    const used = new Set();
    for (const c of candidates) {
      let bestId = null; let bestD = Infinity;
      for (const id of ids) {
        if (used.has(id)) continue;
        const last = this._last.get(id);
        if (!last) continue;
        if (tMs - last.t > this.staleMs) continue;
        const d = dist3(last.wrist, [c.wrist.x, c.wrist.y, c.wrist.z || 0]);
        if (d < bestD) { bestD = d; bestId = id; }
      }
      if (bestId && bestD <= this.swapThreshold) {
        used.add(bestId);
        this._last.set(bestId, { wrist: [c.wrist.x, c.wrist.y, c.wrist.z || 0], t: tMs });
        result.push({ id: bestId, handed: c.handed });
      } else {
        // fallback to handed default
        const id = this._idByHanded[c.handed] || (c.handed === 'Right' ? 'R0' : 'L0');
        this._last.set(id, { wrist: [c.wrist.x, c.wrist.y, c.wrist.z || 0], t: tMs });
        result.push({ id, handed: c.handed });
      }
    }
    return result;
  }
}

function dist3(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = (a[2] || 0) - (b[2] || 0);
  return Math.hypot(dx, dy, dz);
}
