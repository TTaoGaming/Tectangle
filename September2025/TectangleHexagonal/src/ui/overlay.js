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

export function createOverlay(canvas){
  const g = canvas.getContext('2d');
  function clear(){ g.clearRect(0,0,canvas.width,canvas.height); }
  function drawHands(hands, opts={}){ const draw=opts.draw??true; if(!draw || !hands||!hands.length) return; g.save(); g.lineWidth=2; hands.forEach((lm, idx)=>{ const colorStroke = idx===0 ? '#2a87ff' : '#93d977'; const colorFill = idx===0 ? '#82d4ff' : '#b7f5a1'; g.strokeStyle=colorStroke; g.fillStyle=colorFill; for(const p of lm){ g.beginPath(); g.arc(p[0]*canvas.width, p[1]*canvas.height, 3,0,Math.PI*2); g.fill(); } const it=lm[8], tt=lm[4]; if(it && tt){ g.beginPath(); g.moveTo(it[0]*canvas.width, it[1]*canvas.height); g.lineTo(tt[0]*canvas.width, tt[1]*canvas.height); g.stroke(); } }); g.restore(); }
  function annotate(text){ g.save(); g.fillStyle='rgba(0,0,0,.4)'; const lines=String(text).split('\n'); const w=280, h=16*lines.length+20; g.fillRect(8,8,w,h); g.fillStyle='#e7edf3'; g.font='12px system-ui'; lines.forEach((ln,i)=> g.fillText(ln, 16, 28+i*16)); g.restore(); }
  function drawHyst(ctx, norm, enter, exit, gate){ if(!ctx) return; const w=ctx.canvas.width, h=ctx.canvas.height; ctx.clearRect(0,0,w,h); ctx.save(); ctx.fillStyle='#0b111a'; ctx.fillRect(0,0,w,h); const clamp=(x)=>Math.max(0,Math.min(1,x)); const x=clamp(norm)*w, xe=clamp(enter)*w, xx=clamp(exit)*w; ctx.strokeStyle='#82d4ff'; ctx.beginPath(); ctx.moveTo(xe,0); ctx.lineTo(xe,h); ctx.stroke(); ctx.setLineDash([4,3]); ctx.strokeStyle='#ffd47a'; ctx.beginPath(); ctx.moveTo(xx,0); ctx.lineTo(xx,h); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle=gate? '#20c997':'#5a7086'; ctx.beginPath(); ctx.arc(x,h/2,4,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  function drawTimeMarkers(ctx, opts){ if(!ctx) return; const w=ctx.canvas.width, h=ctx.canvas.height; const periodMs = opts?.periodMs ?? 2000; const now = opts?.nowMs ?? 0; const pred = opts?.predAbs ?? null; const sched = opts?.schedAbs ?? null; const quant = opts?.quantAbs ?? null; const actual = opts?.actualAbs ?? null; const nowAbs = opts?.nowAbs ?? now; const bandH = 28; const y0 = h - bandH; ctx.save();
    // band background
    ctx.fillStyle = '#0e1520'; ctx.fillRect(0, y0, w, bandH);
    // Now line
    if(Number.isFinite(nowAbs)){
      const nx = ((nowAbs % periodMs)/periodMs)*w; ctx.fillStyle='#cbd5e1'; ctx.fillRect(nx|0, y0, 1, bandH); label(nx, y0+10, 'Now', '#cbd5e1');
    }
  // Predicted ETA to enter
  if(pred!=null){ const px = ((pred % periodMs)/periodMs)*w; ctx.fillStyle='#ffea00'; ctx.fillRect(px|0, y0, 2, bandH); label(px, y0+10, 'ETA', '#ffea00'); }
  // Actual confirm time
  if(actual!=null){ const ax = ((actual % periodMs)/periodMs)*w; ctx.fillStyle='#ff70ff'; ctx.fillRect(ax|0, y0, 2, bandH); label(ax, y0+10, 'Actual', '#ff70ff'); }
  // Scheduled time (now + user offset)
    if(sched!=null){ const sx = ((sched % periodMs)/periodMs)*w; ctx.fillStyle='#00e5ff'; ctx.fillRect(sx|0, y0, 2, bandH); label(sx, y0+10, 'Sched', '#00e5ff'); }
  // Quantized time (optional)
  if(quant!=null){ const qx = ((quant % periodMs)/periodMs)*w; ctx.fillStyle='#a78bfa'; ctx.fillRect(qx|0, y0, 2, bandH); label(qx, y0+10, 'Quant', '#a78bfa'); }
    // legend/footer (outside band, bottom-left)
    ctx.fillStyle='#cbd5e1'; ctx.font='11px system-ui'; const txt = [];
    if(opts?.lagMs!=null) txt.push(`lag ${Math.round(opts.lagMs)}ms`);
    if(opts?.userOffsetMs!=null) txt.push(`offset ${Math.round(opts.userOffsetMs)}ms`);
    if(txt.length){ ctx.fillText(txt.join('  '), 6, y0 - 6); }
    ctx.restore();
    function label(x, y, text, color){ const pad=3; const tw = ctx.measureText(text).width; const bx=Math.min(Math.max(4, x - tw/2 - pad), w - tw - 8); ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(bx, y-10, tw+pad*2, 14); ctx.fillStyle=color; ctx.fillText(text, bx+pad, y); }
  }
  return { clear, drawHands, annotate, drawHyst, drawTimeMarkers };
}

