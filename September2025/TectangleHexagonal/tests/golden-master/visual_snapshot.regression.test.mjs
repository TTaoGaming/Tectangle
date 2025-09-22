/*
WEBWAY:ww-2025-045: Demo-agnostic visual snapshot regression (expires 2025-09-25)
Goal: Capture a deterministic mid-clip screenshot and compare to a baseline. Configurable via env.
Env:
  SITE_BASE (default http://127.0.0.1:8080)
  PAGE_PATH (default /September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html)
  CLIP (default /September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4)
  SEEK_S (default 2.0)
  VIEWPORT (WxH, default 1280x720)
  SEATCFG (default 1 to show)
*/

import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const pagePath = process.env.PAGE_PATH || '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html';
const clip = process.env.CLIP || '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
const seekS = +(process.env.SEEK_S || 2.0);
const vp = (process.env.VIEWPORT || '1280x720').split('x').map(Number);
const seatcfg = (process.env.SEATCFG || '1') === '1';

const outDir = 'September2025/TectangleHexagonal/out/visual';
const baseline = path.join(outDir, 'baseline.v3.png');
const actual = path.join(outDir, 'actual.v3.png');

async function ensureDir(p){ try{ await fs.mkdir(p, { recursive: true }); }catch{} }

async function launch(){
  // Default to headless in CI; allow local headful by setting HEADLESS=0
  const headless = process.env.HEADLESS ? (process.env.HEADLESS !== '0') : !!process.env.CI;
  return puppeteer.launch({ headless, args: ['--autoplay-policy=no-user-gesture-required','--no-sandbox','--disable-setuid-sandbox'] });
}

describe('Visual snapshot (demo-agnostic)', () => {
  it('matches baseline (or writes if missing)', async () => {
    await ensureDir(outDir);
    const browser = await launch();
    const page = await browser.newPage();
    await page.setViewport({ width: vp[0]||1280, height: vp[1]||720 });
    const url = `${base}${pagePath}?${seatcfg?'seatcfg=1&':''}kalman=1&autostart=1&clip=${encodeURIComponent(clip)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('cam') && document.getElementById('cam').readyState >= 2);
    await page.evaluate((t)=>{ const v=document.getElementById('cam'); if(v) v.currentTime = t; }, seekS);
    await page.waitForTimeout(600);
    await page.screenshot({ path: actual });
    await browser.close();

    // If no baseline, write it and pass
    let haveBaseline = true;
    try { await fs.access(baseline); } catch { haveBaseline = false; }
    if(!haveBaseline){ await fs.copyFile(actual, baseline); return; }

    // Simple byte-size assertion (lightweight guard); recommend pixel-diff addon next
    const a = (await fs.stat(actual)).size; const b = (await fs.stat(baseline)).size;
    const delta = Math.abs(a - b);
    if(delta > Math.max(2000, 0.02*b)){
      throw new Error(`visual delta too large: size(actual)=${a}, size(baseline)=${b}`);
    }
  });
});
