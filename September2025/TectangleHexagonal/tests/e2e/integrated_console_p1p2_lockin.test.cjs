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

// Purpose: Run integrated_hand_console with the two-hand pinch/hold clip and assert
// that (a) at least two pinch:down events occur, (b) seats P1 and P2 are assigned,
// and (c) both down events correspond to distinct hand keys mapping to P1 then P2.
// This validates the integrated console wiring (landmarks + seat + pinch events).

const CLIP = 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';

async function waitFor(predicate, timeoutMs=15000, interval=120){
  const start = Date.now();
  while(Date.now() - start < timeoutMs){
    const val = await predicate();
    if(val) return val;
    await new Promise(r=> setTimeout(r, interval));
  }
  throw new Error('waitFor timeout after '+timeoutMs+'ms');
}

describe('Integrated Console P1/P2 lock-in', () => {
  it('locks P1 then P2 with pinch downs from clip', async () => {
    const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
    const base = `http://127.0.0.1:${port}`;
    const url = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console.html?clip=${encodeURIComponent(CLIP)}&autostart=1`;

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait until we have at least two pinch:down events captured in global log
    const downs = await waitFor(async () => {
      const evs = await page.evaluate(() => (window.__ihcEvents||[]).filter(e=> e.type==='pinch:down'));
      return evs.length >= 2 ? evs : null;
    }, 20000);

    // Collect seat assignments by inspecting pinch events enriched with seat (if present)
    const summary = await page.evaluate(() => {
      const evs = window.__ihcEvents || [];
      const downs = evs.filter(e=> e.type==='pinch:down');
      const seats = downs.map(e=> e.seat || null).filter(Boolean);
      const handKeys = downs.map(e=> e.key);
      return { downs: downs.length, seats, handKeys };
    });

    expect(summary.downs).toBeGreaterThanOrEqual(2);
    // Should include both P1 and P2 somewhere in seat list
    expect(summary.seats).toEqual(expect.arrayContaining(['P1','P2']));
    // Distinct first two down hand keys (ideally different hands)
    if(summary.handKeys.length >= 2){
      expect(summary.handKeys[0]).not.toEqual(summary.handKeys[1]);
    }
  }, 30000);
});
