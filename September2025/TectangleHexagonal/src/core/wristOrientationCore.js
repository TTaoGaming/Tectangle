/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// wristOrientationCore: pure planar wrist orientation computation per hand.
// WEBWAY:ww-2025-006: WristOrientationCore scaffold (expires 2025-10-07)
/* Contract
Input update(frame): expects frame with t (ms), wrist [x,y,z], indexMCP [x,y,z].
Config:
  palmGate: boolean (if true require frame.palmValid !== false)
  buckets: array of { name, min, max } in degrees (wrap handled)
  smoothAlpha: 0<α<=1 for exponential moving average on orientation vector (default 0.25)
  emitUnchanged: if false, suppress events when bucket unchanged (still updates smoothing state)
Outputs via on(listener): events {
  type:'wrist:orientation', t, angleDeg (raw), smoothAngleDeg, bucket, flags{ up,right,down,left }
}
State: last raw angle & bucket & smooth angle.
*/
export function createWristOrientationCore(options={}){
  const C = Object.assign({
    palmGate: true,
    buckets: [
      { name:'UP', min:-45, max:45 },
      { name:'RIGHT', min:45, max:135 },
      { name:'DOWN', min:135, max:225 },
      { name:'LEFT', min:225, max:315 }
    ],
    normalizeAngle: a => { let x = a % 360; if(x<0) x+=360; return x; },
    emitUnchanged: false,
    smoothAlpha: 0.25,
  }, options);

  const subs = new Set();
  function emit(e){ subs.forEach(h=>{ try{ h(e); }catch{} }); }
  let lastAngle = null, lastBucket = null;
  let lastT = null; // last frame timestamp for velocity & dwell
  let lastEmitBucketT = null; // last time bucket event emitted (for dwell)
  let lastAngleForVel = null, lastTVel = null; // tracking for velocity smoothing
  let lastVelDegPerSec = 0;
  let sx = null, sy = null; // smoothed unit vector
  let smoothAngle = null;

  function bucketFor(angleDeg){
    const a = C.normalizeAngle(angleDeg);
    for(const b of C.buckets){
      const min = C.normalizeAngle(b.min);
      const max = C.normalizeAngle(b.max);
      if(min <= max){ if(a>=min && a<max) return b.name; }
      else { if(a>=min || a<max) return b.name; }
    }
    return 'UP';
  }

  function computeAngle(frame){
    if(!frame) return null;
    if(C.palmGate && frame.palmValid === false) return null;
  const wrist = frame.wrist;
  const ref = frame.indexMCP; // simplified: index MCP only WEBWAY:ww-2025-006 (expires 2025-10-07)
  if(!wrist || !ref) return null;
    try{
      const dx = ref[0]-wrist[0];
      const dy = ref[1]-wrist[1];
      const ang = Math.atan2(dy, dx) * 180/Math.PI;
      return C.normalizeAngle(ang);
    }catch{}
    return null;
  }

  function update(frame){
    const ang = computeAngle(frame);
    if(ang == null) return;
    // raw unit vector
    const rad = ang * Math.PI/180;
    const ux = Math.cos(rad), uy = Math.sin(rad);
    if(sx==null || sy==null){ sx = ux; sy = uy; }
    else {
      const a = C.smoothAlpha;
      sx = (1-a)*sx + a*ux;
      sy = (1-a)*sy + a*uy;
      // re-normalize lightly to prevent drift
      const mag = Math.hypot(sx, sy) || 1; sx/=mag; sy/=mag;
    }
    smoothAngle = C.normalizeAngle(Math.atan2(sy, sx) * 180/Math.PI);
    const bucket = bucketFor(ang);

    // Compute angular velocity (raw angle domain 0-360) minimizing wrap discontinuity
    if(lastAngleForVel!=null && lastTVel!=null){
      const dt = (frame.t - lastTVel)/1000; // seconds
      if(dt>0){
        let delta = ang - lastAngleForVel;
        // unwrap shortest path
        if(delta > 180) delta -= 360; else if(delta < -180) delta += 360;
        const vel = delta / dt; // deg/sec
        lastVelDegPerSec = vel;
        emit({ type:'wrist:orientationVel', t: frame.t, velDegPerSec: vel });
      }
    }
    lastAngleForVel = ang; lastTVel = frame.t;

    const suppress = (!C.emitUnchanged && bucket === lastBucket);
    const dwellMs = (lastEmitBucketT!=null && lastBucket===bucket && lastEmitBucketT!=null) ? (frame.t - lastEmitBucketT) : 0;
    lastAngle = ang; lastBucket = bucket; lastT = frame.t;
    if(suppress) return; // still updated smoothing & velocity events were emitted
    lastEmitBucketT = frame.t;
    emit({ type:'wrist:orientation', t: frame.t, angleDeg: ang, smoothAngleDeg: smoothAngle, bucket, dwellMs: 0, flags:{
      up: bucket==='UP', right: bucket==='RIGHT', down: bucket==='DOWN', left: bucket==='LEFT'
    }});
  }

  function state(){ return { angleDeg: lastAngle, smoothAngleDeg: smoothAngle, bucket: lastBucket, velDegPerSec: lastVelDegPerSec }; }

  return { update, state, on(fn){ subs.add(fn); return ()=>subs.delete(fn); }, bucketFor };
}
