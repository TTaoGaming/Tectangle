const path = require('path');
const fs = require('fs');
const assert = require('assert');
const puppeteer = require('puppeteer');
const { createServer } = require('../dev-server');

describe('modular-index integration', function () {
  this.timeout(60000); // allow time for downloads / wasm init

  it('initializes MediaPipe Hands without loader/wasm errors', async function () {
    const root = path.join(__dirname, '..');
    const server = createServer({ port: 0, root });
    const { port } = await server.start();

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-webassembly-simd',
        '--disable-dev-shm-usage',
      ],
    });

    const page = await browser.newPage();
    const consoleMsgs = [];

    page.on('console', (msg) => {
      try {
        consoleMsgs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
      } catch (e) {
        consoleMsgs.push('CONSOLE: ' + String(msg));
      }
    });
    page.on('pageerror', (err) => {
      consoleMsgs.push('PAGE_ERROR: ' + err.toString());
    });

    const url = `http://localhost:${port}/index.html`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Trigger pipeline init (loads MediaPipe assets / wasm)
    const initRes = await page.evaluate(async () => {
      if (window.__TEST_PIPELINE && window.__TEST_PIPELINE.initOnly) {
        try {
          return await window.__TEST_PIPELINE.initOnly();
        } catch (e) {
          return { ok: false, err: String(e) };
        }
      } else {
        return { ok: false, err: 'no test hook (window.__TEST_PIPELINE.initOnly)' };
      }
    });

    // Wait briefly for any async loader console messages to appear
    await page.waitForTimeout(4000);

    // Ensure test-output exists and persist logs
    const outputDir = path.join(root, 'test-output');
    try { fs.mkdirSync(outputDir); } catch (e) {}

    fs.writeFileSync(path.join(outputDir, 'console.log'), consoleMsgs.join('\n'), 'utf8');
    fs.writeFileSync(path.join(outputDir, 'initResult.json'), JSON.stringify(initRes, null, 2), 'utf8');

    if (!initRes || !initRes.ok) {
      await page.screenshot({ path: path.join(outputDir, 'init-failed.png'), fullPage: true });
      await browser.close();
      await server.stop();
      assert.fail('pipeline.initOnly failed: ' + (initRes && initRes.err ? initRes.err : 'unknown'));
    }

    // Search console for known bad signatures
    const errorPatterns = [
      /Cannot read properties of undefined/,
      /hands_solution_packed_assets_loader/,
      /\bAborted\b/,
      /Assertion failed/,
      /Module\.arguments has been replaced/,
      /Uncaught TypeError/,
      /hands_solution_simd_wasm_bin/,
    ];

    const found = consoleMsgs.filter((line) => errorPatterns.some((re) => re.test(line)));

    if (found.length > 0) {
      await page.screenshot({ path: path.join(outputDir, 'failure.png'), fullPage: true });
      fs.writeFileSync(path.join(outputDir, 'errors.json'), JSON.stringify(found, null, 2), 'utf8');
      await browser.close();
      await server.stop();
      assert.fail('Found MediaPipe loader/wasm errors: ' + found.join(' | '));
    }

    // Save a success screenshot for manual inspection
    await page.screenshot({ path: path.join(outputDir, 'success.png'), fullPage: true });

    await browser.close();
    await server.stop();

    assert.ok(true);
  });
});