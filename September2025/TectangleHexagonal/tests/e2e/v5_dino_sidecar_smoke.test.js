/**
 * WEBWAY:ww-2025-055: e2e smoke for v5 Dino sidecar harness on golden MP4
 */
const fs = require('fs');
const path = require('path');

describe('v5 + dino sidecar (golden MP4)', () => {
  // WEBWAY:ww-2025-061: normalize base URL to env-driven port
  const port = process.env.E2E_PORT || process.env.PORT || '8091';
  const host = process.env.E2E_HOST || '127.0.0.1';
  const base = process.env.SITE_BASE || `http://${host}:${port}`;
  const urlBase = base + '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html';
  const outDir = path.resolve(process.cwd(), 'September2025', 'TectangleHexagonal', 'out');
  const outSummary = path.join(outDir, 'dino_sidecar.v5.summary.json');

  beforeAll(async () => {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    await page.setViewport({ width: 1280, height: 800 });
  });

  it('attaches sidecar and records basic stats (fail-fast on zero engagement)', async () => {
    // Use absolute path to avoid relative-resolution duplication under /dev
    const clip = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
    const url = urlBase + `?autostart=1&dino=1&clip=${encodeURIComponent(clip)}&la=100`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Nudge autoplay just in case
    await page.evaluate(() => { try { const v = document.getElementById('cam'); if(v){ v.muted = true; v.play && v.play().catch(()=>{}); } } catch{} });

    // Probe SDK events
    await page.evaluate(() => {
      window.__probe = { downs: 0, ups: 0 };
      if (window.__sdk && typeof window.__sdk.on === 'function') {
        window.__sdk.on('pinch:down', () => { window.__probe.downs++; });
        window.__sdk.on('pinch:up', () => { window.__probe.ups++; });
      }
    });

    // If not auto, click Play Pinch
    try {
      await page.waitForSelector('#btnPlayPinch', { timeout: 5000 });
      await page.click('#btnPlayPinch');
    } catch {}

    // Wait until at least 1-2 downs observed or timeout
    const start = Date.now();
    while (Date.now() - start < 20000) {
      const counts = await page.evaluate(() => window.__probe || { downs: 0, ups: 0 });
      if (counts.downs >= 1) break;
      await new Promise((res) => setTimeout(res, 250));
    }

    // Fetch sidecar summary
    const result = await page.evaluate(() => {
      const probe = window.__probe || { downs: 0, ups: 0 };
      const summary = window.__dino?.getSummary?.() || null;
      return { probe, summary };
    });
    expect(result && result.summary).toBeTruthy();
    fs.writeFileSync(outSummary, JSON.stringify(result, null, 2));

    // WEBWAY:ww-2025-075: Fail fast when zero downs/ups so CI surfaces regressions
    expect(result.summary.downs).toBeGreaterThan(0);
    expect(result.probe.downs).toBeGreaterThanOrEqual(1);
  }, 60000);
});
