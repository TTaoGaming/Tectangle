// WEBWAY:ww-2025-131: WinBox factory consistency guard
const base = (process.env.SITE_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');
const url = (p) => `${base}${p.startsWith('/') ? '' : '/'}${p}`;

describe('WinBox factory consistency', () => {
  const pagePath = '/September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html?FEATURE_GSOS_SHELL_BAR=0';
  beforeAll(async () => { await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 }); });
  it('applies standard classes and markers to ALL app windows', async () => {
    await page.goto(url(pagePath), { waitUntil: 'networkidle0' });
    // wait for registry to be ready
    await page.waitForFunction(() => {
      try { const list = window.__gso?.getCards?.(); return Array.isArray(list) && list.length > 0; } catch { return false; }
    }, { timeout: 5000 });

    // Retrieve all cards and open each one via programmatic hook
    const cards = await page.evaluate(() => window.__gso?.getCards?.() || []);
    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBeGreaterThan(0);

    for (const card of cards) {
      await page.evaluate(async (id) => { await window.__gso?.openApp?.(id); }, card.id);
      await page.waitForSelector(`[data-testid="winbox-${card.id}"]`, { timeout: 6000 });
    }

    // verify every opened window body has consistent class and marker
    const info = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[data-testid^="winbox-"]'));
      return nodes.map(n => ({
        testid: n.getAttribute('data-testid') || '',
        marker: n.getAttribute('data-winbox-type'),
        rootClass: n.closest('.winbox')?.className || ''
      }));
    });

    // There should be at least as many winbox bodies as cards (some apps may reuse a window)
    expect(info.length).toBeGreaterThanOrEqual(cards.length);

    for (const i of info) {
      expect(['real','stub']).toContain(i.marker);
      expect(i.rootClass).toMatch(/\bwinbox\b/);
      expect(i.rootClass).toMatch(/\bwb-dark\b/);
    }
  });
});
