/**
 * WEBWAY: ww-2025-069 — Ghost persistence e2e
 * Asserts: With seatmag+auto, after locking P1 then simulating occlusion (no detections),
 * the overlay reports a P1 ghost; on simulated re-entry, autosnap reclaims P1.
 */

const SITE_BASE = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT||8080}`;
const PAGE = '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html';
const CLIP = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

describe('v7 | Seat Magnet ghost persistence', () => {
  it('renders P1 ghost on occlusion and autosnaps on re-entry', async () => {
    await page.setViewport({ width: 960, height: 540, deviceScaleFactor: 1 });
    const url = `${SITE_BASE}${PAGE}?autostart=1&clip=${encodeURIComponent(CLIP)}&panel=side&seatmag=1&seatmag_auto=1&flag_v6_dino_p1=0`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for P1 to be locked (via pinch during the golden clip)
    await page.waitForFunction(() => {
      try { return !!(window.__lockSummary && window.__lockSummary().P1); } catch { return false; }
    }, { timeout: 20000 });

    // Simulate occlusion: release seat and force no detections in overlay
    await page.evaluate(() => { try { window.__simulateOcclusion({ seat: 'P1' }); window.__seatMagnet?.setTestNoDets?.(true); } catch {} });

    // Expect overlay to render a ghost for P1 within a short window
    await page.waitForFunction(() => {
      try{
        const g = window.__seatMagnet?.ghostSeats; if(!g) return false; return Array.from(g).includes('P1');
      }catch{ return false; }
    }, { timeout: 8000 });

    // Simulate re-entry near the anchor; expect autosnap to reclaim P1
    const reentryOk = await page.evaluate(() => { try { return !!window.__simulateReentry?.({ seat: 'P1', hand: 'left' }); } catch { return false; } });
    expect(reentryOk).toBe(true);

    // Stop test-only nodets override
    await page.evaluate(() => { try { window.__seatMagnet?.setTestNoDets?.(false); } catch {} });

    // Wait for seat mapping to include P1 again (autosnapped)
    await page.waitForFunction(() => {
      try{
        const st = window.__seatMagState?.();
        if(!st || !st.map) return false;
        // any map entry with seat P1
        return Object.values(st.map).includes('P1');
      }catch{ return false; }
    }, { timeout: 8000 });
  }, 45000);
});
