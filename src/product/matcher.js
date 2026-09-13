// JustFair — Product Preflight Multi-Issuer Expectation Matcher
// Phase 11 Final Truth Correction — Evaluates user expectations across all verified representations

import {
  EXPECTATION_PRIORITY,
  MATCH_STATE,
  PRODUCT_VERDICT,
  EXPECTATION_KEYS
} from "./schema.js";
import { getUnderlyingSecurity, UNDERLYING_SECURITY_CATALOG } from "./registry.js";

/**
 * Standard Director Order 010.2 Evaluation Profiles
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

  // Profile 2: Direct ownership of Apple common stock & voting rights
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
 * Evaluates a single expectation against a specific representation's facts
 */
export function evaluateExpectationForRepresentation(key, priority, rep) {
  if (priority === EXPECTATION_PRIORITY.NOT_IMPORTANT) {
    return {
      key,
      priority,
      state: MATCH_STATE.NOT_APPLICABLE,
      title: getExpectationTitle(key),
      explanation: "Not marked as important by your preference profile."
    };
  }

  const { holderRights, issuer } = rep;

  switch (key) {
    case EXPECTATION_KEYS.DIRECT_SHAREHOLDER_OWNERSHIP:
      return {
        key,
        priority,
        state: MATCH_STATE.MISMATCH,
        title: "Direct Shareholder Ownership",
        explanation: holderRights.directShareholderOwnership.summary,
        citation: holderRights.directShareholderOwnership.citation,
        authority: holderRights.directShareholderOwnership.authority
      };

    case EXPECTATION_KEYS.SHAREHOLDER_VOTING_RIGHTS:
      return {
        key,
        priority,
        state: MATCH_STATE.MISMATCH,
        title: "Corporate Voting Rights",
        explanation: holderRights.votingRights.summary,
        citation: holderRights.votingRights.citation,
        authority: holderRights.votingRights.authority
      };

    case EXPECTATION_KEYS.ECONOMIC_DIVIDEND_BENEFIT:
      return {
        key,
        priority,
        state: MATCH_STATE.MATCH,
        title: "Economic Dividend Benefit",
        explanation: holderRights.economicDividendBenefit.summary,
        citation: holderRights.economicDividendBenefit.citation,
        authority: holderRights.economicDividendBenefit.authority
      };

    case EXPECTATION_KEYS.CASH_DIVIDEND_PAYOUTS:
      return {
        key,
        priority,
        state: MATCH_STATE.MISMATCH,
        title: "Cash Dividend Paid Directly into Wallet",
        explanation: "Neither currently verified Apple representation pays ordinary Apple cash dividends directly into your wallet. Both preserve dividend economics through their respective total-return / multiplier mechanisms.",
        scamWarning: holderRights.cashDividendPaidToHolder.scamWarning,
        citation: holderRights.cashDividendPaidToHolder.citation,
        authority: holderRights.cashDividendPaidToHolder.authority
      };

    case EXPECTATION_KEYS.SYNTHETIC_PRICE_EXPOSURE:
      return {
        key,
        priority,
        state: MATCH_STATE.MATCH,
        title: "1:1 Equity Price Exposure",
        explanation: `Product provides 1:1 tracked price exposure on Solana backed by ${issuer.backingRatio}.`,
        citation: issuer.documentationUrl,
        authority: holderRights.directShareholderOwnership.authority
      };

    case EXPECTATION_KEYS.SELF_CUSTODY_WALLET:
      return {
        key,
        priority,
        state: MATCH_STATE.MATCH,
        title: "Self-Custodial Wallet Storage",
        explanation: holderRights.selfCustody.summary,
        authority: holderRights.selfCustody.authority
      };

    case EXPECTATION_KEYS.WALLET_TRANSFERABILITY:
      return {
        key,
        priority,
        state: MATCH_STATE.CONDITIONAL,
        title: "24/7 Wallet-to-Wallet Transferability",
        explanation: holderRights.walletTransferability.summary,
        authority: holderRights.walletTransferability.authority
      };

    case EXPECTATION_KEYS.WEEKEND_OR_OFF_HOURS_TRADING:
      return {
        key,
        priority,
        state: MATCH_STATE.CONDITIONAL,
        title: "Weekend & Off-Hours Trading Availability",
        explanation: holderRights.tradingAvailability.offHoursNotes,
        citation: holderRights.tradingAvailability.citation,
        authority: holderRights.tradingAvailability.authority
      };

    case EXPECTATION_KEYS.PRIMARY_REDEMPTION_WITHOUT_KYC:
      return {
        key,
        priority,
        state: MATCH_STATE.MISMATCH,
        title: "Direct Primary Redemption Without KYC",
        explanation: holderRights.primaryRedemption.summary,
        citation: holderRights.primaryRedemption.citation,
        authority: holderRights.primaryRedemption.authority
      };

    case EXPECTATION_KEYS.BANKRUPTCY_SEGREGATED_COLLATERAL:
      return {
        key,
        priority,
        state: MATCH_STATE.MATCH,
        title: "Segregated Bankruptcy Collateral",
        explanation: holderRights.bankruptcyCustody.summary,
        citation: holderRights.bankruptcyCustody.citation,
        authority: holderRights.bankruptcyCustody.authority
      };

    case EXPECTATION_KEYS.TOKEN_2022_MULTIPLIER_ACCRETION:
      return {
        key,
        priority,
        state: MATCH_STATE.MATCH,
        title: "Token-2022 Scaled UI Multiplier",
        explanation: "Product uses SPL Token-2022 scaledUiAmountConfig extension to reflect dynamic equity exposure without mutating raw balances.",
        authority: FACT_AUTHORITY.SOLANA_ONCHAIN_RPC
      };

    default:
      return {
        key,
        priority,
        state: MATCH_STATE.UNKNOWN,
        title: "Custom Expectation",
        explanation: "This expectation is not currently modeled in the verified fact registry."
      };
  }
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
      representationTicker: rep.representationTicker,
      issuerName: rep.issuer.issuerName,
      mint: rep.mint,
      mintVerificationStatus: rep.mintVerificationStatus,
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
