/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

import fs from 'fs';
import path from 'path';
import { OneEuro } from '../../src/core/filters.js';
import { computePalmAngle } from '../../src/core/handGeometry.js';

/*
Offline TOI probe (adapter):
- Input: landmarks JSONL (t, hand, indexTip, thumbTip, indexMCP, pinkyMCP)
- Hysteresis thresholds: enter, exit (default 0.50 / 0.80), tie TOI to same thresholds used by pinch FSM
- Predicted TOI: ETA to enter threshold using current approach velocity (dnorm/dt < 0)
- Actual TOI: interpolated timestamp when norm crosses enter threshold (first crossing after Idle phase)
- Output: JSON lines with frames plus event lines; console prints summary
*/

if(process.argv.length < 3){
  console.error('Usage: node tests/replay/compute_toi_offline.mjs <landmarks.jsonl> [--enter 0.50] [--exit 0.80] [--cone 30] [--gate true|false] [--minCutoff 1.4] [--beta 0.02] [--dCutoff 1.0] [--out out/analysis.toi.jsonl]');
  process.exit(2);
}

const args = process.argv.slice(2);
const inPath = args[0];
function getArg(name, def){ const i=args.indexOf(`--${name}`); return i>=0? parseFloat(args[i+1]) : def; }
function getArgStr(name, def){ const i=args.indexOf(`--${name}`); return i>=0? args[i+1] : def; }
const ENTER = getArg('enter', 0.50);
const EXIT = getArg('exit', 0.80);
const CONE = getArg('cone', 30);
const gateEnabled = (getArgStr('gate','false') === 'true');
const minCutoff = getArg('minCutoff', 1.4);
const beta = getArg('beta', 0.02);
const dCutoff = getArg('dCutoff', 1.0);
const outPath = getArgStr('out', inPath.replace(/\.landmarks\.jsonl$/,'') + `.toi.enter${ENTER}.jsonl`);

function readJsonl(path){
  const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/).filter(Boolean);
  const arr = []; for(const ln of lines){ try{ arr.push(JSON.parse(ln)); }catch{} }
  if(arr.length && arr[0].meta) arr.shift();
  return arr;
}

function dist2D(a,b){ const dx=a[0]-b[0], dy=a[1]-b[1]; return Math.hypot(dx,dy); }

function normalizeNorm(frame){
  const span = dist2D(frame.indexMCP, frame.pinkyMCP) || 1;
  const d = dist2D(frame.indexTip, frame.thumbTip);
  return d / span;
}

