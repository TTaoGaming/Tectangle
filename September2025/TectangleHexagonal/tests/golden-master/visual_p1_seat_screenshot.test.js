/*
WEBWAY:ww-2025-047: P1 seat screenshot (expires 2025-10-09)
Goal: When Player 1 seat is taken during the golden two-pinch sequence, capture a timestamped screenshot into tests/screenshots.
*/

const fs = require('node:fs/promises');
const path = require('node:path');

const base = process.env.SITE_BASE || 'http://127.0.0.1:8080';
const pagePath = process.env.PAGE_PATH || '/September2025/TectangleHexagonal/dev/demo_fullscreen_sdk_v3_kalman.html';
const clip = process.env.CLIP || '/September2025/TectangleHexagonal/videos/golden/golden.two_hands_pinch_seq.v1.mp4';
const vp = (process.env.VIEWPORT || '1280x720').split('x').map(Number);

const shotsDir = 'September2025/TectangleHexagonal/tests/screenshots';

async function ensureDir(p){ try{ await fs.mkdir(p, { recursive: true }); }catch{} }

function nowStamp(){ return new Date().toISOString().replace(/[:.]/g,'-'); }

async function waitForSeat(page, seatLabel='P1', timeoutMs=15000){
  const start = Date.now();
  while(Date.now()-start < timeoutMs){
    const seat = await page.evaluate((label)=>{
      try{
        const sdk = window.__sdk; if(!sdk) return null;
        const st = sdk.getState?.(); if(!st) return null;
        const rich = sdk.getRichSnapshot?.() || [];
        const used = new Set(rich.map(r=>r.seat).filter(Boolean));
        if(used.has(label)) return label;
        const seats = st.seats?.seats || st.seats || null;
        if(seats){ for(const s of Object.values(seats)){ if(s && s.seat === label && s.handId!=null) return label; }
        }
      }catch{}
      return null;
    }, seatLabel);
    if(seat===seatLabel) return true;
    await new Promise(r=>setTimeout(r, 100));
  }
  return false;
}

describe('P1 seat screenshot (golden two-pinch)', () => {
  it('captures screenshot when P1 seat is taken', async () => {
    await ensureDir(shotsDir);
    await page.setViewport({ width: vp[0]||1280, height: vp[1]||720 });
    const url = `${base}${pagePath}?seatcfg=1&kalman=1&autostart=1&clip=${encodeURIComponent(clip)}`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('cam') && document.getElementById('cam').readyState >= 2);

    const ok = await waitForSeat(page, 'P1', 20000);
    if(!ok){ throw new Error('Timed out waiting for P1 seat'); }

    const file = path.join(shotsDir, `p1_seat_${nowStamp()}.png`);
    await page.screenshot({ path: file });
  }, 30000);
});
