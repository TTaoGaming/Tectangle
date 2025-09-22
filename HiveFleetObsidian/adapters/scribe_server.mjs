// Minimal Scribe Webhook Adapter
// Exposes POST /scribe/append to call tools/append_history.mjs safely.
// Env: PORT (default 8787)

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const tools = path.join(repoRoot, 'HiveFleetObsidian', 'tools');

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) { req.socket.destroy(); reject(new Error('payload_too_large')); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, { ok: true });
  }
  if (req.method === 'POST' && req.url === '/scribe/append') {
    try {
      const body = await readJson(req);
      const snapshot = String(body.snapshot || 'dify:hfo');
      const metric = String(body.metric || 'n/a');
      const lesson = String(body.lesson || 'n/a');
      const type = String(body.type || 'turn');

      const script = path.join(tools, 'append_history.mjs');
      const args = [script, '--snapshot', snapshot, '--metric', metric, '--lesson', lesson, '--type', type];

      const child = spawn('node', args, { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      let err = '';
      child.stdout.on('data', d => (out += d.toString()));
      child.stderr.on('data', d => (err += d.toString()));
      child.on('close', code => {
        json(res, 200, { status: code === 0 ? 'ok' : 'fail', code, out, err });
      });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
    return;
  }
  json(res, 404, { error: 'not_found' });
});

const PORT = Number(process.env.PORT || 8787);
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[scribe] listening on http://127.0.0.1:${PORT}`);
});
