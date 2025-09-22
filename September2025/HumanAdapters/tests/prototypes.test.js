const ROOT = 'http://127.0.0.1:8080';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function startAndWait(page){
  await page.waitForSelector('#startBtn');
  await page.click('#startBtn');
  await page.waitForSelector('.stack canvas');
  // give it time to load models and start drawing
  await sleep(5000);
}

async function readBadgeOrResult(page){
  // sample a few frames by inspecting the canvas pixel changes
  const hasCanvas = await page.$eval('.stack canvas', el => !!el && el.width>0 && el.height>0);
  return { hasCanvas };
}

async function setInput(page, label){
  await page.select('#inputSel', label);
}

async function assertDotsAppear(page){
  // check if any non-black pixels exist on overlay canvas after a short wait
  await sleep(1500);
  const changed = await page.$eval('.stack canvas', (cv)=>{
    const ctx = cv.getContext('2d');
    const w = cv.width, h = cv.height;
    if(!w||!h) return false;
    const data = ctx.getImageData(0,0,Math.min(64,w),Math.min(64,h)).data;
    for(let i=0;i<data.length;i+=4){
      const a = data[i+3];
      if(a>0) return true;
    }
    return false;
  });
  return changed;
}

async function assertDualView(page){
  const hasIframe = await page.$('iframe#demo') !== null;
  const hasRight = await page.$('.right .stack canvas') !== null;
  expect(hasIframe).toBeTruthy();
  expect(hasRight).toBeTruthy();
}

async function assertNormalizedLandmarks(page){
  // Require adapters to expose a debug hook for deterministic checks
  const info = await page.evaluate(()=>{
    const anyWin = window;
    const hands = anyWin.__lastHands || null;
    if(!hands) return { exposed:false };
    if(!hands.length) return { exposed:true, count:0, ok:false };
    const lm = hands[0].landmarks || hands[0].keypoints || hands[0].keypoints3D || [];
    const allNorm = lm.length>=21 && lm.every(p=> typeof p.x==='number' && typeof p.y==='number' && p.x>=0 && p.x<=1 && p.y>=0 && p.y<=1);
    return { exposed:true, count:hands.length, ok: allNorm };
  });
  expect(info.exposed).toBe(true); // red until adapters expose window.__lastHands
  expect(info.count).toBeGreaterThan(0);
  expect(info.ok).toBe(true);
}

describe('HumanAdapters Prototypes', () => {
  const pages = [
    '/September2025/HumanAdapters/option-a-esm/index.html',
    '/September2025/HumanAdapters/option-b-observer/index.html',
    '/September2025/HumanAdapters/option-c-worker/index.html',
  ];

  for(const rel of pages){
    describe(rel, () => {
  it.skip('loads and starts with Webcam', async () => {
        await page.goto(ROOT + rel);
        await setInput(page, 'webcam');
        await startAndWait(page);
        const ok = await assertDotsAppear(page);
        expect(ok).toBe(true);
      });

      it('plays Pinch MP4 and draws dots', async () => {
        await page.goto(ROOT + rel);
        await setInput(page, '/right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch.mp4');
        await startAndWait(page);
  await assertDualView(page);
        const ok = await assertDotsAppear(page);
        expect(ok).toBe(true);
  await assertNormalizedLandmarks(page);
      });

      it('plays Gated MP4 and draws dots', async () => {
        await page.goto(ROOT + rel);
        await setInput(page, '/right hand palm oriented to my left index and thumb pinch should be GATED.mp4');
        await startAndWait(page);
  await assertDualView(page);
        const ok = await assertDotsAppear(page);
        expect(ok).toBe(true);
  await assertNormalizedLandmarks(page);
      });
    });
  }
});
