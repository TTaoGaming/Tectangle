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

import http from 'http';
import handler from 'serve-handler';
import puppeteer from 'puppeteer';

const PORT = 8083;
const ORIGIN = `http://127.0.0.1:${PORT}`;

async function main(){
  const server = http.createServer((request, response) => handler(request, response, { public: '.' }));
  await new Promise(r => server.listen(PORT, r));
  let browser;
  try{
    browser = await puppeteer.launch({ headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`${ORIGIN}/September2025/TectangleHexagonal/dev/pinch_flappy.html`);
  await page.waitForSelector('iframe#game');
  const gameHandle = await page.$('iframe#game');
  const vendorFrame = await gameHandle.contentFrame();
  if(!vendorFrame) throw new Error('Vendor frame not found');
    await vendorFrame.evaluate(() => { try{ window.focus(); document.body.focus(); }catch{} });
    const send = (key, action) => page.evaluate((key, action)=>{ window.postMessage({ source:'hex', type:'pinch-key', key, action }, '*'); }, key, action);
    const base = await vendorFrame.evaluate(() => ({ d: window.__counts?.downs||0, u: window.__counts?.ups||0 }));
    const seq = [['Z','down'],['Z','up'],['X','down'],['X','up'],['Z','down'],['Z','up'],['X','down'],['X','up']];
    for(const [k,a] of seq){ await send(k,a); }
  await new Promise(r=>setTimeout(r,150));
    const after = await vendorFrame.evaluate(() => ({ d: window.__counts?.downs||0, u: window.__counts?.ups||0, seq:[...(window.__counts?.seq||[])] }));
    const tail = after.seq.slice(-8).map(e => `${e.key}:${e.type}`);
    const ok = (after.d - base.d)===4 && (after.u - base.u)===4 && JSON.stringify(tail)===JSON.stringify(['Z:down','Z:up','X:down','X:up','Z:down','Z:up','X:down','X:up']);
    console.log(ok? 'PASS pinch-to-vendor deterministic bridge' : 'FAIL pinch-to-vendor deterministic bridge');
    if(!ok){
      console.log('after:', after);
      process.exitCode = 1;
    }
  }catch(err){
    console.error('ERROR:', err?.stack||String(err));
    process.exitCode = 1;
  }finally{
    try{ await browser?.close(); }catch{}
    await new Promise(r => server.close(r));
  }
}

main();
