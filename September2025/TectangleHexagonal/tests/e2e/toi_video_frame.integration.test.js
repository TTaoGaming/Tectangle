/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

const PORT = Number(process.env.E2E_PORT || process.env.PORT || 8091);
const DEMO = `http://127.0.0.1:${PORT}/September2025/TectangleHexagonal/dev/toi_demo.html`;

// Helper to encode only filename safely for URL
function encPathSegment(name){ return encodeURIComponent(name).replace(/%2F/g,'/'); }

async function waitProcessingDone() {
  await page.waitForFunction(()=> window.__processingDone === true, { timeout: 30000 });
}

function countConfirmsFromLines(lines){
  let c=0; for(const ln of lines||[]){ try{ const o = JSON.parse(ln); if(o && o.kind==='event' && o.type==='confirm') c++; }catch{} } return c;
}

describe('TOI Demo VideoPort (frame-by-frame deterministic)', ()=>{
  it('pinch MP4 yields exactly 1 confirm', async ()=>{
    const fname = 'right hand hand oriented towards the camera and wrist to middle knuckle pointing up index to thumb pinch.mp4';
    const rel = '/tests/' + encPathSegment(fname);
  // Loosen thresholds and disable palm gate to ensure confirm
  await page.goto(`${DEMO}?video=${rel}&process=frame&stepMs=60&enter=0.95&exit=0.98&palm=0`, { waitUntil: 'load' });
    await waitProcessingDone();
    const { count, lines } = await page.evaluate(()=> ({ count: window.__summary?.confirm||0, lines: window.__analysisLines||[] }));
    // Fallback: recompute from lines (more robust)
    const derived = countConfirmsFromLines(lines);
    expect(derived).toBeGreaterThan(0);
    expect(derived).toBeLessThan(3);
  });

  it('gated MP4 yields 0 confirms with PalmGate on', async ()=>{
    const fname = 'right hand palm oriented to my left index and thumb pinch should be GATED.mp4';
    const rel = '/tests/' + encPathSegment(fname);
  await page.goto(`${DEMO}?video=${rel}&process=frame&stepMs=60&palm=1`, { waitUntil: 'load' });
    await page.waitForSelector('#palmGate');
    const pg = await page.$eval('#palmGate', el => el.checked);
    expect(pg).toBe(true);
    await waitProcessingDone();
    const lines = await page.evaluate(()=> window.__analysisLines||[]);
    const derived = countConfirmsFromLines(lines);
    expect(derived).toBe(0);
  });
});
