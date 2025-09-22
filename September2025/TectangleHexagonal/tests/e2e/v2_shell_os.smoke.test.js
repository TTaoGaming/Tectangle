// Verify bottom app bar (shell OS) renders and opens Settings WinBox
// Uses Jest-Puppeteer. Requires local static server. PORT/E2E_PORT controls port.

const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
const base = `http://localhost:${port}`;
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html`;

describe('v2 shell OS bottom app bar', () => {
  it('renders bottom bar and opens Settings window', async () => {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });

    // Wait for the shell bar to appear
    await page.waitForSelector('[data-testid="shell-bar"]', { visible: true, timeout: 15000 });

    // Find and click the Settings button (Material upgraded or plain)
    const selector = '[data-testid="shell-btn-settings"]';
    await page.waitForSelector(selector, { visible: true, timeout: 15000 });
    await page.click(selector);

    // Expect a WinBox window to appear; our host sets data-testid=winbox-settings when available
    // WinBox root uses .winbox by default; allow both
    const shown = await page.waitForFunction(() => {
      const wb = document.querySelector('[data-testid="winbox-settings"]') || document.querySelector('.winbox');
      return !!wb;
    }, { timeout: 15000 });
    expect(shown).toBeTruthy();
  });
});
