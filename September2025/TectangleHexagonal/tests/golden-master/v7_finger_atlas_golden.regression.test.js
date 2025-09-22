/**
 * WEBWAY:ww-2025-067: Finger Atlas — golden MP4 JSONL + overlay regression
 * Asserts: when FINGER_ATLAS is enabled on v7, playing the golden pinch sequence
 * produces a minimum number of JSONL lines and exposes an overlay marker.
 */

const SITE_BASE = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT||8080}`;
const PAGE = '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html';
const CLIP = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

describe('v7 | Finger Atlas golden JSONL + overlay', () => {
  it('records JSONL lines and exposes overlay marker', async () => {
    await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
    const url = `${SITE_BASE}${PAGE}?autostart=1&clip=${encodeURIComponent(CLIP)}&finger_atlas=1&panel=side`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Wait for video readiness
    await page.waitForFunction(() => {
      const v = document.getElementById('cam');
      return !!(v && !isNaN(v.duration) && v.readyState>=2);
    }, { timeout: 8000 });
  // Wait for some JSONL accumulation (processing frames)
  await page.waitForFunction(() => (window.__fingerJSONLLines||0) >= 10, { timeout: 15000 });
    // Assert overlay marker exists
    const hasOverlay = await page.$('[data-test-id="finger-overlay"]') != null;
    expect(hasOverlay).toBe(true);
    // Assert some JSONL accumulated
  const lines = await page.evaluate(()=> window.__fingerJSONLLines || 0);
  expect(lines).toBeGreaterThanOrEqual(10);
  }, 30000);
});
