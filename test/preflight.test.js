// JustFair Comprehensive Automated Test Suite (Order 003 Corrected)
import { runPreflight, fetchOnChainTokenMultiplier, calculateEffectiveMultiplier, calculateMarketSession, isValidSolanaPublicKey } from "../src/preflight.js";
import { SUPPORTED_STOCKS, API_ENDPOINTS } from "../src/config.js";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR ORDER 003 COMPREHENSIVE TEST SUITE");
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

  // 1. Multiplier algorithm: Before effective timestamp uses stored multiplier
  await test("Multiplier algorithm: before effective timestamp uses stored multiplier", async () => {
    const stored = "1.0026642075893797";
    const next = "1.0032690125398187";
    const effectiveTs = 1786149000;
    const testNowSec = 1786148000; // Before effectiveTs

    const evaluated = calculateEffectiveMultiplier(stored, next, effectiveTs, testNowSec);
    if (evaluated.current_multiplier !== parseFloat(stored)) {
      throw new Error(`Expected stored multiplier ${stored}, got ${evaluated.current_multiplier}`);
    }
  });

  // 2. Multiplier algorithm: At/after effective timestamp uses newMultiplier
  await test("Multiplier algorithm: at/after effective timestamp uses newMultiplier", async () => {
    const stored = "1.0026642075893797";
    const next = "1.0032690125398187";
    const effectiveTs = 1786149000;
    const testNowSec = 1786150000; // After effectiveTs

    const evaluated = calculateEffectiveMultiplier(stored, next, effectiveTs, testNowSec);
    if (evaluated.current_multiplier !== parseFloat(next)) {
      throw new Error(`Expected newMultiplier ${next}, got ${evaluated.current_multiplier}`);
    }
  });

  // 3. Live On-Chain AAPLx Multiplier Assertion
  await test("Live On-Chain AAPLx current effective multiplier calculation", async () => {
    const data = await fetchOnChainTokenMultiplier(SUPPORTED_STOCKS.AAPLx.mint);
    if (data.new_multiplier_effective_timestamp === 1786149000) {
      if (data.current_multiplier !== 1.0032690125398187) {
        throw new Error(`Expected current multiplier 1.0032690125398187, got ${data.current_multiplier}`);
      }
    }
  });

  // 4. Corporate Action Safety Window
  await test("Corporate-action activation window safety flag", async () => {
    const stored = "1.0";
    const next = "2.0";
    const effectiveTs = 1786149000;
    const insideTime = effectiveTs + 3600;
    const inside = calculateEffectiveMultiplier(stored, next, effectiveTs, insideTime);
    if (!inside.is_inside_corporate_action_window) {
      throw new Error("Expected is_inside_corporate_action_window to be true inside ±2h");
    }

    const outsideTime = effectiveTs + 18000;
    const outside = calculateEffectiveMultiplier(stored, next, effectiveTs, outsideTime);
    if (outside.is_inside_corporate_action_window) {
      throw new Error("Expected is_inside_corporate_action_window to be false outside ±2h");
    }
  });

  // 5. Solana Public Key Validation
  await test("Solana public key syntax validator", async () => {
    const valid = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    const invalid1 = "0x1234567890abcdef";
    const invalid2 = "invalid_pubkey_with_illegal_char_0OIl";
    const invalid3 = "";

    if (!isValidSolanaPublicKey(valid)) throw new Error("Valid base58 key failed");
    if (isValidSolanaPublicKey(invalid1)) throw new Error("Invalid hex key passed");
    if (isValidSolanaPublicKey(invalid2)) throw new Error("Invalid base58 characters passed");
    if (isValidSolanaPublicKey(invalid3)) throw new Error("Empty key passed");
  });

  // 6. Malformed Public Key Rejected Before Jupiter
  await test("Malformed public key rejected with INVALID_PUBLIC_KEY", async () => {
    const res = await runPreflight({
      inputSymbol: "USDC",
      stockSymbol: "AAPLx",
      amount: 100,
      userPublicKey: "NOT_A_VALID_SOLANA_KEY"
    });
    if (res.reason_code !== "INVALID_PUBLIC_KEY" || res.verification_status !== "UNABLE_TO_VERIFY") {
      throw new Error(`Expected INVALID_PUBLIC_KEY, got ${res.reason_code}`);
    }
  });

  // 7. Jupiter Swap V2 Configuration Integrity (No V1 endpoints)
  await test("Production configuration contains no Swap V1 endpoints", async () => {
    if (API_ENDPOINTS.JUPITER_ORDER_V2.includes("/swap/v1")) {
      throw new Error("Found deprecated /swap/v1 in JUPITER_ORDER_V2 endpoint");
    }
    if (JSON.stringify(API_ENDPOINTS).includes("/swap/v1")) {
      throw new Error("Found deprecated /swap/v1 in API_ENDPOINTS");
    }
  });

  // 8. Jupiter Swap V2 Quote Precheck (No Wallet Required)
  await test("Jupiter Swap V2 Quote Precheck mode", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 500, userPublicKey: null });
    if (res.status !== "SUCCESS") throw new Error(`Preflight failed: ${res.reason}`);
    if (res.simulation.mode !== "QUOTE_PRECHECK") throw new Error("Expected QUOTE_PRECHECK mode");
    if (res.simulation.status !== "NOT_RUN") throw new Error("Simulation status should be NOT_RUN");
    if (res.expected_stock_shares <= 0) throw new Error("Expected shares must be > 0");
  });

  // 9. Stale/After-Hours Market Data Truthfully Blocks VERIFIED
  await test("Stale/After-hours market session returns UNABLE_TO_VERIFY with reason code", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 100 });
    if (res.benchmark.freshness_status !== "FRESH") {
      if (res.verification_status !== "UNABLE_TO_VERIFY") {
        throw new Error("Stale/After-hours reference must block VERIFIED status");
      }
      if (!["STALE_REFERENCE", "MARKET_CLOSED_OR_AFTER_HOURS"].includes(res.reason_code)) {
        throw new Error(`Expected stale reason code, got ${res.reason_code}`);
      }
    }
  });

  // 10. Syntactically Valid Unfunded Wallet Exact Preflight
  await test("Exact Preflight with unfunded wallet fails simulation and produces UNABLE_TO_VERIFY", async () => {
    const unfundedUser = "11111111111111111111111111111111"; // Valid base58, but 0 balance
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 500, userPublicKey: unfundedUser });
    if (res.simulation.mode !== "EXACT_PREFLIGHT") throw new Error("Expected EXACT_PREFLIGHT mode");
    if (res.simulation.status === "PASS") throw new Error("Unfunded wallet should not PASS simulation");
    if (res.verification_status !== "UNABLE_TO_VERIFY") throw new Error("Failed simulation must produce UNABLE_TO_VERIFY");
  });

  // 11. Rejection of Unsupported Assets
  await test("Rejection of unsupported stock asset", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "NON_EXISTENT_COIN", amount: 100 });
    if (res.verification_status !== "UNABLE_TO_VERIFY" || res.reason_code !== "UNSUPPORTED_STOCK_ASSET") {
      throw new Error("Unsupported stock must produce UNSUPPORTED_STOCK_ASSET");
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
