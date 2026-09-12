// JustFair Preflight Calculation Engine (Phase 0/1 Corrected with Resilient Retry)
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS, API_ENDPOINTS } from "./config.js";

/**
 * Resilient fetch with exponential backoff on HTTP 429 rate limits
 */
async function fetchWithRetry(url, options = {}, retries = 2, delayMs = 600) {
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
 * Determine market session from date in US Eastern Time
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
 * Fetch dynamic multiplier from on-chain Token-2022 ScaledUiAmount extension
 */
export async function fetchOnChainTokenMultiplier(mintAddress) {
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
  let activeMultiplier = 1.0;
  let pendingMultiplier = null;
  let pendingEffectiveTimestamp = 0;

  if (scaledExt && scaledExt.state) {
    activeMultiplier = parseFloat(scaledExt.state.multiplier) || 1.0;
    if (scaledExt.state.newMultiplier) {
      pendingMultiplier = parseFloat(scaledExt.state.newMultiplier);
      pendingEffectiveTimestamp = scaledExt.state.newMultiplierEffectiveTimestamp || 0;
    }
  }

  return {
    active_multiplier: activeMultiplier,
    pending_multiplier: pendingMultiplier,
    pending_effective_timestamp: pendingEffectiveTimestamp,
    decimals: parsed.decimals ?? 8,
    source: "Solana Token-2022 scaledUiAmountConfig on-chain state"
  };
}

/**
 * Fetch independent market reference benchmark price
 */
export async function fetchMarketReference(symbol) {
  const url = `${API_ENDPOINTS.MARKET_DATA_CHART}/${symbol}?interval=1m`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JustFair/1.0" }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch reference for ${symbol}: HTTP ${res.status}`);
  }
  const data = await res.json();
  const meta = data.chart?.result?.[0]?.meta;
  if (!meta) {
    throw new Error(`Invalid benchmark response for ${symbol}`);
  }
  const price = meta.regularMarketPrice ?? meta.chartPreviousClose;
  if (!price || typeof price !== "number") {
    throw new Error(`Price unavailable for ${symbol}`);
  }

  const refTimeMs = meta.regularMarketTime ? meta.regularMarketTime * 1000 : Date.now();
  const ageMs = Math.max(0, Date.now() - refTimeMs);
  const session = calculateMarketSession(new Date(refTimeMs));

  let freshness = "FRESH";
  if (session === "CLOSED" || session === "OVERNIGHT") {
    freshness = "AFTER_HOURS_CLOSE";
  } else if (ageMs > 900000) {
    freshness = "STALE";
  }

  return {
    symbol,
    price,
    source: "Market Aggregator (Yahoo / Nasdaq Tape Reference)",
    source_type: "MARKET_DATA_AGGREGATOR",
    timestamp: new Date(refTimeMs).toISOString(),
    age_ms: ageMs,
    market_session: session,
    freshness_status: freshness
  };
}

/**
 * Fetch real Jupiter DEX quote via official api.jup.ag
 */
export async function fetchJupiterQuote(inputAssetConfig, stockConfig, amountHuman, slippageBps = 50) {
  const rawAmount = Math.floor(amountHuman * Math.pow(10, inputAssetConfig.decimals));
  if (rawAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const headers = { "User-Agent": "JustFair/1.0" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }

  const url = `${API_ENDPOINTS.JUPITER_QUOTE}?inputMint=${inputAssetConfig.mint}&outputMint=${stockConfig.mint}&amount=${rawAmount}&slippageBps=${slippageBps}`;
  const res = await fetchWithRetry(url, { headers });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Jupiter quote failed: ${errText}`);
  }
  const quote = await res.json();
  if (quote.error) {
    throw new Error(`Jupiter quote error: ${quote.error}`);
  }
  return quote;
}

/**
 * Build unsigned VersionedTransaction via official api.jup.ag/swap/v1/swap
 */
export async function buildUnsignedSwapTransaction(quoteResponse, userPublicKey) {
  const headers = { "Content-Type": "application/json", "User-Agent": "JustFair/1.0" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }

  const payload = {
    quoteResponse,
    userPublicKey,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true
  };

  if (quoteResponse.platformFee && parseInt(quoteResponse.platformFee.amount, 10) > 0) {
    payload.feeAccount = quoteResponse.inputMint;
  }

  const res = await fetchWithRetry(API_ENDPOINTS.JUPITER_SWAP, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Jupiter swap build failed: ${errText}`);
  }
  const data = await res.json();
  if (!data.swapTransaction) {
    throw new Error(data.error || "No swapTransaction returned by Jupiter Swap API");
  }
  return data.swapTransaction;
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
      id: "justfair-sim-main",
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
 * Execute JustFair Preflight Verification (Supports Quote Precheck & Exact Preflight)
 */
