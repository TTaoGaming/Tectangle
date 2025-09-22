#!/usr/bin/env node
import http from "http";
import fs from "fs";

const HOST = process.env.SMOKE_HOST || "localhost";
const PORT = Number(process.env.SMOKE_PORT || 4100);

const pathArg = process.argv[2] || "/";
const payloadFile = process.argv[3] || null;

let payload = {};
if (payloadFile) {
  try {
    payload = JSON.parse(fs.readFileSync(payloadFile, "utf8"));
  } catch (e) {
    console.error("Failed to read/parse payload file", e);
    process.exit(2);
  }
} else if (process.env.PAYLOAD_B64) {
  try {
    payload = JSON.parse(
      Buffer.from(process.env.PAYLOAD_B64, "base64").toString("utf8")
    );
  } catch (e) {
    console.error("Failed to parse PAYLOAD_B64", e);
    process.exit(2);
  }
}

const payloadStr = JSON.stringify(payload);

const options = {
  hostname: HOST,
  port: PORT,
  path: pathArg,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payloadStr),
  },
};

const req = http.request(options, (res) => {
  let body = "";
  res.setEncoding("utf8");
  res.on("data", (chunk) => (body += chunk));
  res.on("end", () => {
    console.log(
      `${options.method} ${pathArg} response ${res.statusCode} ${body}`
    );
    process.exit(0);
  });
});

req.on("error", (err) => {
  console.error("POST error", err);
  process.exit(1);
});

req.write(payloadStr);
req.end();
