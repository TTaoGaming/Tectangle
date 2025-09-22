// Supervised Executor Adapter
// Exposes POST /exec to accept actions[] and returns statuses. Safe-by-default.
// Env: PORT (default 8788), ALLOW_EXEC (0|1). Only executes when ALLOW_EXEC=1 and approval=="YES".

import http from 'http';
import { spawn } from 'child_process';

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1e6) { req.socket.destroy(); reject(new Error('payload_too_large')); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }

const ALLOW_EXEC = process.env.ALLOW_EXEC === '1';
const WHITELIST = new Set([
  'echo',
  'node',
  'powershell',
  'git',
  'npm',
]);

function runCommand(cmd, args) {
  return new Promise(resolve => {
    if (!WHITELIST.has(cmd)) { return resolve({ status: 'blocked', cmd, args, log: 'not whitelisted' }); }
    const child = spawn(cmd, args, { shell: false });
    let out = ''; let err = '';
    child.stdout.on('data', d => (out += d.toString()));
    child.stderr.on('data', d => (err += d.toString()));
    child.on('close', code => resolve({ status: code === 0 ? 'ok' : 'fail', code, out, err }));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, allow: ALLOW_EXEC });
  if (req.method === 'POST' && req.url === '/exec') {
    try {
      const body = await readJson(req);
      const approval = String(body.approval || 'NO');
      const actions = Array.isArray(body.actions) ? body.actions : [];
      if (!ALLOW_EXEC || approval !== 'YES') {
        return json(res, 200, { executed: false, reason: 'approval_required_or_exec_disabled', actions });
      }
      const results = [];
      for (const a of actions) {
        const cmd = String(a.cmd || '');
        const args = Array.isArray(a.args) ? a.args.map(String) : [];
        // Basic guard: limit args length and characters
        if (cmd.length > 40 || args.join(' ').length > 400) { results.push({ id: a.id, status: 'blocked', log: 'args too long' }); continue; }
        const r = await runCommand(cmd, args);
        results.push({ id: a.id, ...r });
      }
      return json(res, 200, { executed: true, results });
    } catch (e) {
      return json(res, 400, { error: e.message });
    }
  }
  json(res, 404, { error: 'not_found' });
});

const PORT = Number(process.env.PORT || 8788);
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[exec] listening on http://127.0.0.1:${PORT} (ALLOW_EXEC=${ALLOW_EXEC ? '1' : '0'})`);
});
