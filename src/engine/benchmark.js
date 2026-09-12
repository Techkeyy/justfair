// Independent Market Benchmark & Source-Aware Verification Engine
import { API_ENDPOINTS, TIMEOUTS } from "../config.js";

/**
 * Calculate canonical US equity market session for a given Date object (US Eastern Time)
 */
export function calculateMarketSession(date = new Date()) {
  const etStr = date.toLocaleString("en-US", { timeZone: "America/New_York" });
  const etDate = new Date(etStr);
  const day = etDate.getDay(); // 0 = Sun, 6 = Sat
  const hour = etDate.getHours();
  const min = etDate.getMinutes();
  const timeNum = hour + min / 60;

  // Weekend: Saturday all day, Sunday before 20:00 ET (overnight open), Friday after 20:00 ET
  if (day === 6) {
    return "CLOSED";
  }
  if (day === 0) {
    return timeNum >= 20.0 ? "OVERNIGHT" : "CLOSED";
  }
  if (day === 5 && timeNum >= 20.0) {
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
 * Parse and adapt xStocks price-data payload.
 * Evaluates candidate feeds and extracts independent underlying equity reference (Nasdaq / Blue Ocean),
 * strictly ignoring internal onchain xStock DEX prices as independent benchmarks.
 */
export function parseXStocksPriceData(data, symbol) {
  if (!data || typeof data !== "object") return null;
  const quote = data.quote;
  if (!quote || typeof quote !== "object") return null;

  // Check if quote contains underlying provider or direct price
  const price = typeof quote.price === "number" ? quote.price : parseFloat(quote.price || quote.lastSalePrice || quote.close);
  if (isNaN(price) || price <= 0) return null;

  // Determine provider / source
  const provider = quote.provider || quote.source || (quote.exchange ? `${quote.exchange} Reference Tape` : "xStocks Aggregated Underlying Feed");
  const isUnderlying = quote.isUnderlying ?? (quote.sourceType !== "ONCHAIN_DEX" && !quote.poolAddress);
  
  // Reject if it is merely an onchain DEX pool price
  if (!isUnderlying && quote.sourceType === "ONCHAIN_DEX") {
    return null;
  }

  const rawTs = quote.timestamp || quote.lastTradeTimestamp || quote.updatedAt;
  const tsMs = rawTs ? Date.parse(rawTs) : null;
  const timestampIso = tsMs && !isNaN(tsMs) ? new Date(tsMs).toISOString() : null;

  return {
    symbol,
    price,
    provider,
    source: `xStocks Public V2 API (${provider})`,
    source_type: "UNDERLYING_EQUITY_FEED",
    timestamp: timestampIso,
    raw_timestamp: rawTs,
    session: quote.session || quote.period || null,
    is_real_time: Boolean(quote.isRealTime)
  };
}

let cachedMarketReferences = {};

export function clearMarketReferenceCache() {
  cachedMarketReferences = {};
}

/**
 * Fetch independent market reference benchmark price from official sources (xStocks V2 + Nasdaq fallback)
 */
export async function fetchMarketReference(symbol, assetClass = "stocks", forceFresh = false) {
  const now = Date.now();
  const cached = cachedMarketReferences[symbol];
  if (!forceFresh && cached && (now - cached.cachedAt < 60000)) {
    return cached.result;
  }

  const currentSession = calculateMarketSession(new Date());
  let xStocksQuote = null;
  let nasdaqQuote = null;

  // 1. Attempt xStocks V2 price-data endpoint
  try {
    const xUrl = `${API_ENDPOINTS.XSTOCKS_PRICE_DATA_BASE}/${symbol}/price-data`;
    const xRes = await fetch(xUrl, {
      headers: { "Accept": "application/json", "User-Agent": "JustFair/1.0" },
      signal: AbortSignal.timeout(TIMEOUTS.UPSTREAM_FETCH_MS)
    });
    if (xRes.ok) {
      const xJson = await xRes.json();
      xStocksQuote = parseXStocksPriceData(xJson, symbol);
    }
  } catch (e) {
    // xStocks V2 fetch failed or timed out; continue to Nasdaq fallback
  }

  // 2. Query official Nasdaq API
  try {
    const canonicalSymbol = symbol.replace(/x$/i, "");
    const nUrl = `${API_ENDPOINTS.NASDAQ_QUOTE_BASE}/${canonicalSymbol}/info?assetclass=${assetClass}`;
    const nRes = await fetch(nUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JustFair/1.0" },
      signal: AbortSignal.timeout(TIMEOUTS.UPSTREAM_FETCH_MS)
    });
    if (nRes.ok) {
      const nJson = await nRes.json();
      const primary = nJson.data?.primaryData;
      if (primary && primary.lastSalePrice) {
        const rawPriceStr = primary.lastSalePrice.replace(/[^0-9.]/g, "");
        const nPrice = parseFloat(rawPriceStr);
        if (!isNaN(nPrice) && nPrice > 0) {
          nasdaqQuote = {
            symbol: canonicalSymbol,
            price: nPrice,
            rawTs: primary.lastTradeTimestamp,
            isRealTime: Boolean(primary.isRealTime)
          };
        }
      }
    }
  } catch (e) {
    // Nasdaq fetch error
  }

  // Choose the best underlying equity reference
  let chosenQuote = xStocksQuote;
  let source = chosenQuote?.source || "Nasdaq Official Public Equity Quote API (api.nasdaq.com)";
  let price = chosenQuote?.price;
  let rawTs = chosenQuote?.raw_timestamp;
  let isRealTime = chosenQuote?.is_real_time || false;

  if (!chosenQuote && nasdaqQuote) {
    source = "Nasdaq Official Public Equity Quote API (api.nasdaq.com)";
    price = nasdaqQuote.price;
    rawTs = nasdaqQuote.rawTs;
    isRealTime = nasdaqQuote.isRealTime;
  }

  if (!price || isNaN(price)) {
    if (cached) {
      return cached.result;
    }
    throw new Error(`Underlying equity price unavailable for ${symbol}`);
  }

  // Timestamp and Age Calculation
  let refTimeMs = rawTs ? Date.parse(rawTs) : null;
  let timestampIso = null;
  let ageMs = null;
  let refSession = "UNKNOWN";

  if (refTimeMs && !isNaN(refTimeMs)) {
    timestampIso = new Date(refTimeMs).toISOString();
    ageMs = Math.max(0, Date.now() - refTimeMs);
    refSession = calculateMarketSession(new Date(refTimeMs));
  }

  // Source-Aware Eligibility Evaluation
  let referenceEligibility = "ELIGIBLE";
  let freshnessStatus = "FRESH";

  if (currentSession === "CLOSED") {
    referenceEligibility = "INELIGIBLE_CLOSED";
    freshnessStatus = "AFTER_HOURS_CLOSE";
  } else if (!timestampIso || ageMs === null) {
    referenceEligibility = "INELIGIBLE_UNKNOWN";
    freshnessStatus = "UNKNOWN";
  } else if (ageMs > 900000) { // > 15 minutes old during a live tradable session
    referenceEligibility = "INELIGIBLE_STALE";
    freshnessStatus = "STALE";
  } else {
    // Check session-specific eligibility
    if (currentSession === "REGULAR") {
      referenceEligibility = "ELIGIBLE";
      freshnessStatus = "FRESH";
    } else if (currentSession === "PRE_MARKET" || currentSession === "POST_MARKET") {
      referenceEligibility = "ELIGIBLE";
      freshnessStatus = "FRESH";
    } else if (currentSession === "OVERNIGHT") {
      referenceEligibility = "ELIGIBLE";
      freshnessStatus = "FRESH";
    }
  }

  // Truthful Source-Specific Provider Labeling (Director Order 007.5C)
  let provider = chosenQuote?.provider;
  if (!provider) {
    if (currentSession === "CLOSED" || referenceEligibility !== "ELIGIBLE") {
      provider = "Last known Nasdaq reference, not eligible";
    } else if (currentSession === "REGULAR") {
      provider = isRealTime ? "Nasdaq regular-session reference" : "Last known Nasdaq reference, not eligible";
    } else if (currentSession === "PRE_MARKET" || currentSession === "POST_MARKET") {
      provider = "Nasdaq extended-hours reference";
    } else if (currentSession === "OVERNIGHT") {
      provider = "Blue Ocean overnight reference";
    } else {
      provider = "Last known Nasdaq reference, not eligible";
    }
  }

  const marketContext = {
    session: currentSession,
    underlying_reference_available: referenceEligibility === "ELIGIBLE",
    underlying_reference_provider: provider,
    underlying_reference_timestamp: timestampIso,
    underlying_reference_age_ms: ageMs,
    reference_eligibility: referenceEligibility
  };

  const result = {
    symbol,
    price,
    source,
    source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
    provider,
    timestamp: timestampIso,
    age_ms: ageMs,
    reference_session: refSession,
    current_market_session: currentSession,
    freshness_status: freshnessStatus,
    is_real_time: isRealTime && referenceEligibility === "ELIGIBLE",
    market_context: marketContext
  };

  cachedMarketReferences[symbol] = {
    result,
    cachedAt: now
  };

  return result;
}

let cachedCryptoPrices = {};

export function clearCryptoPriceCache() {
  cachedCryptoPrices = {};
}

/**
 * Fetch independent spot price for payment assets (e.g. SOL) with strict truthful timestamp handling
 * NOTE: Never manufactures or falls back to Date.now() when upstream last_updated_at is absent.
 */
export async function fetchCryptoSpotPrice(cryptoPriceId = "solana", forceFresh = false) {
  const now = Date.now();
  const cached = cachedCryptoPrices[cryptoPriceId];

  // Return cached quote if it's less than 60s old and forceFresh is false
  if (!forceFresh && cached && (now - cached.cachedAt < 60000)) {
    const ageMs = cached.entry.timestamp ? Math.max(0, now - Date.parse(cached.entry.timestamp)) : null;
    const isFresh = ageMs !== null && ageMs <= 900000;
    return {
      ...cached.entry,
      age_ms: ageMs,
      freshness_status: isFresh ? "FRESH" : "STALE",
      is_eligible: isFresh
    };
  }

  const url = `${API_ENDPOINTS.COINGECKO_SIMPLE_PRICE}?ids=${cryptoPriceId}&vs_currencies=usd&include_last_updated_at=true`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "JustFair/1.0" },
      signal: AbortSignal.timeout(TIMEOUTS.UPSTREAM_FETCH_MS)
    });

    if (!res.ok) {
      if (cached && (now - Date.parse(cached.entry.timestamp || 0) <= 900000)) {
        return {
          ...cached.entry,
          age_ms: Math.max(0, now - Date.parse(cached.entry.timestamp)),
          is_cached_fallback: true
        };
      }
      throw new Error(`Failed to fetch crypto spot price for ${cryptoPriceId}: HTTP ${res.status}`);
    }

    const data = await res.json();
    const entry = data[cryptoPriceId];
    const price = entry?.usd;
    if (!price || typeof price !== "number") {
      if (cached && (now - Date.parse(cached.entry.timestamp || 0) <= 900000)) {
        return {
          ...cached.entry,
          age_ms: Math.max(0, now - Date.parse(cached.entry.timestamp)),
          is_cached_fallback: true
        };
      }
      throw new Error(`Crypto price unavailable for ${cryptoPriceId}`);
    }

    const upstreamSec = entry.last_updated_at;
    if (!upstreamSec || typeof upstreamSec !== "number") {
      return {
        price,
        symbol: cryptoPriceId === "solana" ? "SOL" : cryptoPriceId.toUpperCase(),
        source: "CoinGecko Simple Price Feed",
        source_type: "CRYPTO_SPOT_ORACLE",
        provider: "CoinGecko Simple Price Feed",
        timestamp: null,
        age_ms: null,
        reference_session: "24/7",
        current_market_session: "24/7",
        freshness_status: "UNKNOWN",
        is_eligible: false
      };
    }

    const upstreamMs = upstreamSec * 1000;
    const upstreamIso = new Date(upstreamMs).toISOString();
    const ageMs = Math.max(0, now - upstreamMs);
    const isFresh = ageMs <= 900000; // 15 mins

    const result = {
      price,
      symbol: cryptoPriceId === "solana" ? "SOL" : cryptoPriceId.toUpperCase(),
      source: "CoinGecko Real-Time Spot Feed",
      source_type: "CRYPTO_SPOT_ORACLE",
      provider: "CoinGecko Real-Time Spot Feed",
      timestamp: upstreamIso,
      age_ms: ageMs,
      reference_session: "24/7",
      current_market_session: "24/7",
      freshness_status: isFresh ? "FRESH" : "STALE",
      is_eligible: isFresh
    };

    cachedCryptoPrices[cryptoPriceId] = {
      entry: result,
      cachedAt: now
    };

    return result;
  } catch (err) {
    if (cached && (now - Date.parse(cached.entry.timestamp || 0) <= 900000)) {
      return {
        ...cached.entry,
        age_ms: Math.max(0, now - Date.parse(cached.entry.timestamp)),
        is_cached_fallback: true
      };
    }
    throw err;
  }
}

