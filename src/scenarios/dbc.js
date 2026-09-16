// JustFair Scenario #3 contract: DBC_OPENING_WHALE (Phase 2: CONTRACT ONLY)
// Purpose: determine whether a proposed DBC configuration violates an
// ISSUER-DECLARED maximum price-impact policy under a large early purchase.
//
// JustFair declares NO universal "safe" impact. The issuer/test author
// supplies maxPriceImpactPct; the scenario checks observed <= tolerance.
//
// Phase 2 scope: contract + pure policy comparator + failure catalog.
// SDK-backed execution (fetch pool+config, run swapQuoteExactIn over live
// state) is deferred to Phase 3 — it would require adding
// @meteora-ag/dynamic-bonding-curve-sdk as a repo dependency, which Phase 2
// deliberately avoids. Intended Phase 3 calls (verified against SDK v1.5.12
// in Phase 2 reality proof):
//   client.state.getPool(poolAddress) -> VirtualPool
//   client.state.getPoolConfig(configAddress) -> PoolConfig
//   getCurrentPoint(connection, activationType) -> BN
//   client.pool.swapQuote({ virtualPool, config, swapBaseForQuote,
//     amountIn, hasReferral, eligibleForFirstSwapWithMinFee, currentPoint })
//   -> { outputAmount, ... } (pure local math over fetched state; read-only)

export const DBC_OPENING_WHALE = {
  id: "DBC_OPENING_WHALE",
  title: "Large early purchase stays within the issuer-declared impact policy",
  category: "MARKET_STRUCTURE",
  version: "1",
  requiresCapabilities: ["dbc_quote_impact"],
  status: "CONTRACT_ONLY",
  policy: {
    maxPriceImpactPct: "supplied per run by the issuer/test author (no universal safe value)"
  },
  inputsShape: {
    poolAddress: "DBC VirtualPool address under test",
    amountIn: "proposed early purchase size in base raw units (string)",
    maxPriceImpactPct: "issuer-declared tolerance, number"
  },
  observationsShape: {
    observedImpactPct: "measured price impact percent from swapQuoteExactIn, number",
    outputAmount: "quoted output amount (string)"
  },
  failureCatalog: {
    IMPACT_POLICY_VIOLATED: {
      rootCause: "The proposed configuration exceeds the issuer-declared maximum price impact for the tested purchase size.",
      guidance: "Tighten the curve (more liquidity early), raise the graduation threshold economics, or lower the declared purchase size before launch."
    }
  }
};

/**
 * Pure policy comparator: observed impact vs issuer-declared tolerance.
 * Returns { withinPolicy } — the only judgment this contract makes.
 */
export function evaluateWhalePolicy({ observedImpactPct, maxPriceImpactPct }) {
  const observed = Number(observedImpactPct);
  const tolerance = Number(maxPriceImpactPct);
  if (!Number.isFinite(observed) || !Number.isFinite(tolerance) || tolerance < 0) {
    return { withinPolicy: null, reason: "Non-numeric impact or tolerance" };
  }
  return { withinPolicy: observed <= tolerance };
}
