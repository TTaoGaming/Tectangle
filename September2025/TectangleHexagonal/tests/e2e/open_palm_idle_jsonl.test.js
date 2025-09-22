// WEBWAY:ww-2025-090: Jest e2e guard for Open_Palm on idle golden using v3 offline page JSONL hooks
/**
 * Validates that the v3 offline gesture page, when fed the golden idle clip,
 * reports Open_Palm at least once on both Left and Right hands, and that
 * at least one frame has two hands present.
 */

const SITE_BASE = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT || process.env.PORT || 8091}`;
const PAGE = '/September2025/TectangleHexagonal/dev/gesture_tasks_offline_v3.html';
const CLIP = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';

async function waitForEndWithRows() {
  const deadline = Date.now() + 60000; // 60s max
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => ({
      rows: (globalThis.__v3?.getRows?.() || []).length,
      ended: !!globalThis.__v3?.isEnded?.(),
    }));
    if (state.ended && state.rows > 0) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

describe('Open_Palm idle JSONL guard (v3)', () => {
  it('observes two hands and Open_Palm on Left and Right at least once', async () => {
    const url = `${SITE_BASE}${PAGE}?video=${encodeURIComponent(`${SITE_BASE}${CLIP}`)}&auto=1&autoExport=1&idle=Open_Palm&target=Closed_Fist&hands=2`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => !!globalThis.__v3, { timeout: 20000 });
    const ok = await waitForEndWithRows();
    expect(ok).toBe(true);

    const rows = await page.evaluate(() => globalThis.__v3?.getRows?.() || []);
    expect(rows.length).toBeGreaterThan(0);

    let twoHandsFrames = 0;
    let leftOpen = 0;
    let rightOpen = 0;
    for (const r of rows) {
      const per = Array.isArray(r?.per) ? r.per : [];
      const count = per.filter((p) => p && (p.label || typeof p.score === 'number')).length;
      if (count >= 2) twoHandsFrames++;
      for (const p of per) {
        if (!p || p.label !== 'Open_Palm') continue;
        if (p.handed === 'Left') leftOpen++;
        if (p.handed === 'Right') rightOpen++;
      }
    }

    expect(twoHandsFrames).toBeGreaterThanOrEqual(1);
    expect(leftOpen).toBeGreaterThanOrEqual(1);
    expect(rightOpen).toBeGreaterThanOrEqual(1);
  });
});
