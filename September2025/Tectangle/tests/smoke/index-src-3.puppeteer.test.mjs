import { startServer, stopServer } from './server.js';
import { strict as assert } from 'assert';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('index-src-3 smoke (puppeteer)', function() {
  this.timeout(20000);
  let server;
  let port;
  let browser;

  before(async function() {
    const res = await startServer({ root: process.cwd(), port: 0 });
    server = res.server;
    port = res.port;
  });

  after(async function() {
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    if (server) {
      await stopServer(server);
    }
  });

  it('loads page and reaches running or no hands detected', async function() {
    // If puppeteer is not installed, throw a clear message.
    let puppeteer;
    try {
      // dynamic import => allow test to fail with clear instruction if missing
      puppeteer = (await import('puppeteer')).default;
    } catch (err) {
      throw new Error('puppeteer is not installed. Install dev dependency with: npm i -D puppeteer');
    }

    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const url = `http://localhost:${port}/September2025/Tectangle/prototype/landmark-smooth/index-src-3.html`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait up to 12s for status element to contain 'running' or 'no hands detected' (case-insensitive)
    await page.waitForFunction(() => {
      const el = document.getElementById('status');
      if (!el) return false;
      const text = (el.textContent || '').toLowerCase();
      return text.includes('running') || text.includes('no hands detected');
    }, { timeout: 12000 });

    // Ensure output dir exists and save a screenshot
    const outDir = path.join(process.cwd(), 'September2025', 'Tectangle', 'tests', 'smoke', 'output');
    await fs.mkdir(outDir, { recursive: true });
    const outPath = path.join(outDir, 'index-src-3.png');
    await page.screenshot({ path: outPath });

    // Assert the awaited condition is indeed met
    const statusText = await page.evaluate(() => (document.getElementById('status') || { textContent: '' }).textContent || '');
    assert(/running/i.test(statusText) || /no hands detected/i.test(statusText), `Unexpected status: ${String(statusText)}`);
  });
});