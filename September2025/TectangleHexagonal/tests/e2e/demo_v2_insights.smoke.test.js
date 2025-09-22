// WEBWAY:ww-2025-002: minimal e2e smoke for v2 demo insights (.js variant for Jest discovery)
describe('Demo v2 (Tier-0 insights)', () => {
  const port = 8080; // expects local static server or jest-puppeteer env
  const url = `http://localhost:${port}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v2.html`;

  it('renders video and shows insights tray behind flag', async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#cam');
    const hasInsights = await page.evaluate(() => {
      const el = document.querySelector('#insights');
      return !!el && getComputedStyle(el).display !== 'none';
    });
    expect(hasInsights).toBe(true);
  });
});
