/*
Visual snapshot for SDK v5 (Dino sidecar docked for P1)
Asserts key controls exist, hysteresis strips render, and captures a mid-clip screenshot.
*/

const fs = require('node:fs/promises');
const path = require('node:path');

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const pagePath = '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v5_material.html';
const clip = process.env.CLIP || '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
const seekS = +(process.env.SEEK_S || 2.0);
const vp = (process.env.VIEWPORT || '1280x720').split('x').map(Number);

const outDir = 'September2025/TectangleHexagonal/out/visual';
function safeName(p){ return p.replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,''); }
const baseline = path.join(outDir, `baseline.${safeName(pagePath)}.v5_dino.png`);
const actual = path.join(outDir, `actual.${safeName(pagePath)}.v5_dino.png`);

async function ensureDir(p){ try{ await fs.mkdir(p, { recursive: true }); }catch{} }

describe('SDK v5 Dino UI snapshot', () => {
  it('shows controls, strips, and matches baseline', async () => {
    await ensureDir(outDir);
    await page.setViewport({ width: vp[0]||1280, height: vp[1]||720 });
    const url = `${base}${pagePath}?dino=1&seat=P1&autostart=1&clip=${encodeURIComponent(clip)}`;
    // eslint-disable-next-line no-console
    console.log('Visual snapshot target (v5 Dino):', pagePath);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Buttons present
    await page.waitForSelector('#btnStart');
    await page.waitForSelector('#btnStop');
    await page.waitForSelector('#btnPlayPinch');
    await page.waitForSelector('#btnPlayIdle');
    await page.waitForSelector('#btnLaunchDino');
    await page.waitForSelector('#kalman'); // tray container

    // Video ready and seek
    await page.waitForFunction(() => document.getElementById('cam') && document.getElementById('cam').readyState >= 2);
    await page.evaluate((t)=>{ const v=document.getElementById('cam'); if(v) v.currentTime = t; }, seekS);

    // Wait for hysteresis strips to appear (ensureStrip creates rows under #strips)
    await page.waitForFunction(() => {
      const el = document.getElementById('strips');
      if(!el) return false;
      const rows = el.querySelectorAll('[data-strip]');
      return rows && rows.length >= 1;
    }, { timeout: 15000 });

    // Dino iframe should be visible (auto-docked when dino=1 and not launch=1)
    await page.waitForFunction(() => {
      const f = document.getElementById('dino');
      return !!(f && (f.style.display!== 'none'));
    }, { timeout: 10000 });

    // Small settle for visuals
    await new Promise(r => setTimeout(r, 500));
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
  }, 45000);
});
