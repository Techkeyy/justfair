// Independent Market Benchmark & Source-Aware Verification Engine
import { API_ENDPOINTS, TIMEOUTS } from "../config.js";
import { fetchAlpacaLatestQuote, ALPACA_FEEDS } from "./alpaca.js";

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
  // Live shape (verified 2026-09-15): a bare indicative number with no
  // timestamp, session, or source fields. Usable as an indicative reference
  // only — never as freshness-certified evidence (Director Order 016).
  if (typeof data.quote === "number") {
    if (isNaN(data.quote) || data.quote <= 0) return null;
    return {
      symbol,
      price: data.quote,
      provider: null,
      source: "xStocks Public Price Data",
      source_type: "INDICATIVE_ASSET_PRICE",
      timestamp: null,
      raw_timestamp: null,
      session: null,
      is_real_time: false,
      is_indicative: true
    };
  }
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
    is_real_time: Boolean(quote.isRealTime),
    is_indicative: false
  };
}

// Canonical technical freshness rule (shared by eligibility, selection, and
// cache honesty). A reference older than this can never certify a comparison.
// This is a TECHNICAL staleness guard against obviously stale or delayed
// upstream data — not a financial GOOD/BAD threshold, and unrelated to any
// vendor plan limit (e.g. Alpaca historical-data delay vs live-quote
// freshness are different concepts). Timestamp validity and session alignment
// are enforced as separate gates; age alone never certifies anything.
export const REFERENCE_FRESHNESS_MAX_AGE_MS = 900000; // 15 minutes

let cachedMarketReferences = {};

export function clearMarketReferenceCache() {
  cachedMarketReferences = {};
}

/**
 * Fetch independent market reference benchmark price from official sources (xStocks V2 + Nasdaq fallback)
 */
export async function fetchMarketReference(symbol, assetClass = "stocks", forceFresh = false) {
  const now = Date.now();
  const currentSession = calculateMarketSession(new Date());
  const cached = cachedMarketReferences[symbol];
  if (!forceFresh && cached && (now - cached.cachedAt < 60000)) {
    return refreshCachedReference(cached, currentSession, now);
  }

  let xStocksQuote = null;
  let nasdaqQuote = null;
  let alpacaQuote = null;
  const canonicalSymbol = symbol.replace(/x$/i, "");

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

  // 2b. Alpaca session quote (session-appropriate feed; skipped when CLOSED
  // to preserve rate limit, and inert without credentials). Any failure —
  // 401/403/429/timeout/missing fields — falls through truthfully.
  if (currentSession !== "CLOSED") {
    const feed = currentSession === "OVERNIGHT" ? ALPACA_FEEDS.OVERNIGHT : ALPACA_FEEDS.IEX;
    try {
      alpacaQuote = await fetchAlpacaLatestQuote(canonicalSymbol, feed);
    } catch (e) {
      alpacaQuote = null;
    }
  }

  const selection = selectEquityBenchmark({ currentSession, xstocksQuote: xStocksQuote, nasdaqQuote, alpacaQuote });
  const fetchedAt = new Date(now).toISOString();

  if (selection.kind === "none") {
    if (cached) {
      return refreshCachedReference(cached, currentSession, now);
    }
    throw new Error(`Underlying equity price unavailable for ${symbol}`);
  }

  let built;
  if (selection.kind === "indicative") {
    built = buildIndicativeBenchmark({ symbol, price: selection.price, currentSession, fetchedAt });
  } else if (selection.kind === "alpaca") {
    built = buildAlpacaBenchmark({ symbol, candidate: selection.candidate, currentSession, fetchedAt });
  } else {
    built = buildDatedBenchmark({ symbol, candidate: selection.candidate, currentSession, fetchedAt, nowMs: now });
  }

  cachedMarketReferences[symbol] = {
    result: built.result,
    cachedAt: now,
    kind: selection.kind,
    parts: built.parts
  };
  return built.result;
}

/**
 * Assemble a dated benchmark result. Pure apart from inputs.
 */
