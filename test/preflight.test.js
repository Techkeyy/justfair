// JustFair Comprehensive Automated Test Suite (Order 004 Block A & Block B)
import http from "node:http";
import {
  runPreflight,
  fetchOnChainTokenMultiplier,
  calculateEffectiveMultiplier,
  calculateMarketSession,
  isValidSolanaPublicKey,
  determineVerdict
} from "../src/preflight.js";
import { SUPPORTED_STOCKS, API_ENDPOINTS } from "../src/config.js";
import { createServer } from "../src/server.js";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR ORDER 004 COMPREHENSIVE TEST SUITE");
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

  // --- BLOCK A TESTS ---

  // 1. Multiplier: Before effective timestamp
  await test("Multiplier algorithm: before effective timestamp uses stored multiplier", async () => {
    const stored = "1.0026642075893797";
    const next = "1.0032690125398187";
    const effectiveTs = 1786149000;
    const testNowSec = 1786148000;

    const evaluated = calculateEffectiveMultiplier(stored, next, effectiveTs, testNowSec);
    if (evaluated.current_multiplier !== parseFloat(stored)) {
      throw new Error(`Expected stored multiplier ${stored}, got ${evaluated.current_multiplier}`);
    }
  });

  // 2. Multiplier: At/after effective timestamp
  await test("Multiplier algorithm: at/after effective timestamp uses newMultiplier", async () => {
    const stored = "1.0026642075893797";
    const next = "1.0032690125398187";
    const effectiveTs = 1786149000;
    const testNowSec = 1786150000;

    const evaluated = calculateEffectiveMultiplier(stored, next, effectiveTs, testNowSec);
    if (evaluated.current_multiplier !== parseFloat(next)) {
      throw new Error(`Expected newMultiplier ${next}, got ${evaluated.current_multiplier}`);
    }
  });

  // 3. Live On-Chain AAPLx Multiplier
  await test("Live On-Chain AAPLx current effective multiplier calculation", async () => {
    const data = await fetchOnChainTokenMultiplier(SUPPORTED_STOCKS.AAPLx.mint);
    if (data.new_multiplier_effective_timestamp === 1786149000) {
      if (data.current_multiplier !== 1.0032690125398187) {
        throw new Error(`Expected current multiplier 1.0032690125398187, got ${data.current_multiplier}`);
      }
    }
  });

  // 4. Documented ±15 min Corporate Action Safety Window
  await test("Corporate-action activation window safety flag (±15 min)", async () => {
    const stored = "1.0";
    const next = "2.0";
    const effectiveTs = 1786149000;

    // Inside 10 minutes (600s) -> should be true
    const inside = calculateEffectiveMultiplier(stored, next, effectiveTs, effectiveTs + 600);
    if (!inside.is_inside_corporate_action_window) {
      throw new Error("Expected is_inside_corporate_action_window to be true within ±15 min");
    }

    // Outside 20 minutes (1200s) -> should be false
    const outside = calculateEffectiveMultiplier(stored, next, effectiveTs, effectiveTs + 1200);
    if (outside.is_inside_corporate_action_window) {
      throw new Error("Expected is_inside_corporate_action_window to be false outside ±15 min");
    }
  });

  // 5. Real Solana Public Key Parser Validation
  await test("Solana public key parser validation via @solana/web3.js", async () => {
    const valid = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    const invalidHex = "0x1234567890abcdef";
    const invalidBase58 = "invalid_pubkey_with_0OIl";
    const invalidByteLen = "1111111111111111111111111111111"; // wrong length
    const empty = "";

    if (!isValidSolanaPublicKey(valid)) throw new Error("Valid address failed");
    if (isValidSolanaPublicKey(invalidHex)) throw new Error("Hex address passed");
    if (isValidSolanaPublicKey(invalidBase58)) throw new Error("Invalid base58 passed");
    if (isValidSolanaPublicKey(invalidByteLen)) throw new Error("Wrong byte length passed");
    if (isValidSolanaPublicKey(empty)) throw new Error("Empty address passed");
  });

  // 6. Malformed Public Key Rejected Before Upstream Call
  await test("Malformed public key rejected with INVALID_PUBLIC_KEY", async () => {
    const res = await runPreflight({
      inputSymbol: "USDC",
      stockSymbol: "AAPLx",
      amount: 100,
      userPublicKey: "NOT_A_VALID_SOLANA_KEY"
    });
    if (!res.reason_codes.includes("INVALID_PUBLIC_KEY") || res.verification_status !== "UNABLE_TO_VERIFY") {
      throw new Error(`Expected INVALID_PUBLIC_KEY, got ${res.reason_codes.join(", ")}`);
    }
  });

  // 7. Jupiter Swap V2 Configuration Integrity (No /swap/v1)
  await test("Production configuration contains no Swap V1 endpoints", async () => {
    if (API_ENDPOINTS.JUPITER_ORDER_V2.includes("/swap/v1")) {
      throw new Error("Found deprecated /swap/v1 in JUPITER_ORDER_V2 endpoint");
    }
    if (JSON.stringify(API_ENDPOINTS).includes("/swap/v1")) {
      throw new Error("Found deprecated /swap/v1 in API_ENDPOINTS");
    }
  });

  // 8. Jupiter Swap V2 Quote Precheck (Default Order without slippageBps)
  await test("Jupiter Swap V2 Quote Precheck mode with automatic router behavior", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 500, userPublicKey: null });
    if (res.request_status !== "SUCCESS") throw new Error(`Preflight failed: ${res.reason}`);
    if (res.preflight_level !== "QUOTE_CHECK") throw new Error("Expected QUOTE_CHECK level");
    if (res.simulation.status !== "NOT_RUN") throw new Error("Simulation status should be NOT_RUN");
    if (res.economics.expected_stock_shares <= 0) throw new Error("Expected shares must be > 0");
    if (!res.dex_route.router) throw new Error("Jupiter router must be exposed");
  });

  // 9. Stale/After-Hours Market Data Truthfully Blocks VERIFIED
  await test("Stale/After-hours market session returns UNABLE_TO_VERIFY with reason code", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 100 });
    if (res.benchmark.freshness_status !== "FRESH") {
      if (res.verification_status !== "UNABLE_TO_VERIFY") {
        throw new Error("Stale/After-hours reference must block VERIFIED status");
      }
      const hasExpectedCode = res.reason_codes.includes("STALE_REFERENCE") || res.reason_codes.includes("MARKET_CLOSED_OR_AFTER_HOURS");
      if (!hasExpectedCode) {
        throw new Error(`Expected stale reason code, got ${res.reason_codes.join(", ")}`);
      }
    }
  });

  // 10. Exact Preflight Mode Simulation
  await test("Exact Preflight mode with valid taker assembling transaction", async () => {
    const testTaker = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 500, userPublicKey: testTaker });
    if (res.preflight_level !== "EXACT_SIMULATION") throw new Error("Expected EXACT_SIMULATION level");
    if (res.simulation.status === "PASS") {
      if (res.simulation.err !== null) throw new Error("Simulation PASS must have err === null");
    }
  });

  // 11. Pure Verdict Engine Function
  await test("Pure verdict function evaluates FAIR, CAUTION, BAD_FILL and UNABLE_TO_VERIFY", async () => {
    if (determineVerdict({ verificationStatus: "UNABLE_TO_VERIFY", differencePct: 0 }) !== "UNABLE_TO_VERIFY") {
      throw new Error("Unverified status must produce UNABLE_TO_VERIFY verdict");
    }
    if (determineVerdict({ verificationStatus: "VERIFIED", differencePct: -0.5 }) !== "FAIR") {
      throw new Error("-0.5% diff must produce FAIR");
    }
    if (determineVerdict({ verificationStatus: "VERIFIED", differencePct: -2.0 }) !== "CAUTION") {
      throw new Error("-2.0% diff must produce CAUTION");
    }
    if (determineVerdict({ verificationStatus: "VERIFIED", differencePct: -4.0 }) !== "BAD_FILL") {
      throw new Error("-4.0% diff must produce BAD_FILL");
    }
  });

  // --- BLOCK B API SERVER TESTS ---

  // 12. HTTP API Server E2E: GET /api/v1/health & GET /api/v1/stocks
  await test("HTTP API Server GET /api/v1/health and GET /api/v1/stocks", async () => {
    const server = createServer();
    await new Promise(resolve => server.listen(3099, "127.0.0.1", resolve));

    try {
      // Health check
      const hRes = await fetch("http://127.0.0.1:3099/api/v1/health");
      if (hRes.status !== 200) throw new Error(`Health status ${hRes.status}`);
      const hData = await hRes.json();
      if (hData.status !== "HEALTHY") throw new Error("Health status not HEALTHY");

      // Stocks list
      const sRes = await fetch("http://127.0.0.1:3099/api/v1/stocks");
      if (sRes.status !== 200) throw new Error(`Stocks status ${sRes.status}`);
      const sData = await sRes.json();
      if (!Array.isArray(sData.supported_stock_assets) || sData.supported_stock_assets.length < 4) {
        throw new Error("Stocks registry incomplete");
      }
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  // 13. HTTP API Server E2E: POST /api/v1/preflight
  await test("HTTP API Server POST /api/v1/preflight", async () => {
    const server = createServer();
    await new Promise(resolve => server.listen(3098, "127.0.0.1", resolve));

    try {
      const res = await fetch("http://127.0.0.1:3098/api/v1/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "AAPLx",
          amount: 250
        })
      });

      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      const data = await res.json();
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (data.trade.stock_symbol !== "AAPLx") throw new Error("Stock symbol mismatch");
      if (typeof data.economics.expected_stock_exposure_usd !== "number") throw new Error("Exposure missing");
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