export async function runPreflight({ inputSymbol, stockSymbol, amount, userPublicKey = null }) {
  const startTime = Date.now();

  // 1. Validate Input Asset
  const inputAsset = SUPPORTED_PAYMENTS[inputSymbol];
  if (!inputAsset) {
    return {
      status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      reason: `Unsupported payment asset: ${inputSymbol}. Supported: ${Object.keys(SUPPORTED_PAYMENTS).join(", ")}`
    };
  }

  // 2. Validate Stock Asset
  const stockAsset = SUPPORTED_STOCKS[stockSymbol];
  if (!stockAsset) {
    return {
      status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      reason: `Unsupported tokenized stock: ${stockSymbol}. Supported: ${Object.keys(SUPPORTED_STOCKS).join(", ")}`
    };
  }

  // 3. Validate Amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return {
      status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      reason: `Invalid input amount: ${amount}`
    };
  }

  try {
    // 4. Fetch Live Data: Jupiter Quote, On-Chain Multiplier, Market Benchmark
    const quoteStartTime = Date.now();
    const [quote, onChainMultiplierData, stockBenchmark, inputBenchmark] = await Promise.all([
      fetchJupiterQuote(inputAsset, stockAsset, numAmount),
      fetchOnChainTokenMultiplier(stockAsset.mint),
      fetchMarketReference(stockAsset.referenceSymbol),
      inputAsset.isStable
        ? Promise.resolve({ price: 1.0, symbol: "USD", timestamp: new Date().toISOString(), age_ms: 0, market_session: "24/7", freshness_status: "FRESH" })
        : fetchMarketReference(inputAsset.referenceSymbol)
    ]);
    const quoteAgeMs = Date.now() - quoteStartTime;

    // 5. Calculate Financial Exposure using dynamic on-chain multiplier
    const inputUsdValue = numAmount * inputBenchmark.price;
    const rawOutAmount = parseInt(quote.outAmount, 10);
    const rawTokens = rawOutAmount / Math.pow(10, onChainMultiplierData.decimals);
    const expectedStockShares = rawTokens * onChainMultiplierData.active_multiplier;
    const expectedStockExposureUsd = expectedStockShares * stockBenchmark.price;

    const diffUsd = expectedStockExposureUsd - inputUsdValue;
    const diffPct = (diffUsd / inputUsdValue) * 100;

    // 6. Handle Simulation Modes (Quote Precheck vs Exact Preflight)
    let simulationResult = {
      status: "NOT_RUN",
      err: null,
      units_consumed: 0,
      logs_count: 0,
      mode: "QUOTE_PRECHECK"
    };

    let verificationStatus = "VERIFIED";

    if (userPublicKey) {
      // EXACT PREFLIGHT MODE
      try {
        const swapTxBase64 = await buildUnsignedSwapTransaction(quote, userPublicKey);
        const sim = await simulateSolanaTransaction(swapTxBase64);
        simulationResult = {
          status: sim.status,
          err: sim.err,
          units_consumed: sim.units_consumed,
          logs_count: sim.logs_count,
          mode: "EXACT_PREFLIGHT"
        };
        if (sim.status !== "PASS") {
          verificationStatus = "UNABLE_TO_VERIFY";
        }
      } catch (simErr) {
        simulationResult = {
          status: "FAIL",
          err: simErr.message,
          units_consumed: 0,
          logs_count: 0,
          mode: "EXACT_PREFLIGHT"
        };
        verificationStatus = "UNABLE_TO_VERIFY";
      }
    }

    return {
      status: "SUCCESS",
      verification_status: verificationStatus,
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
        active: onChainMultiplierData.active_multiplier,
        pending: onChainMultiplierData.pending_multiplier,
        pending_effective_timestamp: onChainMultiplierData.pending_effective_timestamp,
        source: onChainMultiplierData.source
      },
      benchmark: {
        symbol: stockBenchmark.symbol,
        price: stockBenchmark.price,
        source: stockBenchmark.source,
        source_type: stockBenchmark.source_type,
        timestamp: stockBenchmark.timestamp,
        age_ms: stockBenchmark.age_ms,
        market_session: stockBenchmark.market_session,
        freshness_status: stockBenchmark.freshness_status
      },
      dex_route: {
        endpoint: API_ENDPOINTS.JUPITER_QUOTE,
        quote_age_ms: quoteAgeMs,
        in_amount_raw: quote.inAmount,
        out_amount_raw: quote.outAmount,
        price_impact_pct: quote.priceImpactPct || "0",
        steps: quote.routePlan?.map(r => r.swapInfo.label) || []
      },
      simulation: simulationResult,
      execution_time_ms: Date.now() - startTime
    };
  } catch (err) {
    return {
      status: "ERROR",
      verification_status: "UNABLE_TO_VERIFY",
      reason: err.message,
      execution_time_ms: Date.now() - startTime
    };
  }
}
