/*
WEBWAY:ww-2025-044: Headful UI smoke with deterministic snapshot (expires 2025-09-25)
Purpose: Verify critical controls exist and Seat Config panel is visible when requested; capture screenshot at T=2.0s.
*/

import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const pinchClip = 'September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
const url = `${base}/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html?seatcfg=1&kalman=1&autostart=1&clip=/${pinchClip}`;

describe('v3 UI headful smoke', () => {
  it('renders controls and captures screenshot', async () => {
    const browser = await puppeteer.launch({ headless: false, args:['--autoplay-policy=no-user-gesture-required'] });
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // wait video and one hand frame if possible
    await page.waitForSelector('#btnStart');
    await page.waitForSelector('#btnPlayPinch');
    await page.waitForSelector('#kalman');
    await page.waitForSelector('#seatcfg');

    // Advance to ~2s of playback deterministically
    await page.waitForFunction(() => {
      const v = document.getElementById('cam');
      return v && v.readyState >= 2;
    });
    await page.evaluate(() => { const v=document.getElementById('cam'); if(v){ v.currentTime = 2.0; } });
    await page.waitForTimeout(500);

    // capture screenshot
    const shotPath = 'September2025/TectangleHexagonal/out/ui.v3.headful.2s.png';
    await page.screenshot({ path: shotPath, fullPage: false });
    await browser.close();

    // Assert file exists
    const st = await fs.stat(shotPath);
    if(!st || st.size < 1000){ throw new Error('screenshot too small or missing'); }
  });
});
