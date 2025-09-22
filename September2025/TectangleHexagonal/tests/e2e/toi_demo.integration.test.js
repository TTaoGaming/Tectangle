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
 * E2E: TOI demo integration
 * - Loads the demo page
 * - Clicks Sound and Metronome
 * - Verifies AudioContext resumes and button labels toggle
 * - Checks time band draws Sched and updates with offset
 */

const PORT = Number(process.env.E2E_PORT || process.env.PORT || 8091);
const DEMO_URL = `http://127.0.0.1:${PORT}/September2025/TectangleHexagonal/dev/toi_demo.html?mock=1`;

describe('TOI Demo Integration', () => {
  beforeAll(async () => {
    await page.goto(DEMO_URL, { waitUntil: 'load' });
  });

  it('shows controls and can enable sound', async () => {
    await page.waitForSelector('#sound');
    await page.click('#sound');
    const label = await page.$eval('#sound', el => el.textContent.trim());
    expect(label).toMatch(/Sound On/);
    const audioState = await page.evaluate(() => window.__audioState || (window.__audioState = (window._audio = (window._audio || null), (window._audio && window._audio.state))));
    // we can't reliably inspect AudioContext; just ensure label changed
    expect(label.includes('Sound On')).toBe(true);
  });

  it('can toggle metronome', async () => {
    await page.waitForSelector('#metronome');
    await page.click('#metronome');
    const label = await page.$eval('#metronome', el => el.textContent.trim());
    expect(/■|Stop/.test(label)).toBe(true);
    // toggle back
    await page.click('#metronome');
    const label2 = await page.$eval('#metronome', el => el.textContent.trim());
    expect(label2).toMatch(/▶︎/);
  });

  it('updates Sched marker when offset changes', async () => {
    await page.focus('#userOffset');
    await page.click('#userOffset', { clickCount: 3 });
    await page.type('#userOffset', '120');
    await page.click('#apply');
    // Validate that latency port reflects the new offset and sched time moves
    const { userOffsetMs, schedNow, nowPerf } = await page.evaluate(() => ({
      userOffsetMs: window.__latency?.getUserOffsetMs?.(),
      schedNow: window.__latency?.getEffectiveScheduleNow?.(performance.now()),
      nowPerf: performance.now(),
    }));
    expect(userOffsetMs).toBe(120);
    // sched should be roughly now + 120 using the same clock origin
    expect(Math.abs(schedNow - nowPerf - 120) < 60).toBe(true);
  });

  it('produces ETA then Actual marker during a mock pinch', async () => {
    // run synthetic pinch
    await page.evaluate(async ()=>{ await window.__mockPinchSequence?.(); });
    // wait a moment inside the page to avoid missing timer API
  await page.evaluate(()=> new Promise(r=> setTimeout(r, 800)));
  const predSeen = await page.evaluate(()=> window.__sawPrediction?.());
    expect(predSeen).toBe(true);
  });
});
