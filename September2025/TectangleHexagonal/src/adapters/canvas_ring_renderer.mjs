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

// CanvasRingRenderer — minimal ring/sigil drawing on a <canvas>

export function createCanvasRingRenderer(canvas){
  const ctx = canvas.getContext('2d');
  function clear(){ ctx.clearRect(0,0,canvas.width,canvas.height); }
  function draw(specs){
    clear();
    ctx.save();
    for(const spec of specs){
      const { screen, radiusPx, tilt, glyphs } = spec;
      ctx.translate(screen.x, screen.y);
      ctx.rotate(tilt||0);
      // ring
      ctx.strokeStyle = '#82d4ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,radiusPx,0,Math.PI*2); ctx.stroke();
      // glyphs
      const n = Math.max(1, glyphs.length||0);
      ctx.fillStyle = '#e7edf3'; ctx.font = '12px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
      for(let i=0;i<n;i++){
        const a = (i/n) * Math.PI*2; const x = Math.cos(a)*radiusPx; const y = Math.sin(a)*radiusPx;
        ctx.save(); ctx.translate(x,y); ctx.rotate(a+Math.PI/2); ctx.fillText(glyphs[i]||'*', 0, 0); ctx.restore();
      }
      ctx.rotate(-(tilt||0));
      ctx.translate(-screen.x, -screen.y);
    }
    ctx.restore();
  }
  return { draw, clear };
}
