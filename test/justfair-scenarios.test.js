// JustFair Phase 1 Scenario + Adapter Test Suite (node:test)
// Proves the vertical slice: arbitrary-contract targets, judged by JustFair.

import test from "node:test";
import assert from "node:assert/strict";

import {
  validateManifest,
  fetchManifest,
  evaluateTarget,
  ADAPTER_VERSION
} from "../src/scenarios/adapter.js";
import { validateScenario, runScenario, SCENARIO_RESULT } from "../src/scenarios/scenario.js";
import { interpretPythUpdate, fetchPythPriceAt } from "../src/scenarios/pyth.js";
import { STALE_CARRIED_FORWARD_EQUITY } from "../src/scenarios/first-scenario.js";
import { startFixtureTarget, closeFixtureTarget } from "./fixtures/adapter-targets.js";

const LOCAL = { allowLocal: true, timeoutMs: 5000 };

async function withTargets(fn) {
  const naive = await startFixtureTarget({ behavior: "naive" });
  const correct = await startFixtureTarget({ behavior: "correct" });
  try {
    await fn({ naive: naive.baseUrl, correct: correct.baseUrl });
  } finally {
    await closeFixtureTarget(naive);
    await closeFixtureTarget(correct);
  }
}

test("adapter manifest validation accepts the v1 contract", () => {
  const r = validateManifest({ adapterVersion: "1", name: "X", capabilities: ["underlying_price_display"] });
  assert.equal(r.ok, true);
  assert.equal(r.manifest.adapterVersion, ADAPTER_VERSION);
});

test("unsupported adapter version is rejected, never trusted", async () => {
  const h = await startFixtureTarget({
    manifest: { adapterVersion: "99", name: "Future", capabilities: ["underlying_price_display"] }
  });
  try {
    const result = await runScenario(STALE_CARRIED_FORWARD_EQUITY, h.baseUrl, LOCAL);
    assert.equal(result.status, SCENARIO_RESULT.UNABLE_TO_VERIFY);
    assert.equal(result.reasonCode, "ADAPTER_MANIFEST_INVALID");
  } finally {
    await closeFixtureTarget(h);
  }
});

test("missing required capability yields UNABLE_TO_VERIFY, not FAIL", async () => {
  const h = await startFixtureTarget({
    manifest: { adapterVersion: "1", name: "NoCap", capabilities: ["display_balance"] }
  });
  try {
    const result = await runScenario(STALE_CARRIED_FORWARD_EQUITY, h.baseUrl, LOCAL);
    assert.equal(result.status, SCENARIO_RESULT.UNABLE_TO_VERIFY);
    assert.equal(result.reasonCode, "ADAPTER_CAPABILITY_MISSING");
  } finally {
    await closeFixtureTarget(h);
  }
});

test("malformed adapter response yields UNABLE_TO_VERIFY, not FAIL", async () => {
  const h = await startFixtureTarget({
    onEvaluate: async (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("this is not json{{{");
    }
  });
  try {
    const result = await runScenario(STALE_CARRIED_FORWARD_EQUITY, h.baseUrl, LOCAL);
    assert.equal(result.status, SCENARIO_RESULT.UNABLE_TO_VERIFY);
    assert.equal(result.reasonCode, "ADAPTER_MALFORMED_RESPONSE");
  } finally {
    await closeFixtureTarget(h);
  }
});

test("adapter timeout yields UNABLE_TO_VERIFY, not FAIL", async () => {
  const h = await startFixtureTarget({
    onEvaluate: async () => { /* never responds */ }
  });
  try {
    const result = await runScenario(STALE_CARRIED_FORWARD_EQUITY, h.baseUrl, { allowLocal: true, timeoutMs: 300 });
    assert.equal(result.status, SCENARIO_RESULT.UNABLE_TO_VERIFY);
    assert.equal(result.reasonCode, "ADAPTER_TIMEOUT");
  } finally {
    await closeFixtureTarget(h);
  }
});

test("oversized adapter response is refused with a size cap", async () => {
  const h = await startFixtureTarget({
    onEvaluate: async (req, res) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ blob: "x".repeat(70000) }));
    }
  });
  try {
    const result = await runScenario(STALE_CARRIED_FORWARD_EQUITY, h.baseUrl, LOCAL);
    assert.equal(result.status, SCENARIO_RESULT.UNABLE_TO_VERIFY);
    assert.equal(result.reasonCode, "ADAPTER_RESPONSE_TOO_LARGE");
  } finally {
    await closeFixtureTarget(h);
  }
});

test("SSRF guards: file:// and non-opted-in local targets are blocked", async () => {
  await assert.rejects(
    () => fetchManifest("file:///etc/passwd", LOCAL),
    /not allowed/
  );
  await assert.rejects(
    () => fetchManifest("http://127.0.0.1:9", { timeoutMs: 500 }),
    /explicit opt-in/
  );
  await assert.rejects(
    () => evaluateTarget("http://169.254.169.254/", { scenarioId: "x", scenarioVersion: "1", inputs: {} }, { timeoutMs: 500 }),
    /explicit opt-in/
  );
});

