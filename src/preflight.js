// JustFair Preflight Calculation Engine
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS, API_ENDPOINTS, SIMULATION_DUMMY_WALLET } from "./config.js";

/**
 * Fetch independent market reference benchmark price
 */
export async function fetchMarketReference(symbol) {
  const url = `${API_ENDPOINTS.YAHOO_CHART_BASE}/${symbol}?interval=1m`;
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
  return {
    symbol,
    currency: meta.currency || "USD",
    exchange: meta.exchangeName || "UNKNOWN",
    price: price,
    timestamp: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString()
  };
}

/**
 * Fetch real Jupiter DEX quote
 */
export async function fetchJupiterQuote(inputAssetConfig, stockConfig, amountHuman, slippageBps = 50) {
  const rawAmount = Math.floor(amountHuman * Math.pow(10, inputAssetConfig.decimals));
  if (rawAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const url = `${API_ENDPOINTS.JUPITER_QUOTE}?inputMint=${inputAssetConfig.mint}&outputMint=${stockConfig.mint}&amount=${rawAmount}&slippageBps=${slippageBps}`;
  const res = await fetch(url);
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
 * Build unsigned VersionedTransaction via Jupiter Swap API
 */
export async function buildUnsignedSwapTransaction(quoteResponse, userPublicKey = SIMULATION_DUMMY_WALLET) {
  const payload = {
    quoteResponse,
    userPublicKey,
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: "auto"
  };

  // If quote contains platform fee, provide fallback feeAccount
  if (quoteResponse.platformFee) {
    payload.feeAccount = quoteResponse.inputMint;
  }

  const res = await fetch(API_ENDPOINTS.JUPITER_SWAP, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Jupiter swap tx build failed: ${errText}`);
  }
  const data = await res.json();
  if (!data.swapTransaction) {
    throw new Error("No swapTransaction returned by Jupiter API");
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
      id: "justfair-sim-1",
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
  return {
    rawErr: value?.err || null,
    unitsConsumed: value?.unitsConsumed || 0,
    logsCount: value?.logs?.length || 0,
    logsSnippet: value?.logs?.slice(0, 3) || []
  };
}

/**
 * Execute full JustFair Preflight Verification
 */
export async function runPreflight({ inputSymbol, stockSymbol, amount, userPublicKey = SIMULATION_DUMMY_WALLET }) {
  const startTime = Date.now();

  // 1. Validate Input Asset
  const inputAsset = SUPPORTED_PAYMENTS[inputSymbol];
  if (!inputAsset) {
    return {
      status: "ERROR",
      verdict: "UNABLE_TO_VERIFY",
      reason: `Unsupported payment asset: ${inputSymbol}. Supported: ${Object.keys(SUPPORTED_PAYMENTS).join(", ")}`
    };
  }

  // 2. Validate Stock Asset
  const stockAsset = SUPPORTED_STOCKS[stockSymbol];
  if (!stockAsset) {
    return {
      status: "ERROR",
      verdict: "UNABLE_TO_VERIFY",
      reason: `Unsupported tokenized stock: ${stockSymbol}. Supported: ${Object.keys(SUPPORTED_STOCKS).join(", ")}`
    };
  }

  // 3. Validate Amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return {
      status: "ERROR",
      verdict: "UNABLE_TO_VERIFY",
      reason: `Invalid input amount: ${amount}`
    };
  }

  try {
    // 4. Fetch Benchmark Data in parallel
    const [quote, stockBenchmark, inputBenchmark] = await Promise.all([
      fetchJupiterQuote(inputAsset, stockAsset, numAmount),
      fetchMarketReference(stockAsset.referenceSymbol),
      inputAsset.isStable ? Promise.resolve({ price: 1.0, symbol: "USD" }) : fetchMarketReference(inputAsset.referenceSymbol)
    ]);

    // 5. Compute Financial Exposure & Fairness
    const inputUsdValue = numAmount * inputBenchmark.price;
    const rawOutAmount = parseInt(quote.outAmount, 10);
    const expectedStockTokens = rawOutAmount / Math.pow(10, stockAsset.decimals);
    const expectedStockShares = expectedStockTokens * stockAsset.multiplier;
    const expectedStockExposureUsd = expectedStockShares * stockBenchmark.price;

    const diffUsd = expectedStockExposureUsd - inputUsdValue;
    const diffPct = (diffUsd / inputUsdValue) * 100;

    // 6. Build Unsigned Transaction
    let swapTxBase64 = null;
    let simResult = null;
    try {
      swapTxBase64 = await buildUnsignedSwapTransaction(quote, userPublicKey);
      simResult = await simulateSolanaTransaction(swapTxBase64);
    } catch (simErr) {
      simResult = { error: simErr.message };
    }

    // 7. Structured Verdict Determination
    // FAIR: Difference >= -1.5% (normal DEX fee / minor spread)
    // CAUTION: Difference between -1.5% and -3.5% (moderate slippage/spread)
    // BAD_FILL: Difference < -3.5% (severe price gouging / low liquidity)
    let verdict = "FAIR";
    if (diffPct < -3.5) {
      verdict = "BAD_FILL";
    } else if (diffPct < -1.5) {
      verdict = "CAUTION";
    }

    return {
      status: "SUCCESS",
      verdict,
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
      benchmark: {
        symbol: stockBenchmark.symbol,
        exchange: stockBenchmark.exchange,
        price: stockBenchmark.price,
        timestamp: stockBenchmark.timestamp,
        source: "Nasdaq/TradFi Reference Feed"
      },
      dex_route: {
        in_amount_raw: quote.inAmount,
        out_amount_raw: quote.outAmount,
        price_impact_pct: quote.priceImpactPct || "0",
        steps: quote.routePlan?.map(r => r.swapInfo.label) || []
      },
      simulation: {
        status: simResult?.error ? "SIMULATION_SKIPPED" : "EVALUATED_ON_MAINNET",
        units_consumed: simResult?.unitsConsumed || 0,
        logs_count: simResult?.logsCount || 0
      },
      execution_time_ms: Date.now() - startTime
    };
  } catch (err) {
    return {
      status: "ERROR",
      verdict: "UNABLE_TO_VERIFY",
      reason: err.message,
      execution_time_ms: Date.now() - startTime
    };
  }
}
