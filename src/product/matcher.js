// JustFair — Product Preflight Multi-Issuer Expectation Matcher
// Phase 12 — Evaluates user expectations across all verified representations using composed capability registry

import {
  EXPECTATION_PRIORITY,
  MATCH_STATE,
  PRODUCT_VERDICT,
  CAPABILITY_KEYS,
  EXPECTATION_KEYS
} from "./schema.js";
import { getUnderlyingSecurity, getProductCapabilities } from "./registry.js";

/**
 * Standard Director Order Evaluation Profiles
 */
export const COMPARISON_PROFILES = {
  // Profile 1: Self-custody & 1:1 economic dividend exposure
  PROFILE_1_SELF_CUSTODY_EXPOSURE: {
    name: "Profile 1: Self-Custody & Economic Dividend Exposure",
    expectations: {
      [EXPECTATION_KEYS.SELF_CUSTODY_WALLET]: EXPECTATION_PRIORITY.REQUIRED,
      [EXPECTATION_KEYS.ECONOMIC_DIVIDEND_BENEFIT]: EXPECTATION_PRIORITY.REQUIRED,
      [EXPECTATION_KEYS.SYNTHETIC_PRICE_EXPOSURE]: EXPECTATION_PRIORITY.REQUIRED
    }
  },

  // Profile 2: Direct ownership of common stock & voting rights
  PROFILE_2_DIRECT_EQUITY_VOTING: {
    name: "Profile 2: Direct Shareholder Ownership & Voting Rights",
    expectations: {
      [EXPECTATION_KEYS.DIRECT_SHAREHOLDER_OWNERSHIP]: EXPECTATION_PRIORITY.REQUIRED,
      [EXPECTATION_KEYS.SHAREHOLDER_VOTING_RIGHTS]: EXPECTATION_PRIORITY.REQUIRED
    }
  },

  // Profile 3: Wallet transferability & permissionless redemption without KYC
  PROFILE_3_TRANSFER_AND_ANON_REDEMPTION: {
    name: "Profile 3: Transferability & Direct Redemption Without KYC",
    expectations: {
      [EXPECTATION_KEYS.WALLET_TRANSFERABILITY]: EXPECTATION_PRIORITY.REQUIRED,
      [EXPECTATION_KEYS.PRIMARY_REDEMPTION_WITHOUT_KYC]: EXPECTATION_PRIORITY.REQUIRED
    }
  },

  // Profile 4: Cash dividend paid directly to holder wallet
  PROFILE_4_CASH_DIVIDENDS: {
    name: "Profile 4: Cash Dividend Paid Directly to Holder Wallet",
    expectations: {
      [EXPECTATION_KEYS.CASH_DIVIDEND_PAYOUTS]: EXPECTATION_PRIORITY.REQUIRED
    }
  },

  // Profile 5: Weekend / Off-Hours continuous trading guarantee
  PROFILE_5_OFF_HOURS_TRADING: {
    name: "Profile 5: 24/7 Weekend & Off-Hours Trading Availability",
    expectations: {
      [EXPECTATION_KEYS.WEEKEND_OR_OFF_HOURS_TRADING]: EXPECTATION_PRIORITY.REQUIRED
    }
  }
};

/**
 * Maps capability key aliases to normalized keys
 */
function normalizeKey(key) {
  return EXPECTATION_KEYS[key] || key;
}

/**
 * Evaluates a single expectation against a specific representation's composed facts
 */
