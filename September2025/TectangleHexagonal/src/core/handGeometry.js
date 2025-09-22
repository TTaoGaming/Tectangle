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

// Hand geometry utilities: joint angles, palm angle, bone ratios/ID.
// Works with MediaPipe Hands 21-point layout.

const IDX = {
  WRIST: 0,
  TH_CMC: 1, TH_MCP: 2, TH_IP: 3, TH_TIP: 4,
  IX_MCP: 5, IX_PIP: 6, IX_DIP: 7, IX_TIP: 8,
  MD_MCP: 9, MD_PIP:10, MD_DIP:11, MD_TIP:12,
  RG_MCP:13, RG_PIP:14, RG_DIP:15, RG_TIP:16,
  PK_MCP:17, PK_PIP:18, PK_DIP:19, PK_TIP:20,
};

function sub(a,b){ return [a[0]-b[0], a[1]-b[1], (a[2]||0)-(b[2]||0)]; }
function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+(a[2]||0)*(b[2]||0); }
function norm(a){ return Math.hypot(a[0],a[1],a[2]||0)||0; }
function angleBetween(u,v){ const nu = norm(u), nv = norm(v); if(nu===0||nv===0) return 0; const c = Math.max(-1, Math.min(1, dot(u,v)/(nu*nv))); return Math.acos(c)*180/Math.PI; }
function jointAngle(a,b,c){ // angle at b: between BA and BC
  const ba = sub(a,b), bc=sub(c,b); return angleBetween(ba, bc); // degrees
}

export function computePalmAngle(wrist, indexMCP, pinkyMCP, opts={}){
  if(!wrist || !indexMCP || !pinkyMCP) return null;
    let handHint = null;
  if(typeof opts === 'string'){ handHint = opts; }
  else if(opts && typeof opts === 'object'){
    if(Object.prototype.hasOwnProperty.call(opts, 'hand') && opts.hand != null) handHint = opts.hand;
    else if(Object.prototype.hasOwnProperty.call(opts, 'handedness') && opts.handedness != null) handHint = opts.handedness;
    else if(Object.prototype.hasOwnProperty.call(opts, 'side') && opts.side != null) handHint = opts.side;
  }
  const vx=indexMCP[0]-wrist[0], vy=indexMCP[1]-wrist[1], vz=(indexMCP[2]??0)-(wrist[2]??0);
  const ux=pinkyMCP[0]-wrist[0], uy=pinkyMCP[1]-wrist[1], uz=(pinkyMCP[2]??0)-(wrist[2]??0);
  let nx=vy*uz - vz*uy, ny=vz*ux - vx*uz, nz=vx*uy - vy*ux; // normal = v x u
  let hand = handHint;
  if(!hand && indexMCP && pinkyMCP){
    if(indexMCP[0] > pinkyMCP[0]) hand = 'Left';
    else if(indexMCP[0] < pinkyMCP[0]) hand = 'Right';
  }
  if(hand === 'Left'){ nx = -nx; ny = -ny; nz = -nz; }
  const nzNorm = Math.hypot(nx, ny, nz);
  if(!isFinite(nzNorm) || nzNorm === 0) return null;
  const cos = Math.max(-1, Math.min(1, (-nz)/nzNorm)); // camera toward -Z
  return Math.acos(cos)*180/Math.PI;
}

export function computeHandJointAngles(lm){
  if(!lm || lm.length<21) return null;
  const A = (i)=> lm[i];
  const f = (mcp,pip,dip,tip)=>({
    MCP: jointAngle(A(mcp), A(pip), A(mcp)), // degenerate; MCP flexion better via palm plane; leave as 0
    PIP: jointAngle(A(mcp), A(pip), A(dip)),
    DIP: jointAngle(A(pip), A(dip), A(tip)),
  });
  const thumb = {
    CMC: jointAngle(A(IDX.WRIST), A(IDX.TH_CMC), A(IDX.TH_MCP)),
    MCP: jointAngle(A(IDX.TH_CMC), A(IDX.TH_MCP), A(IDX.TH_IP)),
    IP:  jointAngle(A(IDX.TH_MCP), A(IDX.TH_IP), A(IDX.TH_TIP)),
  };
  return {
    thumb,
    index:  f(IDX.IX_MCP, IDX.IX_PIP, IDX.IX_DIP, IDX.IX_TIP),
    middle: f(IDX.MD_MCP, IDX.MD_PIP, IDX.MD_DIP, IDX.MD_TIP),
    ring:   f(IDX.RG_MCP, IDX.RG_PIP, IDX.RG_DIP, IDX.RG_TIP),
    pinky:  f(IDX.PK_MCP, IDX.PK_PIP, IDX.PK_DIP, IDX.PK_TIP),
  };
}

