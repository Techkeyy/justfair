// JustFair Preflight Calculation Engine (Jupiter Swap V2 + Token-2022 Effective Multipliers)
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS, API_ENDPOINTS } from "./config.js";

const BASE58_ALPHABET = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Validate a Solana public key string format before dispatching network calls
 */
export function isValidSolanaPublicKey(pubkey) {
  if (!pubkey || typeof pubkey !== "string") return false;
  return BASE58_ALPHABET.test(pubkey.trim());
}

/**
 * Resilient fetch with exponential backoff on HTTP 429 rate limits
 */
async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 800) {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429 && i < retries) {
      await new Promise(r => setTimeout(r, delayMs));
      delayMs *= 1.5;
      continue;
    }
    return res;
  }
}

/**
 * Calculate canonical US market session for a given Date object (in US Eastern Time)
 */
export function calculateMarketSession(date = new Date()) {
  const etStr = date.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etStr);
  const day = etDate.getDay(); // 0 = Sun, 6 = Sat
  const hour = etDate.getHours();
  const min = etDate.getMinutes();
  const timeNum = hour + min / 60;

  if (day === 0 || day === 6) {
    return "CLOSED";
  }
  if (timeNum >= 9.5 && timeNum < 16.0) {
    return "REGULAR";
  }
  if (timeNum >= 4.0 && timeNum < 9.5) {
    return "PRE_MARKET";
  }
  if (timeNum >= 16.0 && timeNum < 20.0) {
    return "POST_MARKET";
  }
  return "OVERNIGHT";
}

/**
 * Calculate effective Token-2022 multiplier following Solana Scaled UI Amount semantics:
 * IF currentUnixTimestamp >= newMultiplierEffectiveTimestamp: currentMultiplier = newMultiplier
 * ELSE: currentMultiplier = storedMultiplier
 */
export function calculateEffectiveMultiplier(storedMultiplier, newMultiplier, newMultiplierEffectiveTimestamp, currentUnixSec = Math.floor(Date.now() / 1000)) {
  const stored = parseFloat(storedMultiplier) || 1.0;
  const next = newMultiplier ? parseFloat(newMultiplier) : null;
  const effectiveTs = parseInt(newMultiplierEffectiveTimestamp, 10) || 0;

  let currentMultiplier = stored;
  let reason = "Using stored multiplier; no new multiplier scheduled";

  if (next && effectiveTs > 0) {
    if (currentUnixSec >= effectiveTs) {
      currentMultiplier = next;
      reason = `newMultiplier effective timestamp (${effectiveTs}) has passed`;
    } else {
      currentMultiplier = stored;
      reason = `newMultiplier is pending (effective at timestamp ${effectiveTs})`;
    }
  }

  // Safety Window: ±2 hours (7200 seconds) around effective activation timestamp
  const SAFETY_WINDOW_SECONDS = 7200;
  let isInsideCorporateActionWindow = false;
  if (effectiveTs > 0) {
    const timeDelta = Math.abs(currentUnixSec - effectiveTs);
    if (timeDelta <= SAFETY_WINDOW_SECONDS) {
      isInsideCorporateActionWindow = true;
    }
  }

  return {
    stored_multiplier: stored,
    new_multiplier: next,
    new_multiplier_effective_timestamp: effectiveTs,
    current_multiplier: currentMultiplier,
    current_multiplier_reason: reason,
    is_inside_corporate_action_window: isInsideCorporateActionWindow
  };
}

/**
 * Fetch on-chain Token-2022 extension metadata and evaluate effective multiplier
 */
export async function fetchOnChainTokenMultiplier(mintAddress, currentUnixSec = Math.floor(Date.now() / 1000)) {
  const res = await fetch(API_ENDPOINTS.SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "multiplier-check",
      method: "getAccountInfo",
      params: [mintAddress, { encoding: "jsonParsed" }]
    })
  });

  if (!res.ok) {
    throw new Error(`Solana RPC account info failed for mint ${mintAddress}: HTTP ${res.status}`);
  }

  const data = await res.json();
  const parsed = data.result?.value?.data?.parsed?.info;
  if (!parsed) {
    throw new Error(`Unable to parse on-chain account for mint ${mintAddress}`);
  }

  const scaledExt = parsed.extensions?.find(e => e.extension === "scaledUiAmountConfig");
  const storedMultiplier = scaledExt?.state?.multiplier || "1.0";
  const newMultiplier = scaledExt?.state?.newMultiplier || null;
  const effectiveTs = scaledExt?.state?.newMultiplierEffectiveTimestamp || 0;

  const evaluated = calculateEffectiveMultiplier(storedMultiplier, newMultiplier, effectiveTs, currentUnixSec);

  return {
    ...evaluated,
    decimals: parsed.decimals ?? 8,
    source: "Solana Token-2022 scaledUiAmountConfig on-chain state"
  };
}

