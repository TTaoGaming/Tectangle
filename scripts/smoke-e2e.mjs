#!/usr/bin/env node
/* smoke-e2e runner
 * Starts harness, waits for /status, runs mocha test, then shuts down harness.
 */

import { spawn } from "child_process";
import path from "path";
import http from "http";

const ROOT = process.cwd();
const harnessRel = path.join(
  "August Tectangle Sprint",
  "tectangle-gesture-keyboard-mobile",
  "smoke",
  "camera",
  "smoke-harness.js"
);
const harnessPath = path.join(ROOT, harnessRel);

function log(...args) {
  console.log("[smoke-e2e]", ...args);
}

async function waitForUrl(url, timeout = 15000, interval = 200) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const j = await res.json().catch(() => null);
        return j;
      }
    } catch (e) {
      // ignore and retry
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

/**
 * Wait for a specific SSE event to arrive from the harness /events endpoint.
 * Resolves with the raw data when the event is observed, rejects on timeout/error.
 */
async function waitForSseEvent(host, port, eventName, timeout = 7000) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: host,
        port,
        path: "/events",
        method: "GET",
        headers: { Accept: "text/event-stream" },
      },
      (res) => {
        res.setEncoding("utf8");
        let buffer = "";
        const onData = (chunk) => {
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
              else if (line.startsWith("data:"))
                dataLines.push(line.slice(5).trim());
            }
            if (evName === eventName) {
              try {
                req.abort();
              } catch (e) {}
              resolve({ event: evName, data: dataLines.join("\n") });
              return;
            }
          }
        };
        res.on("data", onData);
        res.on("end", () => reject(new Error("SSE stream ended before event")));
      }
    );
    req.on("error", (err) => reject(err));
    req.end();
    setTimeout(() => {
      try {
        req.abort();
      } catch (e) {}
      reject(new Error(`Timed out waiting for SSE event ${eventName}`));
    }, timeout);
  });
}

async function run() {
  log("Starting harness:", harnessPath);
  const harnessProc = spawn(process.execPath, [harnessPath], {
    cwd: ROOT,
    env: { ...process.env, SMOKE_PORT: process.env.SMOKE_PORT || "4100" },
    stdio: ["ignore", "pipe", "inherit"],
  });

  harnessProc.stdout?.on("data", (chunk) => {
    process.stdout.write(`[harness] ${chunk.toString()}`);
  });

  harnessProc.on("exit", (code, sig) => {
    log(`harness exited code=${code} sig=${sig}`);
  });

  try {
    const port = Number(process.env.SMOKE_PORT || "4100");
    const status = await waitForUrl(
      `http://localhost:${port}/status`,
      15000,
      200
    );
    log("Harness status ok", status);

    // Verify LandmarkRawManager pipeline emits landmark:raw via SSE before running tests.
    try {
      await waitForSseEvent("localhost", port, "landmark:raw", 7000);
      log("SSE event received: landmark:raw");
    } catch (sseErr) {
      log("Error: did not receive landmark:raw via SSE within timeout", sseErr);
      try {
        harnessProc.kill();
      } catch (e) {}
      process.exit(2);
    }
  } catch (err) {
    log("Error waiting for harness:", err);
    try {
      harnessProc.kill();
    } catch (e) {}
    process.exit(1);
  }

  const testFile = path.join(
    "August Tectangle Sprint",
    "tectangle-gesture-keyboard-mobile",
    "tests",
    "unit",
    "camera.dynamic-resolution.test.mjs"
  );
  log("Running smoke test:", testFile);

  const testProc = spawn(
    "npx",
    ["mocha", testFile, "--exit", "--reporter", "spec"],
    {
      stdio: "inherit",
      shell: true,
    }
  );

  const exitCode = await new Promise((resolve) => {
    testProc.on("exit", (code) => resolve(code ?? 1));
    testProc.on("error", (err) => {
      console.error(err);
      resolve(1);
    });
  });

  log("Test process exited with code", exitCode);

  try {
    log("Stopping harness...");
    if (!harnessProc.killed) {
      harnessProc.kill();
    }
  } catch (e) {
    log("Error killing harness", e);
  }

  await new Promise((r) => setTimeout(r, 500));

  process.exit(exitCode);
}

run().catch((err) => {
  console.error("[smoke-e2e] fatal:", err);
  process.exit(2);
});
