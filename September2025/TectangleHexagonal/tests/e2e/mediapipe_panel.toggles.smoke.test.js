// Jest-Puppeteer e2e: MediaPipe panel toggles reflect window flags

const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
const base = `http://localhost:${port}`;
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html`;

describe('MediaPipe panel toggles control flags', () => {
  beforeAll(async () => {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="shell-bar"]', { timeout: 10000 });
    await page.click('[data-testid="shell-btn-mediapipe"]');
    await page.waitForFunction(() => {
      const titles = Array.from(document.querySelectorAll('.winbox .wb-title')).map(e => e.textContent?.toLowerCase()||'');
      return titles.some(t => t.includes('mediapipe'));
    }, { timeout: 10000 });
  });

  it('toggles FEATURE_HEX_HAND_TRACKER_T1', async () => {
    // read initial
    const before = await page.evaluate(() => !!window.FEATURE_HEX_HAND_TRACKER_T1);
    // Click switch
    await page.click('md-switch#swT1');
    const after = await page.evaluate(() => !!window.FEATURE_HEX_HAND_TRACKER_T1);
    expect(after).toBe(!before);
  });

  it('toggles FEATURE_T1_TRACKER_REQUIRED', async () => {
    const before = await page.evaluate(() => !!window.FEATURE_T1_TRACKER_REQUIRED);
    await page.click('md-switch#swT1Req');
    const after = await page.evaluate(() => !!window.FEATURE_T1_TRACKER_REQUIRED);
    expect(after).toBe(!before);
  });

  it('toggles FEATURE_TELEM_HANDID_GUARD', async () => {
    const before = await page.evaluate(() => window.FEATURE_TELEM_HANDID_GUARD ?? true);
    await page.click('md-switch#swGuard');
    const after = await page.evaluate(() => window.FEATURE_TELEM_HANDID_GUARD ?? true);
    expect(after).toBe(before ? false : true);
  });
});
