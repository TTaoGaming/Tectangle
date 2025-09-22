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

// HexLatticeRingRenderer — draws a luminous hex-lattice ring projected as a rotated ellipse

function drawHex(ctx, x, y, r, rot, color){
  ctx.save();
  ctx.translate(x,y); ctx.rotate(rot||0);
  ctx.beginPath();
  for(let i=0;i<6;i++){
    const a = (i/6)*Math.PI*2; const px = Math.cos(a)*r; const py = Math.sin(a)*r;
    if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  ctx.closePath();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.shadowBlur = 8; ctx.shadowColor = color;
  ctx.stroke();
  ctx.restore();
}

export function createHexLatticeRingRenderer(canvas){
  const ctx = canvas.getContext('2d');
  function clear(){ ctx.clearRect(0,0,canvas.width,canvas.height); }
  /**
   * spec: { center:{x,y}, R:number, r:number, rot:number, color?:string, hexR?:number, density?:number }
   * R=major radius (px), r=minor radius (px), rot=ellipse rotation (rad)
   */
  function draw(spec){
    const { center, R, r, rot=0, color='#82d4ff', hexR=5, density=64 } = spec;
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.rotate(rot);
    // ellipse outline (subtle)
    ctx.globalAlpha = 0.25; ctx.lineWidth = 1; ctx.shadowBlur = 6; ctx.shadowColor = color; ctx.strokeStyle = color;
    ctx.beginPath(); for(let i=0;i<=96;i++){ const t=i/96*Math.PI*2; const x=Math.cos(t)*R; const y=Math.sin(t)*r; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.stroke(); ctx.globalAlpha=1;
    // hex lattice along ellipse
    const N = Math.max(12, density);
    for(let i=0;i<N;i++){
      const t = (i/N)*Math.PI*2; const x = Math.cos(t)*R; const y = Math.sin(t)*r;
      // orient hex to tangent direction
      const tx = -Math.sin(t)*R; const ty = Math.cos(t)*r; // derivative
      const angle = Math.atan2(ty, tx);
      drawHex(ctx, x, y, hexR, angle, color);
    }
    ctx.restore();
  }
  return { clear, draw };
}
