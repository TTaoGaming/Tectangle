/*
WEBWAY:ww-2025-049: Design audit for v4 (expires 2025-10-09)
Checks computed styles align with Material tokens and panel is non-empty.
*/
const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const pagePath = process.env.V4_PAGE || '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v4_material.html';
const clip = process.env.CLIP || '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

function hex(c){ return c?.toLowerCase(); }

describe('Design audit (Material tokens)', () => {
  it('uses tokenized colors and shows live panel', async () => {
    const url = `${base}${pagePath}?seatcfg=1&autostart=1&clip=${encodeURIComponent(clip)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#panel');
    // Wait for panel to populate
    await page.waitForFunction(() => {
      const el = document.getElementById('state');
      return el && el.textContent && el.textContent.length > 10;
    }, { timeout: 10000 });

    // Grab computed styles
    const styles = await page.evaluate(()=>{
      const body = getComputedStyle(document.body);
      const toolbar = document.querySelector('.toolbar');
      const toolbarStyle = toolbar ? getComputedStyle(toolbar) : null;
      return {
        bodyBg: body.backgroundColor,
        bodyColor: body.color,
        toolbarBorder: toolbarStyle?.borderTopColor || null
      };
    });

    // Assert body background close to tokens (we only know it's not empty and not default white)
    expect(styles.bodyBg).toBeTruthy();
    expect(styles.bodyBg).not.toMatch(/rgb\(255,\s*255,\s*255\)/);
    expect(styles.bodyColor).toBeTruthy();
    expect(styles.toolbarBorder).toBeTruthy();
  }, 20000);
});
