// Independent Market Benchmark & Session Engine
import { API_ENDPOINTS } from "../config.js";

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

  const rawTs = primary.lastTradeTimestamp;
  if (!rawTs || typeof rawTs !== "string") {
    return {
      symbol,
      price,
      source: "Nasdaq Official Public Equity Quote API (api.nasdaq.com)",
      source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
      provider: "Nasdaq Real-Time Stock Market Tape",
      timestamp: null,
      age_ms: null,
      reference_session: "UNKNOWN",
      current_market_session: calculateMarketSession(new Date()),
      freshness_status: "UNKNOWN",
      is_real_time: Boolean(primary.isRealTime)
    };
  }

  const refTimeMs = Date.parse(rawTs);
  if (isNaN(refTimeMs)) {
    return {
      symbol,
      price,
      source: "Nasdaq Official Public Equity Quote API (api.nasdaq.com)",
      source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
      provider: "Nasdaq Real-Time Stock Market Tape",
      timestamp: rawTs,
      age_ms: null,
      reference_session: "UNKNOWN",
      current_market_session: calculateMarketSession(new Date()),
      freshness_status: "UNKNOWN",
      is_real_time: Boolean(primary.isRealTime)
    };
  }

  const ageMs = Math.max(0, Date.now() - refTimeMs);
  const referenceSession = calculateMarketSession(new Date(refTimeMs));
  const currentSession = calculateMarketSession(new Date());

  let freshnessStatus = "FRESH";
  if (currentSession === "CLOSED" || currentSession === "OVERNIGHT") {
    freshnessStatus = "AFTER_HOURS_CLOSE";
  } else if (ageMs > 900000) { // > 15 minutes
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
 * Fetch independent spot price for payment assets (e.g. SOL) with upstream timestamp
 */
export async function fetchCryptoSpotPrice(cryptoPriceId = "solana") {
  const url = `${API_ENDPOINTS.COINGECKO_SIMPLE_PRICE}?ids=${cryptoPriceId}&vs_currencies=usd&include_last_updated_at=true`;
  const res = await fetch(url, {
    headers: { "User-Agent": "JustFair/1.0" }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch crypto spot price for ${cryptoPriceId}`);
  }
  const data = await res.json();
  const entry = data[cryptoPriceId];
  const price = entry?.usd;
  if (!price || typeof price !== "number") {
    throw new Error(`Crypto price unavailable for ${cryptoPriceId}`);
  }

  const upstreamSec = entry.last_updated_at;
  const upstreamIso = upstreamSec ? new Date(upstreamSec * 1000).toISOString() : new Date().toISOString();
  const ageMs = upstreamSec ? Math.max(0, Date.now() - upstreamSec * 1000) : 0;

  return {
    price,
    symbol: "SOL",
    source: "CoinGecko Real-Time Spot Feed",
    source_type: "CRYPTO_SPOT_ORACLE",
    timestamp: upstreamIso,
    age_ms: ageMs,
    reference_session: "24/7",
    current_market_session: "24/7",
    freshness_status: "FRESH"
  };
}
