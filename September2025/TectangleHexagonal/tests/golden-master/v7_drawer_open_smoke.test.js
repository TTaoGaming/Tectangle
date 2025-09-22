/**
 * v7: Drawer-open smoke. Ensures FAB opens drawer and drawer cards reflect live P1 telemetry.
 */

const SITE_BASE = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT||8080}`;
const PAGE = '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html';
const CLIP = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

async function openDrawer(page){
  await page.waitForSelector('#fabDrawer', { visible: true });
  await page.click('#fabDrawer');
  await page.waitForSelector('#bottomDrawer', { visible: true });
}

describe('v7 | Drawer open smoke', () => {
  it('opens the drawer and shows P1 card updates', async () => {
    const url = `${SITE_BASE}${PAGE}?autostart=1&clip=${encodeURIComponent(CLIP)}&probe=1&panel=drawer`;
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => {
      const el = document.getElementById('e2eReady');
      return el && el.dataset.ready === '1';
    }, { timeout: 45000 });

    await openDrawer(page);

    // Ensure drawer cards exist
    await page.waitForSelector('#p1CardBadge_d');
    await page.waitForSelector('#p1CardHand_d');

    const p1 = await page.evaluate(() => ({
      badge: document.getElementById('p1CardBadge_d')?.textContent || '',
      hand: document.getElementById('p1CardHand_d')?.textContent || '',
      fsm: document.getElementById('p1CardFsm_d')?.textContent || '',
      norm: document.getElementById('p1CardNorm_d')?.textContent || '',
    }));

    expect(p1.badge).toBe('1/1');
    expect(p1.hand && p1.hand !== '–').toBeTruthy();
    expect(p1.fsm && p1.fsm !== '–').toBeTruthy();
  }, 60000);
});
