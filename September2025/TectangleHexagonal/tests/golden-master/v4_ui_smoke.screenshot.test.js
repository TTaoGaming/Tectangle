/*
WEBWAY:ww-2025-048: v4 UI smoke (expires 2025-10-09)
Asserts key controls exist and captures a mid-clip screenshot.
*/

const fs = require('node:fs/promises');
const path = require('node:path');

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const pagePath = process.env.V4_PAGE || '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v4_material.html';
const clip = process.env.CLIP || '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
const vp = (process.env.VIEWPORT || '1280x720').split('x').map(Number);

const outDir = 'September2025/TectangleHexagonal/out/visual';

async function ensureDir(p){ try{ await fs.mkdir(p, { recursive: true }); }catch{} }

describe('UI smoke v4 (Material)', () => {
  it('shows controls and saves screenshot', async () => {
    await ensureDir(outDir);
    await page.setViewport({ width: vp[0]||1280, height: vp[1]||720 });
    const url = `${base}${pagePath}?seatcfg=1&autostart=1&clip=${encodeURIComponent(clip)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btnStart');
    await page.waitForSelector('#kalman');
    await page.waitForSelector('#seatcfg');
    // seek to 2s
    await page.waitForFunction(() => document.getElementById('cam') && document.getElementById('cam').readyState >= 2);
    await page.evaluate(()=>{ const v=document.getElementById('cam'); if(v) v.currentTime = 2.0; });
    await new Promise(r=>setTimeout(r, 500));
    await page.screenshot({ path: path.join(outDir, 'ui.v4.headful.2s.png') });
  }, 30000);
});
