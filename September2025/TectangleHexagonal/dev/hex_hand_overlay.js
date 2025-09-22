// Minimal reusable overlay helper (2D) - prepares for potential 3D pivot
// Flag gated: FEATURE_HEX_HAND_OVERLAY_HELPER
// Revert: delete file + remove import sites.

export function createHandOverlay({ canvas, video, getHands }) {
  const ctx = canvas.getContext('2d');
  const state = { frames:0 };

  function resize() {
    const dpr = window.devicePixelRatio||1; const cw = canvas.clientWidth||window.innerWidth; const ch = canvas.clientHeight||window.innerHeight;
    if(canvas.width!==cw*dpr || canvas.height!==ch*dpr){ canvas.width=cw*dpr; canvas.height=ch*dpr; ctx.setTransform(1,0,0,1,0,0); ctx.scale(dpr,dpr); }
    return { cw, ch };
  }

  function projectPoint(lm, norm, vw, vh, drawW, drawH, dx, dy){
    const x=lm[0], y=lm[1];
    if(norm) return [ dx + x*drawW, dy + y*drawH ];
    return [ dx + (x / vw) * drawW, dy + (y / vh) * drawH ];
  }

  function handIsLikelyNormalized(hand){
    let inRange=0; for(const lm of hand){ const x=lm[0], y=lm[1]; if(Math.abs(x)<=1.5 && Math.abs(y)<=1.5) inRange++; }
    return (inRange / hand.length) >= 0.8;
  }

  function draw(){
    const { cw, ch } = resize();
    ctx.clearRect(0,0,cw,ch);
    const hands = getHands(); if(!hands.length) return;
    const vw = video.videoWidth||cw, vh = video.videoHeight||ch;
    const coverScale = Math.max(cw/vw, ch/vh); const drawW = vw*coverScale, drawH = vh*coverScale; const dx=(cw-drawW)/2, dy=(ch-drawH)/2;
    const norms = hands.map(handIsLikelyNormalized);
    hands.forEach((hand,i)=>{
      const color = i===0?'#10b981':(i===1?'#f59e0b':'#6366f1');
      const norm = norms[i];
      hand.forEach((lm,idx)=>{
        const [sx,sy] = projectPoint(lm,norm,vw,vh,drawW,drawH,dx,dy);
        ctx.beginPath(); const r=(idx===4||idx===8)?4:2.1; ctx.fillStyle=(idx===4||idx===8)?'#fff':color; ctx.arc(sx,sy,r,0,Math.PI*2); ctx.fill();
      });
    });
    state.frames++;
  }

  return { draw, state };
}
