/**
 * Smoke test: integrated_hand_console_min.html
 * Goals:
 *  - Page loads without init or draw error.
 *  - HUD seat line becomes visible.
 *  - Video element present and metadata loads (width>0 or diagnostic points drawn after some frames).
 *  - Diagnostic global does not contain initError.
 */

import path from 'node:path';
import fs from 'node:fs';

const PAGE_REL = 'September2025/TectangleHexagonal/dev/integrated_hand_console_min.html';
const AUTOSTART_Q = '?autostart=1';

/** Helper to wait */
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

// Jest-Puppeteer style test (assumes jest-puppeteer config present)
// If not using jest-puppeteer yet, adjust runner accordingly.

describe('hand console min smoke', () => {
  beforeAll(async () => {
    const full = `http://localhost:8080/${PAGE_REL}${AUTOSTART_Q}`;
    await page.goto(full, { waitUntil: 'domcontentloaded' });
  });

  it('loads without init error', async () => {
    await sleep(600); // allow some frames & potential autostart
    const diag = await page.evaluate(() => globalThis.__minConsoleDiag || {});
    if(diag.initError){
      console.error('Init error diag', diag.initError);
    }
    expect(diag.initError).toBeUndefined();
  });

  it('draw loop advances (no persistent drawError)', async () => {
    const hadErr = await page.evaluate(() => (globalThis.__minConsoleDiag && globalThis.__minConsoleDiag.drawError) ? globalThis.__minConsoleDiag.drawError : null);
    expect(hadErr).toBeNull();
  });

  it('HUD updates seat line text', async () => {
    const seatText = await page.$eval('#seatLine', el => el.textContent.trim());
    expect(seatText.startsWith('P1=')).toBe(true);
  });

  it('video element present', async () => {
    const dims = await page.evaluate(() => { const v=document.getElementById('cam'); return v? { w:v.videoWidth, h:v.videoHeight, ready:v.readyState } : null; });
    expect(dims).not.toBeNull();
  });
});
