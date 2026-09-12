// Solana RPC Simulation & Key Validation Engine (Current @solana/kit)
import { isAddress } from "@solana/kit";
import { API_ENDPOINTS, TIMEOUTS } from "../config.js";

/**
 * Validate a Solana public key / address using current @solana/kit validator
 */
export function isValidSolanaPublicKey(pubkey) {
  if (!pubkey || typeof pubkey !== "string") return false;
  return isAddress(pubkey.trim());
}

/**
 * Simulate transaction on Solana Mainnet RPC without broadcasting or moving funds
 */
export async function simulateSolanaTransaction(swapTransactionBase64) {
  const res = await fetch(API_ENDPOINTS.SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(TIMEOUTS.SIMULATION_FETCH_MS),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "justfair-sim-v2",
      method: "simulateTransaction",
      params: [
        swapTransactionBase64,
        {
          encoding: "base64",
          replaceRecentBlockhash: true,
          sigVerify: false
        }
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`Solana RPC simulation failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  const value = data.result?.value;
  const err = value?.err || null;

  return {
    status: err === null ? "PASS" : "FAIL",
    err: err,
    units_consumed: value?.unitsConsumed || 0,
    logs_count: value?.logs?.length || 0,
    logs_snippet: value?.logs?.slice(0, 3) || []
  };
}