export function isFingersStraight(angles, bendThreshDeg=25){
  if(!angles) return false;
  const bend = (x)=> Math.max(0, 180 - (x||0));
  const fingers = ['index','middle','ring','pinky'];
  return fingers.every(fn=>{
    const a = angles[fn]; if(!a) return false;
    return bend(a.PIP) < bendThreshDeg && bend(a.DIP) < bendThreshDeg;
  });
}

function len(a,b){ return Math.hypot(a[0]-b[0], a[1]-b[1]); }
export function computeBoneRatios(lm){
  if(!lm || lm.length<21) return null;
  const segs = {
    thumb: [ len(lm[IDX.TH_CMC], lm[IDX.TH_MCP]), len(lm[IDX.TH_MCP], lm[IDX.TH_IP]), len(lm[IDX.TH_IP], lm[IDX.TH_TIP]) ],
    index: [ len(lm[IDX.IX_MCP], lm[IDX.IX_PIP]), len(lm[IDX.IX_PIP], lm[IDX.IX_DIP]), len(lm[IDX.IX_DIP], lm[IDX.IX_TIP]) ],
    middle:[ len(lm[IDX.MD_MCP], lm[IDX.MD_PIP]), len(lm[IDX.MD_PIP], lm[IDX.MD_DIP]), len(lm[IDX.MD_DIP], lm[IDX.MD_TIP]) ],
    ring:  [ len(lm[IDX.RG_MCP], lm[IDX.RG_PIP]), len(lm[IDX.RG_PIP], lm[IDX.RG_DIP]), len(lm[IDX.RG_DIP], lm[IDX.RG_TIP]) ],
    pinky: [ len(lm[IDX.PK_MCP], lm[IDX.PK_PIP]), len(lm[IDX.PK_PIP], lm[IDX.PK_DIP]), len(lm[IDX.PK_DIP], lm[IDX.PK_TIP]) ],
  };
  const refPool = ['index','middle','ring','pinky'].flatMap(f=> segs[f][0]);
  const ref = (segs.index[0] + segs.middle[0] + segs.ring[0] + segs.pinky[0]) / 4 || 1;
  const ratios = {};
  for(const [k,arr] of Object.entries(segs)) ratios[k] = arr.map(x=> x/ref);
  return { ratios, scale: ref };
}

export function computeBoneRatioId(lm, opts={}){
  const { ratios, scale } = computeBoneRatios(lm) || {};
  if(!ratios) return null;
  const flat = ['thumb','index','middle','ring','pinky'].flatMap(f=> ratios[f]).map(x=> Math.round(x*1000)/1000);
  // simple djb2 hash
  let h=5381; for(const v of flat){ const s=String(v); for(let i=0;i<s.length;i++){ h=((h<<5)+h) + s.charCodeAt(i); h|=0; } }
  const id = 'H'+Math.abs(h).toString(36);
  return { id, ratios, scale, features: flat };
}

export function isCalibrationPose(lm, { palmConeDeg=25, bendThreshDeg=25 }={}){
  if(!lm || lm.length<21) return false;
  const ang = computeHandJointAngles(lm);
  const palm = computePalmAngle(lm[IDX.WRIST], lm[IDX.IX_MCP], lm[IDX.PK_MCP]);
  return (palm==null || palm <= palmConeDeg) && isFingersStraight(ang, bendThreshDeg);
}