export function buildDatedBenchmark({ symbol, candidate, currentSession, fetchedAt, nowMs }) {
  const quote = candidate.quote;
  const isNasdaq = candidate.kind === "nasdaq";
  const source = isNasdaq
    ? "Nasdaq Official Public Equity Quote API (api.nasdaq.com)"
    : quote.source;
  const price = quote.price;
  const rawTs = isNasdaq ? quote.rawTs : (quote.raw_timestamp || quote.timestamp);
  const isRealTime = !!quote.isRealTime;
  const refTimeMs = candidate.refTimeMs ?? null;
  const timestampIso = candidate.timestampIso ?? null;
  const ageMs = candidate.ageMs ?? (refTimeMs ? Math.max(0, nowMs - refTimeMs) : null);
  const refSession = refTimeMs ? calculateMarketSession(new Date(refTimeMs)) : "UNKNOWN";
  const { referenceEligibility, freshnessStatus } = evaluateReferenceEligibility({ currentSession, timestampIso, ageMs });
  const provider = labelReferenceProvider({
    chosenProvider: isNasdaq ? null : (quote.provider || null),
    currentSession,
    referenceEligibility,
    isRealTime
  });
  const result = {
    symbol,
    price,
    reference_price_type: "LAST_REFERENCE",
    bid_price: null,
    ask_price: null,
    midpoint: null,
    currency: "USD",
    feed: null,
    source,
    source_type: isNasdaq ? "OFFICIAL_MARKET_DATA_PROVIDER" : (quote.source_type || "UNDERLYING_EQUITY_FEED"),
    provider,
    upstream_source: isNasdaq
      ? "Nasdaq Official Public Equity Quote API"
      : "xStocks Public Price Data",
    timestamp: timestampIso,
    source_timestamp: timestampIso,
    fetched_at: fetchedAt,
    reference_date: timestampIso ? timestampIso.slice(0, 10) : null,
    age_ms: ageMs,
    reference_session: refSession,
    current_market_session: currentSession,
    freshness_status: freshnessStatus,
    is_real_time: isRealTime && referenceEligibility === "ELIGIBLE",
    market_context: {
      session: currentSession,
      underlying_reference_available: referenceEligibility === "ELIGIBLE",
      underlying_reference_provider: provider,
      underlying_reference_timestamp: timestampIso,
      underlying_reference_age_ms: ageMs,
      reference_eligibility: referenceEligibility
    }
  };
  return {
    result,
    parts: {
      kind: "dated", candidateKind: candidate.kind, source, price, rawTs,
      isRealTime, refTimeMs, chosenProvider: isNasdaq ? null : (quote.provider || null)
    }
  };
}

/**
 * Assemble an Alpaca session-quote benchmark. Buy-side reference price is
 * the ASK (the quoted price to acquire the underlying); midpoint is derived
 * math, never an upstream price. Session-qualified, timestamp-proven.
 */
export function buildAlpacaBenchmark({ symbol, candidate, currentSession, fetchedAt }) {
  const q = candidate.quote;
  const midpoint = (q.bid_price + q.ask_price) / 2;
  const feedLabel = q.feed === "overnight" ? "Overnight" : "IEX";
  const provider = `Alpaca ${feedLabel}`;
  const result = {
    symbol,
    price: q.ask_price,
    reference_price_type: "ASK",
    bid_price: q.bid_price,
    ask_price: q.ask_price,
    midpoint,
    currency: "USD",
    feed: q.feed,
    source: "Alpaca Market Data",
    source_type: "ALPACA_QUOTE",
    provider,
    upstream_source: q.upstream_source,
    timestamp: q.source_timestamp,
    source_timestamp: q.source_timestamp,
    fetched_at: fetchedAt,
    reference_date: q.source_timestamp.slice(0, 10),
    age_ms: candidate.ageMs,
    reference_session: candidate.quoteSession,
    current_market_session: currentSession,
    freshness_status: "FRESH",
    is_real_time: true,
    market_context: {
      session: currentSession,
      underlying_reference_available: true,
      underlying_reference_provider: provider,
      underlying_reference_timestamp: q.source_timestamp,
      underlying_reference_age_ms: candidate.ageMs,
      reference_eligibility: "ELIGIBLE"
    }
  };
  return {
    result,
    parts: { kind: "alpaca", feed: q.feed, source_timestamp: q.source_timestamp, refTimeMs: candidate.refTimeMs, provider, isRealTime: true }
  };
}

/**
 * Assemble an indicative benchmark result: truthful number, uncertifiable
 * freshness. Never ELIGIBLE, never timestamped.
 */
export function buildIndicativeBenchmark({ symbol, price, currentSession, fetchedAt }) {
  const provider = "xStocks Public Price Data (indicative)";
  const result = {
    symbol,
    price,
    reference_price_type: "INDICATIVE_PRICE",
    bid_price: null,
    ask_price: null,
    midpoint: null,
    currency: "USD",
    feed: null,
    source: "xStocks Public Price Data",
    source_type: "INDICATIVE_ASSET_PRICE",
    provider,
    upstream_source: "On-chain providers (cached) + Nasdaq (Blue Ocean overnight/extended hours)",
    timestamp: null,
    source_timestamp: null,
    fetched_at: fetchedAt,
    reference_date: null,
    age_ms: null,
    reference_session: "UNKNOWN",
    current_market_session: currentSession,
    freshness_status: "INDICATIVE_UNVERIFIED",
    is_real_time: false,
    market_context: {
      session: currentSession,
      underlying_reference_available: false,
      underlying_reference_provider: provider,
      underlying_reference_timestamp: null,
      underlying_reference_age_ms: null,
      reference_eligibility: "INELIGIBLE_INDICATIVE"
    }
  };
  return { result, parts: { kind: "indicative", price } };
}

