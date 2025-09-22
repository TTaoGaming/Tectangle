/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Run this test with the latest September2025 build
 - [ ] Log decisions in TODO_2025-09-16.md
*/

import puppeteer from 'puppeteer';
import http from 'http';
import handler from 'serve-handler';

const PORT = 8083;
const ORIGIN = `http://127.0.0.1:${PORT}`;

describe('Pinch-to-Game bridge', () => {
  let server; let browser; let page;

  beforeAll(async () => {
    server = http.createServer((request, response) => handler(request, response, { public: '.' }));
    await new Promise(r => server.listen(PORT, r));
    browser = await puppeteer.launch({ headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
    page = await browser.newPage();
  }, 30000);

  afterAll(async () => {
    try { await browser?.close(); } catch {}
    await new Promise(r => server.close(r));
  });

  it('forwards Z/X down/up deterministically into vendor harness', async () => {
    await page.goto(`${ORIGIN}/September2025/TectangleHexagonal/dev/pinch_flappy.html`);
    // Wait for both iframes
    const frames = () => page.frames();
    await page.waitForFunction(() => document.querySelectorAll('iframe').length >= 2);

    // Locate vendor frame
    const vendorFrame = frames().find(f => f.url().includes('/vendor/flappy/index.html'));
    expect(vendorFrame).toBeTruthy();

    // Ensure vendor is focused
    await vendorFrame.evaluate(() => { try{ window.focus(); document.body.focus(); }catch{} });

    // Post synthetic pinch-key messages from page to trigger bridge
    const send = async (key, action) => {
      await page.evaluate((key, action) => {
        window.postMessage({ source: 'hex', type:'pinch-key', key, action }, '*');
      }, key, action);
    };

    // Baseline counts
    const base = await vendorFrame.evaluate(() => ({ d: window.__counts?.downs||0, u: window.__counts?.ups||0 }));

    // Sequence: Z down/up, X down/up (repeat twice)
    const seq = [['Z','down'],['Z','up'],['X','down'],['X','up'],['Z','down'],['Z','up'],['X','down'],['X','up']];
    for(const [k,a] of seq){ await send(k,a); }

    // Read counts after a short settle
    await page.waitForTimeout(150);
    const after = await vendorFrame.evaluate(() => ({ d: window.__counts?.downs||0, u: window.__counts?.ups||0, seq:[...(window.__counts?.seq||[])] }));

    expect(after.d - base.d).toBe(4); // four downs
    expect(after.u - base.u).toBe(4); // four ups
    // Deterministic order check
    const tail = after.seq.slice(-8).map(e => `${e.key}:${e.type}`);
    expect(tail).toEqual(['Z:down','Z:up','X:down','X:up','Z:down','Z:up','X:down','X:up']);
  }, 30000);
});
