// JustFair Server-Side Pyth Evidence Adapter (Phase 1, minimal)
// Parses CURRENT Pyth Pro field semantics (docs.pyth.network) into the
// freshness facts scenarios need. Native fetch only — no SDK dependency for
// one REST shape. SERVER ONLY: the bearer key never leaves the backend.
//
// Carried-forward rule (official): when the market is closed and no fresh
// aggregate exists, Pro carries the most recent price forward. A price is
// carried forward when feedUpdateTimestamp differs from timestampUs.

export const PYTH_PRO_HISTORY_BASE = "https://pyth.dourolabs.app";
export const PYTH_PRO_WS_URLS = [
  "wss://pyth-lazer-0.dourolabs.app/v1/stream",
  "wss://pyth-lazer-1.dourolabs.app/v1/stream",
  "wss://pyth-lazer-2.dourolabs.app/v1/stream"
];

// Feed symbols named by the Stocklana Pyth bounty (verified on official page).
export const PYTH_SYMBOLS = {
  AAPL_EQUITY: "Equity.US.AAPL/USD",
  AAPLX_TOKEN: "Crypto.AAPLX/USD",
  AAPLON_TOKEN: "Crypto.AAPLON/USD"
};

/**
 * Interpret one Pyth Pro price update into freshness facts.
 * Input shape mirrors official payload fields:
 * { timestampUs, feedUpdateTimestamp?, marketSession?, price? }
 */
export function interpretPythUpdate(update) {
  if (!update || typeof update !== "object") {
    return { usable: false, reason: "Missing update object" };
  }
  const ts = Number(update.timestampUs);
  if (!Number.isFinite(ts)) {
    return { usable: false, reason: "Missing numeric timestampUs" };
  }
  const feedTs = update.feedUpdateTimestamp === undefined || update.feedUpdateTimestamp === null
    ? null
    : Number(update.feedUpdateTimestamp);
  // Carried forward when the feed timestamp exists and differs from the
  // update timestamp (official availability semantics).
  const carriedForward = feedTs !== null && Number.isFinite(feedTs) && feedTs !== ts;
  return {
    usable: true,
    timestampUs: ts,
    feedUpdateTimestamp: Number.isFinite(feedTs) ? feedTs : null,
    marketSession: typeof update.marketSession === "string" ? update.marketSession : null,
    carriedForward,
    // A carried-forward price is NOT a fresh live reference.
    freshLiveReference: !carriedForward
  };
}

/**
 * Fetch one historical Pro price point (server-side, key from env only).
 * Returns { ok, update? } — callers interpret via interpretPythUpdate.
 * Never throws on HTTP/auth problems; reports them as data.
 */
export async function fetchPythPriceAt({ feedId, timestampUs, channel = "real_time", apiKey } = {}) {
  const key = apiKey || process.env.PYTH_API_KEY;
  if (!key || !String(key).trim()) {
    return { ok: false, code: "PYTH_KEY_ABSENT", message: "No Pyth Pro API key configured" };
  }
  if (feedId === undefined || feedId === null || timestampUs === undefined || timestampUs === null) {
    return { ok: false, code: "PYTH_BAD_ARGS", message: "feedId and timestampUs are required" };
  }
  const url = `${PYTH_PRO_HISTORY_BASE}/v1/${channel}/price?ids=${encodeURIComponent(feedId)}&timestamp=${encodeURIComponent(timestampUs)}`;
  let res;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${String(key).trim()}` },
      signal: AbortSignal.timeout(10000)
    });
  } catch (err) {
    return { ok: false, code: "PYTH_UNREACHABLE", message: err.message };
  }
  if (res.status === 401) return { ok: false, code: "PYTH_UNAUTHORIZED", message: "Bearer key rejected (401)" };
  if (res.status === 403) return { ok: false, code: "PYTH_NOT_ENTITLED", message: "Key not entitled to this feed (403)" };
  if (res.status === 404) return { ok: false, code: "PYTH_UNKNOWN_FEED", message: "Unknown feed ID (404)" };
  if (!res.ok) return { ok: false, code: "PYTH_HTTP_ERROR", message: `Upstream HTTP ${res.status}` };
  try {
    return { ok: true, update: await res.json() };
  } catch {
    return { ok: false, code: "PYTH_MALFORMED_RESPONSE", message: "Upstream JSON unparseable" };
  }
}
