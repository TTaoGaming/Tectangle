/**
 * Failing smoke test scaffold for forthcoming v6 console (fast overlay architecture).
 * Intentionally expects a page + diag global that do not exist yet.
 * Will fail until `integrated_hand_console_v6.html` and `__fastOverlayDiag` are implemented.
 */

const PAGE_REL = 'September2025/TectangleHexagonal/dev/integrated_hand_console_v6.html';
const AUTOSTART_Q='?autostart=1&overlay=on';
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

describe('hand console v6 smoke (expected fail)', ()=>{
  beforeAll(async()=>{
    await page.goto(`http://localhost:8080/${PAGE_REL}${AUTOSTART_Q}`, { waitUntil:'domcontentloaded' });
  });

  it('diagnostic frames advance (>2)', async()=>{
    await sleep(400);
    const frames = await page.evaluate(()=> globalThis.__fastOverlayDiag?.frames || 0);
    expect(frames).toBeGreaterThan(2); // should fail (0) before implementation
  });
});
