/**
 * WEBWAY:ww-2025-008: e2e to validate Dino sidecar negative-latency stats on golden MP4
 */
const fs = require('fs');
const path = require('path');

describe('v3 kalman + dino sidecar (golden MP4)', () => {
  // WEBWAY:ww-2025-061: env-driven base URL for tests
  const port = process.env.E2E_PORT || process.env.PORT || '8091';
  const host = process.env.E2E_HOST || '127.0.0.1';
  const base = process.env.SITE_BASE || `http://${host}:${port}`;
  const url = base + '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html';
  const pinchUrl = base + '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
  const outDir = path.resolve(process.cwd(), 'out');
  const outSummary = path.join(outDir, 'dino_sidecar.summary.json');

  beforeAll(async () => {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    await page.setViewport({ width: 1280, height: 800 });
  });

  it('collects summary and meets thresholds', async () => {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    // enable flags
    await page.evaluate(() => { window.__flags = window.__flags || {}; window.__flags['FEATURE_SDK_V3_KALMAN_TOI'] = true; window.__flags['FEATURE_SIDECAR_DINO'] = true; });
    // Reload to apply if needed
    await page.reload({ waitUntil: 'networkidle2' });

    // After reload, click toggles to reflect UI state
    await page.waitForSelector('#ff_kalman');
    const kalChecked = await page.$eval('#ff_kalman', (el) => el.checked);
    if (!kalChecked) await page.click('#ff_kalman');
    await page.waitForSelector('#ff_dino');
    const dinoChecked = await page.$eval('#ff_dino', (el) => el.checked);
    if (!dinoChecked) await page.click('#ff_dino');

    // Play golden MP4
    await page.evaluate((src) => {
      const v = document.getElementById('cam');
      const sdk = window.__sdk;
      v.crossOrigin = 'anonymous';
      sdk.startVideoUrl(v, src);
    }, pinchUrl);

    // Wait for run; extend to capture ups as well
    await page.waitForTimeout(12000);

    // Pull summary
    const summary = await page.evaluate(() => {
      return window.__dino?.getSummary?.() || null;
    });
    expect(summary).toBeTruthy();
    fs.writeFileSync(outSummary, JSON.stringify(summary, null, 2));

    // Basic thresholds: at least 4 downs; p95 error under 80ms; jitter p95 under 60ms
    expect(summary.downs).toBeGreaterThanOrEqual(4);
    expect(summary.errorDown.p95).toBeLessThanOrEqual(80);
    expect(summary.errorDown.jitterP95).toBeLessThanOrEqual(60);
  }, 60000);
});
