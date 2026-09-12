// Comprehensive 12-Stock End-to-End Verification Script (Director Order 007.5B)
import { SUPPORTED_STOCKS, SUPPORTED_PAYMENTS } from "../src/config.js";
import { runPreflight, fetchOnChainTokenMultiplier } from "../src/preflight.js";
import { fetchMarketReference } from "../src/engine/benchmark.js";
import { fetchJupiterOrderV2 } from "../src/engine/jupiter.js";

async function verifyAll12Stocks() {
  console.log("================================================================================");
  console.log("JUSTFAIR DIRECTOR ORDER 007.5B: 12-STOCK INDIVIDUAL END-TO-END VERIFICATION");
  console.log("================================================================================\n");

  const results = [];
  const testWallet = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

  for (const [symbol, config] of Object.entries(SUPPORTED_STOCKS)) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`Verifying: ${config.name} (${symbol}) [Canonical: ${config.canonicalSymbol}]`);
    console.log(`Mint: ${config.mint}`);
    console.log(`----------------------------------------------------------------`);

    const record = {
      stock: config.name,
      xStockTicker: symbol,
      canonical: config.canonicalSymbol,
      mint: config.mint,
      multiplier: null,
      multiplierSuccess: false,
      corporateActionWindow: false,
      jupiterUSDCQuote: null,
      jupiterUSDCSuccess: false,
      jupiterSOLQuote: null,
      jupiterSOLSuccess: false,
      benchmarkSource: null,
      benchmarkAvailable: false,
      benchmarkPrice: null,
      exposureMathSuccess: false,
      expectedShares: null,
      expectedExposureUsd: null,
      differenceUsd: null,
      differencePct: null,
      simulationSuccess: false,
      simulationStatus: null,
      session: null,
      finalStatus: "SUPPORTED",
      failureReason: "None"
    };

    // 1. Multiplier & Corporate Action
    try {
      const multRes = await fetchOnChainTokenMultiplier(config.mint);
      record.multiplier = multRes.current_multiplier;
      record.multiplierSuccess = true;
      record.corporateActionWindow = multRes.is_inside_corporate_action_window;
      console.log(`  [1] On-chain Multiplier: ${multRes.current_multiplier} (window: ${multRes.is_inside_corporate_action_window})`);
    } catch (e) {
      record.multiplierSuccess = false;
      record.failureReason = `Multiplier error: ${e.message}`;
      console.log(`  [1] Multiplier FAILED: ${e.message}`);
    }

    // 2. Jupiter USDC Quote
    try {
      const usdcOrder = await fetchJupiterOrderV2(SUPPORTED_PAYMENTS.USDC, config, 500, testWallet);
      const rawOrder = usdcOrder?.orderData;
      if (rawOrder && (rawOrder.outAmount || rawOrder.order?.outAmount || rawOrder.outAmountWithSlippage)) {
        const outAmt = rawOrder.outAmount || rawOrder.order?.outAmount;
        record.jupiterUSDCQuote = outAmt / (10 ** config.decimals);
        record.jupiterUSDCSuccess = true;
        console.log(`  [2] Jupiter USDC Quote ($500 -> ${record.jupiterUSDCQuote} ${symbol}) PASS ✅`);
      } else {
        throw new Error("No outAmount in Jupiter response");
      }
    } catch (e) {
      record.jupiterUSDCSuccess = false;
      record.failureReason = `Jupiter USDC Quote failed: ${e.message}`;
      console.log(`  [2] Jupiter USDC Quote FAILED ❌: ${e.message}`);
    }

    // 3. Jupiter SOL Quote
    try {
      const solOrder = await fetchJupiterOrderV2(SUPPORTED_PAYMENTS.SOL, config, 2.0, testWallet);
      const rawOrder = solOrder?.orderData;
      if (rawOrder && (rawOrder.outAmount || rawOrder.order?.outAmount || rawOrder.outAmountWithSlippage)) {
        const outAmt = rawOrder.outAmount || rawOrder.order?.outAmount;
        record.jupiterSOLQuote = outAmt / (10 ** config.decimals);
        record.jupiterSOLSuccess = true;
        console.log(`  [3] Jupiter SOL Quote (2 SOL -> ${record.jupiterSOLQuote} ${symbol}) PASS ✅`);
      } else {
        throw new Error("No outAmount in SOL Jupiter response");
      }
    } catch (e) {
      record.jupiterSOLSuccess = false;
      console.log(`  [3] Jupiter SOL Quote FAILED ❌: ${e.message}`);
    }

    // 4. Benchmark Feed
    try {
      const benchRes = await fetchMarketReference(symbol, config.assetClass || "stocks");
      if (benchRes) {
        record.benchmarkSource = `${benchRes.provider} (${benchRes.source_type})`;
        record.benchmarkAvailable = benchRes.is_real_time !== undefined;
        record.benchmarkPrice = benchRes.price;
        record.session = benchRes.session || "REGULAR/CLOSED";
        console.log(`  [4] Benchmark: $${benchRes.price} [Session: ${benchRes.session}, Source: ${benchRes.provider}]`);
      } else {
        record.benchmarkSource = "xStocks / Nasdaq Reference Feed";
        record.benchmarkAvailable = false;
        console.log(`  [4] Benchmark returned null (market closed or reference unavailable)`);
      }
    } catch (e) {
      record.benchmarkSource = "Unavailable";
      record.benchmarkAvailable = false;
      console.log(`  [4] Benchmark error: ${e.message}`);
    }

    // 5. Full Preflight Run & Economics
    try {
      const preflightRes = await runPreflight({
        inputSymbol: "USDC",
        stockSymbol: symbol,
        amount: 500,
        userPublicKey: testWallet
      });

      if (preflightRes.request_status === "SUCCESS") {
        record.exposureMathSuccess = true;
        record.expectedShares = preflightRes.economics?.expected_stock_shares;
        record.expectedExposureUsd = preflightRes.economics?.expected_stock_exposure_usd;
        record.differenceUsd = preflightRes.economics?.difference_usd;
        record.differencePct = preflightRes.economics?.difference_pct;
        record.simulationStatus = preflightRes.simulation?.status;
        record.simulationSuccess = preflightRes.simulation?.status === "PASS" || preflightRes.simulation?.status === "NOT_RUN";
        console.log(`  [5] Preflight Economics: Spend: $${preflightRes.trade.input_usd_value} -> Exp: $${record.expectedExposureUsd} (Diff: $${record.differenceUsd}, ${record.differencePct}%)`);
        console.log(`  [6] Simulation: ${preflightRes.simulation?.status} (err: ${preflightRes.simulation?.err || "null"})`);
      } else {
        throw new Error(`Preflight status ${preflightRes.request_status}: ${preflightRes.reason_codes?.join(", ")}`);
      }
    } catch (e) {
      record.exposureMathSuccess = false;
      record.failureReason = `Preflight run failed: ${e.message}`;
      console.log(`  [5] Preflight run FAILED ❌: ${e.message}`);
    }

    // Determine final status
    if (record.multiplierSuccess && record.jupiterUSDCSuccess && record.exposureMathSuccess) {
      record.finalStatus = "SUPPORTED";
    } else if (record.multiplierSuccess && record.exposureMathSuccess && !record.jupiterUSDCSuccess) {
      record.finalStatus = "TEMPORARILY UNAVAILABLE";
    } else {
      record.finalStatus = "NOT SUPPORTED";
    }

    results.push(record);
  }

  console.log("\n================================================================================");
  console.log("FINAL 12-STOCK VERIFICATION SUMMARY TABLE");
  console.log("================================================================================\n");

  console.log(JSON.stringify(results, null, 2));

  return results;
}

verifyAll12Stocks().catch(console.error);
