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

// Minimal Flappy sidecar game: one-button flap using Z/X (mapped from pinch)
export function initFlappy(canvas){
  const ctx = canvas.getContext('2d');
  const W = canvas.width|0, H = canvas.height|0;
  // Game state
  let running = true;
  let t0 = performance.now();
  const g = 1400; // px/s^2
  const flapVy = -450; // impulse
  const pipeGap = 140;
  const pipeW = 70;
  const pipeSpacing = 260;
  const speed = 160; // px/s
  const bird = { x: Math.round(W*0.25), y: Math.round(H*0.5), vy: 0, r: 12 };
  let pipes = [];
  let score = 0, best = 0;
  let lastPipeX = W;

  function reset(){
    bird.y = Math.round(H*0.5); bird.vy = 0; score = 0; lastPipeX = W; pipes = [];
    for(let i=0;i<4;i++){ addPipe(W + i*pipeSpacing); }
  }
  function addPipe(x){
    const margin=40; const maxTop = H - margin - pipeGap - margin; const topH = Math.max(margin, Math.floor(Math.random()*maxTop)+margin);
    pipes.push({ x, topH, passed:false });
  }

  function flap(){
    if(!running){ running = true; reset(); }
    bird.vy = flapVy;
  }

  // Input: keyboard Z/X
  function onKey(e){ if(e.type==='keydown' && (e.key==='z' || e.key==='Z' || e.key==='x' || e.key==='X')) flap(); }
  document.addEventListener('keydown', onKey);

  reset();

  function step(dt){
    // Physics
    bird.vy += g*dt; bird.y += bird.vy*dt; 
    // Scroll pipes
    for(const p of pipes){ p.x -= speed*dt; }
    if(pipes.length && (lastPipeX - pipes[pipes.length-1].x) >= pipeSpacing-1){ /* keep spacing */ }
    if(pipes.length===0 || pipes[pipes.length-1].x < W - pipeSpacing){ addPipe(W + 10); }
    // Remove off-screen
    while(pipes.length && pipes[0].x + pipeW < 0){ pipes.shift(); }
    // Collisions and scoring
    if(bird.y < bird.r || bird.y > H - bird.r){ gameOver(); }
    for(const p of pipes){
      const holeTop = p.topH;
      const holeBot = p.topH + pipeGap;
      const bx1 = bird.x - bird.r, bx2 = bird.x + bird.r;
      const px1 = p.x, px2 = p.x + pipeW;
      const overlapX = !(bx2 < px1 || bx1 > px2);
      if(overlapX){
        if(bird.y - bird.r < holeTop || bird.y + bird.r > holeBot){ gameOver(); break; }
      }
      if(!p.passed && p.x + pipeW < bird.x){ p.passed = true; score++; best = Math.max(best, score); }
    }
  }

  function gameOver(){ running = false; }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // bg
    ctx.fillStyle = '#081018'; ctx.fillRect(0,0,W,H);
    // ground line
    ctx.strokeStyle = '#1a222c'; ctx.beginPath(); ctx.moveTo(0,H-1); ctx.lineTo(W,H-1); ctx.stroke();
    // pipes
    for(const p of pipes){
      ctx.fillStyle = '#2a3a4d';
      // top
      ctx.fillRect(p.x, 0, pipeW, p.topH);
      // bottom
      ctx.fillRect(p.x, p.topH + pipeGap, pipeW, H - (p.topH + pipeGap));
    }
    // bird
    ctx.beginPath(); ctx.fillStyle = '#82d4ff'; ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI*2); ctx.fill();
    // score
    ctx.fillStyle = '#e7edf3'; ctx.font = '16px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(`Score ${score}`, 10, 22);
    ctx.textAlign = 'right'; ctx.fillText(`Best ${best}`, W-10, 22);
    if(!running){
      ctx.fillStyle = '#9fb3c8'; ctx.textAlign = 'center'; ctx.font = '18px system-ui, sans-serif';
      ctx.fillText('Press Z/X (pinch) to start', W/2, H/2);
    }
  }

  function loop(now){ const dt = Math.min(0.033, (now - t0)/1000); t0 = now; if(running) step(dt); draw(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);

  return { destroy(){ document.removeEventListener('keydown', onKey); }, flap };
}
