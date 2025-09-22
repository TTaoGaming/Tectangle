const express = require('express');
const path = require('path');
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');

/**
 * createServer(options)
 * - options.port: 0 (random) or specific port
 * - options.root: folder to serve (defaults to this module dir)
 *
 * Returns an object with:
 * - start(): Promise resolving to { port }
 * - stop(): Promise
 * - port getter
 */
function createServer({ port = 0, root = path.join(__dirname) } = {}) {
  const app = express();

  // LiveReload server (optional; safe to use in tests)
  const lrServer = livereload.createServer({ exts: ['html', 'js', 'css'] });
  lrServer.watch(root);

  // Inject livereload script into served pages
  app.use(connectLivereload());

  // Serve static files
  app.use(express.static(root));

  let _server = null;

  return {
    start: () =>
      new Promise((resolve, reject) => {
        _server = app
          .listen(port)
          .on('listening', () => {
            const actualPort = _server.address().port;
            console.log(`dev-server: serving ${root} on http://localhost:${actualPort}`);
            resolve({ port: actualPort });
          })
          .on('error', (err) => {
            reject(err);
          });
      }),
    stop: () =>
      new Promise((resolve) => {
        if (!_server) {
          try {
            lrServer.close();
          } catch (e) {}
          return resolve();
        }
        _server.close(() => {
          try {
            lrServer.close();
          } catch (e) {}
          _server = null;
          resolve();
        });
      }),
    get port() {
      return _server ? _server.address().port : null;
    },
    // Expose internals for advanced test usage
    _app: app,
  };
}

module.exports = { createServer };

// CLI: start server if executed directly
if (require.main === module) {
  (async () => {
    const port = process.env.PORT ? Number(process.env.PORT) : 8000;
    const srv = createServer({ port });
    try {
      const res = await srv.start();
      console.log(`dev-server running on port ${res.port}. Press Ctrl+C to exit.`);
    } catch (e) {
      console.error('dev-server failed to start', e);
      process.exit(1);
    }
  })();
}