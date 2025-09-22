/**
 * v7: Toolbar drawer snapshot (non-baseline) — capture PNG for human review.
 */

const fs = require('node:fs/promises');
const path = require('path');

const SITE_BASE = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT||8080}`;
const PAGE = '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v7_material.html';
const CLIP = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

const outDir = 'September2025/TectangleHexagonal/out/visual';
function safeName(p){ return p.replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,''); }
const actual = path.join(outDir, `actual.${safeName(PAGE)}.v7_toolbar_drawer_open.png`);

async function ensureDir(p){ try{ await fs.mkdir(p, { recursive: true }); }catch{} }

describe('v7 | Toolbar drawer snapshot (ad-hoc)', () => {
  it('opens drawer via toolbar and saves a screenshot', async () => {
    await ensureDir(outDir);
    const url = `${SITE_BASE}${PAGE}?panel=drawer&panel_btn=1&autostart=1&clip=${encodeURIComponent(CLIP)}`;
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    await page.waitForFunction(() => {
      const el = document.getElementById('e2eReady');
      return el && el.dataset.ready === '1';
    }, { timeout: 45000 });

    await page.waitForSelector('#btnPanelToolbar', { visible: true });
    await page.click('#btnPanelToolbar');
    await page.waitForSelector('#bottomDrawer', { visible: true });

    await page.screenshot({ path: actual });
  }, 60000);
});
