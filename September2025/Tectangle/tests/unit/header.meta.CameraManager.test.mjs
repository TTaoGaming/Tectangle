import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const PROJECT = process.cwd();
const META_PATH = path.join(PROJECT, "src", "CameraManager.meta.json");

test("CameraManager meta.json header contains required fields and a valid timestamp", async (t) => {
  if (!fs.existsSync(META_PATH)) {
    assert.fail(`Meta file not found: ${META_PATH}`);
  }

  const raw = fs.readFileSync(META_PATH, "utf8");
  let meta;
  try {
    meta = JSON.parse(raw);
  } catch (err) {
    assert.fail(`Invalid JSON in ${META_PATH}: ${err.message}`);
  }

  const required = [
    "name",
    "generatedFrom",
    "version",
    "timestamp",
    "emits",
    "tests",
    "acceptance",
  ];
  for (const key of required) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(meta, key),
      `Missing required meta field: ${key}`
    );
  }

  // timestamp parseable
  const parsed = Date.parse(meta.timestamp);
  assert.ok(
    !Number.isNaN(parsed),
    `meta.timestamp is not parseable ISO8601: ${meta.timestamp}`
  );

  // emits presence and basic shape
  assert.ok(
    Array.isArray(meta.emits) && meta.emits.length > 0,
    "meta.emits must be a non-empty array"
  );
  for (const e of meta.emits) {
    assert.ok(e && typeof e === "object", "each emits entry must be an object");
    assert.ok(
      typeof e.event === "string" && e.event.length > 0,
      "emits[].event must be a non-empty string"
    );
    assert.ok(
      e.detailSchema && typeof e.detailSchema === "object",
      "emits[].detailSchema must be an object"
    );
    assert.ok(
      typeof e.testHint === "string" && e.testHint.length > 0,
      "emits[].testHint must be a non-empty string"
    );
  }

  // tests referenced must exist
  assert.ok(
    Array.isArray(meta.tests) && meta.tests.length > 0,
    "meta.tests must be a non-empty array"
  );
  for (const tpath of meta.tests) {
    const tPath = path.join(PROJECT, tpath);
    assert.ok(fs.existsSync(tPath), `Referenced test file not found: ${tpath}`);
  }

  // acceptance array
  assert.ok(
    Array.isArray(meta.acceptance) && meta.acceptance.length > 0,
    "meta.acceptance must be a non-empty array"
  );
});
