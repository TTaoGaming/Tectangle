/**
 * WEBWAY:ww-2025-055: v5 Dino iframe integration — verify Space keydowns and sidecar stats
 */
const fs = require('fs');
const path = require('path');

describe('v5 Dino iframe integration', () => {
  // WEBWAY:ww-2025-061: normalize base URL using env
  const port = process.env.E2E_PORT || process.env.PORT || '8091';
  const host = process.env.E2E_HOST || '127.0.0.1';
  const base = process.env.SITE_BASE || `http://${host}:${port}`;
  const pageUrl = base + '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html';
  const clip = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
  const outDir = path.resolve(process.cwd(), 'September2025', 'TectangleHexagonal', 'out');
  const outSummary = path.join(outDir, 'dino_iframe.v5.summary.json');

  beforeAll(async () => {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    await page.setViewport({ width: 1280, height: 800 });
  });

  it('launches dino + observes Space keydowns', async () => {
    const url = pageUrl + `?autostart=1&dino=1&launch=1&clip=${encodeURIComponent(clip)}&la=100`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Nudge video autoplay
    await page.evaluate(() => { try { const v = document.getElementById('cam'); if(v){ v.muted = true; v.play && v.play().catch(()=>{}); } } catch{} });

    // Wait for dino iframe and add a listener inside to count keydowns
    const frame = await page.waitForSelector('#dino', { timeout: 15000 });
    // Ensure the iframe is loaded
    await page.waitForFunction(() => {
      const f = document.getElementById('dino');
      return f && f.contentWindow && f.contentDocument && f.contentDocument.readyState === 'complete';
    }, { timeout: 15000 });

    // Attach a counter for Space keydown in the iframe document
    await page.evaluate(() => {
      const f = document.getElementById('dino');
      const doc = f && (f.contentDocument || f.contentWindow?.document);
      if (!doc) return;
      doc.__spaceCount = 0;
      doc.addEventListener('keydown', (e) => { if (String(e.keyCode) === '32' || e.code === 'Space') doc.__spaceCount++; });
    });

    // Wait for at least one pinch→Space mapping to fire or timeout
    const start = Date.now();
    let spaceCount = 0;
    while (Date.now() - start < 20000) {
      spaceCount = await page.evaluate(() => {
        const f = document.getElementById('dino');
        const doc = f && (f.contentDocument || f.contentWindow?.document);
        return (doc && doc.__spaceCount) || 0;
      });
      if (spaceCount >= 1) break;
      await new Promise((res) => setTimeout(res, 250));
    }

    // Gather sidecar summary
    const result = await page.evaluate(() => {
      return { summary: window.__dino?.getSummary?.() || null };
    });

    fs.writeFileSync(outSummary, JSON.stringify({ spaceCount, ...result }, null, 2));
    expect(result.summary).toBeTruthy();
    // Non-strict guard: at least one Space keydown observed in 20s
    expect(spaceCount).toBeGreaterThanOrEqual(1);
  }, 70000);
});