function v3(a,b){ return [a[0]-b[0], a[1]-b[1], (a[2]||0)-(b[2]||0)]; }
function cross(a,b){ return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
function dot(a,b){ return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
function norm3(a){ return Math.hypot(a[0],a[1],a[2]); }
function normalize3(a){ const n=norm3(a)||1; return [a[0]/n,a[1]/n,a[2]/n]; }
function palmGate(frame){
  const angDeg = computePalmAngle(frame.wrist, frame.indexMCP, frame.pinkyMCP, { hand: frame.hand });
  if(angDeg == null) return false;
  return angDeg <= CONE;
}

// Simple constant-velocity 1D Kalman for norm
class Kalman1D {
  constructor({ q=1e-4, r=1e-3 }={}){
    this.q=q; this.r=r;
    this.x = [0,0]; // [norm, vel]
    this.P = [[1,0],[0,1]];
    this.tPrev=null; this.init=false;
  }
  step(z, t){
    if(!this.init){ this.x=[z,0]; this.P=[[1,0],[0,1]]; this.tPrev=t; this.init=true; return { x:this.x, P:this.P }; }
    const dt = Math.max(1e-3,(t-this.tPrev)/1000);
    // State transition F, Process noise Q
    const F = [[1, dt],[0,1]];
    const Q = [[this.q*dt,0],[0,this.q]];
    // Predict
    const xPred = [ F[0][0]*this.x[0] + F[0][1]*this.x[1], F[1][0]*this.x[0] + F[1][1]*this.x[1] ];
    const Ppred = [
      [ F[0][0]*this.P[0][0] + F[0][1]*this.P[1][0], F[0][0]*this.P[0][1] + F[0][1]*this.P[1][1] ],
      [ F[1][0]*this.P[0][0] + F[1][1]*this.P[1][0], F[1][0]*this.P[0][1] + F[1][1]*this.P[1][1] ]
    ];
    // P = FPF' + Q
    const Ft = [[F[0][0],F[1][0]],[F[0][1],F[1][1]]];
    let P2 = [
      [ Ppred[0][0]*Ft[0][0] + Ppred[0][1]*Ft[1][0], Ppred[0][0]*Ft[0][1] + Ppred[0][1]*Ft[1][1] ],
      [ Ppred[1][0]*Ft[0][0] + Ppred[1][1]*Ft[1][0], Ppred[1][0]*Ft[0][1] + Ppred[1][1]*Ft[1][1] ]
    ];
    P2 = [[P2[0][0]+Q[0][0], P2[0][1]+Q[0][1]],[P2[1][0]+Q[1][0], P2[1][1]+Q[1][1]]];
    // Update with z
    const H = [1,0]; // observe norm only
    const y = z - (H[0]*xPred[0] + H[1]*xPred[1]);
    const S = H[0]*(P2[0][0]*H[0]+P2[0][1]*H[1]) + H[1]*(P2[1][0]*H[0]+P2[1][1]*H[1]) + this.r;
    const K = [ (P2[0][0]*H[0] + P2[0][1]*H[1]) / S, (P2[1][0]*H[0] + P2[1][1]*H[1]) / S ];
    const xNew = [ xPred[0] + K[0]*y, xPred[1] + K[1]*y ];
    const I = [[1,0],[0,1]];
    const KH = [ [K[0]*H[0], K[0]*H[1]], [K[1]*H[0], K[1]*H[1]] ];
    const Pnew = [
      [ (I[0][0]-KH[0][0])*P2[0][0] + (I[0][1]-KH[0][1])*P2[1][0], (I[0][0]-KH[0][0])*P2[0][1] + (I[0][1]-KH[0][1])*P2[1][1] ],
      [ (I[1][0]-KH[1][0])*P2[0][0] + (I[1][1]-KH[1][1])*P2[1][0], (I[1][0]-KH[1][0])*P2[0][1] + (I[1][1]-KH[1][1])*P2[1][1] ]
    ];
    this.x = xNew; this.P = Pnew; this.tPrev=t;
    return { x:this.x, P:this.P };
  }
}

const framesRaw = readJsonl(inPath);
const euro = new OneEuro({ minCutoff, beta, dCutoff });
const kf = new Kalman1D({ q: 5e-4, r: 5e-3 });
const frames = framesRaw.map(f=> ({...f, norm: normalizeNorm(f)}));
if(frames.length<3){ console.error('Not enough frames'); process.exit(2); }

// Apply OneEuro + Kalman; compute velocity (per ms) from Kalman
for(let i=0;i<frames.length;i++){
  const f = frames[i];
  f.normSm = euro.filter(f.norm, f.t);
  const { x:[xHat, vHat] } = kf.step(f.normSm, f.t);
  f.v = vHat / 1000; // vHat is per second; convert roughly to per ms
}

// Simple hysteresis FSM tied to thresholds
const State = { Idle:'Idle', Pinched:'Pinched' };
let state=State.Idle;
let events=[];
let outLines=[];
let downs=0, ups=0;
let lastPrePred=null; // last predicted TOI before down
let lastEventT=null;

function interpolateTOICross(prev, curr, target){
  const dn = curr.norm - prev.norm;
  const dt = curr.t - prev.t;
  if(Math.abs(dn) < 1e-9) return curr.t; // degenerate
  const alpha = (target - prev.norm) / dn; // fraction between prev->curr
  const clamped = Math.min(1, Math.max(0, alpha));
  return prev.t + clamped * dt;
}

for(let i=0;i<frames.length;i++){
  const f = frames[i];
  // Predicted absolute ENTER-TOI while approaching
  let toiPredAbsV = null;
  const gate = gateEnabled ? palmGate(f) : true;
  if(f.normSm > ENTER && f.v < -1e-6){ // approaching threshold
    const etaMs = (f.normSm - ENTER) / (-f.v);
    if(isFinite(etaMs) && etaMs>=0 && etaMs<2000){ toiPredAbsV = Math.round(f.t + etaMs); }
  }

  // FSM transitions
  if(state===State.Idle){
    // predict while approaching
  if(toiPredAbsV!=null){ lastPrePred = toiPredAbsV; }
    // check crossing to Pinched (gated)
    if(gate && i>0 && frames[i-1].normSm > ENTER && f.normSm <= ENTER){
      // interpolate actual TOI at crossing
      const toiActualEnterAbs = Math.round(interpolateTOICross(frames[i-1], f, ENTER));
      if(!lastEventT || toiActualEnterAbs - lastEventT > 80){ // debounce 80ms
        downs++; state=State.Pinched; lastEventT = toiActualEnterAbs;
        events.push({ kind:'event', t: toiActualEnterAbs, type:'down', toiPredAbsV: lastPrePred??null, toiActualEnterAbs });
        outLines.push(JSON.stringify({ kind:'event', t: toiActualEnterAbs, type:'down', toiPredAbsV: lastPrePred??null, toiActualEnterAbs }));
      }
      lastPrePred = null;
    }
  } else { // Pinched
    // release when crossing exit upwards (gate ignored for release)
    if(i>0 && frames[i-1].normSm < EXIT && f.normSm >= EXIT){
      const tUp = Math.round(interpolateTOICross(frames[i-1], f, EXIT));
      if(!lastEventT || tUp - lastEventT > 80){
        ups++; state=State.Idle; lastEventT = tUp;
        events.push({ kind:'event', t: tUp, type:'up' });
        outLines.push(JSON.stringify({ kind:'event', t: tUp, type:'up' }));
      }
    }
  }

  // Write frame line
  outLines.push(JSON.stringify({ kind:'frame', t:f.t, norm: Number(f.normSm.toFixed(4)), rawNorm: Number(f.norm.toFixed(4)), v: Number((f.v||0).toFixed(6)), state, gate }));
}

// Summary and envelope checks
let toiErrors = events.filter(e=>e.type==='down' && typeof e.toiPredAbsV==='number' && typeof e.toiActualEnterAbs==='number').map(e=> e.toiActualEnterAbs - e.toiPredAbsV);
const meanErr = toiErrors.length? Math.round(toiErrors.reduce((a,b)=>a+b,0)/toiErrors.length) : 0;
const maxAbs = toiErrors.length? Math.max(...toiErrors.map(e=>Math.abs(e))) : 0;
const summary = { file: inPath, enter: ENTER, exit: EXIT, cone: CONE, gateEnabled, oneEuro:{minCutoff,beta,dCutoff}, downs, ups, meanToiErr: meanErr, maxAbsToiErr: Math.round(maxAbs) };
console.log(JSON.stringify(summary));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, outLines.join('\n')+'\n','utf8');
console.error('Wrote', outPath);



