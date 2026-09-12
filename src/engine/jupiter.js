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
export async function fetchJupiterOrderV2(inputAssetConfig, stockConfig, amountHuman, taker = null) {
  const rawAmount = Math.floor(amountHuman * Math.pow(10, inputAssetConfig.decimals));
  if (rawAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  let url = `${API_ENDPOINTS.JUPITER_ORDER_V2}?inputMint=${inputAssetConfig.mint}&outputMint=${stockConfig.mint}&amount=${rawAmount}`;
  if (taker) {
    url += `&taker=${encodeURIComponent(taker)}`;
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
    fetch_latency_ms: latencyMs
  };
}
