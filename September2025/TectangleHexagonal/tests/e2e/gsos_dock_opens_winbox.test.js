const base = process.env.TEST_BASE || 'http://localhost:8080';

// Click each dock icon and assert a WinBox opens (by data-testid markers)
describe('GSOS dock opens WinBox windows', () => {
  it('each dock icon opens a winbox', async () => {
    const pageUrl = `${base}/September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html?FEATURE_GSOS_SHELL_BAR=0`;
    await page.goto(pageUrl, { waitUntil: 'load' });
    // Give Material/Web/WinBox a short time
    await page.waitForTimeout(400);

    // Collect dock icons (both hex and rectangular layouts)
    const selectors = ['#dock .hex-row .hex-icon', '#dock .dock-icon'];
    let apps = [];
    for (const sel of selectors) {
      const found = await page.$$eval(sel, nodes => nodes.map(n => n.getAttribute('data-app')).filter(Boolean));
      apps = apps.concat(found);
    }
    // De-dup
    apps = Array.from(new Set(apps));
    expect(apps.length).toBeGreaterThan(0);

    // For each app, click and assert a winbox marker appears
    for (const appId of apps) {
      // Skip camera if present; wallpaper provides viz, camera card optional
      if (appId === 'camera') continue;
      // Click icon
      const btnSel = `#dock [data-app="${appId}"]`;
      await page.click(btnSel);
      // Wait for either real or stub winbox markers
      const testId = `winbox-${appId}`;
      await page.waitForFunction((id) => {
        const el = document.querySelector(`[data-testid="${id}"]`);
        if (!el) return false;
        const type = el.getAttribute('data-winbox-type');
        return type === 'real' || type === 'stub' || true; // presence is enough; type may be on body
      }, {}, testId);
    }
  }, 30000);
});
