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

// Rolling median and OneEuro filter (pure utilities)
export class RollingMedian {
  constructor(n){ this.n=n; this.buf=[]; }
  push(x){ this.buf.push(x); if(this.buf.length>this.n) this.buf.shift(); return this.med; }
  get med(){ if(!this.buf.length) return 0; const a=[...this.buf].sort((x,y)=>x-y); const m=a.length>>1; return a.length%2 ? a[m] : (a[m-1]+a[m])/2; }
}

export class OneEuro {
  constructor({minCutoff=1.0, beta=0.01, dCutoff=1.0}={}){ this.minCutoff=minCutoff; this.beta=beta; this.dCutoff=dCutoff; this.xPrev=null; this.dxPrev=0; this.tPrev=null; }
  static alpha(cutoff, dt){ const r=2*Math.PI*cutoff*dt; return r/(r+1); }
  filter(x, t){ if(this.tPrev==null){ this.tPrev=t; this.xPrev=x; return x; } const dt=Math.max(1e-3,(t-this.tPrev)/1000); const dx=(x-this.xPrev)/dt; const aD=OneEuro.alpha(this.dCutoff,dt); const dxHat=aD*dx+(1-aD)*this.dxPrev; const cutoff=this.minCutoff+this.beta*Math.abs(dxHat); const aX=OneEuro.alpha(cutoff,dt); const xHat=aX*x+(1-aX)*this.xPrev; this.tPrev=t; this.xPrev=xHat; this.dxPrev=dxHat; return xHat; }
}

export const clamp = (v,min,max)=>Math.max(min,Math.min(max,v));

