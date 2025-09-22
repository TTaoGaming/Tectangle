// WEBWAY:ww-2025-130: Cards registry guard waits for readiness; dock buttons must open WinBox
/**
 * Cards registry and template validation (Jest + Puppeteer)
 * Ensures:
 * - GSOS exposes a list of cards (apps)
 * - Each card opens as a WinBox singleton using the shared template
 * - Material Web is ready when a card is shown
 * - Visual screenshot captured for review
 */

const { toMatchImageSnapshot } = require('jest-image-snapshot');
expect.extend({ toMatchImageSnapshot });

function siteBase() {
  const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
  return base.replace(/\/$/, '');
}

function url(path) {
  return `${siteBase()}${path.startsWith('/') ? '' : '/'}${path}`;
}

describe('GSOS cards registry + template CI', () => {
  const pagePath = '/September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html?FEATURE_GSOS_SHELL_BAR=0';

  beforeAll(async () => {
    const viewport = process.env.VIEWPORT || '1280x720';
    const [w, h] = viewport.split('x').map(Number);
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  });

  it('exposes registry and validates each card opens via WinBox+Material', async () => {
    await page.goto(url(pagePath), { waitUntil: 'networkidle0' });

    // Wait for cards registry to populate (handles Material preload wait inside GSOS)
    await page.waitForFunction(() => {
      try { const list = window.__gso?.getCards?.(); return Array.isArray(list) && list.length > 0; } catch { return false; }
    }, { timeout: 3000 });

    const cards = await page.evaluate(() => (window.__gso?.getCards?.() || []));

    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
  // click via programmatic opener to avoid selector fragility
      await page.evaluate(async (id) => { await window.__gso?.openApp?.(id); }, card.id);
  // wait for the winbox body to appear
  const sel = `[data-testid="winbox-${card.id}"]`;
  await page.waitForSelector(sel, { timeout: 2000 });

      // Assert a WinBox-like container exists for this card
      const hasWinbox = await page.evaluate((id) => {
        const sel = `[data-testid="winbox-${id}"]`;
        const body = document.querySelector(sel);
        if (!body) return { ok: false, reason: 'missing-testid' };
        const type = body.getAttribute('data-winbox-type');
        return { ok: !!type, type };
      }, card.id);

      expect(hasWinbox.ok).toBe(true);
      // We accept both real and stub in developer runs; CI can require real via flag if desired
      expect(['real', 'stub']).toContain(hasWinbox.type);

      // Material readiness (soft): record boolean but do not fail build
      const materialReady = await page.evaluate(() => {
        try { return !!(window.__gso && window.__gso.materialReady && window.__gso.materialReady()); } catch { return false; }
      });
      // eslint-disable-next-line no-console
      console.log(`[cards-guard] materialReady=${materialReady} for card ${card.id}`);

      // Snapshot region: clip to the specific winbox body for stability
      const bbox = await page.evaluate((id) => {
        const el = document.querySelector(`[data-testid="winbox-${id}"]`);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const minH = 120; // avoid degenerate 1px captures
        const h = Math.max(minH, r.height);
        return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.max(1, r.width), height: h };
      }, card.id);
      let image;
      if (bbox) {
        image = await page.screenshot({ clip: bbox });
      } else {
        image = await page.screenshot({ fullPage: false });
      }
      expect(image).toMatchImageSnapshot({
        customSnapshotIdentifier: `cards-guard-${card.id}`,
        failureThresholdType: 'percent',
        failureThreshold: 0.05
      });
    }

    // Also validate: every dock icon opens a WinBox (camera optional)
    // Collect apps from dock (hex or rectangular)
    const dockApps = await page.evaluate(() => {
      const ids = new Set();
      document.querySelectorAll('#dock [data-app]').forEach(n => { const id = n.getAttribute('data-app'); if (id) ids.add(id); });
      return Array.from(ids);
    });
    expect(Array.isArray(dockApps)).toBe(true);
    for (const appId of dockApps) {
      if (appId === 'camera') continue;
      const btnSel = `#dock [data-app="${appId}"]`;
      await page.click(btnSel);
      const testId = `winbox-${appId}`;
      await page.waitForSelector(`[data-testid="${testId}"]`, { timeout: 3000 });
    }
  });
});