export const PYTH_FEEDS_REGISTRY = {
  "SOL/USD": {
    symbol: "SOL/USD",
    pythSymbol: "Crypto.SOL/USD",
    id: "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    assetClass: "crypto",
    description: "SOLANA / US DOLLAR",
    schedule: "America/New_York;O,O,O,O,O,O,O;"
  },
  "AAPLx": {
    symbol: "AAPLx",
    canonicalSymbol: "AAPL",
    pythSymbol: "Equity.US.AAPL/USD",
    id: "49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688",
    assetClass: "stocks",
    description: "APPLE INC / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "NVDAx": {
    symbol: "NVDAx",
    canonicalSymbol: "NVDA",
    pythSymbol: "Equity.US.NVDA/USD",
    id: "b1073854ed24cbc755dc527418f52b7d271f6cc967bbf8d8129112b18860a593",
    assetClass: "stocks",
    description: "NVIDIA CORP / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "SPYx": {
    symbol: "SPYx",
    canonicalSymbol: "SPY",
    pythSymbol: "Equity.US.SPY/USD",
    id: "19e09bb805456ada3979a7d1cbb4b6d63babc3a0f8e8a9509f68afa5c4c11cd5",
    assetClass: "etf",
    description: "SPY / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "TSLAx": {
    symbol: "TSLAx",
    canonicalSymbol: "TSLA",
    pythSymbol: "Equity.US.TSLA/USD",
    id: "16dad506d7db8da01c87581c87ca897a012a153557d4d578c3b9c9e1bc0632f1",
    assetClass: "stocks",
    description: "TESLA INC / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "MSFTx": {
    symbol: "MSFTx",
    canonicalSymbol: "MSFT",
    pythSymbol: "Equity.US.MSFT/USD",
    id: "d0ca23c1cc005e004ccf1db5bf76aeb6a49218f43dac3d4b275e92de12ded4d1",
    assetClass: "stocks",
    description: "MICROSOFT CORP / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "AMZNx": {
    symbol: "AMZNx",
    canonicalSymbol: "AMZN",
    pythSymbol: "Equity.US.AMZN/USD",
    id: "b5d0e0fa58a1f8b81498ae670ce93c872d14434b72c364885d4fa1b257cbb07a",
    assetClass: "stocks",
    description: "AMAZON.COM, INC. / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "GOOGLx": {
    symbol: "GOOGLx",
    canonicalSymbol: "GOOGL",
    pythSymbol: "Equity.US.GOOGL/USD",
    id: "5a48c03e9b9cb337801073ed9d166817473697efff0d138874e0f6a33d6d5aa6",
    assetClass: "stocks",
    description: "ALPHABET INC CLASS A / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "METAx": {
    symbol: "METAx",
    canonicalSymbol: "META",
    pythSymbol: "Equity.US.META/USD",
    id: "78a3e3b8e676a8f73c439f5d749737034b139bbbe899ba5775216fba596607fe",
    assetClass: "stocks",
    description: "META PLATFORMS INC / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "COINx": {
    symbol: "COINx",
    canonicalSymbol: "COIN",
    pythSymbol: "Equity.US.COIN/USD",
    id: "fee33f2a978bf32dd6b662b65ba8083c6773b494f8401194ec1870c640860245",
    assetClass: "stocks",
    description: "COINBASE GLOBAL INC / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "AMDx": {
    symbol: "AMDx",
    canonicalSymbol: "AMD",
    pythSymbol: "Equity.US.AMD/USD",
    id: "3622e381dbca2efd1859253763b1adc63f7f9abb8e76da1aa8e638a57ccde93e",
    assetClass: "stocks",
    description: "ADVANCED MICRO DEVICES INC / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "MSTRx": {
    symbol: "MSTRx",
    canonicalSymbol: "MSTR",
    pythSymbol: "Equity.US.MSTR/USD",
    id: "e1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09",
    assetClass: "stocks",
    description: "MICROSTRATEGY INC. - CLASS A / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  },
  "QQQx": {
    symbol: "QQQx",
    canonicalSymbol: "QQQ",
    pythSymbol: "Equity.US.QQQ/USD",
    id: "9695e2b96ea7b3859da9ed25b7a46a920a776e2fdae19a7bcfdf2b219230452d",
    assetClass: "etf",
    description: "INVESCO QQQ TRUST SERIES 1 / US DOLLAR",
    schedule: "America/New_York;0930-1600,0930-1600,0930-1600,0930-1600,0930-1600,C,C"
  }
};

export function isPythAuthAvailable() {
  return !!(process.env.PYTH_API_KEY && process.env.PYTH_API_KEY.trim().length > 0);
}
