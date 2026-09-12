// JustFair Comprehensive Automated Test Suite (Phase 0/1 Corrected)
import { runPreflight, fetchOnChainTokenMultiplier, calculateMarketSession } from "../src/preflight.js";
import { SUPPORTED_STOCKS } from "../src/config.js";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR COMPREHENSIVE TEST SUITE");
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

  // 1. Dynamic On-Chain Multiplier Retrieval for AAPLx
  await test("Dynamic Token-2022 multiplier retrieval for AAPLx", async () => {
    const data = await fetchOnChainTokenMultiplier(SUPPORTED_STOCKS.AAPLx.mint);
    if (typeof data.active_multiplier !== "number" || data.active_multiplier <= 0) {
      throw new Error(`Expected numeric multiplier > 0, got ${data.active_multiplier}`);
    }
    if (!data.source.includes("Token-2022 scaledUiAmountConfig")) {
      throw new Error("Multiplier source was not from on-chain extension");
    }
  });

  // 2. Dynamic On-Chain Multiplier Retrieval for NVDAx & SPYx
  await test("Dynamic Token-2022 multiplier retrieval for NVDAx & SPYx", async () => {
    const [nvda, spy] = await Promise.all([
      fetchOnChainTokenMultiplier(SUPPORTED_STOCKS.NVDAx.mint),
      fetchOnChainTokenMultiplier(SUPPORTED_STOCKS.SPYx.mint)
    ]);
    if (nvda.active_multiplier <= 0 || spy.active_multiplier <= 0) {
      throw new Error("NVDAx/SPYx multipliers failed");
    }
  });

  // 3. Market Session Calculation Logic
  await test("Market session time computation", async () => {
    // Test Saturday (Closed)
    const sat = new Date("2026-09-12T14:00:00Z");
    if (calculateMarketSession(sat) !== "CLOSED") throw new Error("Saturday should be CLOSED");
    // Test Wednesday Regular Session (14:30 UTC = 10:30 ET)
    const wedReg = new Date("2026-09-16T14:30:00Z");
    if (calculateMarketSession(wedReg) !== "REGULAR") throw new Error("Wednesday 10:30 ET should be REGULAR");
    // Test Wednesday Pre-Market (10:00 UTC = 06:00 ET)
    const wedPre = new Date("2026-09-16T10:00:00Z");
    if (calculateMarketSession(wedPre) !== "PRE_MARKET") throw new Error("Wednesday 06:00 ET should be PRE_MARKET");
    // Test Wednesday Post-Market (21:00 UTC = 17:00 ET)
    const wedPost = new Date("2026-09-16T21:00:00Z");
    if (calculateMarketSession(wedPost) !== "POST_MARKET") throw new Error("Wednesday 17:00 ET should be POST_MARKET");
  });

  // 4. Quote Precheck Mode (No Wallet Required)
  await test("USDC -> AAPLx Quote Precheck mode without wallet", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 500, userPublicKey: null });
    if (res.status !== "SUCCESS") throw new Error(`Preflight failed: ${res.reason}`);
    if (res.simulation.mode !== "QUOTE_PRECHECK") throw new Error("Expected QUOTE_PRECHECK mode");
    if (res.simulation.status !== "NOT_RUN") throw new Error("Simulation status should be NOT_RUN in quote-only mode");
    if (res.verification_status !== "VERIFIED") throw new Error("Quote precheck should be VERIFIED");
    if (res.expected_stock_shares <= 0) throw new Error("Expected shares must be > 0");
  });

  // 5. SOL -> AAPLx Quote Precheck Mode
  await test("SOL -> AAPLx Quote Precheck with dynamic pricing", async () => {
    const res = await runPreflight({ inputSymbol: "SOL", stockSymbol: "AAPLx", amount: 2, userPublicKey: null });
    if (res.status !== "SUCCESS") throw new Error(`Preflight failed: ${res.reason}`);
    if (res.input_usd_value <= 0) throw new Error("SOL input USD value must be > 0");
    if (typeof res.difference_usd !== "number") throw new Error("Dollar difference must be calculated");
  });

  // 6. Exact Preflight Mode with Arbitrary User Public Key (Testing Non-Funded Wallet Simulation Failure)
  await test("Exact Preflight mode with arbitrary user wallet and honest simulation failure handling", async () => {
    const unfundedUser = "11111111111111111111111111111111"; // Unfunded / empty wallet
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 500, userPublicKey: unfundedUser });
    if (res.simulation.mode !== "EXACT_PREFLIGHT") throw new Error("Expected EXACT_PREFLIGHT mode");
    // Since this wallet has no USDC balance, simulation must report FAIL and verification becomes UNABLE_TO_VERIFY
    if (res.simulation.status === "PASS") throw new Error("Unfunded wallet simulation must NOT report PASS");
    if (res.verification_status !== "UNABLE_TO_VERIFY") throw new Error("Failed simulation must result in UNABLE_TO_VERIFY");
  });

  // 7. Token-2022 Amount Math and Decimal Precision
  await test("Token-2022 amount scaling math", async () => {
    const rawOutAmount = 149457922; // 8 decimals
    const decimals = 8;
    const activeMultiplier = 1.0026642075893797;
    const computedShares = (rawOutAmount / Math.pow(10, decimals)) * activeMultiplier;
    if (Math.abs(computedShares - 1.49856) > 0.001) {
      throw new Error(`Mathematical precision mismatch: computed ${computedShares}`);
    }
  });

  // 8. Freshness & Benchmark Verification
  await test("Market benchmark metadata and freshness structure", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 100 });
    const b = res.benchmark;
    if (!b.symbol || !b.source || !b.source_type || typeof b.price !== "number") {
      throw new Error("Benchmark object missing required fields");
    }
    if (!["REGULAR", "PRE_MARKET", "POST_MARKET", "OVERNIGHT", "CLOSED"].includes(b.market_session)) {
      throw new Error(`Invalid market session: ${b.market_session}`);
    }
  });

  // 9. Rejection of Unsupported Stock
  await test("Rejection of unsupported stock asset", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "NON_EXISTENT_COIN", amount: 100 });
    if (res.status !== "ERROR" || res.verification_status !== "UNABLE_TO_VERIFY") {
      throw new Error("Unsupported stock must produce UNABLE_TO_VERIFY");
    }
  });

  // 10. Rejection of Unsupported Payment Asset
  await test("Rejection of unsupported payment asset", async () => {
    const res = await runPreflight({ inputSymbol: "ETH_ON_SOLANA", stockSymbol: "AAPLx", amount: 100 });
    if (res.status !== "ERROR" || res.verification_status !== "UNABLE_TO_VERIFY") {
      throw new Error("Unsupported payment must produce UNABLE_TO_VERIFY");
    }
  });

  // 11. Rejection of Invalid Amount
  await test("Rejection of zero or negative amount", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: -100 });
    if (res.status !== "ERROR" || res.verification_status !== "UNABLE_TO_VERIFY") {
      throw new Error("Invalid amount must produce UNABLE_TO_VERIFY");
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
