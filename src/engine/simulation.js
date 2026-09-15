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
 * Fallback when an RPC simulation error carries no usable message.
 * Never invented per-case: only used when the structured error is empty.
 */
export const SIMULATION_UNKNOWN_ERROR = "RPC simulation returned an unspecified transaction error.";

/**
 * Maximum characters for a normalized simulation error. Concise by design:
 * consumer UI must never receive a giant raw JSON dump.
 */
export const SIMULATION_ERROR_MAX_LENGTH = 160;

function truncateSimText(text) {
  if (text.length <= SIMULATION_ERROR_MAX_LENGTH) return text;
  return text.slice(0, SIMULATION_ERROR_MAX_LENGTH - 1) + "…";
}

function describeInstructionDetail(detail) {
  if (detail === null || detail === undefined) return "";
  if (typeof detail === "string") return detail.trim() ? `: ${detail.trim()}` : "";
  if (typeof detail === "number") return ` (error code ${detail})`;
  if (typeof detail === "object") {
    if (typeof detail.Custom === "number") return ` (custom program error ${detail.Custom})`;
    if (typeof detail.BorshIoError === "string" && detail.BorshIoError.trim()) {
      return ` (borsh IO error: ${detail.BorshIoError.trim()})`;
    }
    try {
      const json = JSON.stringify(detail);
      if (json && json !== "{}") return `: ${truncateSimText(json)}`;
    } catch {
      // Fall through to empty detail.
    }
  }
  return "";
}

/**
 * Normalize a raw Solana RPC simulation `err` into a stable human-readable
 * failure description. Returns null only when there is no error.
 * Prefers real fields (message, InstructionError) and never invents a reason.
 */
export function describeSimulationError(err) {
  if (err === null || err === undefined) return null;
  if (typeof err === "string") {
    const trimmed = err.trim();
    return trimmed ? truncateSimText(trimmed) : SIMULATION_UNKNOWN_ERROR;
  }
  if (typeof err === "number" || typeof err === "boolean") return String(err);
  if (typeof err === "object") {
    if (typeof err.message === "string" && err.message.trim()) {
      return truncateSimText(err.message.trim());
    }
    if (Array.isArray(err.InstructionError) && err.InstructionError.length > 0) {
      const [index, detail] = err.InstructionError;
      return truncateSimText(`Instruction ${index} failed${describeInstructionDetail(detail)}`);
    }
    try {
      const json = JSON.stringify(err);
      if (json && json !== "{}" && json !== "[]") return truncateSimText(json);
    } catch {
      // Fall through to the truthful fallback.
    }
    return SIMULATION_UNKNOWN_ERROR;
  }
  return SIMULATION_UNKNOWN_ERROR;
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
  // Raw RPC err is structured (often an InstructionError object). The API
  // boundary normalizes it to a stable human-readable string; null stays null.
  const rawErr = value?.err ?? null;
  const err = describeSimulationError(rawErr);

  return {
    status: rawErr === null ? "PASS" : "FAIL",
    err: err,
    units_consumed: value?.unitsConsumed || 0,
    logs_count: value?.logs?.length || 0,
    logs_snippet: value?.logs?.slice(0, 3) || []
  };
}
