/**
 * Smoke test: integrated_hand_console_v3.html
 * Verifies:
 *  - Page loads, diagnostics frames increment.
 *  - Seat summary element present.
 *  - Hysteresis tube DOM nodes exist for P1/P2.
 *  - No early overlay errors recorded.
 */

const PAGE_REL = 'September2025/TectangleHexagonal/dev/integrated_hand_console_v3.html';
const AUTOSTART_Q = '?autostart=1';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

describe('hand console v3 smoke', () => {
  beforeAll(async () => {
    await page.goto(`http://localhost:8080/${PAGE_REL}${AUTOSTART_Q}`, { waitUntil:'domcontentloaded' });
  });

  it('diagnostics frames advance', async () => {
    await sleep(400);
    const frames = await page.evaluate(()=> globalThis.__hexVizDiag?.frames || 0);
    expect(frames).toBeGreaterThan(2);
  });

  it('seat summary present', async () => {
    const seatText = await page.$eval('#seatSummary', el=>el.textContent.trim());
    expect(seatText.startsWith('P1=')).toBe(true);
  });

  it('hysteresis elements exist', async () => {
    const exists = await page.evaluate(()=> !!document.getElementById('p1Fill') && !!document.getElementById('p2Fill'));
    expect(exists).toBe(true);
  });

  it('no overlay errors (initial)', async () => {
    const errs = await page.evaluate(()=> (globalThis.__hexVizDiag && globalThis.__hexVizDiag.errors) ? globalThis.__hexVizDiag.errors.slice(0) : []);
    expect(errs.length).toBe(0);
  });
});
