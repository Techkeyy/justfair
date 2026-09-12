// JustFair Shared Equity Preflight Engine
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS, API_ENDPOINTS } from "./config.js";
import { fetchOnChainTokenMultiplier, calculateEffectiveMultiplier } from "./engine/multiplier.js";
import { fetchMarketReference, fetchCryptoSpotPrice, calculateMarketSession } from "./engine/benchmark.js";
import { fetchJupiterOrderV2 } from "./engine/jupiter.js";
import { simulateSolanaTransaction, isValidSolanaPublicKey } from "./engine/simulation.js";
import { determineVerdict, THRESHOLD_CALIBRATION_STATUS } from "./engine/verdict.js";

export {
  fetchOnChainTokenMultiplier,
  calculateEffectiveMultiplier,
  fetchMarketReference,
  fetchCryptoSpotPrice,
  calculateMarketSession,
  fetchJupiterOrderV2,
  simulateSolanaTransaction,
  isValidSolanaPublicKey,
  determineVerdict,
  THRESHOLD_CALIBRATION_STATUS
};

/**
 * Execute Unified Equity Preflight Analysis
 */
export async function runPreflight({ inputSymbol, stockSymbol, amount, userPublicKey = null }) {
  const startTime = Date.now();

  // 1. Validate Input Asset
  const inputAsset = SUPPORTED_PAYMENTS[inputSymbol];
  if (!inputAsset) {
    return {
      request_status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      verdict: "UNABLE_TO_VERIFY",
      preflight_level: userPublicKey ? "EXACT_SIMULATION" : "QUOTE_CHECK",
      reason_codes: ["UNSUPPORTED_PAYMENT_ASSET"],
      reason: `Unsupported payment asset: ${inputSymbol}. Supported: ${Object.keys(SUPPORTED_PAYMENTS).join(", ")}`,
      execution_time_ms: Date.now() - startTime
    };
  }

  // 2. Validate Stock Asset
  const stockAsset = SUPPORTED_STOCKS[stockSymbol];
  if (!stockAsset) {
    return {
      request_status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      verdict: "UNABLE_TO_VERIFY",
      preflight_level: userPublicKey ? "EXACT_SIMULATION" : "QUOTE_CHECK",
      reason_codes: ["UNSUPPORTED_STOCK_ASSET"],
      reason: `Unsupported tokenized stock: ${stockSymbol}. Supported: ${Object.keys(SUPPORTED_STOCKS).join(", ")}`,
      execution_time_ms: Date.now() - startTime
    };
  }

  // 3. Validate Amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0 || numAmount > 10000000) {
    return {
      request_status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      verdict: "UNABLE_TO_VERIFY",
      preflight_level: userPublicKey ? "EXACT_SIMULATION" : "QUOTE_CHECK",
      reason_codes: ["INVALID_AMOUNT"],
      reason: isNaN(numAmount) || numAmount <= 0 ? `Invalid input amount: ${amount}` : `Amount exceeds maximum safety limit of 10,000,000`,
      execution_time_ms: Date.now() - startTime
    };
  }

  // 4. Validate Solana Public Key if provided
  if (userPublicKey) {
    if (!isValidSolanaPublicKey(userPublicKey)) {
      return {
        request_status: "ERROR",
        verification_status: "UNABLE_TO_VERIFY",
        verdict: "UNABLE_TO_VERIFY",
        preflight_level: "EXACT_SIMULATION",
        reason_codes: ["INVALID_PUBLIC_KEY"],
        reason: `Malformed Solana public key: ${userPublicKey}`,
        execution_time_ms: Date.now() - startTime
      };
    }
  }

  try {
    // 5. Fetch Live Data: Jupiter V2 Order, Multiplier, Benchmark
    let v2Result;
    let takerBuildError = null;

    try {
      v2Result = await fetchJupiterOrderV2(inputAsset, stockAsset, numAmount, userPublicKey);
    } catch (v2Err) {
      if (userPublicKey) {
        takerBuildError = v2Err.message;
        v2Result = await fetchJupiterOrderV2(inputAsset, stockAsset, numAmount, null);
      } else {
        throw v2Err;
      }
    }

    const [onChainMultiplierData, stockBenchmark, inputBenchmark] = await Promise.all([
      fetchOnChainTokenMultiplier(stockAsset.mint),
      fetchMarketReference(stockAsset.symbol, stockAsset.assetClass),
      inputAsset.isStable
        ? Promise.resolve({
            price: 1.0,
            symbol: "USD",
            timestamp: new Date().toISOString(),
            age_ms: 0,
            reference_session: "24/7",
            current_market_session: "24/7",
            freshness_status: "FRESH",
            is_eligible: true
          })
        : fetchCryptoSpotPrice(inputAsset.cryptoPriceId)
    ]);

    const orderData = v2Result.orderData;
    const quoteAgeMs = Date.now() - Date.parse(v2Result.obtained_at);

    // 6. Compute Fairness Economics
    const inputUsdValue = numAmount * inputBenchmark.price;
    const rawOutAmount = parseInt(orderData.outAmount, 10);
    const rawTokens = rawOutAmount / Math.pow(10, onChainMultiplierData.decimals);
    const expectedStockShares = rawTokens * onChainMultiplierData.current_multiplier;
    const expectedStockExposureUsd = expectedStockShares * stockBenchmark.price;
    const effectivePricePerShare = expectedStockShares > 0 ? inputUsdValue / expectedStockShares : 0;

    const diffUsd = expectedStockExposureUsd - inputUsdValue;
    const diffPct = (diffUsd / inputUsdValue) * 100;

    // 7. Handle Simulation
    let simulationResult = {
      mode: userPublicKey ? "EXACT_SIMULATION" : "QUOTE_CHECK",
      status: "NOT_RUN",
      err: null,
      units_consumed: 0,
      logs_count: 0
    };

    let simulationPassed = true;

    if (userPublicKey) {
      if (takerBuildError) {
        simulationResult = {
          mode: "EXACT_SIMULATION",
          status: "FAIL",
          err: takerBuildError,
          units_consumed: 0,
          logs_count: 0
        };
        simulationPassed = false;
      } else if (orderData.transaction) {
        const sim = await simulateSolanaTransaction(orderData.transaction);
        simulationResult = {
          mode: "EXACT_SIMULATION",
          status: sim.status,
          err: sim.err,
          units_consumed: sim.units_consumed,
          logs_count: sim.logs_count
        };
        if (sim.status !== "PASS" || sim.err !== null) {
          simulationPassed = false;
        }
      } else {
        simulationResult = {
          mode: "EXACT_SIMULATION",
          status: "FAIL",
          err: "Jupiter V2 did not assemble transaction for taker",
          units_consumed: 0,
          logs_count: 0
        };
        simulationPassed = false;
      }
    }

    // 8. Strict Verification Prerequisites Evaluation
    const reasonCodes = [];
    let verificationStatus = "VERIFIED";

    if (onChainMultiplierData.is_inside_corporate_action_window) {
      verificationStatus = "UNABLE_TO_VERIFY";
      reasonCodes.push("CORPORATE_ACTION_WINDOW");
    }

    if (stockBenchmark.market_context?.reference_eligibility !== "ELIGIBLE") {
      verificationStatus = "UNABLE_TO_VERIFY";
      if (stockBenchmark.freshness_status === "AFTER_HOURS_CLOSE") {
        reasonCodes.push("MARKET_CLOSED_OR_AFTER_HOURS");
      } else if (stockBenchmark.freshness_status === "STALE") {
        reasonCodes.push("STALE_REFERENCE");
      } else {
        reasonCodes.push("REFERENCE_UNAVAILABLE");
      }
    }

    if (!inputBenchmark.is_eligible || inputBenchmark.freshness_status !== "FRESH") {
      verificationStatus = "UNABLE_TO_VERIFY";
      reasonCodes.push(inputBenchmark.freshness_status === "UNKNOWN" ? "UNKNOWN_INPUT_REFERENCE" : "STALE_INPUT_REFERENCE");
    }

    if (userPublicKey && !simulationPassed) {
      verificationStatus = "UNABLE_TO_VERIFY";
      reasonCodes.push("SIMULATION_FAILED");
    }

    if (reasonCodes.length === 0) {
      reasonCodes.push("ALL_PREREQUISITES_PASSED");
    }

    const verdict = determineVerdict({
      verificationStatus,
      differencePct: diffPct,
      priceImpactPct: orderData.priceImpactPct
    });

    return {
      request_status: "SUCCESS",
      verification_status: verificationStatus,
      verdict,
      preflight_level: userPublicKey ? "EXACT_SIMULATION" : "QUOTE_CHECK",
      reason_codes: reasonCodes,
      trade: {
        input_asset: inputAsset.symbol,
        input_amount: numAmount,
        input_usd_value: parseFloat(inputUsdValue.toFixed(2)),
        stock_symbol: stockAsset.symbol,
        canonical_stock: stockAsset.canonicalSymbol,
        token_mint: stockAsset.mint,
        token_program: stockAsset.programId
      },
      benchmark: {
        symbol: stockBenchmark.symbol,
        price: stockBenchmark.price,
        source: stockBenchmark.source,
        source_type: stockBenchmark.source_type,
        provider: stockBenchmark.provider,
        timestamp: stockBenchmark.timestamp,
        age_ms: stockBenchmark.age_ms,
        reference_session: stockBenchmark.reference_session,
        current_market_session: stockBenchmark.current_market_session,
        freshness_status: stockBenchmark.freshness_status,
        is_real_time: stockBenchmark.is_real_time,
        market_context: stockBenchmark.market_context
      },
      economics: {
        raw_out_amount: orderData.outAmount,
        expected_stock_shares: parseFloat(expectedStockShares.toFixed(6)),
        underlying_benchmark_price: stockBenchmark.price,
        expected_stock_exposure_usd: parseFloat(expectedStockExposureUsd.toFixed(2)),
        effective_price_per_share: parseFloat(effectivePricePerShare.toFixed(2)),
        difference_usd: parseFloat(diffUsd.toFixed(2)),
        difference_pct: parseFloat(diffPct.toFixed(2)),
        multiplier: {
          stored_multiplier: onChainMultiplierData.stored_multiplier,
          new_multiplier: onChainMultiplierData.new_multiplier,
          new_multiplier_effective_timestamp: onChainMultiplierData.new_multiplier_effective_timestamp,
          current_multiplier: onChainMultiplierData.current_multiplier,
          current_multiplier_reason: onChainMultiplierData.current_multiplier_reason,
          is_inside_corporate_action_window: onChainMultiplierData.is_inside_corporate_action_window,
          source: onChainMultiplierData.source
        }
      },
      dex_route: {
        endpoint: API_ENDPOINTS.JUPITER_ORDER_V2,
        router: orderData.router || "jupiterz",
        mode: orderData.mode || "ultra",
        fee_bps: orderData.feeBps ?? 0,
        fee_mint: orderData.feeMint || null,
        platform_fee: orderData.platformFee || null,
        price_impact_pct: orderData.priceImpactPct || "0",
        quote_obtained_at: v2Result.obtained_at,
        quote_age_ms: quoteAgeMs,
        quote_fetch_latency_ms: v2Result.fetch_latency_ms,
        steps: orderData.routePlan?.map(r => r.swapInfo?.label || "DEX") || []
      },
      simulation: simulationResult,
      execution_time_ms: Date.now() - startTime
    };
  } catch (err) {
    const isTimeout = err.name === "TimeoutError" || err.message?.toLowerCase().includes("timeout") || err.name === "AbortError";
    const isUpstreamUnavailable = err.message?.includes("failed") || err.message?.includes("fetch") || err.message?.includes("503") || err.message?.includes("502");
    const reasonCode = isTimeout ? "UPSTREAM_TIMEOUT" : isUpstreamUnavailable ? "UPSTREAM_UNAVAILABLE" : "UPSTREAM_ERROR";

    return {
      request_status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      verdict: "UNABLE_TO_VERIFY",
      preflight_level: userPublicKey ? "EXACT_SIMULATION" : "QUOTE_CHECK",
      reason_codes: [reasonCode],
      reason: err.message,
      execution_time_ms: Date.now() - startTime
    };
  }
}
