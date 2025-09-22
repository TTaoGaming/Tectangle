// kinematic-clamp.js
// Simple kinematic clamp that assigns stable controller IDs using wrist (landmark 0)
// nearest-neighbor greedy matching. Keeps temporal state and expires old IDs.
//
// API:
//   const kc = new KinematicClamp({ expiryFrames: 30, maxDist: 0.2 });
//   const assigned = kc.assign(smoothedMulti, handednessArray);
//   // assigned => [{ controllerId, landmarks, handedness }, ...]
//   kc.reset();

export class KinematicClamp {
  constructor({ expiryFrames = 30, maxDist = 0.20 } = {}) {
    this.expiryFrames = expiryFrames;
    this.maxDist = maxDist; // normalized coordinate units (approx 0..1)
    this.nextId = 1;
    // tracked: Map<controllerId, { lastPos: {x,y,z}, lastSeenFrame: number }>
    this.tracked = new Map();
    this._frame = 0;
  }

  reset() {
    this.nextId = 1;
    this.tracked.clear();
    this._frame = 0;
  }

  // smoothedMulti: [ [ {x,y,z} ... 21 ], ... ]
  // handednessArr: optional array parallel to smoothedMulti (strings or objects)
  assign(smoothedMulti = [], handednessArr = []) {
    this._frame++;
    const results = [];
    const usedIds = new Set();

    // Helper: squared distance in xyz (handles missing z)
    const dist2 = (a, b) => {
      if (!a || !b) return Infinity;
      const dx = (a.x || 0) - (b.x || 0);
      const dy = (a.y || 0) - (b.y || 0);
      const dz = (a.z || 0) - (b.z || 0);
      return dx * dx + dy * dy + dz * dz;
    };

    for (let h = 0; h < smoothedMulti.length; h++) {
      const landmarks = smoothedMulti[h] || [];
      const wrist = landmarks[0] || null;
      let assignedId = null;

      if (wrist) {
        // Greedy nearest neighbor: find closest unassigned tracked id
        let best = { id: null, d2: Infinity };
        for (const [id, info] of this.tracked.entries()) {
          if (usedIds.has(id)) continue;
          const d2 = dist2(wrist, info.lastPos);
          if (d2 < best.d2) {
            best = { id, d2 };
          }
        }
        if (best.id !== null && Math.sqrt(best.d2) <= this.maxDist) {
          assignedId = best.id;
          usedIds.add(assignedId);
          const entry = this.tracked.get(assignedId);
          entry.lastPos = { x: wrist.x, y: wrist.y, z: wrist.z };
          entry.lastSeenFrame = this._frame;
        }
      }

      if (assignedId === null) {
        // allocate a new id
        assignedId = this.nextId++;
        this.tracked.set(assignedId, {
          lastPos: wrist ? { x: wrist.x, y: wrist.y, z: wrist.z } : { x: 0, y: 0, z: 0 },
          lastSeenFrame: this._frame,
        });
        usedIds.add(assignedId);
      }

      results.push({
        controllerId: assignedId,
        landmarks,
        handedness: handednessArr && handednessArr[h] ? handednessArr[h] : null,
      });
    }

    // Expire stale tracked ids that haven't been seen for expiryFrames
    for (const [id, info] of Array.from(this.tracked.entries())) {
      if (!usedIds.has(id) && this._frame - info.lastSeenFrame >= this.expiryFrames) {
        this.tracked.delete(id);
      }
    }

    return results;
  }
}