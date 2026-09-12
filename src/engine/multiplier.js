// Token-2022 Dynamic Effective Multiplier Engine
import { API_ENDPOINTS } from "../config.js";

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

/**
 * Fetch on-chain Token-2022 extension metadata and evaluate effective multiplier
 */
export async function fetchOnChainTokenMultiplier(mintAddress, currentUnixSec = Math.floor(Date.now() / 1000)) {
  const res = await fetch(API_ENDPOINTS.SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "multiplier-check",
      method: "getAccountInfo",
      params: [mintAddress, { encoding: "jsonParsed" }]
    })
  });

  if (!res.ok) {
    throw new Error(`Solana RPC account info failed for mint ${mintAddress}: HTTP ${res.status}`);
  }

  const data = await res.json();
  const parsed = data.result?.value?.data?.parsed?.info;
  if (!parsed) {
    throw new Error(`Unable to parse on-chain account for mint ${mintAddress}`);
  }

  const scaledExt = parsed.extensions?.find(e => e.extension === "scaledUiAmountConfig");
  const storedMultiplier = scaledExt?.state?.multiplier || "1.0";
  const newMultiplier = scaledExt?.state?.newMultiplier || null;
  const effectiveTs = scaledExt?.state?.newMultiplierEffectiveTimestamp || 0;

  const evaluated = calculateEffectiveMultiplier(storedMultiplier, newMultiplier, effectiveTs, currentUnixSec);

  return {
    ...evaluated,
    decimals: parsed.decimals ?? 8,
    source: "Solana Token-2022 scaledUiAmountConfig on-chain state"
  };
}
