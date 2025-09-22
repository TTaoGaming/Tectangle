/**
 * Smoke test: integrated_hand_console_v4.html
 * Verifies:
 *  - Page loads, diagnostics frames increment.
 *  - Seat summary element present.
 *  - Signals grid populates (or shows placeholder) without throwing.
 *  - No early loop errors recorded.
 */

const PAGE_REL = 'September2025/TectangleHexagonal/dev/integrated_hand_console_v4.html';
const AUTOSTART_Q = '?autostart=1';

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

describe('hand console v4 smoke', () => {
  beforeAll(async () => {
    await page.goto(`http://localhost:8080/${PAGE_REL}${AUTOSTART_Q}`, { waitUntil:'domcontentloaded' });
  });

  it('diagnostics frames advance', async () => {
    await sleep(400);
    const frames = await page.evaluate(()=> globalThis.__hexVizDiagV4?.frames || 0);
    expect(frames).toBeGreaterThan(2);
  });

  it('seat summary present', async () => {
    const seatText = await page.$eval('#seatSummary', el=>el.textContent.trim());
    expect(seatText.startsWith('P1=')).toBe(true);
  });

  it('signals grid exists', async () => {
    const exists = await page.evaluate(()=> !!document.getElementById('signalsGrid'));
    expect(exists).toBe(true);
  });

  it('no loop errors (initial)', async () => {
    const errs = await page.evaluate(()=> (globalThis.__hexVizDiagV4 && globalThis.__hexVizDiagV4.errors) ? globalThis.__hexVizDiagV4.errors.slice(0) : []);
    expect(errs.length).toBe(0);
  });
});
