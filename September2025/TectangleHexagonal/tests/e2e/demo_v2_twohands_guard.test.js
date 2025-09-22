/**
 * E2E guard: v2 demo should detect >=2 hands for at least 1 frame on the two-hands goldens.
 * Uses page headless hooks exposed by the v2 demo to read summary and JSONL.
 */

const path = require('path');

const SITE_BASE = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT || process.env.PORT || 8091}`;

const idleClip = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_idle.v1.mp4';
const pinchClip = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
const pagePath = '/September2025/TectangleHexagonal/dev/gesture_tasks_offline_v2.html';

async function runOnce(clip){
  const url = `${SITE_BASE}${pagePath}?video=${encodeURIComponent(clip)}&idle=Open_Palm&target=Closed_Fist&auto=1`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Wait up to 30s for end
  await page.waitForFunction(() => window.__v2 && window.__v2.isEnded && window.__v2.isEnded(), { timeout: 30000 });
  const summary = await page.evaluate(() => window.__v2.getSummary());
  const rows = await page.evaluate(() => window.__v2.getRows());
  const jsonlText = await page.evaluate(() => window.__v2.getJsonl());
  const lines = jsonlText.trim().split('\n').filter(Boolean);
  const objs = lines.map(l => JSON.parse(l));
  const twoHandsFrames = objs.filter(o => (o.hands||0) >= 2);
  expect(rows.length).toBeGreaterThan(0);
  expect(summary.twoHands).toBeGreaterThanOrEqual(1);
  expect(twoHandsFrames.length).toBeGreaterThanOrEqual(1);
  // basic field presence on first frame
  const f0 = objs[0];
  expect(f0).toHaveProperty('t');
  expect(f0).toHaveProperty('frame');
  expect(f0).toHaveProperty('hands');
  expect(f0).toHaveProperty('label');
  return { summary, rowsCount: rows.length, jsonlCount: lines.length };
}

describe('Gesture v2 two-hands guards', () => {
  it('idle golden has >=1 frame with two hands', async () => {
    const { summary } = await runOnce(idleClip);
    // For idle, also expect twoHandsIdle >= 1
    expect(summary.twoHandsIdle).toBeGreaterThanOrEqual(1);
  });

  it('pinch sequence golden has >=1 frame with two hands', async () => {
    const { summary } = await runOnce(pinchClip);
    // For pinch, expect at least some two-hands frames; target spikes are optional for classification model
    expect(summary.twoHands).toBeGreaterThanOrEqual(1);
  });
});