/**
 * Fetch independent market reference benchmark price from official Nasdaq API
 */
export async function fetchMarketReference(symbol, assetClass = "stocks") {
  const url = `${API_ENDPOINTS.NASDAQ_QUOTE_BASE}/${symbol}/info?assetclass=${assetClass}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JustFair/1.0" }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch official Nasdaq quote for ${symbol}: HTTP ${res.status}`);
  }

  const data = await res.json();
  const primary = data.data?.primaryData;
  if (!primary || !primary.lastSalePrice) {
    throw new Error(`Price unavailable from Nasdaq API for ${symbol}`);
  }

  const rawPriceStr = primary.lastSalePrice.replace(/[^0-9.]/g, "");
  const price = parseFloat(rawPriceStr);
  if (isNaN(price) || price <= 0) {
    throw new Error(`Invalid price value returned for ${symbol}: ${primary.lastSalePrice}`);
  }

  const refTimestampStr = primary.lastTradeTimestamp || new Date().toISOString();
  const refTimeMs = Date.parse(refTimestampStr) || Date.now();
  const ageMs = Math.max(0, Date.now() - refTimeMs);

  const referenceSession = calculateMarketSession(new Date(refTimeMs));
  const currentSession = calculateMarketSession(new Date());

  let freshnessStatus = "FRESH";
  if (currentSession === "CLOSED" || currentSession === "OVERNIGHT") {
    freshnessStatus = "AFTER_HOURS_CLOSE";
  } else if (ageMs > 900000) {
    freshnessStatus = "STALE";
  }

  return {
    symbol,
    price,
    source: "Nasdaq Official Public Equity Quote API (api.nasdaq.com)",
    source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
    provider: "Nasdaq Real-Time Stock Market Tape",
    timestamp: new Date(refTimeMs).toISOString(),
    age_ms: ageMs,
    reference_session: referenceSession,
    current_market_session: currentSession,
    freshness_status: freshnessStatus,
    is_real_time: Boolean(primary.isRealTime)
  };
}

/**
 * Fetch independent spot price for payment assets (e.g. SOL)
 */
export async function fetchCryptoSpotPrice(cryptoPriceId = "solana") {
  const url = `${API_ENDPOINTS.COINGECKO_SIMPLE_PRICE}?ids=${cryptoPriceId}&vs_currencies=usd`;
  const res = await fetch(url, {
    headers: { "User-Agent": "JustFair/1.0" }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch crypto spot price for ${cryptoPriceId}`);
  }
  const data = await res.json();
  const price = data[cryptoPriceId]?.usd;
  if (!price || typeof price !== "number") {
    throw new Error(`Crypto price unavailable for ${cryptoPriceId}`);
  }
  return {
    price,
    symbol: "SOL",
    source: "CoinGecko Real-Time Spot Feed",
    source_type: "CRYPTO_SPOT_ORACLE",
    timestamp: new Date().toISOString(),
    age_ms: 0,
    reference_session: "24/7",
    current_market_session: "24/7",
    freshness_status: "FRESH"
  };
}

/**
 * Fetch real route from official Jupiter Swap V2 API (/swap/v2/order)
 */
export async function fetchJupiterOrderV2(inputAssetConfig, stockConfig, amountHuman, slippageBps = 50, taker = null) {
  const rawAmount = Math.floor(amountHuman * Math.pow(10, inputAssetConfig.decimals));
  if (rawAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  let url = `${API_ENDPOINTS.JUPITER_ORDER_V2}?inputMint=${inputAssetConfig.mint}&outputMint=${stockConfig.mint}&amount=${rawAmount}&slippageBps=${slippageBps}`;
  if (taker) {
    url += `&taker=${encodeURIComponent(taker)}`;
  }

  const headers = { "User-Agent": "JustFair/1.0" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }

  const quoteStartTime = Date.now();
  const res = await fetchWithRetry(url, { headers });
  const latencyMs = Date.now() - quoteStartTime;

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Jupiter Swap V2 order failed: ${errText}`);
  }
  const orderData = await res.json();
  if (orderData.error) {
    throw new Error(`Jupiter Swap V2 order error: ${orderData.error}`);
  }

  return {
    orderData,
    obtained_at: new Date().toISOString(),
    fetch_latency_ms: latencyMs
  };
}

