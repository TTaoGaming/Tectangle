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

/** @jest-environment puppeteer */

const { installRecorder, ensureRecorder, waitForPinchDowns } = require('./helpers/hexPage');

const clip = 'September2025/TectangleHexagonal/videos/two_hands_stationary_right_then_left_index_pinch_hold_1s_v1.mp4';

describe('P1/P2 lock-in (lab page)', () => {
  it('assigns P1 then P2 on two pinch downs from clip', async () => {
    await installRecorder(page);

    const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
    const base = `http://127.0.0.1:${port}`;
    const url = `${base}/September2025/TectangleHexagonal/dev/controller_router_lab.html?src=${encodeURIComponent(clip)}&noauto=0&maxMs=30000`;

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await ensureRecorder(page);
    await page.waitForFunction(() => window.__hexReady === true, { timeout: 10000 }).catch(() => {});

    const summary = await waitForPinchDowns(page, 2);

    expect(summary.downsCount).toBeGreaterThanOrEqual(2);
    expect(summary.controllers).toEqual(expect.arrayContaining(['P1', 'P2']));
  }, 30000);
});
