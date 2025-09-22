import test from "node:test";
import assert from "node:assert/strict";
import * as registryModule from "../../src/ManagerRegistry.js";

/**
 * ManagerRegistry API (test-first scaffold)
 *
 * This test asserts the public API described in the header of
 * [`September2025/Tectangle/src/ManagerRegistry.js:1`](September2025/Tectangle/src/ManagerRegistry.js:1).
 *
 * This is intentionally test-first: the registry implementation is missing,
 * so this test will fail until the registry is implemented. That failure
 * is the desired outcome for the TDD workflow.
 */

test("ManagerRegistry basic API (test-first scaffold)", async () => {
  const registry = registryModule.default || registryModule.registry || registryModule;

  assert.ok(registry, "Registry module should export something");

  // API shape
  assert.strictEqual(typeof registry.register, "function", "register should be a function");
  assert.strictEqual(typeof registry.unregister, "function", "unregister should be a function");
  assert.strictEqual(typeof registry.get, "function", "get should be a function");
  assert.strictEqual(typeof registry.getMeta, "function", "getMeta should be a function");
  assert.strictEqual(typeof registry.has, "function", "has should be a function");
  assert.strictEqual(typeof registry.list, "function", "list should be a function");

  // Behavioral contract
  const name = "FakeManager";
  const instance = { id: "fake-1" };
  const meta = { EARS: "TREQ-FAKE-001", UI_METADATA: { tabId: "fake", title: "Fake" } };

  // register should return the instance
  const returned = registry.register(name, instance, meta);
  assert.strictEqual(returned, instance, "register should return the same instance");

  // get/has/getMeta/list should reflect registration
  assert.strictEqual(registry.get(name), instance, "get should return the registered instance");
  assert.strictEqual(registry.has(name), true, "has should be true after register");
  assert.deepStrictEqual(registry.getMeta(name), meta, "getMeta should return the metadata");
  const lst = registry.list();
  assert.ok(Array.isArray(lst), "list() should return an array");
  assert.ok(lst.includes(name), "list() should include the registered name");

  // unregister should remove the entry
  const removed = registry.unregister(name);
  assert.ok(removed === true || removed === false, "unregister should return a boolean");
  assert.strictEqual(registry.has(name), false, "has should be false after unregister");
});