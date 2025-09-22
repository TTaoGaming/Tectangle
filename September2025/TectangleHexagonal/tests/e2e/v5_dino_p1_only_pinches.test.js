// Ensures Dino sidecar listens to P1 only, using golden pinch clip; no P2 cross-contamination

const PINCH_URL = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

describe('v5 Dino sidecar P1-only', () => {
  it('routes only P1 pinches to Space and rejects P2', async () => {
  // WEBWAY:ww-2025-061: env-driven base URL
  const port = process.env.E2E_PORT || process.env.PORT || '8091';
  const host = process.env.E2E_HOST || '127.0.0.1';
  const base = process.env.SITE_BASE || `http://${host}:${port}`;
  const url = `${base}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html?dino=1&launch=1&autostart=1&clip=${encodeURIComponent(PINCH_URL)}&la=100`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    // Wait for iframe to appear and get focus
  await page.waitForSelector('#dino', { visible: true });
  // Give the app a moment to start decoding and producing snapshots
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  await sleep(4000);
    // Poll dino summary
    // Nudge play button like in smoke to ensure playback starts
    try { await page.click('#btnPlayPinch'); } catch {}
    const result = await page.evaluate(async () => {
      const retry = (n) => new Promise((res) => setTimeout(res, n));
      for (let i = 0; i < 60; i++) {
        const d = window.__dino;
        if (d && d.getSummary) {
          const s = d.getSummary();
          if (s.downs > 0) return s;
        }
        await retry(1000);
      }
      return window.__dino && window.__dino.getSummary ? window.__dino.getSummary() : null;
    });
    expect(result).toBeTruthy();
    // Should have at least one Space down from P1
    expect(result.downs).toBeGreaterThan(0);
    // We expect to reject at least one P2 event in the two-hands sequence
    expect(result.rejectedBySeat).toBeGreaterThanOrEqual(1);
    // Summary seat should be P1
    expect(result.seat).toBe('P1');
  }, 45000);
});
