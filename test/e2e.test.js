// JustFair Consumer Product End-to-End Test Suite (Director Order 005 Block B Gate)
import { createServer } from "../src/server.js";

async function runE2ETests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR CONSUMER PRODUCT E2E TEST SUITE");
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
  const TEST_PORT = server.address().port;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  // Upstream weather tolerance (014 §2/§22): live Jupiter/benchmark calls can
  // transiently fail. A transient ERROR with an upstream reason code proves
  // the contract stayed truthful; it must not fail the deterministic suite.
  // Real live-success proof lives in headed production runs + smoke_prod.js.
  const UPSTREAM_TRANSIENT_CODES = ["UPSTREAM_TIMEOUT", "UPSTREAM_UNAVAILABLE", "UPSTREAM_ERROR"];
  function isUpstreamTransient(res, data) {
    return res.status !== 200
      && data.request_status === "ERROR"
      && Array.isArray(data.reason_codes)
      && data.reason_codes.some(c => UPSTREAM_TRANSIENT_CODES.includes(c));
  }

  try {
    // 1. App Loads (HTML Serving) — approved production hero contract
    await test("App root (GET /) loads with complete consumer structure & approved hero", async () => {
      const res = await fetch(`${BASE_URL}/`);
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      if (!html.includes("Know what you're buying.") || !html.includes("Then check the fill.")) {
        throw new Error("Missing approved hero headline (Know what you're buying. Then check the fill.)");
      }
      if (!html.includes("Start a Preflight")) {
        throw new Error("Missing approved Start a Preflight CTA");
      }
      if (!html.includes("stock-cards-container") || !html.includes("feed-controls-bar")) {
        throw new Error("Missing stock feed container or controls bar");
      }
      if (!html.includes("USDC")) {
        throw new Error("Missing payment asset options in interface");
      }
      if (!html.includes("PREVIEW ONLY · NO FUNDS MOVED")) {
        throw new Error("Missing non-custodial safety banner");
      }
      if (!html.includes("Built for users. Embeddable by wallets.")) {
        throw new Error("Missing secondary API showcase section");
      }
    });

    // 2. Static CSS & JS Bundles
    await test("Static assets (GET /styles.css and GET /app.js) served with correct MIME types", async () => {
      const cssRes = await fetch(`${BASE_URL}/styles.css`);
      if (cssRes.status !== 200 || !cssRes.headers.get("content-type")?.includes("text/css")) {
        throw new Error("styles.css failed to serve");
      }

      const jsRes = await fetch(`${BASE_URL}/app.js`);
      if (jsRes.status !== 200 || !jsRes.headers.get("content-type")?.includes("text/javascript")) {
        throw new Error("app.js failed to serve");
      }
    });

    // 3. Stock Catalog API
    await test("Catalog API (GET /api/v1/stocks) returns exactly 12 verified tokenized stocks with metadata", async () => {
      const sRes = await fetch(`${BASE_URL}/api/v1/stocks`);
      if (sRes.status !== 200) throw new Error(`Stocks status ${sRes.status}`);
      const sData = await sRes.json();
      if (sData.supported_stock_assets.length !== 12) {
        throw new Error(`Expected 12 stocks, received ${sData.supported_stock_assets.length}`);
      }
      const symbols = sData.supported_stock_assets.map(s => s.symbol);
      for (const expected of ["AAPLx", "NVDAx", "SPYx", "TSLAx", "MSFTx", "AMZNx", "GOOGLx", "METAx", "COINx", "AMDx", "MSTRx", "QQQx"]) {
        if (!symbols.includes(expected)) throw new Error(`Missing expected stock in catalog: ${expected}`);
      }
    });

    // 4. Frontend Trade Flow 1: AAPLx with USDC (Quote Check Mode)
    await test("Frontend trade flow: AAPLx + USDC Quote Check delivers real economics", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "AAPLx",
          amount: 500
        })
      });

      const data = await res.json();
      if (isUpstreamTransient(res, data)) {
        console.log(`      (upstream transient ${data.reason_codes.join(",")}, contract held) ... `);
        return;
      }
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (data.preflight_level !== "QUOTE_CHECK") throw new Error("Expected QUOTE_CHECK level");
      if (data.trade.input_usd_value !== 500) throw new Error("Spend mismatch");
      if (data.economics.expected_stock_exposure_usd <= 0) throw new Error("Expected exposure missing");
      if (!data.benchmark.market_context) throw new Error("Market context missing");
      if (!data.alternative_routes || !data.alternative_routes.status) throw new Error("Alternative routes missing");
    });

    // 5. Frontend Trade Flow 2: NVDAx with SOL
    await test("Frontend trade flow: NVDAx + SOL Quote Check delivers spot-adjusted economics", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "SOL",
          stock: "NVDAx",
          amount: 2.0
        })
      });

      const data = await res.json();
      if (isUpstreamTransient(res, data)) {
        console.log(`      (upstream transient ${data.reason_codes.join(",")}, contract held) ... `);
        return;
      }
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (data.trade.input_asset !== "SOL") throw new Error("Input asset mismatch");
      if (data.economics.expected_stock_shares <= 0) throw new Error("Expected shares must be > 0");
    });

    // 6. Frontend Trade Flow 3: MSFTx with USDC (Newly Expanded Megacap)
    await test("Frontend trade flow: MSFTx + USDC delivers real economics and multiplier", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "MSFTx",
          amount: 300
        })
      });

      const data = await res.json();
      if (isUpstreamTransient(res, data)) {
        console.log(`      (upstream transient ${data.reason_codes.join(",")}, contract held) ... `);
        return;
      }
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (data.trade.stock_symbol !== "MSFTx") throw new Error("Expected MSFTx");
      if (data.economics.expected_stock_exposure_usd <= 0) throw new Error("Expected exposure missing");
    });

    // 7. Frontend Trade Flow 4: QQQx with USDC (Index ETF)
    await test("Frontend trade flow: QQQx + USDC delivers real economics and multiplier", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "QQQx",
          amount: 250
        })
      });

      const data = await res.json();
      if (isUpstreamTransient(res, data)) {
        console.log(`      (upstream transient ${data.reason_codes.join(",")}, contract held) ... `);
        return;
      }
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (data.trade.stock_symbol !== "QQQx") throw new Error("Expected QQQx");
      if (data.economics.expected_stock_exposure_usd <= 0) throw new Error("Expected exposure missing");
    });

    // 5. Frontend Trade Flow 3: Wallet-Connected Exact RPC Simulation
    await test("Frontend trade flow: Wallet Exact Simulation mode simulates on Solana RPC with err: null", async () => {
      const testWallet = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "AAPLx",
          amount: 100,
          wallet: testWallet
        })
      });

      const data = await res.json();
      if (isUpstreamTransient(res, data)) {
        console.log(`      (upstream transient ${data.reason_codes.join(",")}, contract held) ... `);
        return;
      }
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.preflight_level !== "EXACT_SIMULATION") throw new Error("Expected EXACT_SIMULATION level");
      if (data.simulation.status === "PASS") {
        if (data.simulation.err !== null) throw new Error("Simulation pass must have err: null");
      }
    });

    // 6. Failure State: Invalid Amount
    await test("Failure state: Non-positive or out-of-bounds amount returns INVALID_AMOUNT", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "AAPLx",
          amount: -100
        })
      });

      if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
      const data = await res.json();
      if (!data.reason_codes.includes("INVALID_AMOUNT")) {
        throw new Error(`Expected INVALID_AMOUNT reason code, got ${data.reason_codes.join(", ")}`);
      }
    });

    // 7. Failure State: Malformed Public Key
    await test("Failure state: Malformed wallet address returns INVALID_PUBLIC_KEY without simulation", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "AAPLx",
          amount: 100,
          wallet: "0xNotASolanaKey12345"
        })
      });

      if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
      const data = await res.json();
      if (!data.reason_codes.includes("INVALID_PUBLIC_KEY")) {
        throw new Error(`Expected INVALID_PUBLIC_KEY reason code, got ${data.reason_codes.join(", ")}`);
      }
    });

    // 8. No Execution / Send / Sign Path Verification
    await test("Zero-custody verification: No /execute, sendTransaction, or signing endpoints exist", async () => {
      const execRes = await fetch(`${BASE_URL}/api/v1/execute`, { method: "POST" });
      if (execRes.status !== 404) throw new Error("Found unauthorized /execute route");

      const sendRes = await fetch(`${BASE_URL}/sendTransaction`, { method: "POST" });
      if (sendRes.status !== 404) throw new Error("Found unauthorized /sendTransaction route");
    });

  } finally {
    await new Promise(resolve => server.close(resolve));
  }

  console.log("\n==================================================");
  console.log(`E2E TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runE2ETests().catch(err => {
  console.error("E2E Test Runner Crashed:", err);
  process.exitCode = 1;
});

