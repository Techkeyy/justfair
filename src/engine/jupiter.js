// Jupiter Swap V2 Order & Routing Integration
import { API_ENDPOINTS, TIMEOUTS } from "../config.js";

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
 * Fetch real route from official Jupiter Swap V2 API (/swap/v2/order)
 * NOTE: Does NOT send manual slippageBps by default; allows Jupiter default ultra/automatic mode.
 */
export async function fetchJupiterOrderV2(inputAssetConfig, stockConfig, amountHuman, taker = null, options = {}) {
  const rawAmount = Math.floor(amountHuman * Math.pow(10, inputAssetConfig.decimals));
  if (rawAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  let url = `${API_ENDPOINTS.JUPITER_ORDER_V2}?inputMint=${inputAssetConfig.mint}&outputMint=${stockConfig.mint}&amount=${rawAmount}`;
  if (taker) {
    url += `&taker=${encodeURIComponent(taker)}`;
  }
  if (options.directRoutesOnly) {
    url += `&directRoutesOnly=true`;
  }
  if (options.excludeDexes) {
    const excluded = Array.isArray(options.excludeDexes) ? options.excludeDexes.join(",") : options.excludeDexes;
    if (excluded) {
      url += `&excludeDexes=${encodeURIComponent(excluded)}`;
    }
  }
  if (options.dexes) {
    const included = Array.isArray(options.dexes) ? options.dexes.join(",") : options.dexes;
    if (included) {
      url += `&dexes=${encodeURIComponent(included)}`;
    }
  }

  const headers = { "User-Agent": "JustFair/1.0" };
  if (process.env.JUPITER_API_KEY) {
    headers["x-api-key"] = process.env.JUPITER_API_KEY;
  }

  const quoteStartTime = Date.now();
  const res = await fetchWithRetry(url, { headers, signal: AbortSignal.timeout(TIMEOUTS.UPSTREAM_FETCH_MS) });
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
    fetch_latency_ms: latencyMs,
    options_applied: { ...options }
  };
}

/**
 * Helper to extract unique DEX venues from a Jupiter order routePlan
 */
export function extractVenuesFromRoutePlan(routePlan = []) {
  if (!Array.isArray(routePlan)) return [];
  const venues = new Set();
  for (const step of routePlan) {
    const label = step?.swapInfo?.label;
    if (label && typeof label === "string") {
      venues.add(label);
    }
  }
  return Array.from(venues);
}

/**
 * Query alternative routing options (direct routes, alternate DEX venues) concurrently
 */
export async function fetchJupiterAlternativeCandidates(inputAssetConfig, stockConfig, amountHuman, taker = null, canonicalResult = null) {
  const candidates = [];
  const canonicalVenues = canonicalResult?.orderData?.routePlan
    ? extractVenuesFromRoutePlan(canonicalResult.orderData.routePlan)
    : [];

  const candidatePromises = [];

  // Candidate 1: Direct Route Only
  candidatePromises.push(
    fetchJupiterOrderV2(inputAssetConfig, stockConfig, amountHuman, taker, { directRoutesOnly: true })
      .then(res => ({
        candidate_type: "DIRECT_ROUTE",
        candidate_label: "Direct AMM Route",
        is_direct: true,
        excluded_venues: [],
        result: res
      }))
      .catch(() => null)
  );

  // Candidate 2: Alternative DEX Venue (if canonical has a recognizable primary venue)
  if (canonicalVenues.length > 0) {
    const primaryVenue = canonicalVenues[0];
    candidatePromises.push(
      fetchJupiterOrderV2(inputAssetConfig, stockConfig, amountHuman, taker, { excludeDexes: primaryVenue })
        .then(res => ({
          candidate_type: "EXCLUDED_PRIMARY_VENUE",
          candidate_label: `Alternative Route (Excl. ${primaryVenue})`,
          is_direct: false,
          excluded_venues: [primaryVenue],
          result: res
        }))
        .catch(() => null)
    );
  }

  const resolved = await Promise.all(candidatePromises);
  for (const c of resolved) {
    if (c && c.result?.orderData?.outAmount) {
      candidates.push(c);
    }
  }

  return candidates;
}
