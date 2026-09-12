// Solana RPC Simulation & Key Validation Engine
import { PublicKey } from "@solana/web3.js";
import { API_ENDPOINTS } from "../config.js";

/**
 * Validate a Solana public key using @solana/web3.js PublicKey parser
 */
export function isValidSolanaPublicKey(pubkey) {
  if (!pubkey || typeof pubkey !== "string") return false;
  try {
    const pk = new PublicKey(pubkey.trim());
    return PublicKey.isOnCurve(pk.toBuffer());
  } catch (e) {
    return false;
  }
}

/**
 * Simulate transaction on Solana Mainnet RPC without broadcasting or moving funds
 */
export async function simulateSolanaTransaction(swapTransactionBase64) {
  const res = await fetch(API_ENDPOINTS.SOLANA_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
