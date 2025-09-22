/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-18T00:00-06:00
Expires: 2025-10-09T00:00-06:00 (auto-expire after 21 days)

Checklist:
 - [ ] Confirm deterministic per-loop pinch counts on CI
 - [ ] Evaluate additional golden clips and longer durations
 - [ ] Document tolerated variance (should be 0 for canned clips)
*/

/** @jest-environment puppeteer */

// WEBWAY:ww-2025-057: Loop determinism e2e for canned golden clip
// Loads integrated_hand_console.html, enables video.loop, and detects wrap-around using currentTime
// to segment pinch:down counts by loop. Asserts each loop has identical counts, at multiple playback rates.

// WEBWAY:ww-2025-058: Gate to avoid cross-suite interference; run with FEATURE_LOOP_E2E=1
const FEATURE_LOOP = process.env.FEATURE_LOOP_E2E === '1';

const CLIP = process.env.GOLDEN_CLIP || 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

async function setupPage(url, playbackRate){
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Ensure video is looping and at desired rate; install wrap-around detector and counters.
  await page.evaluate((rate) => {
    const v = document.getElementById('cam');
    if(!v){ throw new Error('video#cam not found'); }
    try { v.muted = true; v.autoplay = true; v.loop = true; } catch {}
    if(rate && !Number.isNaN(+rate)) v.playbackRate = +rate;
    window.__ihcEvents = window.__ihcEvents || [];
    // WEBWAY:ww-2025-058: fall back to window.__probe.downs if present
    window.__det = { loops: 0, lastT: 0, downsSoFar: 0, perLoopDowns: [] };
    const onTime = ()=>{
      const d = window.__det; const t = v.currentTime || 0;
      // wrap detected when time resets near 0 after being reasonably into the clip
      if(t < d.lastT && d.lastT > 0.5){
        let downs;
        if (window.__probe && typeof window.__probe.downs === 'number') {
          // SDK probe counter (total downs)
          downs = window.__probe.downs;
        } else {
          // Try multiple shapes: {type:'pinch:down'} or {name:'pinch:down'} or {type:'pinch', phase:'down'}
          const evts = (window.__ihcEvents||[]);
          downs = evts.filter(e => e && (
            e.type === 'pinch:down' ||
            e.name === 'pinch:down' ||
            (e.type === 'pinch' && (e.phase === 'down' || e.state === 'down'))
          )).length;
        }
        const loopDowns = downs - d.downsSoFar;
        d.downsSoFar = downs;
        d.perLoopDowns.push(loopDowns);
        d.loops++;
      }
      d.lastT = t;
    };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('ended', onTime); // in case loop still fires ended
    // Nudge playback now that handlers are set
    try { v.play && v.play().catch(()=>{}); } catch {}
  }, playbackRate);
}

async function waitForLoops(n, timeoutMs=45000){
  const start = Date.now();
  while(Date.now() - start < timeoutMs){
    const loops = await page.evaluate(() => (window.__det && window.__det.loops) || 0);
    if(loops >= n) return loops;
    await new Promise(r=> setTimeout(r, 120));
  }
  throw new Error(`Timeout waiting for ${n} loops`);
}

async function getPerLoopDowns(){
  return await page.evaluate(() => (window.__det && window.__det.perLoopDowns) || []);
}

describe('Golden clip loop determinism', () => {
  jest.setTimeout(90000);
  if (!FEATURE_LOOP) {
    it.skip('FEATURE_LOOP_E2E=1 to enable deterministic loop test', () => {});
    return;
  }

  function buildUrl(){
    const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
    const base = `http://127.0.0.1:${port}`;
    // Use integrated console; autostart clip, which calls startVideoUrl internally
    return `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console.html?clip=${encodeURIComponent(CLIP)}&autostart=1`;
  }

  it('has identical pinch:down counts per loop at 1.0x', async () => {
    const url = buildUrl();
    await setupPage(url, 1.0);
    const LOOPS = 3;
    await waitForLoops(LOOPS);
    const per = await getPerLoopDowns();
    expect(per.length).toBeGreaterThanOrEqual(LOOPS);
    const first = per[0];
    expect(first).toBeGreaterThan(0);
    for(let i=1;i<LOOPS;i++){
      expect(per[i]).toBe(first);
    }
  });

  it('has identical pinch:down counts per loop at 1.5x', async () => {
    const url = buildUrl();
    await setupPage(url, 1.5);
    const LOOPS = 3;
    await waitForLoops(LOOPS);
    const per = await getPerLoopDowns();
    expect(per.length).toBeGreaterThanOrEqual(LOOPS);
    const first = per[0];
    expect(first).toBeGreaterThan(0);
    for(let i=1;i<LOOPS;i++){
      expect(per[i]).toBe(first);
    }
  });
});
