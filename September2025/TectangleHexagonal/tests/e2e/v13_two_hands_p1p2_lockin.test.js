/** @jest-environment puppeteer */

// V13: Assert that the two-hands pinch clip locks P1 then P2 within a reasonable timeout.

const CLIP = 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';

describe('V13 Integrated Console — Two-hands P1/P2 lock-in', () => {
  jest.setTimeout(60000);

  it('locks both P1 and P2 on the two-hands sequence', async () => {
    const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
    const base = `http://127.0.0.1:${port}`;
    const url = `${base}/September2025/TectangleHexagonal/dev/integrated_hand_console_v13.html?autostart=1&nocam=1&clip=${encodeURIComponent(CLIP)}`;

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Max UI update frequency to ensure angle presence increments
    await page.evaluate(() => { const sel = document.getElementById('richHz'); if(sel) sel.value = 'frame'; });

    // Ensure globals are ready
    await page.waitForFunction(() => !!(window.__ihcV13 && __ihcV13.seatLockAdapter), { timeout: 20000 });

    // Wait until both seats are locked
    await page.waitForFunction(() => {
      const a = window.__ihcV13?.seatLockAdapter; if(!a) return null;
      const e = a.snapshot().enriched || {};
      return (e.P1?.locked && e.P2?.locked) ? true : null;
    }, { timeout: 30000 });

    // Optional: verify angles are present by sampling briefly
    const angleInfo = await page.evaluate(async () => {
      const a = window.__ihcV13.seatLockAdapter;
      const acc = { P1:0, P2:0 };
      const start = performance.now();
      while(performance.now() - start < 800){
        const snap = a.snapshot();
        for(const sid of ['P1','P2']){
          const e = snap.enriched?.[sid];
          const idx = e?.jointAngles?.index;
          if(idx && (idx.mcpDeg!=null || idx.pipDeg!=null || idx.dipDeg!=null)) acc[sid]++;
        }
        await new Promise(r=>setTimeout(r, 50));
      }
      return acc;
    });

    expect(angleInfo.P1).toBeGreaterThan(0);
    expect(angleInfo.P2).toBeGreaterThan(0);
  });
});
