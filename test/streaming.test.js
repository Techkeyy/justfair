// JustFair Continuous Market Streaming & Route Scheduler Test Suite (Director Order 009.6)
process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";
import { calculateTradeEconomics } from "../src/engine/economics.js";
import { PYTH_FEEDS_REGISTRY, isPythAuthAvailable, calculateMarketSession } from "../src/engine/benchmark.js";
import { SUPPORTED_STOCKS } from "../src/config.js";

async function runStreamingTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR STREAMING & ROUTE SCHEDULER TEST SUITE (009.6)");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`TEST: ${name} ... `);
      await fn();
      console.log("PASS ✅");
      passed++;
    } catch (err) {
      console.log(`FAIL ❌\n  Error: ${err.message}`);
      failed++;
    }
  }

  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const PORT = server.address().port;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  try {
    // 1. Pyth Feed Coverage for SOL + all 12 stocks
    await test("1. Complete Pyth Feed Coverage for SOL and all 12 stocks", async () => {
      assert.ok(PYTH_FEEDS_REGISTRY["SOL/USD"], "SOL/USD feed must be present");
      assert.strictEqual(PYTH_FEEDS_REGISTRY["SOL/USD"].id, "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d");

      for (const stockKey of Object.keys(SUPPORTED_STOCKS)) {
        const feed = PYTH_FEEDS_REGISTRY[stockKey];
        assert.ok(feed, `Feed for ${stockKey} must exist in PYTH_FEEDS_REGISTRY`);
        assert.ok(feed.id && feed.id.length === 64, `Feed ID for ${stockKey} must be a 64-char hex string`);
        assert.ok(feed.pythSymbol, `Feed pythSymbol for ${stockKey} must be present`);
        assert.ok(feed.schedule, `Market hours schedule for ${stockKey} must be present`);
      }
      assert.strictEqual(Object.keys(PYTH_FEEDS_REGISTRY).length, 13, "Exactly 13 feeds (12 equities + SOL) must be configured");
    });

    // 2. Truthful 503 Gating when PYTH_API_KEY is not configured
    await test("2. GET /api/v1/stream returns 503 BLOCKED: PYTH_API_KEY_REQUIRED when key is absent", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/stream`);
      assert.strictEqual(res.status, 503, "Must return HTTP 503 Service Unavailable");
      const data = await res.json();
      assert.strictEqual(data.error, "BLOCKED: PYTH_API_KEY_REQUIRED");
      assert.strictEqual(data.reason_codes[0], "PYTH_API_KEY_REQUIRED");
    });

    // 3. Streaming Infrastructure Status Endpoint
    await test("3. GET /api/v1/stream/status reports truthful streaming health", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/stream/status`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, "SUCCESS");
      assert.strictEqual(data.streaming_infrastructure.supported_feeds_count, 13);
      assert.strictEqual(typeof data.streaming_infrastructure.pyth_auth_present, "boolean");
      assert.strictEqual(data.streaming_infrastructure.auth_mode, isPythAuthAvailable() ? "SERVER_AUTHENTICATED_BEARER" : "BLOCKED_PYTH_API_KEY_REQUIRED");
    });

    // 4. Pure Economics Calculation Parity
    await test("4. Shared pure calculateTradeEconomics parity across USDC and SOL", async () => {
      // 500 USDC on AAPLx @ $332.27 benchmark, multiplier 1.003269, rawOut 150000000 (1.5 tokens)
      const econUsdc = calculateTradeEconomics({
        inputAmount: 500,
        inputAsset: "USDC",
        inputAssetPriceUsd: 1.0,
        rawOutAmount: "150000000",
        stockDecimals: 8,
        multiplier: 1.003269,
        underlyingBenchmarkPrice: 332.27
      });

      assert.strictEqual(econUsdc.input_usd_value, 500.00);
      assert.strictEqual(econUsdc.raw_token_units, 1.5);
      assert.strictEqual(econUsdc.expected_stock_shares, 1.504903);
      assert.strictEqual(econUsdc.expected_stock_exposure_usd, 500.03);
      assert.strictEqual(econUsdc.difference_usd, 0.03);
      assert.strictEqual(econUsdc.difference_pct, 0.01);

      // 4 SOL @ $101.56/SOL = $406.24 input USD
      const econSol = calculateTradeEconomics({
        inputAmount: 4,
        inputAsset: "SOL",
        inputAssetPriceUsd: 101.56,
        rawOutAmount: "121423481",
        stockDecimals: 8,
        multiplier: 1.003269,
        underlyingBenchmarkPrice: 332.27
      });

      assert.strictEqual(econSol.input_usd_value, 406.24);
      assert.strictEqual(econSol.expected_stock_exposure_usd, 404.77);
      assert.strictEqual(econSol.difference_usd, -1.47);
      assert.strictEqual(econSol.difference_pct, -0.36);
    });

    // 5. Market Session Weekend Detection Truthfulness
    await test("5. Weekend market session correctly classified as CLOSED without live trading animation", async () => {
      const saturday = new Date("2026-09-12T15:00:00Z"); // Saturday
      const session = calculateMarketSession(saturday);
      assert.strictEqual(session, "CLOSED", "Saturday must be classified as CLOSED market session");
    });

    // 6. Security Audit: No Secrets Exposed in Server Responses
    await test("6. Zero API credentials or secrets exposed in API endpoints", async () => {
      const endpoints = ["/api/v1/health", "/api/v1/stocks", "/api/v1/prices", "/api/v1/prices/sol", "/api/v1/stream/status"];
      for (const ep of endpoints) {
        const res = await fetch(`${BASE_URL}${ep}`);
        const text = await res.text();
        assert.ok(!text.includes("Bearer "), `Endpoint ${ep} must not expose Bearer tokens`);
        assert.ok(!text.toLowerCase().includes("secret"), `Endpoint ${ep} must not expose secrets`);
      }
    });

  } finally {
    if (server.closeAllConnections) server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }

  console.log("\n==================================================");
  console.log(`STREAMING TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runStreamingTests().catch(err => {
  console.error("Streaming test runner failure:", err);
  process.exit(1);
});
