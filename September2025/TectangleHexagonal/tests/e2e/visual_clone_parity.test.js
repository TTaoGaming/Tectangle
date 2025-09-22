/**
 * Visual parity: GSOS clone should match v2 layout and HUD at rest.
 * - We hide the live video element to make frames stable and focus on overlay/HUD/UI.
 * - Baseline is produced from v2; GSOS is compared against that.
 */

const base = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT || '8091'}`;

describe('visual parity: v2 vs GSOS', () => {
  const hasSnapshot = !!global.__IMG_SNAPSHOT__;

  const v2Url = base + '/September2025/TectangleHexagonal/dev/camera_landmarks_wrist_label_v2.html?FEATURE_SEAT_OPEN_CALIB=0';
  const gsosUrl = base + '/September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html?FEATURE_SEAT_OPEN_CALIB=0';

  async function ready(url) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Wait for hud/fps visible
    await page.waitForSelector('#hud');
    // Let one frame render
    await page.waitForFunction(() => {
      const fpsEl = document.getElementById('fps');
      const fps = parseFloat(fpsEl?.textContent || '0') || 0;
      return fps >= 0; // allow 0 since video is hidden below
    }, { timeout: 10000 });
    // Hide the live video to reduce frame variability; keep overlay/HUD
    await page.addStyleTag({ content: '#video{visibility:hidden !important}' });
  }

  (hasSnapshot ? it : it.skip)('freeze: v2 baseline (#stage)', async () => {
    await ready(v2Url);
    const handle = await page.$('#stage');
    const image = await handle.screenshot({ omitBackground: false });
    expect(image).toMatchImageSnapshot({ customSnapshotIdentifier: 'v2_stage_baseline' });
  });

  (hasSnapshot ? it : it.skip)('diff: GSOS matches v2 baseline (#stage)', async () => {
    await ready(gsosUrl);
    const handle = await page.$('#stage');
    const image = await handle.screenshot({ omitBackground: false });
    expect(image).toMatchImageSnapshot({ customSnapshotIdentifier: 'v2_stage_baseline' });
  });
});
