/**
 * v7 UI contract tests: drawer open/close behavior must be reliable.
 */

const SITE_BASE = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT||8080}`;
const PAGE = '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html';

async function isOpen(page){
  return await page.evaluate(() => {
    const d = document.getElementById('bottomDrawer');
    const s = document.getElementById('drawerScrim');
    return !!(d && s && d.dataset.open === '1' && s.dataset.open === '1');
  });
}

describe('v7 | Drawer UI contract', () => {
  it('opens via toolbar button and via FAB; state reflects correctly', async () => {
    const url = `${SITE_BASE}${PAGE}`; // defaults to drawer mode now
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Toolbar button should be visible by default; click to open
    await page.waitForSelector('[data-test-id="btn-open-panel-toolbar"]', { visible: true });
    await page.click('[data-test-id="btn-open-panel-toolbar"]');
    await page.waitForFunction(() => document.getElementById('bottomDrawer')?.dataset.open === '1');
    expect(await isOpen(page)).toBe(true);

  // Close by clicking scrim
    await page.click('[data-test-id="drawer-scrim"]');
  await page.waitForFunction(() => document.getElementById('bottomDrawer')?.dataset.open === '0');
  await page.evaluate(() => new Promise(r => setTimeout(r, 200))); // allow transition to settle
    expect(await isOpen(page)).toBe(false);

    // Open via FAB
  await page.waitForSelector('[data-test-id="btn-open-panel-fab"]', { visible: true });
  await page.click('[data-test-id="btn-open-panel-fab"]');
  await page.waitForFunction(() => document.getElementById('bottomDrawer')?.dataset.open === '1');
  await page.evaluate(() => new Promise(r => setTimeout(r, 120)));
    expect(await isOpen(page)).toBe(true);

  // Idempotent open: clicking again keeps it open
  await page.click('[data-test-id="btn-open-panel-fab"]');
  await page.evaluate(() => new Promise(r => setTimeout(r, 120)));
    expect(await isOpen(page)).toBe(true);
  }, 45000);
});
