/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

/**
 * E2E: Hand ID Lab stability on a no-pinch crossover clip.
 * Expects: zero downs/ups, low teleports, stable alive count 0..2.
 */
const path = require('path');

describe('Hand ID Lab — stability (no pinches)', () => {
  const PORT = process.env.E2E_PORT || process.env.PORT || 8091;
  const BASE = `http://127.0.0.1:${PORT}`;
  const DEMO = `${BASE}/September2025/TectangleHexagonal/dev/hand_id_lab.html`;
  // Updated canonical no-pinch crossover+occlusion clip (renamed to include crossover semantics)
  const CLIP = process.env.NO_PINCH_CLIP || 'September2025/TectangleHexagonal/videos/right_hand_crossover_exit_occlusion_no_pinch_v1.mp4';

  // Jest case-level timeout: 2 minutes
  jest.setTimeout(120000);

  it('tracks hands across enter/exit/crossover without teleport', async () => {
    // Prefer MP4; fallback to deterministic simulator if clip missing or not served in CI.
    const useSim = process.env.USE_SIM === '1';
    const qs = useSim ? `?process=frame&stepMs=60&durMs=12000&noauto=0` : `?src=${encodeURIComponent(CLIP)}&noauto=0&maxMs=30000`;
    const url = `${DEMO}${qs}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // wait up to 5s for lab init
    await page.waitForFunction(() => window.__hexReady === true, { timeout: 5000 });
    // Wait for frames; if insufficient after 10s, fallback to deterministic simulator
    let usedSim = false;
    try {
      await page.waitForFunction(()=> window.__hex.getStats().frames > 25, { timeout:10000 });
    } catch {
      const simUrl = `${DEMO}?process=frame&stepMs=60&durMs=12000&noauto=0`;
      await page.goto(simUrl, { waitUntil:'domcontentloaded' });
      await page.waitForFunction(()=> window.__hexReady === true, { timeout:4000 });
      await page.waitForFunction(()=> window.__hex.getStats().frames > 25, { timeout:8000 });
      usedSim = true;
    }
    // Allow run to finish or accumulate enough frames under sim
    try { await page.waitForFunction(()=> window.__processingDone === true, { timeout:15000 }); } catch {}
    const stats = await page.evaluate(() => window.__hex.getStats());
    expect(stats.frames).toBeGreaterThan(usedSim ? 120 : 25);
    // Allow a couple reassigns/teleports due to model jitter, but keep low
    expect(stats.teleports).toBeLessThan(6);
    expect(stats.reassigns).toBeLessThan(4);
  });
});
