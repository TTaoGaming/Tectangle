// WEBWAY:ww-2025-058: allow opting into test server reuse on CI
const port = Number(process.env.E2E_PORT || process.env.PORT || 8091);
const headless = (process.env.HEADLESS === '0' || process.env.HEADFUL === '1') ? false : 'new';
const skipServer = process.env.E2E_SKIP_SERVER === '1';

const base = {
  launch: {
    headless,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-web-security',
      '--disable-gpu-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
    defaultViewport: { width: 1280, height: 800 },
  },
};

// If skipping, don't include a server section at all (reuse external server)
module.exports = skipServer
  ? base
  : {
      ...base,
      server: {
        // WEBWAY:ww-2025-058: prefer not to kill an existing server when E2E_REUSE_HTTP=1
        command: `npx http-server . -p ${port} -c-1`,
        port,
        launchTimeout: 30000,
        usedPortAction: process.env.E2E_REUSE_HTTP === '1' ? 'ignore' : 'kill',
        debug: false,
      },
    };
