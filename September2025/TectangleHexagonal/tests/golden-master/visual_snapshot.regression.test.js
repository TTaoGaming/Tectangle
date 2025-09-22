/*
WEBWAY:ww-2025-045: Demo-agnostic visual snapshot regression (expires 2025-10-09)
Goal: Capture a deterministic mid-clip screenshot and compare to a baseline. Configurable via env.
Env:
  SITE_BASE (default http://127.0.0.1:8080)
  PAGE_PATH (default /September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html)
  PAGE_PATH_V4 (optional) if set, will also capture a second PNG for v4 Material demo
  CLIP (default /September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4)
  SEEK_S (default 2.0)
  VIEWPORT (WxH, default 1280x720)
  SEATCFG (default 1 to show)
*/

const fs = require('node:fs/promises');
const path = require('node:path');

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const pagePath = process.env.PAGE_PATH || '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html';
const pagePathV4 = process.env.PAGE_PATH_V4 || '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v4_material.html';
const clip = process.env.CLIP || '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
const seekS = +(process.env.SEEK_S || 2.0);
const vp = (process.env.VIEWPORT || '1280x720').split('x').map(Number);
const seatcfg = (process.env.SEATCFG || '1') === '1';

const outDir = 'September2025/TectangleHexagonal/out/visual';
function safeName(p){ return p.replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,''); }
const baseline = path.join(outDir, `baseline.${safeName(pagePath)}.png`);
const actual = path.join(outDir, `actual.${safeName(pagePath)}.png`);

async function ensureDir(p){ try{ await fs.mkdir(p, { recursive: true }); }catch{} }

describe('Visual snapshot (demo-agnostic)', () => {
  it('matches baseline (or writes if missing)', async () => {
    await ensureDir(outDir);
    await page.setViewport({ width: vp[0]||1280, height: vp[1]||720 });
  const url = `${base}${pagePath}?${seatcfg?'seatcfg=1&':''}kalman=1&autostart=1&clip=${encodeURIComponent(clip)}`;
  // Note the page used in console for traceability
  // WEBWAY:ww-2025-049: Visual snapshot logs include HTML path
  // eslint-disable-next-line no-console
  console.log('Visual snapshot target:', pagePath);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('cam') && document.getElementById('cam').readyState >= 2);
  await page.evaluate((t)=>{ const v=document.getElementById('cam'); if(v) v.currentTime = t; }, seekS);
  await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: actual });

    // If no baseline, write it and pass
    let haveBaseline = true;
    try { await fs.access(baseline); } catch { haveBaseline = false; }
    if(!haveBaseline){ await fs.copyFile(actual, baseline); return; }

    // Simple byte-size assertion (lightweight guard)
    const a = (await fs.stat(actual)).size; const b = (await fs.stat(baseline)).size;
    const delta = Math.abs(a - b);
    if(delta > Math.max(2000, 0.02*b)){
      throw new Error(`visual delta too large: size(actual)=${a}, size(baseline)=${b}`);
    }
  }, 30000);

  it('also writes a PNG for SDK v4 Material page', async () => {
    await ensureDir(outDir);
    await page.setViewport({ width: vp[0]||1280, height: vp[1]||720 });
    const urlV4 = `${base}${pagePathV4}?${seatcfg?'seatcfg=1&':''}autostart=1&clip=${encodeURIComponent(clip)}`;
    await page.goto(urlV4, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('cam') && document.getElementById('cam').readyState >= 2);
    await page.evaluate((t)=>{ const v=document.getElementById('cam'); if(v) v.currentTime = t; }, seekS);
    await new Promise(r => setTimeout(r, 600));
    const actualV4 = path.join(outDir, `actual.${safeName(pagePathV4)}.png`);
    await page.screenshot({ path: actualV4 });
    // eslint-disable-next-line no-console
    console.log('Saved v4 visual to', actualV4);
  }, 30000);
});
