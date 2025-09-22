#!/usr/bin/env node
import http from "http";

const HOST = "localhost";
const PORT = Number(process.env.SMOKE_PORT || 4100);
const initialMs = 3000;
const postMs = 3000;

let buffer = "";
const events = [];

function parseSseChunks(chunk) {
  buffer += chunk;
  let idx;
  while ((idx = buffer.indexOf("\n\n")) !== -1) {
    const raw = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 2);
    if (!raw) continue;
    const lines = raw.split(/\r?\n/);
    let evName = null,
      dataLines = [];
    for (const line of lines) {
      if (line.startsWith("event:")) evName = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    const dataStr = dataLines.join("\n");
    let data;
    try {
      data = JSON.parse(dataStr);
    } catch (e) {
      data = dataStr;
    }
    events.push({ event: evName, data });
    console.log("SSE got", evName, dataStr);
  }
}

const req = http.request(
  {
    hostname: HOST,
    port: PORT,
    path: "/events",
    method: "GET",
    headers: { Accept: "text/event-stream" },
  },
  (res) => {
    res.setEncoding("utf8");
    res.on("data", parseSseChunks);
    res.on("end", () => console.log("SSE end"));
  }
);

req.on("error", (err) => {
  console.error("SSE request error", err);
  process.exit(1);
});

req.end();

console.log("Connected SSE to", `http://${HOST}:${PORT}/events`);

setTimeout(() => {
  const re = JSON.stringify({ width: 640, height: 480, fps: 5 });
  const postReq = http.request(
    {
      hostname: HOST,
      port: PORT,
      path: "/reconfigure",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(re),
      },
    },
    (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        console.log("POST /reconfigure response", res.statusCode, body);
      });
    }
  );
  postReq.on("error", (err) => {
    console.error("POST error", err);
  });
  postReq.write(re);
  postReq.end();
}, initialMs);

setTimeout(() => {
  try {
    req.abort();
  } catch (e) {}
  console.log("Captured events:", JSON.stringify(events, null, 2));
  const frames = events.filter((e) => e.event === "camera:frame");
  const params = events.filter((e) => e.event === "camera:params");
  console.log(`frames:${frames.length}, params:${params.length}`);
  process.exit(0);
}, initialMs + postMs + 500);
