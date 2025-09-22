#!/usr/bin/env node
import http from "http";
import { URL } from "url";
import CameraManager from "../August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/CameraManager.js";
import EventBus from "../August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/EventBusManager.js";

const PORT = Number(process.env.SMOKE_PORT || 4100);
const START_WIDTH = Number(process.env.SMOKE_WIDTH || 320);
const START_HEIGHT = Number(process.env.SMOKE_HEIGHT || 240);
const START_FPS = Number(process.env.SMOKE_FPS || 10);

const sseClients = new Set();

// Helper: broadcast JSON payload to all SSE clients with an event name
function broadcastSSE(eventName, payload) {
  const data = JSON.stringify({ event: eventName, payload });
  for (const res of Array.from(sseClients)) {
    try {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${data}\n\n`);
    } catch (err) {
      // remove on error
      try {
        res.end();
      } catch (e) {}
      sseClients.delete(res);
    }
  }
}

// Subscribe to EventBus events and forward to SSE clients
EventBus.addEventListener("camera:frame", (envelope) => {
  // envelope.detail is the frame payload when CameraManager used EventBus.publish('camera:frame', frame)
  const frame = envelope && envelope.detail ? envelope.detail : envelope;
  broadcastSSE("camera:frame", frame);
});

EventBus.addEventListener("camera:params", (envelope) => {
  const params = envelope && envelope.detail ? envelope.detail : envelope;
  broadcastSSE("camera:params", params);
});

// Instantiate CameraManager using the shared EventBus so events flow through it
const camera = new CameraManager({ eventBus: EventBus });

// Start camera with deterministic synthetic frames
(async () => {
  try {
    await camera.start({
      source: "synthetic",
      width: START_WIDTH,
      height: START_HEIGHT,
      fps: START_FPS,
    });
    console.log(
      `CameraManager started (synthetic) ${START_WIDTH}x${START_HEIGHT}@${START_FPS}fps`
    );
  } catch (err) {
    console.error("CameraManager start error", err);
  }
})();

// Simple HTTP + SSE server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Helper to set CORS headers for non-SSE responses (preflight + simple requests)
  function setCorsHeaders() {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  // Handle preflight early
  if (req.method === "OPTIONS") {
    setCorsHeaders();
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    setCorsHeaders();
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(
      [
        "Smoke harness for CameraManager",
        "",
        "Endpoints:",
        "  GET  /events        -> Server-Sent Events stream of camera:params and camera:frame",
        "  POST /reconfigure   -> JSON body {width,height,fps} to call camera.reconfigure(...)",
        "  GET  /status        -> JSON status & current params",
        "",
        `Listening on port ${PORT}`,
      ].join("\n")
    );
    return;
  }

  if (req.method === "GET" && url.pathname === "/events") {
    // SSE connection - keep event-stream headers (include CORS via ACAO)
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });
    res.write("\n");
    sseClients.add(res);
    req.on("close", () => {
      sseClients.delete(res);
    });
    return;
  }

  if (
    (req.method === "POST" || req.method === "PUT") &&
    url.pathname === "/reconfigure"
  ) {
    setCorsHeaders();
    let body = "";
    for await (const chunk of req) body += chunk;
    let payload = {};
    try {
      payload = JSON.parse(body || "{}");
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "invalid json" }));
      return;
    }

    try {
      if (typeof camera.reconfigure !== "function") {
        throw new Error("camera.reconfigure not implemented");
      }
      await camera.reconfigure(payload);
      // success response
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, params: payload }));
      // CameraManager emits camera:params and camera:frame which will be forwarded via EventBus subscription
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    }
    return;
  }

  if (req.method === "GET" && url.pathname === "/status") {
    setCorsHeaders();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        running: !!camera._running,
        params: camera._params || null,
      })
    );
    return;
  }

  // default 404
  setCorsHeaders();
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`Smoke harness listening at http://localhost:${PORT}`);
  console.log(
    "SSE: /events   POST /reconfigure {width,height,fps}   GET /status"
  );
});
