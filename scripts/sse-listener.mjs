#!/usr/bin/env node
import http from "http";

const HOST = process.env.SMOKE_HOST || "localhost";
const PORT = Number(process.env.SMOKE_PORT || 4100);

let buffer = "";
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
    res.on("end", () => {
      console.log("SSE end");
      process.exit(0);
    });
  }
);

req.on("error", (err) => {
  console.error("SSE request error", err);
  process.exit(1);
});

req.end();
console.log("Connected SSE to", `http://${HOST}:${PORT}/events`);
