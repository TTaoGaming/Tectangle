// Simple static file server used by tests: startServer/stopServer
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

export async function startServer({ root = process.cwd(), port = 0 } = {}) {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(req.url.split('?')[0] || '/');
      let pathname = urlPath;
      if (pathname === '/') pathname = '/index.html';
      if (pathname.endsWith('/')) pathname += 'index.html';
      const safePath = path.normalize(path.join(root, pathname));
      if (!safePath.startsWith(path.normalize(root))) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      fs.stat(safePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
        const ext = path.extname(safePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', mime);
        const stream = fs.createReadStream(safePath);
        stream.on('error', () => {
          res.statusCode = 500;
          res.end('Server error');
        });
        stream.pipe(res);
      });
    } catch (e) {
      res.statusCode = 500;
      res.end('Server error');
    }
  });

  return new Promise((resolve, reject) => {
    server.listen(port, '127.0.0.1', () => {
      const addr = server.address();
      const actualPort = (addr && typeof addr === 'object' && addr.port) ? addr.port : port;
      resolve({ server, port: actualPort });
    });
    server.on('error', (err) => reject(err));
  });
}

export async function stopServer(server) {
  if (!server) return;
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}