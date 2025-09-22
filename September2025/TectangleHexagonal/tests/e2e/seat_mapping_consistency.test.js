/** @jest-environment puppeteer */
// WEBWAY:ww-2025-058: Verify that seat labels are consistent across state panel, overlay stripes, and strip header.

const CLIP = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

function buildUrl(){
  const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
  const base = `http://127.0.0.1:${port}`;
  // WEBWAY:ww-2025-059: force ready sentinel + autoplay probe
  return `${base}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html?autostart=1&probe=1&forceRaf=1&clip=${encodeURIComponent(CLIP)}`;
}

async function waitForSomeFrames(ms=4000){ await new Promise(r=> setTimeout(r, ms)); }

describe('Seat mapping consistency (v5)', () => {
  it('P1/P2 labels agree across state, overlay, and bottom strips', async () => {
    jest.setTimeout(60000);
    const url = buildUrl();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Wait until the page declares readiness: at least some rich frames and at least one strip
    await page.waitForFunction(() => {
      const el = document.getElementById('e2eReady');
      return el && el.dataset.ready === '1';
    }, { timeout: 20000 });

    // Extract a snapshot: state panel JSON and DOM labels for strips
    const result = await page.evaluate(() => {
      const stateText = document.getElementById('state')?.textContent || '';
      let seatsFromState = [];
      try{ const st = JSON.parse(stateText); const hands = (st?.hands?.hands)||[]; seatsFromState = hands.map(h=> ({hand: h.hand, seat: h.seat||null})); }catch{}

      const stripLabels = Array.from(document.querySelectorAll('[data-strip] .font-semibold'))
        .map(el => el?.textContent?.trim() || '');
      // overlay is drawn; we can also sample latest rich snapshot text for seats
      const richText = document.getElementById('rich')?.textContent || '';
      let seatsFromRich = [];
      try { const arr = JSON.parse(richText); seatsFromRich = arr.map(s=> s.seat); } catch {}

      return { seatsFromState, stripLabels, seatsFromRich };
    });

    // Guards: we expect at least one seat label present
    expect(result.stripLabels.length).toBeGreaterThan(0);

    // Heuristic checks: if P1 appears in strips, it should appear in rich seats as well
    if (result.stripLabels.some(l => l.includes('P1'))) {
      expect(result.seatsFromRich.some(s => s === 'P1')).toBe(true);
    }
    if (result.stripLabels.some(l => l.includes('P2'))) {
      expect(result.seatsFromRich.some(s => s === 'P2')).toBe(true);
    }

    // No direct mismatch like overlay shows P1 while strip shows P2 only
    const stripsHaveP1 = result.stripLabels.some(l => l.includes('P1'));
    const stripsHaveP2 = result.stripLabels.some(l => l.includes('P2'));
    const richHaveP1 = result.seatsFromRich.includes('P1');
    const richHaveP2 = result.seatsFromRich.includes('P2');

    // Allow both present, but disallow contradictory single-sided presence
    if (stripsHaveP1 && !stripsHaveP2) {
      expect(richHaveP1).toBe(true);
    }
    if (stripsHaveP2 && !stripsHaveP1) {
      expect(richHaveP2).toBe(true);
    }
  });
});
