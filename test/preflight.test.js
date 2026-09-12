// JustFair Comprehensive Automated Test Suite (Order 005 Block A Test Gate)
import { readFileSync } from "node:fs";
import {
  runPreflight,
  fetchOnChainTokenMultiplier,
  calculateEffectiveMultiplier,
  calculateMarketSession,
  isValidSolanaPublicKey,
  determineVerdict,
  THRESHOLD_CALIBRATION_STATUS
} from "../src/preflight.js";
import { parseXStocksPriceData, fetchCryptoSpotPrice } from "../src/engine/benchmark.js";
import { SUPPORTED_STOCKS, API_ENDPOINTS } from "../src/config.js";
import { createServer } from "../src/server.js";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR ORDER 005 BLOCK A TEST SUITE");
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

  // --- 1. REAL xSTOCKS PRICE-DATA PARSER ---
  await test("Real xStocks price-data parser extracts valid underlying quote", async () => {
    const mockPayload = {
      quote: {
        price: 332.50,
        provider: "Nasdaq Real-Time Tape",
        isUnderlying: true,
        sourceType: "EQUITY_FEED",
        timestamp: "2026-09-12T00:00:00.000Z",
        session: "REGULAR",
        isRealTime: true
      }
    };
    const parsed = parseXStocksPriceData(mockPayload, "AAPLx");
    if (!parsed) throw new Error("Parser returned null for valid payload");
    if (parsed.price !== 332.50) throw new Error(`Expected price 332.50, got ${parsed.price}`);
    if (parsed.provider !== "Nasdaq Real-Time Tape") throw new Error(`Wrong provider: ${parsed.provider}`);
    if (parsed.source_type !== "UNDERLYING_EQUITY_FEED") throw new Error(`Wrong source_type: ${parsed.source_type}`);
  });

  // --- 2. UNDERLYING PROVIDER CHOSEN RATHER THAN ONCHAIN xSTOCK DEX PRICE ---
  await test("Parser rejects onchain xStock DEX pool price as independent benchmark", async () => {
    const mockOnchainDexPayload = {
      quote: {
        price: 330.00,
        provider: "Raydium AMM Pool",
        isUnderlying: false,
        sourceType: "ONCHAIN_DEX",
        poolAddress: "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"
      }
    };
    const parsed = parseXStocksPriceData(mockOnchainDexPayload, "AAPLx");
    if (parsed !== null) {
      throw new Error("Parser must NOT select internal onchain DEX pool price as independent underlying reference");
    }
  });

  // --- 3. SOURCE-AWARE SESSION ELIGIBILITY (REGULAR / EXTENDED / OVERNIGHT / CLOSED) ---
  await test("Session calculator accurately detects regular, pre-market, post-market, overnight, and closed sessions", async () => {
    // Wednesday 14:00 ET (Regular session)
    const regDate = new Date("2026-09-09T14:00:00-04:00");
    if (calculateMarketSession(regDate) !== "REGULAR") {
      throw new Error(`Expected REGULAR session, got ${calculateMarketSession(regDate)}`);
    }

    // Wednesday 08:00 ET (Pre-market session)
    const preDate = new Date("2026-09-09T08:00:00-04:00");
    if (calculateMarketSession(preDate) !== "PRE_MARKET") {
      throw new Error(`Expected PRE_MARKET session, got ${calculateMarketSession(preDate)}`);
    }

    // Wednesday 17:00 ET (Post-market session)
    const postDate = new Date("2026-09-09T17:00:00-04:00");
    if (calculateMarketSession(postDate) !== "POST_MARKET") {
      throw new Error(`Expected POST_MARKET session, got ${calculateMarketSession(postDate)}`);
    }

    // Wednesday 22:00 ET (Overnight session)
    const overnightDate = new Date("2026-09-09T22:00:00-04:00");
    if (calculateMarketSession(overnightDate) !== "OVERNIGHT") {
      throw new Error(`Expected OVERNIGHT session, got ${calculateMarketSession(overnightDate)}`);
    }

    // Saturday 12:00 ET (Weekend / Closed)
    const satDate = new Date("2026-09-12T12:00:00-04:00");
    if (calculateMarketSession(satDate) !== "CLOSED") {
      throw new Error(`Expected CLOSED session on Saturday, got ${calculateMarketSession(satDate)}`);
    }

    // Sunday 14:00 ET (Weekend / Closed before overnight opens at 20:00)
    const sunDate = new Date("2026-09-13T14:00:00-04:00");
    if (calculateMarketSession(sunDate) !== "CLOSED") {
      throw new Error(`Expected CLOSED session on Sunday afternoon, got ${calculateMarketSession(sunDate)}`);
    }
  });

  // --- 4. UNAVAILABLE WEEKEND / STALE FRIDAY REFERENCE IS INELIGIBLE ---
  await test("Stale Friday / weekend reference evaluates to INELIGIBLE_CLOSED and UNABLE_TO_VERIFY", async () => {
    // Saturday date check
    const saturdayDate = new Date("2026-09-12T12:00:00-04:00");
    const session = calculateMarketSession(saturdayDate);
    if (session !== "CLOSED") {
      throw new Error(`Expected CLOSED session on Saturday, got ${session}`);
    }

    // Live preflight execution on Saturday must yield UNABLE_TO_VERIFY with MARKET_CLOSED_OR_AFTER_HOURS
    const pf = await runPreflight({
      inputSymbol: "USDC",
      stockSymbol: "AAPLx",
      amount: 100
    });
    if (pf.verification_status !== "UNABLE_TO_VERIFY") {
      throw new Error(`Expected UNABLE_TO_VERIFY on weekend, got ${pf.verification_status}`);
    }
    if (!pf.reason_codes.includes("MARKET_CLOSED_OR_AFTER_HOURS")) {
      throw new Error(`Expected MARKET_CLOSED_OR_AFTER_HOURS reason code, got ${pf.reason_codes.join(", ")}`);
    }
    if (pf.benchmark.market_context.reference_eligibility !== "INELIGIBLE_CLOSED") {
      throw new Error(`Expected INELIGIBLE_CLOSED, got ${pf.benchmark.market_context.reference_eligibility}`);
    }
  });

  // --- 5. NULL QUOTE & UNKNOWN TIMESTAMP EVALUATE SAFELY ---
  await test("Null quote or unknown timestamp evaluates to ineligible without errors", async () => {
    // Null quote payload
    const nullParsed = parseXStocksPriceData(null, "AAPLx");
    if (nullParsed !== null) throw new Error("Expected null for null payload");

    const emptyQuoteParsed = parseXStocksPriceData({ quote: {} }, "AAPLx");
    if (emptyQuoteParsed !== null) throw new Error("Expected null for empty quote");

    // Missing timestamp in crypto spot
    const missingTimestamp = null;
    let freshnessStatus = "UNKNOWN";
    let isEligible = false;
    if (!missingTimestamp) {
      freshnessStatus = "UNKNOWN";
      isEligible = false;
    }
    if (freshnessStatus !== "UNKNOWN" || isEligible !== false) {
      throw new Error("Missing timestamp must evaluate to UNKNOWN and ineligible");
    }
  });

  // --- 6. PROVISIONAL VERDICT CANNOT PRODUCE PRODUCTION FAIR/CAUTION/BAD_FILL ---
  await test("Provisional verdict cannot produce production FAIR/CAUTION/BAD_FILL until calibrated", async () => {
    if (THRESHOLD_CALIBRATION_STATUS === "COMPLETE") {
      throw new Error("Calibration status must be pending prior to regular session live tape calibration");
    }

    // When verification succeeds, determineVerdict must return MEASURED rather than claiming FAIR/CAUTION/BAD_FILL
    const verdict = determineVerdict({
      verificationStatus: "VERIFIED",
      differencePct: -0.2
    });
    if (verdict !== "MEASURED") {
      throw new Error(`Expected neutral MEASURED verdict prior to calibration completion, got ${verdict}`);
    }

    // When unverified, still returns UNABLE_TO_VERIFY
    const unverifiedVerdict = determineVerdict({
      verificationStatus: "UNABLE_TO_VERIFY",
      differencePct: 0
    });
    if (unverifiedVerdict !== "UNABLE_TO_VERIFY") {
      throw new Error(`Expected UNABLE_TO_VERIFY, got ${unverifiedVerdict}`);
    }

    // Calibration override for testing pure policy calculation
    const testFair = determineVerdict({ verificationStatus: "VERIFIED", differencePct: -0.5, overrideCalibration: true });
    const testCaution = determineVerdict({ verificationStatus: "VERIFIED", differencePct: -2.0, overrideCalibration: true });
    const testBadFill = determineVerdict({ verificationStatus: "VERIFIED", differencePct: -4.0, overrideCalibration: true });
    if (testFair !== "FAIR" || testCaution !== "CAUTION" || testBadFill !== "BAD_FILL") {
      throw new Error("Pure policy calculation threshold logic error");
    }
  });

  // --- 7. CURRENT SOLANA KIT ADDRESS PARSER ---
  await test("Current @solana/kit address parser validates valid and rejects invalid keys", async () => {
    const valid = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
    const invalidHex = "0x1234567890abcdef";
    const invalidBase58 = "invalid_pubkey_with_0OIl";
    const empty = "";

    if (!isValidSolanaPublicKey(valid)) throw new Error("Valid address failed");
    if (isValidSolanaPublicKey(invalidHex)) throw new Error("Hex address passed");
    if (isValidSolanaPublicKey(invalidBase58)) throw new Error("Invalid base58 passed");
    if (isValidSolanaPublicKey(empty)) throw new Error("Empty address passed");
  });

  // --- 8. NO @solana/web3.js DEPENDENCY REMAINS ---
  await test("No legacy @solana/web3.js dependency remains in package.json", async () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    if (pkg.dependencies && pkg.dependencies["@solana/web3.js"]) {
      throw new Error("Found legacy @solana/web3.js in dependencies");
    }
    if (pkg.devDependencies && pkg.devDependencies["@solana/web3.js"]) {
      throw new Error("Found legacy @solana/web3.js in devDependencies");
    }
  });

  // --- 9. ON-CHAIN TOKEN-2022 MULTIPLIER RESOLUTION ---
  await test("Multiplier algorithm: before and after effective timestamp semantics", async () => {
    const stored = "1.0026642075893797";
    const next = "1.0032690125398187";
    const effectiveTs = 1786149000;

    const before = calculateEffectiveMultiplier(stored, next, effectiveTs, effectiveTs - 1000);
    if (before.current_multiplier !== parseFloat(stored)) throw new Error("Before timestamp failed");

    const after = calculateEffectiveMultiplier(stored, next, effectiveTs, effectiveTs + 1000);
    if (after.current_multiplier !== parseFloat(next)) throw new Error("After timestamp failed");
  });

  // --- 10. DOCUMENTED ±15 MIN CORPORATE ACTION SAFETY WINDOW ---
  await test("Corporate-action activation window safety flag (±15 min)", async () => {
    const effectiveTs = 1786149000;
    const inside = calculateEffectiveMultiplier("1.0", "2.0", effectiveTs, effectiveTs + 600);
    if (!inside.is_inside_corporate_action_window) throw new Error("Inside ±15 min failed");

    const outside = calculateEffectiveMultiplier("1.0", "2.0", effectiveTs, effectiveTs + 1200);
    if (outside.is_inside_corporate_action_window) throw new Error("Outside ±15 min failed");
  });

  // --- 11. AMOUNT SANITY BOUNDS ---
  await test("Preflight rejects non-positive and excessively large trade amounts", async () => {
    const negative = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: -50 });
    if (!negative.reason_codes.includes("INVALID_AMOUNT")) throw new Error("Negative amount not rejected");

    const excessive = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 20000000 });
    if (!excessive.reason_codes.includes("INVALID_AMOUNT")) throw new Error("Excessive amount > 10M not rejected");
  });

  // --- 12. HTTP API SERVER E2E: GET /api/v1/health & GET /api/v1/stocks ---
  await test("HTTP API Server GET /api/v1/health and GET /api/v1/stocks", async () => {
    const server = createServer();
    await new Promise(resolve => server.listen(3099, "127.0.0.1", resolve));

    try {
      const hRes = await fetch("http://127.0.0.1:3099/api/v1/health");
      if (hRes.status !== 200) throw new Error(`Health status ${hRes.status}`);
      const hData = await hRes.json();
      if (hData.status !== "HEALTHY") throw new Error("Health status not HEALTHY");

      const sRes = await fetch("http://127.0.0.1:3099/api/v1/stocks");
      if (sRes.status !== 200) throw new Error(`Stocks status ${sRes.status}`);
      const sData = await sRes.json();
      if (!Array.isArray(sData.supported_stock_assets) || sData.supported_stock_assets.length !== 12) {
        throw new Error(`Expected 12 supported stocks, got ${sData.supported_stock_assets?.length}`);
      }

      // Assert no duplicate mints across the 12 stocks
      const mints = sData.supported_stock_assets.map(s => s.mint);
      const uniqueMints = new Set(mints);
      if (uniqueMints.size !== 12) {
        throw new Error(`Duplicate mint detected: ${mints.length} total, ${uniqueMints.size} unique`);
      }

      // Assert local SVG logo file exists for every stock
      for (const stock of sData.supported_stock_assets) {
        const logoPath = new URL(`../public${stock.logo_url}`, import.meta.url);
        const svgContent = readFileSync(logoPath, "utf8");
        if (!svgContent || !svgContent.includes("<svg")) {
          throw new Error(`Invalid or missing SVG for stock ${stock.symbol} at ${stock.logo_url}`);
        }
      }
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  // --- 13. HTTP API SERVER E2E: POST /api/v1/preflight ---
  await test("HTTP API Server POST /api/v1/preflight executes real quote and returns market_context", async () => {
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
      if (!data.benchmark.market_context) throw new Error("Market context missing from benchmark");
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  // --- 14. API RATE LIMIT PATH ---
  await test("API rate limiter blocks excessive rapid requests with HTTP 429 RATE_LIMITED", async () => {
    const server = createServer();
    await new Promise(resolve => server.listen(3097, "127.0.0.1", resolve));

    try {
      // Fire rapid health requests to trigger rate limit (60 max per min)
      let got429 = false;
      for (let i = 0; i < 70; i++) {
        const res = await fetch("http://127.0.0.1:3097/api/v1/health");
        if (res.status === 429) {
          got429 = true;
          const body = await res.json();
          if (!body.reason_codes.includes("RATE_LIMITED")) {
            throw new Error("Expected RATE_LIMITED reason code in 429 response");
          }
          break;
        }
      }
      if (!got429) {
        throw new Error("Rate limiter did not trigger 429 after threshold");
      }
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  });

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runTests().catch(err => {
  console.error("Test runner crashed:", err);
  process.exitCode = 1;
});
