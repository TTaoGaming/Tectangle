/**
 * Visual snapshot for v6: verifies P1 lock-in HUD and Dino echo (Space key injection).
 * Assumes local static server; configure via SITE_BASE/E2E_PORT.
 */

const fs = require('node:fs/promises');
const path = require('path');

const SITE_BASE = process.env.SITE_BASE || `http://127.0.0.1:${process.env.E2E_PORT||8080}`;
const VISUAL_UPDATE = process.env.VISUAL_UPDATE === '1';
const PAGE = '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v6_material.html';
const CLIP = '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';

const outDir = 'September2025/TectangleHexagonal/out/visual';
function safeName(p){ return p.replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,''); }
const baseline = path.join(outDir, `baseline.${safeName(PAGE)}.v6_p1_lock_dino_echo.png`);
const actual = path.join(outDir, `actual.${safeName(PAGE)}.v6_p1_lock_dino_echo.png`);

async function ensureDir(p){ try{ await fs.mkdir(p, { recursive: true }); }catch{} }

describe('v6 | P1 lock + Dino echo', () => {
  it('shows P1 lock and records Dino echo', async () => {
    await ensureDir(outDir);
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
    const url = `${SITE_BASE}${PAGE}?autostart=1&clip=${encodeURIComponent(CLIP)}&probe=1`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for ready sentinel requiring P1 and at least one dino echo
    await page.waitForFunction(() => {
      const el = document.getElementById('e2eReady');
      return el && el.dataset.ready === '1';
    }, { timeout: 45000 });

    // HUD badges appear
    await page.waitForSelector('#p1Badge');
    await page.waitForSelector('#p2Badge');

    // Extract lock and dino echo counts
    const diag = await page.evaluate(() => ({
      lock: window.__lockSummary && window.__lockSummary(),
      echo: (window.__diag && window.__diag.dinoEcho) || 0,
    }));

    expect(diag.lock.P1).toBeTruthy();
    expect(diag.echo).toBeGreaterThanOrEqual(1);

    // Snapshot to file and compare byte-size with baseline
    await page.screenshot({ path: actual });
    let haveBaseline = true;
    try { await fs.access(baseline); } catch { haveBaseline = false; }
    if(!haveBaseline){ await fs.copyFile(actual, baseline); return; }

    const a = (await fs.stat(actual)).size; const b = (await fs.stat(baseline)).size;
    const delta = Math.abs(a - b);
    const limit = Math.max(2000, 0.02*b);
    if(delta > limit){
      if(VISUAL_UPDATE){
        await fs.copyFile(actual, baseline);
        // eslint-disable-next-line no-console
        console.log('[visual] baseline updated due to VISUAL_UPDATE=1');
      } else {
        throw new Error(`visual delta too large: size(actual)=${a}, size(baseline)=${b}`);
      }
    }
  }, 60000);
});
