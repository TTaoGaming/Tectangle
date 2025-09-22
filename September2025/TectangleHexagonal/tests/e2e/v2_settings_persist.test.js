// Verify Settings persistence via hex settings service (localStorage adapter)

const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
const base = `http://localhost:${port}`;
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html`;

describe('v2 settings persistence', () => {
  it('persists cooldown and ghosts across reload', async () => {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="shell-btn-settings"]', { visible: true });
    await page.click('[data-testid="shell-btn-settings"]');
    await page.waitForSelector('[data-testid="winbox-settings"], .winbox', { visible: true, timeout: 15000 });

    // Set known values
    await page.waitForSelector('[data-testid="settings-cooldown"]', { visible: true });
    await page.click('[data-testid="settings-cooldown"]', { clickCount: 3 });
    await page.type('[data-testid="settings-cooldown"]', '1234');

    const ghostsSel = '[data-testid="settings-ghosts"]';
    const initialGhosts = await page.$eval(ghostsSel, el => el.checked);
    // Toggle ghosts
    await page.click(ghostsSel);
    await page.click('[data-testid="settings-apply"]');

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="shell-btn-settings"]', { visible: true });
    await page.click('[data-testid="shell-btn-settings"]');
    await page.waitForSelector('[data-testid="winbox-settings"], .winbox', { visible: true, timeout: 15000 });

    // Assert values restored
    const cooldown = await page.$eval('[data-testid="settings-cooldown"]', el => el.value);
    const ghosts = await page.$eval(ghostsSel, el => el.checked);
    expect(cooldown).toBe('1234');
    expect(ghosts).toBe(!initialGhosts);
  });
});
