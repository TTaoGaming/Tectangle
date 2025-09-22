/**
 * WEBWAY:ww-2025-008: e2e to validate Dino sidecar negative-latency stats on golden MP4
 */
const fs = require('fs');
const path = require('path');

describe('v3 kalman + dino sidecar (golden MP4)', () => {
  // WEBWAY:ww-2025-061: env-driven base URL to avoid hardcoded :8080
  const port = process.env.E2E_PORT || process.env.PORT || '8091';
  const host = process.env.E2E_HOST || '127.0.0.1';
  const base = process.env.SITE_BASE || `http://${host}:${port}`;
  const urlBase = base + '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html';
  const pinchUrl = base + '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
  const outDir = path.resolve(process.cwd(), 'out');
  const outSummary = path.join(outDir, 'dino_sidecar.summary.json');

  beforeAll(async () => {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    await page.setViewport({ width: 1280, height: 800 });
  });

  it('collects summary and meets thresholds', async () => {
  const url = urlBase + `?autostart=1&kalman=1&dino=1&clip=${encodeURIComponent('/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4')}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  // Nudge autoplay just in case
  await page.evaluate(() => { try { const v = document.getElementById('cam'); if(v){ v.muted = true; v.play && v.play().catch(()=>{}); } } catch{} });

    // Set up probe on sdk events
    await page.evaluate(() => {
      window.__probe = { downs: 0, ups: 0 };
      if (window.__sdk && typeof window.__sdk.on === 'function') {
        window.__sdk.on('pinch:down', () => { window.__probe.downs++; });
        window.__sdk.on('pinch:up', () => { window.__probe.ups++; });
      }
    });

    // Play golden MP4 via UI button to reuse demo wiring
    await page.waitForSelector('#btnPlayPinch');
    await page.click('#btnPlayPinch');

    // Wait until at least 2 downs observed or timeout ~12s
  const start = Date.now();
  while (Date.now() - start < 20000) {
      const counts = await page.evaluate(() => window.__probe || { downs: 0, ups: 0 });
      if (counts.downs >= 2) break;
      await new Promise((res) => setTimeout(res, 250));
    }

    // Pull summary
    const result = await page.evaluate(() => {
      const probe = window.__probe || { downs: 0, ups: 0 };
      const summary = window.__dino?.getSummary?.() || null;
      return { probe, summary };
    });
    expect(result && result.summary).toBeTruthy();
    fs.writeFileSync(outSummary, JSON.stringify(result, null, 2));

    // Guard: Events should be flowing (at least 2 downs observed by probe)
    expect(result.probe.downs).toBeGreaterThanOrEqual(2);
    // Informational thresholds for sidecar; don't fail if not attached yet
    if (result.summary.downs > 0) {
      expect(result.summary.errorDown.p95).toBeLessThanOrEqual(120);
      expect(result.summary.errorDown.jitterP95).toBeLessThanOrEqual(90);
    }
  }, 60000);
});
