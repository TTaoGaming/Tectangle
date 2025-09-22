// Jest-Puppeteer: capture bottom bar screenshots and click buttons
const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
const base = `http://localhost:${port}`;
const pageUrl = `${base}/September2025/TectangleHexagonal/dev/gesture_shell_os_v1.html`;

async function snap(name){
  const buf = await page.screenshot({ fullPage:false, clip: await bottomBarClip() });
  // eslint-disable-next-line no-undef
  const fs = require('fs'); const path=require('path');
  const dir = path.join(process.cwd(), 'tests', 'artifacts', 'screens');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name + '.png'), buf);
}
async function bottomBarClip(){
  const handle = await page.$('[data-testid="shell-bar"]');
  const box = await handle.boundingBox();
  return { x: Math.max(0, box.x-8), y: Math.max(0, box.y-8), width: Math.min(box.width+16, page.viewport().width), height: Math.min(box.height+16, page.viewport().height) };
}

describe('GSOS shell bar screenshots', () => {
  beforeAll(async () => {
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="shell-bar"]', { timeout: 10000 });
  });

  it('captures default bottom bar', async () => {
    await snap('shell-bar-default');
  });

  it('opens a few apps and captures bar state', async () => {
    // Click some buttons
    const ids = ['xstate','mediapipe','seats','settings'];
    for (const id of ids) {
      await page.click(`[data-testid="shell-btn-${id}"]`);
      await new Promise(r => setTimeout(r, 200));
    }
    await snap('shell-bar-after-clicks');
  });
});