/**
 * Refresh a cached entry: recompute age-sensitive fields so a reused
 * response can never present a stale-cached age as current (016 §26).
 */
export function refreshCachedReference(cached, currentSession, nowMs) {
  if (!cached || !cached.parts) return cached?.result;
  if (cached.parts.kind === "indicative") {
    return { ...cached.result };
  }
  if (cached.parts.kind === "alpaca") {
    const p = cached.parts;
    const ageMs = p.refTimeMs ? Math.max(0, nowMs - p.refTimeMs) : null;
    const quoteSession = p.refTimeMs ? calculateMarketSession(new Date(p.refTimeMs)) : null;
    // Session match + technical freshness, else truthfully degraded (never refetched here).
    const stillCurrent = ageMs !== null && ageMs <= REFERENCE_FRESHNESS_MAX_AGE_MS && quoteSession === currentSession;
    const freshness = stillCurrent ? "FRESH" : "STALE";
    const eligibility = stillCurrent ? "ELIGIBLE" : "INELIGIBLE_STALE";
    return {
      ...cached.result,
      age_ms: ageMs,
      freshness_status: freshness,
      is_real_time: stillCurrent,
      current_market_session: currentSession,
      market_context: {
        ...cached.result.market_context,
        session: currentSession,
        underlying_reference_available: stillCurrent,
        underlying_reference_age_ms: ageMs,
        reference_eligibility: eligibility
      }
    };
  }
  const p = cached.parts;
  const ageMs = p.refTimeMs ? Math.max(0, nowMs - p.refTimeMs) : null;
  const timestampIso = p.refTimeMs ? new Date(p.refTimeMs).toISOString() : null;
  const { referenceEligibility, freshnessStatus } = evaluateReferenceEligibility({ currentSession, timestampIso, ageMs });
  const provider = labelReferenceProvider({
    chosenProvider: p.chosenProvider, currentSession, referenceEligibility, isRealTime: false
  });
  return {
    ...cached.result,
    age_ms: ageMs,
    timestamp: timestampIso,
    source_timestamp: timestampIso,
    reference_date: timestampIso ? timestampIso.slice(0, 10) : null,
    freshness_status: freshnessStatus,
    is_real_time: !!p.isRealTime && referenceEligibility === "ELIGIBLE",
    current_market_session: currentSession,
    market_context: {
      ...cached.result.market_context,
      session: currentSession,
      underlying_reference_available: referenceEligibility === "ELIGIBLE",
      underlying_reference_provider: provider,
      underlying_reference_timestamp: timestampIso,
      underlying_reference_age_ms: ageMs,
      reference_eligibility: referenceEligibility
    }
  };
}

/**
 * Pure eligibility evaluation shared by fresh and cached references.
 * Session-appropriate freshness only; never inferred from session alone.
 */
export function evaluateReferenceEligibility({ currentSession, timestampIso, ageMs }) {
  if (currentSession === "CLOSED") {
    return { referenceEligibility: "INELIGIBLE_CLOSED", freshnessStatus: "AFTER_HOURS_CLOSE" };
  }
  if (!timestampIso || ageMs === null || ageMs === undefined) {
    return { referenceEligibility: "INELIGIBLE_UNKNOWN", freshnessStatus: "UNKNOWN" };
  }
  if (ageMs > REFERENCE_FRESHNESS_MAX_AGE_MS) { // > 15 minutes old during a live tradable session
    return { referenceEligibility: "INELIGIBLE_STALE", freshnessStatus: "STALE" };
  }
  return { referenceEligibility: "ELIGIBLE", freshnessStatus: "FRESH" };
}

/**
 * Pure provider labeling shared by fresh and cached references.
 */
export function labelReferenceProvider({ chosenProvider, currentSession, referenceEligibility, isRealTime }) {
  if (chosenProvider) return chosenProvider;
  if (currentSession === "CLOSED" || referenceEligibility !== "ELIGIBLE") {
    return "Last known Nasdaq reference, not eligible";
  }
  if (currentSession === "REGULAR") {
    return isRealTime ? "Nasdaq regular-session reference" : "Last known Nasdaq reference, not eligible";
  }
  if (currentSession === "PRE_MARKET" || currentSession === "POST_MARKET") {
    return "Nasdaq extended-hours reference";
  }
  if (currentSession === "OVERNIGHT") {
    return "Blue Ocean overnight reference";
  }
  return "Last known Nasdaq reference, not eligible";
}