export function evaluateExpectationForRepresentation(key, priority, rep) {
  const normKey = normalizeKey(key);

  if (priority === EXPECTATION_PRIORITY.NOT_IMPORTANT) {
    return {
      key: normKey,
      priority,
      state: MATCH_STATE.NOT_APPLICABLE,
      title: getExpectationTitle(normKey),
      explanation: "Not marked as important by your preference profile."
    };
  }

  const productCaps = getProductCapabilities(rep.productId);
  const capability = productCaps?.capabilities?.[normKey];

  if (normKey === "SYNTHETIC_PRICE_EXPOSURE") {
    return {
      key: normKey,
      priority,
      state: MATCH_STATE.MATCH,
      title: "1:1 Equity Price Exposure",
      explanation: `Product provides 1:1 tracked price exposure on Solana backed by ${productCaps?.issuer?.backingRatio || "underlying collateral"}.`,
      citation: productCaps?.issuer?.documentationUrl,
      authorityClass: productCaps?.issuer?.authorityClass || "ISSUER_LEGAL"
    };
  }

  if (!capability) {
    return {
      key: normKey,
      priority,
      state: MATCH_STATE.UNKNOWN,
      title: getExpectationTitle(normKey),
      explanation: "This expectation is not currently modeled in the verified fact registry."
    };
  }

  let matchState;
  if (capability.evidenceStatus === "SOURCE_CONFLICT") {
    matchState = MATCH_STATE.SOURCE_CONFLICT;
  } else if (capability.conditional) {
    matchState = MATCH_STATE.CONDITIONAL;
  } else if (capability.value === true) {
    matchState = MATCH_STATE.MATCH;
  } else {
    matchState = MATCH_STATE.MISMATCH;
  }

  return {
    key: normKey,
    priority,
    state: matchState,
    title: capability.title,
    explanation: capability.summary,
    reason: capability.reason,
    citation: capability.citation,
    safetyWarning: capability.safetyWarning,
    authorityClass: capability.authorityClass,
    sourceUrl: capability.sourceUrl,
    dateChecked: capability.dateChecked
  };
}

/**
 * Runs multi-issuer product preflight expectation matching for an underlying asset.
 */
export function matchUnderlyingExpectations(underlyingOrRepresentationSymbol, userExpectations = {}) {
  let canonicalSymbol = underlyingOrRepresentationSymbol.toUpperCase();
  if (canonicalSymbol.endsWith("X") && canonicalSymbol.length > 2) {
    canonicalSymbol = canonicalSymbol.slice(0, -1);
  } else if (canonicalSymbol.endsWith("ON") && canonicalSymbol.length > 3) {
    canonicalSymbol = canonicalSymbol.slice(0, -2);
  }

  const underlying = getUnderlyingSecurity(canonicalSymbol);
  if (!underlying) {
    return {
      underlyingSymbol: canonicalSymbol,
      verdict: PRODUCT_VERDICT.NO_VERIFIED_PRODUCT_MATCH,
      summary: `No verified tokenized representations found for underlying symbol '${canonicalSymbol}'.`,
      representationEvaluations: []
    };
  }

  const representationEvaluations = [];
  const matchingRepresentations = [];

  for (const rep of underlying.representations) {
    const evaluations = [];
    let hasRequiredMismatch = false;

    for (const [key, priority] of Object.entries(userExpectations)) {
      const evaluation = evaluateExpectationForRepresentation(key, priority, rep);
      evaluations.push(evaluation);

      if (priority === EXPECTATION_PRIORITY.REQUIRED && evaluation.state === MATCH_STATE.MISMATCH) {
        hasRequiredMismatch = true;
      }
    }

    const isMatch = !hasRequiredMismatch;
    if (isMatch) {
      matchingRepresentations.push(rep.representationTicker);
    }

    representationEvaluations.push({
      productId: rep.productId,
      representationTicker: rep.representationTicker,
      issuerName: rep.issuerProfile?.issuerName,
      mint: rep.mint,
      mintVerificationStatus: rep.mintVerificationStatus,
      executionPreflightSupport: rep.executionPreflightSupport,
      executionPreflightSupported: rep.executionPreflightSupported,
      executionPreflightStatus: rep.executionPreflightStatus || "READY",
      isMatch,
      evaluations
    });
  }

  let overallVerdict;
  let summary;

  if (matchingRepresentations.length > 1) {
    overallVerdict = PRODUCT_VERDICT.MULTIPLE_VERIFIED_MATCHES;
    summary = `Multiple tokenized representations (${matchingRepresentations.join(", ")}) satisfy all of your required expectations. Review the issuer-specific mechanisms below before choosing.`;
  } else if (matchingRepresentations.length === 1) {
    overallVerdict = PRODUCT_VERDICT.MATCHES_REQUIRED_EXPECTATIONS;
    summary = `Representation '${matchingRepresentations[0]}' satisfies all of your required expectations.`;
  } else {
    overallVerdict = PRODUCT_VERDICT.REQUIREMENT_MISMATCH;
    summary = `None of the available tokenized representations for '${underlying.companyName}' satisfy your required expectations. Neither product provides ordinary cash dividends directly into your wallet or unverified shareholder rights.`;
  }

  return {
    underlyingSymbol: underlying.symbol,
    companyName: underlying.companyName,
    verdict: overallVerdict,
    summary,
    matchingRepresentations,
    representationEvaluations
  };
}

function getExpectationTitle(key) {
  return key.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
