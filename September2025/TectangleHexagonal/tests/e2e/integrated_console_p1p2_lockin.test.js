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

/** @jest-environment puppeteer */

// Integrated Console P1/P2 lock-in test
// Loads integrated_hand_console.html with two-hand pinch clip and asserts two pinch:down events
// and that seats P1 and P2 both appear among those downs. Uses global window.__ihcEvents buffer
// populated by the console page instrumentation.

const CLIP = 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';

describe('Integrated Console - P1/P2 lock-in', () => {
  jest.setTimeout(45000);

  async function waitFor(predicate, timeoutMs=20000, interval=120){
    const start = Date.now();
    while(Date.now() - start < timeoutMs){
      const val = await predicate();
      if(val) return val;
      await new Promise(r=> setTimeout(r, interval));
    }
    throw new Error('waitFor timeout after '+timeoutMs+'ms');
  }

  it('observes two pinch:down events mapped to P1 and P2', async () => {
    const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
    const base = `http://127.0.0.1:${port}`;
    const url = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console.html?clip=${encodeURIComponent(CLIP)}&autostart=1`;

    await page.goto(url, { waitUntil:'domcontentloaded' });

    // Wait for downs
    const downs = await waitFor(async () => {
      return await page.evaluate(() => {
        const evs = (window.__ihcEvents||[]).filter(e=> e.type==='pinch:down');
        return evs.length >= 2 ? evs : null;
      });
    });

    const summary = await page.evaluate(() => {
      const evs = window.__ihcEvents || [];
      const downs = evs.filter(e=> e.type==='pinch:down');
      return {
        downs: downs.length,
        seats: Array.from(new Set(downs.map(e=> e.seat).filter(Boolean))),
        handKeys: downs.map(e=> e.key)
      };
    });

    expect(summary.downs).toBeGreaterThanOrEqual(2);
    expect(summary.seats).toEqual(expect.arrayContaining(['P1','P2']));
    if(summary.handKeys.length >= 2){
      expect(summary.handKeys[0]).not.toEqual(summary.handKeys[1]);
    }
  });
});
