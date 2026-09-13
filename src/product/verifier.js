// JustFair — Exact-Asset On-Chain Verifier
// Phase 12 — Verifies Expected Registry State against Live Solana Token-2022 Mainnet State

import {
  VERIFICATION_STATUS,
  VERIFICATION_REASON_CODES
} from "./schema.js";
import { getProduct, resolveEffectiveMultiplier } from "./registry.js";

const DEFAULT_RPC_URL = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

/**
 * Low-level Solana RPC helper to fetch and parse token account info
 */
export async function fetchOnchainMintAccount(mintPubkey, rpcUrl = DEFAULT_RPC_URL, timeoutMs = 8000) {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "getAccountInfo",
    params: [
      mintPubkey,
      { encoding: "jsonParsed" }
    ]
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { error: VERIFICATION_REASON_CODES.RPC_UNAVAILABLE, httpStatus: res.status };
    }

    const json = await res.json();
    if (json.error) {
      return { error: VERIFICATION_REASON_CODES.RPC_UNAVAILABLE, rpcError: json.error };
    }

    return { value: json.result?.value };
  } catch (err) {
    clearTimeout(timeoutId);
    return { error: VERIFICATION_REASON_CODES.RPC_UNAVAILABLE, message: err.message };
  }
}

/**
 * Extracts structured Token-2022 fields from parsed account info
 */
export function extractObservedTokenState(accountValue) {
  if (!accountValue) {
    return { exists: false };
  }

  const owner = accountValue.owner;
  const parsed = accountValue.data?.parsed?.info;
  if (!parsed) {
    return { exists: true, owner, isParsed: false };
  }

  const decimals = parsed.decimals;
  const supply = parsed.supply;
  const mintAuthority = parsed.mintAuthority;
  const freezeAuthority = parsed.freezeAuthority;

  const rawExtensions = parsed.extensions || [];
  const extensions = rawExtensions.map(e => e.extension);

  // Extract scaledUiAmountConfig
  const scaledExt = rawExtensions.find(e => e.extension === "scaledUiAmountConfig");
  let multiplierState = null;
  if (scaledExt && scaledExt.state) {
    multiplierState = {
      multiplier: scaledExt.state.multiplier,
      newMultiplier: scaledExt.state.newMultiplier,
      newMultiplierEffectiveTimestamp: scaledExt.state.newMultiplierEffectiveTimestamp
    };
  }

  // Extract metadata pointer or metadata
  const metaPointerExt = rawExtensions.find(e => e.extension === "metadataPointer");
  const tokenMetadataExt = rawExtensions.find(e => e.extension === "tokenMetadata");

  return {
    exists: true,
    isParsed: true,
    owner,
    decimals,
    supply,
    mintAuthority,
    freezeAuthority,
    extensions,
    multiplierState,
    metadataPointer: metaPointerExt?.state,
    tokenMetadata: tokenMetadataExt?.state
  };
}

/**
 * Compares Expected Registry Configuration against Observed Live On-Chain State
 */
export function compareExpectedVsObserved(expected, observed) {
  const reasonCodes = [];

  if (!observed || !observed.exists) {
    reasonCodes.push(VERIFICATION_REASON_CODES.MINT_NOT_FOUND);
    return {
      status: VERIFICATION_STATUS.MISMATCH,
      reasonCodes,
      summary: `Solana mint account '${expected.mint}' does not exist on mainnet.`
    };
  }

  // 1. Token Program Check
  if (observed.owner !== expected.tokenProgram) {
    reasonCodes.push(VERIFICATION_REASON_CODES.TOKEN_PROGRAM_MISMATCH);
  }

  // 2. Decimals Check
  if (observed.decimals !== expected.decimals) {
    reasonCodes.push(VERIFICATION_REASON_CODES.DECIMALS_MISMATCH);
  }

  // 3. Expected Extensions Check (Issuer-specific)
  if (Array.isArray(expected.expectedExtensions)) {
    for (const reqExt of expected.expectedExtensions) {
      if (!observed.extensions || !observed.extensions.includes(reqExt)) {
        reasonCodes.push(VERIFICATION_REASON_CODES.EXPECTED_EXTENSION_MISSING);
        break;
      }
    }
  }

  // 4. Multiplier State Check
  if (expected.expectedExtensions?.includes("scaledUiAmountConfig")) {
    if (!observed.multiplierState || !observed.multiplierState.multiplier) {
      reasonCodes.push(VERIFICATION_REASON_CODES.MULTIPLIER_PARSE_FAILURE);
    }
  }

  if (reasonCodes.length > 0) {
    return {
      status: VERIFICATION_STATUS.MISMATCH,
      reasonCodes,
      summary: `On-chain configuration mismatch: ${reasonCodes.join(", ")}`
    };
  }

  return {
    status: VERIFICATION_STATUS.VERIFIED,
    reasonCodes: [VERIFICATION_REASON_CODES.VERIFICATION_SUCCESS],
    summary: `Verified on-chain: exact mint matches expected ${expected.issuerName} ${expected.tokenProgram} profile.`
  };
}

/**
 * Main verification entrypoint for a given product_id
 */
export async function verifyProductOnchain(productId, options = {}) {
  const product = getProduct(productId);
  if (!product) {
    return {
      productId,
      verificationStatus: VERIFICATION_STATUS.MISMATCH,
      reasonCodes: [VERIFICATION_REASON_CODES.MINT_NOT_FOUND],
      summary: `Product ID '${productId}' is not registered in the canonical catalog.`,
      checkedAt: new Date().toISOString()
    };
  }

  const expected = {
    productId: product.productId,
    ticker: product.representationTicker,
    issuerId: product.issuerProfile.issuerId,
    issuerName: product.issuerProfile.issuerName,
    mint: product.mint,
    decimals: product.decimals,
    tokenProgram: product.tokenProgram,
    expectedExtensions: product.expectedExtensions,
    metadataSymbol: product.metadataSymbol,
    metadataName: product.metadataName
  };

  const rpcUrl = options.rpcUrl || DEFAULT_RPC_URL;
  const fetchResult = await fetchOnchainMintAccount(product.mint, rpcUrl, options.timeoutMs);

  if (fetchResult.error) {
    return {
      productId: product.productId,
      ticker: product.representationTicker,
      mint: product.mint,
      verificationStatus: VERIFICATION_STATUS.UNABLE_TO_VERIFY,
      reasonCodes: [fetchResult.error],
      summary: `Solana RPC unavailable or timed out while querying mint '${product.mint}'.`,
      expected,
      observed: null,
      checkedAt: new Date().toISOString()
    };
  }

  const observed = extractObservedTokenState(fetchResult.value);
  const comparison = compareExpectedVsObserved(expected, observed);

  // Compute effective multiplier if multiplier state is present
  const effectiveMultiplier = observed.multiplierState
    ? resolveEffectiveMultiplier(observed.multiplierState)
    : null;

  return {
    productId: product.productId,
    ticker: product.representationTicker,
    underlyingSymbol: product.underlyingSymbol,
    companyName: product.companyName,
    mint: product.mint,
    verificationStatus: comparison.status,
    reasonCodes: comparison.reasonCodes,
    summary: comparison.summary,
    expected,
    observed: {
      owner: observed.owner,
      decimals: observed.decimals,
      supply: observed.supply,
      extensions: observed.extensions,
      mintAuthority: observed.mintAuthority,
      freezeAuthority: observed.freezeAuthority,
      multiplierState: observed.multiplierState,
      effectiveMultiplier
    },
    checkedAt: new Date().toISOString()
  };
}