/**
 * Pure source selection (Director Orders 016/017): strongest truthful
 * reference wins. Alpaca candidates carry requireSession: the quote's own
 * session must equal the current session, else they cannot certify it.
 * Precedence per session:
 *   REGULAR: Nasdaq eligible, Alpaca eligible, indicative, dated fallback.
 *   PRE/POST/OVERNIGHT: Alpaca eligible, Nasdaq eligible, indicative, fallback.
 * Returns { kind: "dated"|"alpaca", candidate } | { kind: "indicative", price } | { kind: "none" }.
 */
export function selectEquityBenchmark({ currentSession, xstocksQuote, nasdaqQuote, alpacaQuote = null }) {
  const dated = [];
  if (xstocksQuote && !xstocksQuote.is_indicative && xstocksQuote.price > 0) {
    dated.push({ kind: "xstocks", quote: xstocksQuote });
  }
  if (nasdaqQuote && nasdaqQuote.price > 0) {
    dated.push({ kind: "nasdaq", quote: nasdaqQuote });
  }
  for (const c of dated) {
    const refTimeMs = c.quote.rawTs ? Date.parse(c.quote.rawTs) : (c.quote.timestamp ? Date.parse(c.quote.timestamp) : null);
    c.refTimeMs = refTimeMs && !isNaN(refTimeMs) ? refTimeMs : null;
    c.timestampIso = c.refTimeMs ? new Date(c.refTimeMs).toISOString() : null;
    c.ageMs = c.refTimeMs ? Math.max(0, Date.now() - c.refTimeMs) : null;
    const evald = evaluateReferenceEligibility({ currentSession, timestampIso: c.timestampIso, ageMs: c.ageMs });
    c.referenceEligibility = evald.referenceEligibility;
    c.freshnessStatus = evald.freshnessStatus;
  }
  // Alpaca candidate: valid bid/ask + provable timestamp + session alignment
  // + technical freshness. Never certified otherwise.
  let alpacaCandidate = null;
  if (alpacaQuote && alpacaQuote.ask_price > 0 && alpacaQuote.bid_price > 0) {
    const tsMs = alpacaQuote.source_timestamp ? Date.parse(alpacaQuote.source_timestamp) : null;
    const validTs = tsMs && !isNaN(tsMs) ? tsMs : null;
    const quoteSession = validTs ? calculateMarketSession(new Date(validTs)) : null;
    const ageMs = validTs ? Math.max(0, Date.now() - validTs) : null;
    if (validTs && quoteSession === currentSession && ageMs !== null && ageMs <= REFERENCE_FRESHNESS_MAX_AGE_MS) {
      alpacaCandidate = {
        kind: "alpaca",
        quote: alpacaQuote,
        refTimeMs: validTs,
        timestampIso: new Date(validTs).toISOString(),
        ageMs,
        referenceEligibility: "ELIGIBLE",
        freshnessStatus: "FRESH",
        quoteSession
      };
    }
  }
  const nasdaqEligible = dated.find(c => c.kind === "nasdaq" && c.referenceEligibility === "ELIGIBLE");
  // 1/2. Current reference with per-session precedence.
  if (currentSession === "REGULAR") {
    if (nasdaqEligible) return { kind: "dated", candidate: nasdaqEligible };
    if (alpacaCandidate) return { kind: "alpaca", candidate: alpacaCandidate };
  } else {
    if (alpacaCandidate) return { kind: "alpaca", candidate: alpacaCandidate };
    const anyEligible = dated.find(c => c.referenceEligibility === "ELIGIBLE");
    if (anyEligible) return { kind: "dated", candidate: nasdaqEligible || anyEligible };
  }
  // 3. Indicative xStocks price: truthful number, uncertifiable freshness.
  if (xstocksQuote && xstocksQuote.is_indicative && xstocksQuote.price > 0) {
    return { kind: "indicative", price: xstocksQuote.price };
  }
  // 4. Legacy dated fallback order.
  if (dated.length > 0) {
    const xstocksDated = dated.find(c => c.kind === "xstocks");
    return { kind: "dated", candidate: xstocksDated || dated[0] };
  }
  return { kind: "none" };
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
    const isFresh = ageMs !== null && ageMs <= REFERENCE_FRESHNESS_MAX_AGE_MS;
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
      if (cached && (now - Date.parse(cached.entry.timestamp || 0) <= REFERENCE_FRESHNESS_MAX_AGE_MS)) {
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
      if (cached && (now - Date.parse(cached.entry.timestamp || 0) <= REFERENCE_FRESHNESS_MAX_AGE_MS)) {
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
    const isFresh = ageMs <= REFERENCE_FRESHNESS_MAX_AGE_MS; // 15 mins

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
    if (cached && (now - Date.parse(cached.entry.timestamp || 0) <= REFERENCE_FRESHNESS_MAX_AGE_MS)) {
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