test("naive target FAILS the invariant for the correct reason", async () => {
  await withTargets(async ({ naive }) => {
    const result = await runScenario(STALE_CARRIED_FORWARD_EQUITY, naive, LOCAL);
    assert.equal(result.status, SCENARIO_RESULT.FAIL);
    assert.equal(result.diagnosis.failureCode, "STALE_REFERENCE_TREATED_AS_LIVE");
    assert.ok(result.diagnosis.expected.includes("must not be presented as a fresh live"));
    assert.equal(result.diagnosis.actual.claimsLive, true);
    assert.ok(result.diagnosis.rootCause.length > 10);
    assert.ok(result.diagnosis.guidance.length > 10);
    assert.equal(result.assertions.length, 2);
  });
});

test("correct target PASSES the same invariant (no target-specific code)", async () => {
  await withTargets(async ({ correct }) => {
    const result = await runScenario(STALE_CARRIED_FORWARD_EQUITY, correct, LOCAL);
    assert.equal(result.status, SCENARIO_RESULT.PASS);
    assert.equal(result.diagnosis, null);
    assert.ok(result.assertions.every(a => a.passed));
  });
});

test("FAIL result carries ordered replay data for the future Replay Lab", async () => {
  await withTargets(async ({ naive }) => {
    const result = await runScenario(STALE_CARRIED_FORWARD_EQUITY, naive, LOCAL);
    assert.ok(Array.isArray(result.replay) && result.replay.length >= 5);
    const labels = result.replay.map(e => e.label);
    assert.ok(labels[0].includes("Scenario issued"));
    assert.ok(labels.includes("Invariant violated"));
    for (const e of result.replay) {
      assert.ok(typeof e.at === "string" && typeof e.label === "string");
    }
  });
});

test("remediation mapping is deterministic across re-runs", async () => {
  await withTargets(async ({ naive }) => {
    const a = await runScenario(STALE_CARRIED_FORWARD_EQUITY, naive, LOCAL);
    const b = await runScenario(STALE_CARRIED_FORWARD_EQUITY, naive, LOCAL);
    assert.deepEqual(a.diagnosis, b.diagnosis);
  });
});

test("scenario re-run after fix: same scenario passes against the correct target", async () => {
  await withTargets(async ({ naive, correct }) => {
    const before = await runScenario(STALE_CARRIED_FORWARD_EQUITY, naive, LOCAL);
    assert.equal(before.status, SCENARIO_RESULT.FAIL);
    const after = await runScenario(STALE_CARRIED_FORWARD_EQUITY, correct, LOCAL);
    assert.equal(after.status, SCENARIO_RESULT.PASS);
  });
});

test("unreachable adapter yields UNABLE_TO_VERIFY, never PASS or FAIL", async () => {
  const result = await runScenario(STALE_CARRIED_FORWARD_EQUITY, "http://127.0.0.1:1", { allowLocal: true, timeoutMs: 500 });
  assert.equal(result.status, SCENARIO_RESULT.UNABLE_TO_VERIFY);
});

test("Pyth parser: carried-forward detection follows official field semantics", () => {
  const carried = interpretPythUpdate({ timestampUs: 2000, feedUpdateTimestamp: 1000, marketSession: "overnight" });
  assert.equal(carried.usable, true);
  assert.equal(carried.carriedForward, true);
  assert.equal(carried.freshLiveReference, false);
  assert.equal(carried.marketSession, "overnight");
  const fresh = interpretPythUpdate({ timestampUs: 2000, feedUpdateTimestamp: 2000, marketSession: "regular" });
  assert.equal(fresh.carriedForward, false);
  assert.equal(fresh.freshLiveReference, true);
  const noFeedTs = interpretPythUpdate({ timestampUs: 2000, marketSession: "regular" });
  assert.equal(noFeedTs.carriedForward, false);
  assert.equal(interpretPythUpdate(null).usable, false);
  assert.equal(interpretPythUpdate({}).usable, false);
});

test("Pyth fetcher reports absent key without fabricating data", async () => {
  const saved = process.env.PYTH_API_KEY;
  delete process.env.PYTH_API_KEY;
  try {
    const r = await fetchPythPriceAt({ feedId: 1, timestampUs: 2 });
    assert.equal(r.ok, false);
    assert.equal(r.code, "PYTH_KEY_ABSENT");
  } finally {
    if (saved !== undefined) process.env.PYTH_API_KEY = saved;
  }
});

test("first scenario labels its evidence as simulated, never live", () => {
  assert.equal(STALE_CARRIED_FORWARD_EQUITY.evidence.classification, "simulated");
  assert.ok(validateScenario(STALE_CARRIED_FORWARD_EQUITY).ok);
});

test("no secret ever travels to a test target", async () => {
  process.env.PYTH_API_KEY = "SENTINEL_SECRET_XYZ";
  process.env.ALPACA_API_SECRET_KEY = "SENTINEL_SECRET_XYZ";
  let seenBody = null;
  const h = await startFixtureTarget({
    onEvaluate: async (req, res, payload) => {
      seenBody = JSON.stringify(payload);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ displayedPrice: 1, claimsLive: false, label: "x" }));
    }
  });
  try {
    await runScenario(STALE_CARRIED_FORWARD_EQUITY, h.baseUrl, LOCAL);
    assert.ok(seenBody && !seenBody.includes("SENTINEL_SECRET_XYZ"), "request body must not contain secrets");
  } finally {
    delete process.env.PYTH_API_KEY;
    delete process.env.ALPACA_API_SECRET_KEY;
    await closeFixtureTarget(h);
  }
});
