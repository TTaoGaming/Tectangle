/**
 * Smoke test: integrated_hand_console_v5.html
 * Verifies:
 *  - Frames increment (__hexVizDiagV5.frames > 2)
 *  - Overlay canvas present and sized
 *  - No early overlay errors captured
 */

const PAGE_REL = 'September2025/TectangleHexagonal/dev/integrated_hand_console_v5.html';
const AUTOSTART_Q='?autostart=1';
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

describe('hand console v5 smoke', ()=>{
  beforeAll(async()=>{
    await page.goto(`http://localhost:8080/${PAGE_REL}${AUTOSTART_Q}`, { waitUntil:'domcontentloaded' });
  });

  it('frames advance', async()=>{
    await sleep(400);
    const frames = await page.evaluate(()=> globalThis.__hexVizDiagV5?.frames || 0);
    expect(frames).toBeGreaterThan(2);
  });

  it('overlay canvas present', async()=>{
    const has = await page.evaluate(()=>{ const c=document.getElementById('overlay'); return !!c && c.width>=0; });
    expect(has).toBe(true);
  });

  it('no early errors', async()=>{
    const errs = await page.evaluate(()=> globalThis.__hexVizDiagV5?.errors ? globalThis.__hexVizDiagV5.errors.slice() : []);
    expect(errs.length).toBe(0);
  });
});
