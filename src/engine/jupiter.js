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
 * Officially supported route-control parameters on /order: excludeRouters, excludeDexes
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
  if (options.excludeRouters) {
    const excluded = Array.isArray(options.excludeRouters) ? options.excludeRouters.join(",") : options.excludeRouters;
    if (excluded) {
      url += `&excludeRouters=${encodeURIComponent(excluded)}`;
    }
  }
  if (options.excludeDexes) {
    const excluded = Array.isArray(options.excludeDexes) ? options.excludeDexes.join(",") : options.excludeDexes;
    if (excluded) {
      url += `&excludeDexes=${encodeURIComponent(excluded)}`;
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
 * Compute deterministic structural route fingerprint.
 *
 * Route identity is strictly structural execution data:
 * - router
 * - ordered routePlan hops
 * - each hop's ammKey / program identity
 * - label
 * - inputMint & outputMint
 *
 * NOTE: Quote-specific economics (outAmount, price, timestamp, fee) and request modes
 * do NOT change route identity. Same route with differing outAmount = DUPLICATE.
 */
export function createRouteFingerprint(orderData) {
  if (!orderData) return "null";
  const router = (orderData.router || "unknown").toLowerCase().trim();

  if (!Array.isArray(orderData.routePlan) || orderData.routePlan.length === 0) {
    return `${router}|direct`;
  }

  const hops = orderData.routePlan.map(step => {
    const s = step?.swapInfo || {};
    const ammKey = (s.ammKey || "none").toLowerCase().trim();
    const label = (s.label || "dex").trim();
    const inMint = (s.inputMint || "").toLowerCase().trim();
    const outMint = (s.outputMint || "").toLowerCase().trim();
    const mintPair = inMint && outMint ? `:${inMint}>${outMint}` : "";
    return `${ammKey}:${label}${mintPair}`;
  }).join("|");

  return `${router}|${hops}`;
}

const KNOWN_ROUTER_NAMES = new Set(["jupiterz", "metis", "dflow", "okx"]);

/**
 * Query genuinely distinct alternative routing options using official Jupiter Swap V2 controls.
 * Enforces Candidate Distinctness Gate: identical structural fingerprints are discarded as duplicates.
 */
export async function fetchJupiterAlternativeCandidates(inputAssetConfig, stockConfig, amountHuman, taker = null, canonicalResult = null) {
  const canonicalOrder = canonicalResult?.orderData;
  const canonicalFp = createRouteFingerprint(canonicalOrder);
  const canonicalVenues = canonicalOrder?.routePlan
    ? extractVenuesFromRoutePlan(canonicalOrder.routePlan)
    : [];
  const canonicalRouter = (canonicalOrder?.router || "jupiterz").toLowerCase().trim();

  const candidatePromises = [];

  // Strategy A: Exclude Canonical Router (official excludeRouters=<canonicalRouter>)
  // - If canonical is JupiterZ, Jupiter will evaluate Metis.
  // - If canonical is Metis, Jupiter will evaluate JupiterZ.
  candidatePromises.push(
    fetchJupiterOrderV2(inputAssetConfig, stockConfig, amountHuman, taker, { excludeRouters: canonicalRouter })
      .then(res => ({
        candidate_type: "ROUTER_EXCLUSION",
        candidate_strategy: `Router Exclusion (excludeRouters=${canonicalRouter})`,
        candidate_label: `Competing Router (Excl. ${canonicalRouter})`,
        excluded_routers: [canonicalRouter],
        excluded_venues: [],
        result: res
      }))
      .catch(() => null)
  );

  // Strategy B: Metis DEX Exclusion (official excludeDexes=<venue>)
  // NOTE: Official Jupiter documentation explicitly states excludeDexes affects ONLY Metis routing.
  // It MUST NOT be used with router names (e.g. excludeDexes=JupiterZ is invalid).
  // Only probe when canonical is Metis, using actual AMM venues present in the route.
  if (canonicalRouter === "metis") {
    const validDexVenues = canonicalVenues.filter(v => !KNOWN_ROUTER_NAMES.has(v.toLowerCase()));
    if (validDexVenues.length > 0) {
      const primaryVenue = validDexVenues[0];
      candidatePromises.push(
        fetchJupiterOrderV2(inputAssetConfig, stockConfig, amountHuman, taker, { excludeDexes: primaryVenue })
          .then(res => ({
            candidate_type: "DEX_EXCLUSION",
            candidate_strategy: `Metis DEX Exclusion (excludeDexes=${primaryVenue})`,
            candidate_label: `Metis Alternative AMM (Excl. ${primaryVenue})`,
            excluded_routers: [],
            excluded_venues: [primaryVenue],
            result: res
          }))
          .catch(() => null)
      );
    }
  }

  const resolved = await Promise.all(candidatePromises);
  const distinctCandidates = [];
  const seenFingerprints = new Set([canonicalFp]);

  for (const c of resolved) {
    if (!c || !c.result?.orderData?.outAmount) continue;

    const candFp = createRouteFingerprint(c.result.orderData);
    const isDistinct = !seenFingerprints.has(candFp);

    // CANDIDATE DISTINCTNESS GATE:
    // If the candidate returned the exact same structural route identity as canonical
    // or a prior candidate, discard as duplicate.
    if (isDistinct) {
      seenFingerprints.add(candFp);
      c.fingerprint = candFp;
      c.is_distinct_from_canonical = true;
      distinctCandidates.push(c);
    }
  }

  return distinctCandidates;
}
