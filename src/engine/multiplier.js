// Token-2022 Dynamic Effective Multiplier Engine
import { API_ENDPOINTS, TIMEOUTS } from "../config.js";

/**
 * Calculate effective Token-2022 multiplier following Solana Scaled UI Amount semantics:
 * IF currentUnixTimestamp >= newMultiplierEffectiveTimestamp: currentMultiplier = newMultiplier
 * ELSE: currentMultiplier = storedMultiplier
 *
 * Corporate Action Window: ±15 minutes (900 seconds) per xStocks documented integrator guidance.
 */
export function calculateEffectiveMultiplier(storedMultiplier, newMultiplier, newMultiplierEffectiveTimestamp, currentUnixSec = Math.floor(Date.now() / 1000)) {
  const stored = parseFloat(storedMultiplier) || 1.0;
  const next = newMultiplier ? parseFloat(newMultiplier) : null;
  const effectiveTs = parseInt(newMultiplierEffectiveTimestamp, 10) || 0;

  let currentMultiplier = stored;
  let reason = "Using stored multiplier; no new multiplier scheduled";

  if (next && effectiveTs > 0) {
    if (currentUnixSec >= effectiveTs) {
      currentMultiplier = next;
      reason = `newMultiplier effective timestamp (${effectiveTs}) has passed`;
    } else {
      currentMultiplier = stored;
      reason = `newMultiplier is pending (effective at timestamp ${effectiveTs})`;
    }
  }

  // Documented xStocks Integrator Guidance: ±15 minutes (900 seconds) around effective activation timestamp
  const SAFETY_WINDOW_SECONDS = 900;
  let isInsideCorporateActionWindow = false;
  if (effectiveTs > 0) {
    const timeDelta = Math.abs(currentUnixSec - effectiveTs);
    if (timeDelta <= SAFETY_WINDOW_SECONDS) {
      isInsideCorporateActionWindow = true;
    }
  }

  return {
    stored_multiplier: stored,
    new_multiplier: next,
    new_multiplier_effective_timestamp: effectiveTs,
    current_multiplier: currentMultiplier,
    current_multiplier_reason: reason,
    is_inside_corporate_action_window: isInsideCorporateActionWindow
  };
}

let cachedMultipliers = {};

export function clearMultiplierCache() {
  cachedMultipliers = {};
}

/**
 * Fetch on-chain Token-2022 extension metadata and evaluate effective multiplier
 */
export async function fetchOnChainTokenMultiplier(mintAddress, currentUnixSec = Math.floor(Date.now() / 1000), forceFresh = false) {
  const now = Date.now();
  const cached = cachedMultipliers[mintAddress];
  if (!forceFresh && cached && (now - cached.cachedAt < 60000)) {
    const evaluated = calculateEffectiveMultiplier(cached.stored, cached.next, cached.effectiveTs, currentUnixSec);
    return {
      ...evaluated,
      decimals: cached.decimals,
      source: "Solana Token-2022 scaledUiAmountConfig on-chain state"
    };
  }

  const rpcEndpoints = [
    process.env.SOLANA_RPC_URL,
    "https://solana-rpc.publicnode.com",
    API_ENDPOINTS.SOLANA_RPC,
    "https://api.mainnet-beta.solana.com"
  ].filter(Boolean);

  let lastError = null;

  for (const endpoint of rpcEndpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(TIMEOUTS.UPSTREAM_FETCH_MS),
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "multiplier-check",
          method: "getAccountInfo",
          params: [mintAddress, { encoding: "jsonParsed" }]
        })
      });

      if (!res.ok) continue;

      const data = await res.json();
      const parsed = data.result?.value?.data?.parsed?.info;
      if (!parsed) continue;

      const scaledExt = parsed.extensions?.find(e => e.extension === "scaledUiAmountConfig");
      const storedMultiplier = scaledExt?.state?.multiplier || "1.0";
      const newMultiplier = scaledExt?.state?.newMultiplier || null;
      const effectiveTs = scaledExt?.state?.newMultiplierEffectiveTimestamp || 0;

      const evaluated = calculateEffectiveMultiplier(storedMultiplier, newMultiplier, effectiveTs, currentUnixSec);

      cachedMultipliers[mintAddress] = {
        stored: storedMultiplier,
        next: newMultiplier,
        effectiveTs,
        decimals: parsed.decimals ?? 8,
        cachedAt: now
      };

      return {
        ...evaluated,
        decimals: parsed.decimals ?? 8,
        source: "Solana Token-2022 scaledUiAmountConfig on-chain state"
      };
    } catch (e) {
      lastError = e;
    }
  }

  if (cached) {
    const evaluated = calculateEffectiveMultiplier(cached.stored, cached.next, cached.effectiveTs, currentUnixSec);
    return {
      ...evaluated,
      decimals: cached.decimals,
      source: "Solana Token-2022 scaledUiAmountConfig on-chain state (cached)"
    };
  }

  throw lastError || new Error(`Unable to fetch on-chain multiplier for mint ${mintAddress}`);
}
