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

// Minimal 1D Kalman filter (position-velocity) for lookahead visualization.
// State: [x, v]; Measurements: x with noise R; Process noise Q.

export class Kalman1D {
  constructor({ q=1e-3, r=1e-2, v0=0, x0=0 }={}){
    this.x = x0; this.v = v0; this.P = [[1,0],[0,1]]; this.q=q; this.r=r; this.tPrev=null;
  }
  predict(dt){
    // x = x + v*dt
    const F = [[1, dt],[0,1]]; const Q = [[this.q*dt,0],[0,this.q]];
    const x = [ this.x + this.v*dt, this.v ];
    const P = matAdd(matMul(F, matMul(this.P, matT(F))), Q);
    this.x = x[0]; this.v = x[1]; this.P = P;
  }
  update(z){
    // H = [1, 0]
    const H = [[1,0]]; const R = [[this.r]];
    const y = z - this.x; // residual
    const S = matAdd(matMul(H, matMul(this.P, matT(H))), R); // scalar
    const K = matMul(this.P, matT(H)); // 2x1
    const invS = 1/(S[0][0]||1e-9);
    const Ksc = [ K[0][0]*invS, K[1][0]*invS ];
    this.x = this.x + Ksc[0]*y; this.v = this.v + Ksc[1]*y;
    // P = (I - K H) P
    const KH = [[Ksc[0], Ksc[0]*0],[Ksc[1], Ksc[1]*0]]; // since H=[1,0]
    const I = [[1,0],[0,1]];
    this.P = matMul(matSub(I, KH), this.P);
  }
  step(z, t){ if(this.tPrev!=null){ const dt = Math.max(1e-3,(t - this.tPrev)/1000); this.predict(dt); } this.update(z); this.tPrev=t; return { x:this.x, v:this.v }; }
  lookahead(ms){ const dt = Math.max(0, ms/1000); return this.x + this.v * dt; }
}

function matMul(A,B){ const r=A.length, c=B[0].length, n=B.length; const R=Array.from({length:r},()=>Array(c).fill(0)); for(let i=0;i<r;i++) for(let j=0;j<c;j++) for(let k=0;k<n;k++) R[i][j]+=A[i][k]*B[k][j]; return R; }
function matT(A){ const r=A.length,c=A[0].length; const R=Array.from({length:c},()=>Array(r).fill(0)); for(let i=0;i<r;i++) for(let j=0;j<c;j++) R[j][i]=A[i][j]; return R; }
function matAdd(A,B){ const r=A.length,c=A[0].length; const R=Array.from({length:r},()=>Array(c).fill(0)); for(let i=0;i<r;i++) for(let j=0;j<c;j++) R[i][j]=A[i][j]+B[i][j]; return R; }
function matSub(A,B){ const r=A.length,c=A[0].length; const R=Array.from({length:r},()=>Array(c).fill(0)); for(let i=0;i<r;i++) for(let j=0;j<c;j++) R[i][j]=A[i][j]-B[i][j]; return R; }
