// JustFair — Cross-Issuer Product Difference Engine (FinePrint)
// Phase 12 — Deterministic Factual Comparison without Subjective Ranking

import { getProduct, getProductCapabilities, getUnderlyingSecurity } from "./registry.js";

/**
 * Compares two representations and returns only meaningful factual differences
 */
export function compareProducts(productIdA, productIdB) {
  const prodA = getProductCapabilities(productIdA);
  const prodB = getProductCapabilities(productIdB);

  if (!prodA || !prodB) {
    return {
      error: "PRODUCT_NOT_FOUND",
      summary: "One or both product IDs could not be resolved from the catalog."
    };
  }

  const differences = [];
  const sharedFacts = [];

  // 1. Issuer & Jurisdiction
  if (prodA.issuer.issuerName !== prodB.issuer.issuerName) {
    differences.push({
      dimension: "ISSUER_AND_JURISDICTION",
      title: "Issuer & Legal Jurisdiction",
      productA: `${prodA.issuer.issuerName} (${prodA.issuer.issuerJurisdiction})`,
      productB: `${prodB.issuer.issuerName} (${prodB.issuer.issuerJurisdiction})`
    });
  }

  // 2. Legal Instrument Structure
  if (prodA.issuer.legalStructure !== prodB.issuer.legalStructure) {
    differences.push({
      dimension: "LEGAL_STRUCTURE",
      title: "Legal Instrument Structure",
      productA: prodA.issuer.legalStructure,
      productB: prodB.issuer.legalStructure
    });
  }

  // 3. Custody & Collateral Claim
  if (prodA.issuer.custodyModel !== prodB.issuer.custodyModel) {
    differences.push({
      dimension: "CUSTODY_MODEL",
      title: "Custody & Collateral Claim",
      productA: prodA.issuer.custodyModel,
      productB: prodB.issuer.custodyModel
    });
  }

  // 4. On-Chain Decimals Precision
  if (prodA.decimals !== prodB.decimals) {
    differences.push({
      dimension: "DECIMALS_PRECISION",
      title: "On-Chain Decimals Precision",
      productA: `${prodA.decimals} decimals (10^${prodA.decimals})`,
      productB: `${prodB.decimals} decimals (10^${prodB.decimals})`
    });
  }

  // 5. Active Effective Multiplier
  if (prodA.effectiveMultiplier?.activeMultiplier !== prodB.effectiveMultiplier?.activeMultiplier) {
    differences.push({
      dimension: "EFFECTIVE_MULTIPLIER",
      title: "Active Scaled UI Multiplier",
      productA: prodA.effectiveMultiplier?.activeMultiplier || "1.0",
      productB: prodB.effectiveMultiplier?.activeMultiplier || "1.0"
    });
  }

  // 6. Direct Issuer Redemption Requirements
  const redA = prodA.capabilities?.DIRECT_ISSUER_REDEMPTION?.summary;
  const redB = prodB.capabilities?.DIRECT_ISSUER_REDEMPTION?.summary;
  if (redA !== redB) {
    differences.push({
      dimension: "REDEMPTION_MECHANICS",
      title: "Primary Issuer Redemption Route",
      productA: redA,
      productB: redB
    });
  }

  // 7. Trading Availability Semantics
  const tradeA = prodA.capabilities?.WEEKEND_TRADING?.summary;
  const tradeB = prodB.capabilities?.WEEKEND_TRADING?.summary;
  if (tradeA !== tradeB) {
    differences.push({
      dimension: "TRADING_AVAILABILITY",
      title: "Trading Availability & Session Rules",
      productA: tradeA,
      productB: tradeB
    });
  }

  // 8. JustFair Execution Preflight Support
  if (prodA.executionPreflightSupport !== prodB.executionPreflightSupport) {
    differences.push({
      dimension: "EXECUTION_PREFLIGHT_SUPPORT",
      title: "JustFair Execution Preflight (Layer 2)",
      productA: prodA.executionPreflightSupport === "SUPPORTED"
        ? "SUPPORTED — Full DEX routing, live simulation & benchmark verification"
        : "NOT_YET_SUPPORTED — Product Preflight verified; DEX routing engine pending integration",
      productB: prodB.executionPreflightSupport === "SUPPORTED"
        ? "SUPPORTED — Full DEX routing, live simulation & benchmark verification"
        : "NOT_YET_SUPPORTED — Product Preflight verified; DEX routing engine pending integration"
    });
  }

  // Key Shared Fundamental Truths (Crucial context)
  sharedFacts.push({
    title: "Self-Custody Storage",
    value: "Both products are held directly in your self-custody Solana wallet as SPL Token-2022 tokens."
  });
  sharedFacts.push({
    title: "Equity Ownership & Voting",
    value: "Neither product confers direct shareholder equity ownership or corporate voting rights in the underlying company."
  });
  sharedFacts.push({
    title: "Dividend Mechanism",
    value: "Neither product deposits cash/stablecoins into wallets. Both compound net dividends automatically via Token-2022 Scaled UI multipliers (Total Return)."
  });

  return {
    underlyingSymbol: prodA.underlyingSymbol,
    companyName: prodA.companyName,
    productA: {
      productId: prodA.productId,
      ticker: prodA.representationTicker,
      mint: prodA.mint,
      issuerName: prodA.issuer.issuerName
    },
    productB: {
      productId: prodB.productId,
      ticker: prodB.representationTicker,
      mint: prodB.mint,
      issuerName: prodB.issuer.issuerName
    },
    differencesCount: differences.length,
    differences,
    sharedFacts
  };
}

/**
 * Compares all verified representations for a given underlying company symbol
 */
export function compareUnderlyingRepresentations(underlyingSymbol) {
  const underlying = getUnderlyingSecurity(underlyingSymbol);
  if (!underlying) {
    return {
      error: "UNDERLYING_NOT_FOUND",
      summary: `Underlying symbol '${underlyingSymbol}' is not registered in the catalog.`
    };
  }

  const reps = underlying.representations;
  if (reps.length < 2) {
    return {
      underlyingSymbol: underlying.symbol,
      companyName: underlying.companyName,
      representationsCount: reps.length,
      summary: `Underlying '${underlying.symbol}' currently has 1 verified representation (${reps[0]?.representationTicker}). No comparison available.`
    };
  }

  return compareProducts(reps[0].productId, reps[1].productId);
}

