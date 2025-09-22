// Verify WinBox renders with dark theme (no white-on-white)

const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
const base = `http://localhost:${port}`;
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html`;

describe('v2 shell OS dark theme', () => {
  it('Settings window has dark header/body colors', async () => {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="shell-btn-settings"]', { visible: true });
    await page.click('[data-testid="shell-btn-settings"]');
    // Wait for WinBox to mount
    await page.waitForSelector('[data-testid="winbox-settings"], .winbox', { visible: true, timeout: 15000 });

    const colors = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="winbox-settings"]') || document.querySelector('.winbox');
      if (!root) return null;
      const header = root.querySelector('.wb-header');
      const body = root.querySelector('.wb-body');
      const csHeader = header ? getComputedStyle(header) : null;
      const csBody = body ? getComputedStyle(body) : null;
      return {
        headerBg: csHeader ? csHeader.backgroundColor : null,
        bodyBg: csBody ? csBody.backgroundColor : null,
        bodyColor: csBody ? csBody.color : null,
      };
    });
    expect(colors).toBeTruthy();
    // Basic guards against white-on-white
    expect(colors.headerBg).not.toBe('rgb(255, 255, 255)');
    expect(colors.bodyBg).not.toBe('rgb(255, 255, 255)');
    expect(colors.bodyColor).not.toBe('rgb(255, 255, 255)');
  });
});
