// Alpaca Market Data adapter (Director Order 017).
// Latest stock quotes with bid/ask/size/timestamp per official Alpaca schema:
// { t, bp, bs, bx, ap, as, ax, c, z }. Endpoint:
//   GET https://data.alpaca.markets/v2/stocks/quotes/latest?symbols=X&feed=iex|overnight
// Auth: APCA-API-KEY-ID / APCA-API-SECRET-KEY headers, server-side only.
// Feeds per official docs: iex (default w/o unlimited), sip, delayed_sip,
// boats (Blue Ocean overnight), overnight (DERIVED overnight data), otc.
// Without credentials the adapter is inert (throws NO_CREDENTIALS) and the
// Benchmark V2 ladder applies unchanged.
import { API_ENDPOINTS, TIMEOUTS } from "../config.js";

export const ALPACA_FEEDS = {
  IEX: "iex",
  OVERNIGHT: "overnight",
  BOATS: "boats",
  SIP: "sip",
  DELAYED_SIP: "delayed_sip"
};

export function isAlpacaConfigured() {
  return !!(process.env.ALPACA_API_KEY_ID && String(process.env.ALPACA_API_KEY_ID).trim().length > 0
    && process.env.ALPACA_API_SECRET_KEY && String(process.env.ALPACA_API_SECRET_KEY).trim().length > 0);
}

function alpacaError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/**
 * Fetch the latest quote for one canonical equity symbol on an explicit feed.
 * Returns a normalized quote or throws a coded error. Never fabricates data.
 */
export async function fetchAlpacaLatestQuote(canonicalSymbol, feed = ALPACA_FEEDS.IEX) {
  if (!isAlpacaConfigured()) {
    throw alpacaError("NO_CREDENTIALS", "Alpaca market-data credentials are not configured");
  }
  const symbol = String(canonicalSymbol || "").trim().toUpperCase();
  if (!symbol) throw alpacaError("INVALID_SYMBOL", "Canonical equity symbol is required");
  const url = `${API_ENDPOINTS.ALPACA_DATA_BASE}/v2/stocks/quotes/latest?symbols=${encodeURIComponent(symbol)}&feed=${encodeURIComponent(feed)}`;
  let res;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "APCA-API-KEY-ID": process.env.ALPACA_API_KEY_ID,
        "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET_KEY
      },
      signal: AbortSignal.timeout(TIMEOUTS.UPSTREAM_FETCH_MS || 10000)
    });
  } catch (err) {
    throw alpacaError("ALPACA_TIMEOUT", `Alpaca quote request failed: ${err.message}`);
  }
  if (res.status === 401 || res.status === 403) {
    throw alpacaError("ALPACA_AUTH", `Alpaca rejected credentials (HTTP ${res.status})`);
  }
  if (res.status === 429) {
    throw alpacaError("ALPACA_RATE_LIMIT", "Alpaca rate limit exceeded (HTTP 429)");
  }
  if (!res.ok) {
    throw alpacaError("ALPACA_UPSTREAM", `Alpaca quote request failed (HTTP ${res.status})`);
  }
  let body = null;
  try {
    body = await res.json();
  } catch {
    throw alpacaError("ALPACA_INVALID_RESPONSE", "Alpaca quote response was not JSON");
  }
  const raw = body?.quote || body?.quotes?.[symbol] || null;
  if (!raw || typeof raw !== "object") {
    throw alpacaError("ALPACA_MISSING_QUOTE", `Alpaca returned no quote for ${symbol} on feed ${feed}`);
  }
  const bid = Number(raw.bp);
  const ask = Number(raw.ap);
  const ts = raw.t ? Date.parse(raw.t) : null;
  if (!(bid > 0) || !(ask > 0)) {
    throw alpacaError("ALPACA_MISSING_QUOTE", `Alpaca quote for ${symbol} lacks valid bid/ask`);
  }
  if (ts === null || isNaN(ts)) {
    throw alpacaError("ALPACA_MISSING_TIMESTAMP", `Alpaca quote for ${symbol} lacks a valid timestamp`);
  }
  return {
    symbol,
    feed,
    bid_price: bid,
    ask_price: ask,
    bid_size: Number(raw.bs) || 0,
    ask_size: Number(raw.as) || 0,
    bid_exchange: raw.bx || null,
    ask_exchange: raw.ax || null,
    conditions: Array.isArray(raw.c) ? raw.c : [],
    tape: raw.z || null,
    midpoint: (bid + ask) / 2,
    source_timestamp: new Date(ts).toISOString(),
    provider: "Alpaca",
    upstream_source: feed === ALPACA_FEEDS.OVERNIGHT
      ? "Alpaca Market Data (overnight derived feed)"
      : "Alpaca Market Data (IEX)"
  };
}
