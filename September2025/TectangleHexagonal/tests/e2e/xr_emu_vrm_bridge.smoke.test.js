const PAGE = '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html';
const CLIP = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

describe('XR emu smoke: pinch → selectstart', () => {
  const SITE_BASE = process.env.SITE_BASE || 'http://127.0.0.1:8091';
  const url = `${SITE_BASE}${PAGE}?autostart=1&clip=${encodeURIComponent(CLIP)}&panel=side&pinch_bridge=1&xr_emu=1&flag_v6_dino_p1=0`;

  it('increments XR select counter when pinch occurs', async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-test-id="xr-select-count"]', { visible: true, timeout: 8000 });
    // Wait until the counter registers at least one select
    await page.waitForFunction(() => { try { return (window.__xrEmuCount && window.__xrEmuCount() >= 1); } catch { return false; } }, { timeout: 10000 });
    const count = await page.evaluate(() => { try { return window.__xrEmuCount && window.__xrEmuCount(); } catch { return 0; } });
    expect(count).toBeGreaterThanOrEqual(1);
  }, 20000);
});
