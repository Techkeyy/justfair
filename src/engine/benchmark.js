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
