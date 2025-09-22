/**
 * v7: Toolbar button smoke for beginner UX.
 * Opens drawer via toolbar button when in drawer mode with panel_btn=1.
 */

const SITE_BASE = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT||8080}`;
const PAGE = '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html';
const CLIP = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

describe('v7 | Toolbar Open Panel smoke', () => {
  it('shows toolbar button and opens drawer', async () => {
    const url = `${SITE_BASE}${PAGE}?panel=drawer&panel_btn=1&autostart=1&clip=${encodeURIComponent(CLIP)}`;
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => {
      const el = document.getElementById('e2eReady');
      return el && el.dataset.ready === '1';
    }, { timeout: 45000 });

    await page.waitForSelector('#btnPanelToolbar', { visible: true });
    await page.click('#btnPanelToolbar');

    await page.waitForSelector('#bottomDrawer', { visible: true });
  }, 60000);
});