/**
 * Simulate transaction on Solana Mainnet RPC
 */
export async function simulateSolanaTransaction(swapTransactionBase64) {
  const res = await fetch(API_ENDPOINTS.SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "justfair-sim-v2",
      method: "simulateTransaction",
      params: [
        swapTransactionBase64,
        {
          encoding: "base64",
          replaceRecentBlockhash: true,
          sigVerify: false
        }
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`Solana RPC simulation failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  const value = data.result?.value;
  const err = value?.err || null;

  return {
    status: err === null ? "PASS" : "FAIL",
    err: err,
    units_consumed: value?.unitsConsumed || 0,
    logs_count: value?.logs?.length || 0,
    logs_snippet: value?.logs?.slice(0, 3) || []
  };
}

/**
 * Execute JustFair Preflight Verification (Supports Quote Precheck & Exact Preflight via Jupiter V2)
 */
export async function runPreflight({ inputSymbol, stockSymbol, amount, userPublicKey = null }) {
  const startTime = Date.now();

  // 1. Validate Input Asset
  const inputAsset = SUPPORTED_PAYMENTS[inputSymbol];
  if (!inputAsset) {
    return {
      status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      reason_code: "UNSUPPORTED_PAYMENT_ASSET",
      reason: `Unsupported payment asset: ${inputSymbol}. Supported: ${Object.keys(SUPPORTED_PAYMENTS).join(", ")}`
    };
  }

  // 2. Validate Stock Asset
  const stockAsset = SUPPORTED_STOCKS[stockSymbol];
  if (!stockAsset) {
    return {
      status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      reason_code: "UNSUPPORTED_STOCK_ASSET",
      reason: `Unsupported tokenized stock: ${stockSymbol}. Supported: ${Object.keys(SUPPORTED_STOCKS).join(", ")}`
    };
  }

  // 3. Validate Amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return {
      status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      reason_code: "INVALID_AMOUNT",
      reason: `Invalid input amount: ${amount}`
    };
  }

  // 4. Validate Public Key if provided
  if (userPublicKey) {
    if (!isValidSolanaPublicKey(userPublicKey)) {
      return {
        status: "ERROR",
        verification_status: "UNABLE_TO_VERIFY",
        reason_code: "INVALID_PUBLIC_KEY",
        reason: `Malformed Solana public key: ${userPublicKey}`
      };
    }
  }

  try {
    // 5. Fetch Live Data: Jupiter V2 Order (with taker fallback handling), Multiplier, Benchmark
    let v2Result;
    let takerBuildError = null;

    try {
      v2Result = await fetchJupiterOrderV2(inputAsset, stockAsset, numAmount, 50, userPublicKey);
    } catch (v2Err) {
      if (userPublicKey) {
        // Fallback to Quote-only route to inspect quote economics even if taker build had issues
        takerBuildError = v2Err.message;
        v2Result = await fetchJupiterOrderV2(inputAsset, stockAsset, numAmount, 50, null);
      } else {
        throw v2Err;
      }
    }

    const [onChainMultiplierData, stockBenchmark, inputBenchmark] = await Promise.all([
      fetchOnChainTokenMultiplier(stockAsset.mint),
      fetchMarketReference(stockAsset.referenceSymbol, stockAsset.assetClass),
      inputAsset.isStable
        ? Promise.resolve({ price: 1.0, symbol: "USD", timestamp: new Date().toISOString(), age_ms: 0, reference_session: "24/7", current_market_session: "24/7", freshness_status: "FRESH" })
        : fetchCryptoSpotPrice(inputAsset.cryptoPriceId)
    ]);

    const orderData = v2Result.orderData;
    const quoteAgeMs = Date.now() - Date.parse(v2Result.obtained_at);

    // 6. Calculate Financial Exposure using current effective multiplier
    const inputUsdValue = numAmount * inputBenchmark.price;
    const rawOutAmount = parseInt(orderData.outAmount, 10);
    const rawTokens = rawOutAmount / Math.pow(10, onChainMultiplierData.decimals);
    const expectedStockShares = rawTokens * onChainMultiplierData.current_multiplier;
    const expectedStockExposureUsd = expectedStockShares * stockBenchmark.price;

    const diffUsd = expectedStockExposureUsd - inputUsdValue;
    const diffPct = (diffUsd / inputUsdValue) * 100;

    // 7. Handle Simulation (Quote Precheck vs Exact Preflight)
    let simulationResult = {
      status: "NOT_RUN",
      err: null,
      units_consumed: 0,
      logs_count: 0,
      mode: "QUOTE_PRECHECK"
    };

    let simulationPassed = true;

    if (userPublicKey) {
      if (takerBuildError) {
        simulationResult = {
          status: "FAIL",
          err: takerBuildError,
          units_consumed: 0,
          logs_count: 0,
          mode: "EXACT_PREFLIGHT"
        };
        simulationPassed = false;
      } else if (orderData.transaction) {
        const sim = await simulateSolanaTransaction(orderData.transaction);
        simulationResult = {
          status: sim.status,
          err: sim.err,
          units_consumed: sim.units_consumed,
          logs_count: sim.logs_count,
          mode: "EXACT_PREFLIGHT"
        };
        if (sim.status !== "PASS" || sim.err !== null) {
          simulationPassed = false;
        }
      } else {
        simulationResult = {
          status: "FAIL",
          err: "Jupiter V2 did not assemble transaction for taker",
          units_consumed: 0,
          logs_count: 0,
          mode: "EXACT_PREFLIGHT"
        };
        simulationPassed = false;
      }
    }

    // 8. Strict Verification Prerequisites Evaluation
    let verificationStatus = "VERIFIED";
    let reasonCode = "ALL_PREREQUISITES_PASSED";

    if (onChainMultiplierData.is_inside_corporate_action_window) {
      verificationStatus = "UNABLE_TO_VERIFY";
      reasonCode = "CORPORATE_ACTION_WINDOW";
    } else if (stockBenchmark.freshness_status === "STALE" || stockBenchmark.freshness_status === "AFTER_HOURS_CLOSE") {
      verificationStatus = "UNABLE_TO_VERIFY";
      reasonCode = stockBenchmark.freshness_status === "STALE" ? "STALE_REFERENCE" : "MARKET_CLOSED_OR_AFTER_HOURS";
    } else if (!simulationPassed) {
      verificationStatus = "UNABLE_TO_VERIFY";
      reasonCode = "SIMULATION_FAILED";
    }

    return {
      status: "SUCCESS",
      verification_status: verificationStatus,
      reason_code: reasonCode,
      stock: stockAsset.canonicalSymbol,
      token_mint: stockAsset.mint,
      token_program: stockAsset.programId,
      input_asset: inputAsset.symbol,
      input_amount: numAmount,
      input_usd_value: parseFloat(inputUsdValue.toFixed(2)),
      expected_stock_shares: parseFloat(expectedStockShares.toFixed(6)),
      expected_stock_exposure_usd: parseFloat(expectedStockExposureUsd.toFixed(2)),
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
        is_real_time: stockBenchmark.is_real_time
      },
      dex_route: {
        endpoint: API_ENDPOINTS.JUPITER_ORDER_V2,
        router: orderData.router || "jupiterz",
        quote_obtained_at: v2Result.obtained_at,
        quote_age_ms: quoteAgeMs,
        quote_fetch_latency_ms: v2Result.fetch_latency_ms,
        in_amount_raw: orderData.inAmount,
        out_amount_raw: orderData.outAmount,
        price_impact_pct: orderData.priceImpactPct || "0",
        steps: orderData.routePlan?.map(r => r.swapInfo?.label || "DEX") || []
      },
      simulation: simulationResult,
      execution_time_ms: Date.now() - startTime
    };
  } catch (err) {
    return {
      status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      reason_code: "EXECUTION_ERROR",
      reason: err.message,
      execution_time_ms: Date.now() - startTime
    };
  }
}
