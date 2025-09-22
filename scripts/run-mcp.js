#!/usr/bin/env node
import http from 'http';
import { URL } from 'url';

const PORT = process.env.MCP_PORT || 4000;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/tools') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tools: [] }));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/memory/graph') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ nodes: [], relations: [] }));
    return;
  }
  if (req.method === 'POST' && url.pathname === '/memory/create_entities') {
    let body = '';
    for await (const chunk of req) body += chunk;
    let payload = {};
    try { payload = JSON.parse(body || '{}'); } catch (e) { payload = {}; }
    const entities = payload.entities || [];
    console.log('MCP create_entities ->', entities.length);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, created: entities.length }));
    return;
  }
  if (req.method === 'POST' && url.pathname === '/call') {
    let body = '';
    for await (const chunk of req) body += chunk;
    let payload = {};
    try { payload = JSON.parse(body || '{}'); } catch (e) { payload = {}; }
    console.log('MCP call ->', payload.tool || payload);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'mocked', payload }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log(`Mock MCP server listening at http://localhost:${PORT}`);
});