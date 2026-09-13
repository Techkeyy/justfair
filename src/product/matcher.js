// JustFair — Product Preflight Expectation Matcher Engine
// Phase 13 — Deterministic Expectation Evaluation & Consumer API (Order 012)
// Evaluates user expectation profiles against verified product facts without subjective scores, rankings, or AI hallucinations

import {
  PREFLIGHT_MODE,
  EXPECTATION_PRIORITY,
  MATCH_STATE,
  PRODUCT_EVALUATION_STATE,
  UNDERLYING_RESULT_STATE,
  PRODUCT_VERDICT,
  FACT_EVIDENCE_STATUS,
  VERIFICATION_STATUS,
  EXECUTION_SUPPORT,
  CAPABILITY_KEYS,
  EXPECTATION_KEYS,
  CONSUMER_EXPECTATION_PROMPTS
} from "./schema.js";

import {
  getUnderlyingSecurity,
  getAllUnderlyings,
  getProduct,
  getAllProducts,
  getProductCapabilities
} from "./registry.js";

import {
  verifyProductOnchain
} from "./verifier.js";

import {
  compareProducts
} from "./comparator.js";

/**
 * Verification Cache with TTL (5 minutes) to avoid redundant Solana RPC fanout
 */
const verificationCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getOrFetchVerification(productId, options = {}) {
  const now = Date.now();
  if (!options.forceFresh && verificationCache.has(productId)) {
    const cached = verificationCache.get(productId);
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const data = await verifyProductOnchain(productId, options);
  verificationCache.set(productId, { data, timestamp: now });
  return data;
}

export function clearVerificationCache() {
  verificationCache.clear();
}

/**
 * Standard Director Order Evaluation Profiles
 */
export const COMPARISON_PROFILES = {
  // Legacy Profiles
  PROFILE_1_SELF_CUSTODY_EXPOSURE: {
    name: "Self-Custody Synthetic Exposure",
    expectations: {
      SELF_CUSTODY: EXPECTATION_PRIORITY.REQUIRED,
      ECONOMIC_DIVIDEND_BENEFIT: EXPECTATION_PRIORITY.REQUIRED
    }
  },
  PROFILE_2_DIRECT_EQUITY_VOTING: {
    name: "Direct Equity Ownership with Voting",
    expectations: {
      DIRECT_SHARE_OWNERSHIP: EXPECTATION_PRIORITY.REQUIRED,
      ORDINARY_VOTING_RIGHTS: EXPECTATION_PRIORITY.REQUIRED
    }
  },
  PROFILE_3_TRANSFER_AND_ANON_REDEMPTION: {
    name: "Transferable with Unrestricted Redemption",
    expectations: {
      WALLET_TRANSFERABILITY: EXPECTATION_PRIORITY.REQUIRED,
      REDEMPTION_WITHOUT_KYC: EXPECTATION_PRIORITY.REQUIRED
    }
  },
  PROFILE_4_CASH_DIVIDENDS: {
    name: "Cash Dividend Recipient",
    expectations: {
      CASH_DIVIDEND_PAYOUT: EXPECTATION_PRIORITY.REQUIRED
    }
  },
  PROFILE_5_OFF_HOURS_TRADING: {
    name: "24/7 DEX Trader",
    expectations: {
      ONCHAIN_SECONDARY_TRADING: EXPECTATION_PRIORITY.REQUIRED,
      WEEKEND_TRADING: EXPECTATION_PRIORITY.REQUIRED
    }
  },
  // Order 012 Profiles
  PROFILE_A: {
    name: "Profile A: Self-Custody & Economic Dividends",
    expectations: [
      { key: "SELF_CUSTODY", priority: EXPECTATION_PRIORITY.REQUIRED },
      { key: "ECONOMIC_DIVIDEND_BENEFIT", priority: EXPECTATION_PRIORITY.REQUIRED }
    ]
  },
  PROFILE_B: {
    name: "Profile B: Ordinary Voting Rights",
    expectations: [
      { key: "ORDINARY_VOTING_RIGHTS", priority: EXPECTATION_PRIORITY.REQUIRED }
    ]
  },
  PROFILE_C: {
    name: "Profile C: Cash Dividend Payouts",
    expectations: [
      { key: "CASH_DIVIDEND_PAYOUT", priority: EXPECTATION_PRIORITY.REQUIRED }
    ]
  },
  PROFILE_D: {
    name: "Profile D: Self-Custody Required + Cash Dividend Optional",
    expectations: [
      { key: "SELF_CUSTODY", priority: EXPECTATION_PRIORITY.REQUIRED },
      { key: "CASH_DIVIDEND_PAYOUT", priority: EXPECTATION_PRIORITY.OPTIONAL }
    ]
  },
  PROFILE_E: {
    name: "Profile E: Direct Issuer Redemption",
    expectations: [
      { key: "DIRECT_ISSUER_REDEMPTION", priority: EXPECTATION_PRIORITY.REQUIRED }
    ]
  },
  PROFILE_F: {
    name: "Profile F: Redemption Without KYC",
    expectations: [
      { key: "REDEMPTION_WITHOUT_KYC", priority: EXPECTATION_PRIORITY.REQUIRED }
    ]
  },
  PROFILE_G: {
    name: "Profile G: In-Kind Share Redemption",
    expectations: [
      { key: "IN_KIND_SHARE_REDEMPTION", priority: EXPECTATION_PRIORITY.REQUIRED }
    ]
  }
};

/**
 * Normalizes input expectation key to canonical schema key
 */
export function normalizeExpectationKey(key) {
  if (!key || typeof key !== "string") return null;
  const upper = key.trim().toUpperCase();
  return EXPECTATION_KEYS[upper] || (CAPABILITY_KEYS[upper] ? upper : null);
}

/**
 * Normalizes priority value
 */
export function normalizePriority(priority) {
  if (!priority) return EXPECTATION_PRIORITY.REQUIRED;
  const upper = String(priority).trim().toUpperCase();
  if (upper === EXPECTATION_PRIORITY.OPTIONAL) return EXPECTATION_PRIORITY.OPTIONAL;
  if (upper === EXPECTATION_PRIORITY.NOT_IMPORTANT) return EXPECTATION_PRIORITY.NOT_IMPORTANT;
  return EXPECTATION_PRIORITY.REQUIRED;
}

/**
 * Deterministic Explanation Templates for Expectations
 */
export function generateExpectationExplanation({ key, state, capability, rep, underlyingSymbol, companyName }) {
  const ticker = rep.representationTicker;
  const issuerName = rep.issuerProfile?.issuerName || "the issuer";

  switch (key) {
    case CAPABILITY_KEYS.SELF_CUSTODY:
      if (state === MATCH_STATE.MATCH) {
        return `${ticker} is held directly in your self-custodial Solana wallet.`;
      }
      return `${ticker} is held in a custodial account rather than a self-custodial wallet.`;

    case CAPABILITY_KEYS.DIRECT_SHARE_OWNERSHIP:
      if (state === MATCH_STATE.MISMATCH) {
        return `You do not directly own ${companyName} shares while holding ${ticker}. ${ticker} provides tokenized exposure tracking ${underlyingSymbol}, but does not grant direct legal share ownership in ${companyName}.`;
      }
      return `${ticker} grants direct legal common share ownership in ${companyName}.`;

    case CAPABILITY_KEYS.ORDINARY_VOTING_RIGHTS:
      if (state === MATCH_STATE.MISMATCH) {
        return `${ticker} gives you economic exposure to ${companyName}, but it does not give you ordinary shareholder voting rights.`;
      }
      return `${ticker} includes pass-through corporate voting rights for shareholder resolutions.`;

    case CAPABILITY_KEYS.ECONOMIC_DIVIDEND_BENEFIT:
      if (state === MATCH_STATE.MATCH) {
        return `${ticker} automatically reinvests net dividends into the underlying exposure, increasing token balance/multiplier on-chain.`;
      }
      return `${ticker} does not capture net dividend economics.`;

    case CAPABILITY_KEYS.CASH_DIVIDEND_PAYOUT:
      if (state === MATCH_STATE.MISMATCH) {
        return `${ticker} does not pay cash or stablecoins to your wallet. Net dividends are automatically compounded into token value on-chain via SPL Token-2022.`;
      }
      return `${ticker} distributes periodic cash/stablecoin dividends directly into your wallet.`;

    case CAPABILITY_KEYS.WALLET_TRANSFERABILITY:
      if (state === MATCH_STATE.CONDITIONAL) {
        return `${ticker} is freely transferable between Solana wallets 24/7, subject to ${issuerName} compliance and pause controls.`;
      }
      return `${ticker} can be transferred between wallets.`;

    case CAPABILITY_KEYS.ONCHAIN_SECONDARY_TRADING:
      if (state === MATCH_STATE.MATCH) {
        return `${ticker} is tradable on-chain on Solana decentralized venues and solver networks.`;
      }
      return `${ticker} does not support on-chain secondary trading.`;

    case CAPABILITY_KEYS.DIRECT_ISSUER_REDEMPTION:
      if (state === MATCH_STATE.CONDITIONAL) {
        if (rep.issuerProfile?.issuerId === "BACKED_ASSETS_JE" || rep.issuerProfile?.issuerId === "BACKED_ASSETS") {
          return `Direct primary redemption with Backed Assets (JE) Limited is available to eligible retail and institutional participants upon KYC onboarding and token surrender ($5,000 minimum transaction size). Everyday retail users trade on DEXes without onboarding.`;
        } else {
          return `Direct primary redemption with Ondo Global Markets (BVI) Limited requires platform KYC onboarding under Regulation S (non-US persons only). Everyday retail users trade on DEXes without onboarding.`;
        }
      }
      return `${ticker} supports direct redemption with the issuer.`;

    case CAPABILITY_KEYS.IN_KIND_SHARE_REDEMPTION:
      if (state === MATCH_STATE.CONDITIONAL || state === MATCH_STATE.MATCH) {
        return `You do not directly own ${underlyingSymbol} shares while holding ${ticker}. However, eligible onboarded users may convert ${ticker} into actual underlying shares via the xPort / Alpaca process.`;
      } else if (state === MATCH_STATE.MISMATCH) {
        return `${ticker} primary redemption settles in cash or settlement assets under Regulation S. Converting ${ticker} directly into actual registered ${underlyingSymbol} equity shares is not supported.`;
      }
      return `${ticker} in-kind share conversion status is unconfirmed.`;

    case CAPABILITY_KEYS.CASH_STABLECOIN_REDEMPTION:
      if (state === MATCH_STATE.CONDITIONAL || state === MATCH_STATE.MATCH) {
        return `Direct primary redemption for cash/stablecoin proceeds is available with ${issuerName} for KYC-onboarded users.`;
      }
      return `${ticker} does not support cash/stablecoin primary redemption.`;

    case CAPABILITY_KEYS.REDEMPTION_WITHOUT_KYC:
      if (state === MATCH_STATE.MISMATCH) {
        return `Direct primary redemption with ${issuerName} strictly requires KYC identity verification. Everyday retail users exit via decentralized secondary DEX liquidity without KYC.`;
      }
      return `Direct primary redemption is available without KYC identity verification.`;

    case CAPABILITY_KEYS.WEEKEND_TRADING:
      if (state === MATCH_STATE.CONDITIONAL) {
        return `${ticker} can be transferred and traded on-chain 24/7, but off-hours and weekend execution face wider bid-ask spreads and liquidity limits while underlying US stock exchanges are closed.`;
      }
      return `${ticker} supports 24/7 weekend execution.`;

    default:
      return capability?.summary || `Expectation evaluation for ${key}.`;
  }
}

/**
 * Evaluates a single expectation for a representation
 */
export function evaluateExpectationForRepresentation(key, priority, rep) {
  const normKey = normalizeExpectationKey(key);
  const normPriority = normalizePriority(priority);

  const promptMeta = CONSUMER_EXPECTATION_PROMPTS[normKey] || {
    key: normKey || key,
    prompt: `Requirement for ${normKey || key}`,
    shortLabel: normKey || key
  };

  if (!normKey) {
    return {
      key: key,
      priority: normPriority,
      state: MATCH_STATE.UNKNOWN,
      prompt: `Unknown requirement: ${key}`,
      shortLabel: key,
      title: key,
      explanation: `Expectation key '${key}' is unrecognized in the canonical capability schema.`,
      authorityClass: "UNKNOWN"
    };
  }

  if (normPriority === EXPECTATION_PRIORITY.NOT_IMPORTANT) {
    return {
      key: normKey,
      priority: normPriority,
      state: MATCH_STATE.NOT_APPLICABLE,
      prompt: promptMeta.prompt,
      shortLabel: promptMeta.shortLabel,
      title: promptMeta.shortLabel,
      explanation: "Not marked as important by your preference profile."
    };
  }

  const productCaps = getProductCapabilities(rep.productId);
  const capability = productCaps?.capabilities?.[normKey];

  if (!capability) {
    return {
      key: normKey,
      priority: normPriority,
      state: MATCH_STATE.UNKNOWN,
      prompt: promptMeta.prompt,
      shortLabel: promptMeta.shortLabel,
      title: promptMeta.shortLabel,
      explanation: `This capability (${normKey}) is not modeled for this product in the verified fact registry.`
    };
  }

  let matchState;
  if (capability.evidenceStatus === FACT_EVIDENCE_STATUS.SOURCE_CONFLICT) {
    matchState = MATCH_STATE.SOURCE_CONFLICT;
  } else if (capability.conditional || capability.evidenceStatus === FACT_EVIDENCE_STATUS.CONDITIONAL) {
    matchState = MATCH_STATE.CONDITIONAL;
  } else if (capability.value === true) {
    matchState = MATCH_STATE.MATCH;
  } else if (capability.value === false) {
    matchState = MATCH_STATE.MISMATCH;
  } else {
    matchState = MATCH_STATE.UNKNOWN;
  }

  const explanation = generateExpectationExplanation({
    key: normKey,
    state: matchState,
    capability,
    rep,
    underlyingSymbol: rep.underlyingSymbol,
    companyName: rep.companyName
  });

  // Protective advice if REQUIRED expectation mismatches
  let protectiveAdvice = null;
  if (normPriority === EXPECTATION_PRIORITY.REQUIRED && matchState === MATCH_STATE.MISMATCH) {
    if (normKey === CAPABILITY_KEYS.ORDINARY_VOTING_RIGHTS) {
      protectiveAdvice = `If voting rights are essential to you, don't buy this representation expecting ordinary ${rep.companyName || "company"} shareholder rights.`;
    } else if (normKey === CAPABILITY_KEYS.DIRECT_SHARE_OWNERSHIP) {
      protectiveAdvice = `If direct legal share ownership is essential to you, don't buy this representation expecting company common shares.`;
    } else if (normKey === CAPABILITY_KEYS.CASH_DIVIDEND_PAYOUT) {
      protectiveAdvice = `If cash dividends paid to your wallet are essential to you, don't buy this representation expecting periodic cash deposits.`;
    } else if (normKey === CAPABILITY_KEYS.REDEMPTION_WITHOUT_KYC) {
      protectiveAdvice = `If anonymous direct issuer redemption is required, note that direct issuer redemption always requires KYC.`;
    } else if (normKey === CAPABILITY_KEYS.IN_KIND_SHARE_REDEMPTION) {
      protectiveAdvice = `If converting tokenized exposure into actual brokerage common shares is required, note that ${rep.representationTicker} only settles for cash/settlement assets, not physical shares.`;
    }
  }

  return {
    key: normKey,
    priority: normPriority,
    state: matchState,
    prompt: promptMeta.prompt,
    shortLabel: promptMeta.shortLabel,
    title: capability.title || promptMeta.shortLabel,
    explanation,
    protectiveAdvice,
    reason: capability.reason || null,
    citation: capability.citation || null,
    authorityClass: capability.authorityClass || null,
    sourceUrl: capability.sourceUrl || null,
    dateChecked: capability.dateChecked || null
  };
}

/**
 * Evaluates all user expectations for a single product representation
 */
export function evaluateRepresentation(rep, normalizedExpectations, verificationState = null) {
  const evaluations = [];
  const requiredEvaluations = [];
  const optionalEvaluations = [];
  const notImportantEvaluations = [];

  for (const exp of normalizedExpectations) {
    const evalResult = evaluateExpectationForRepresentation(exp.key, exp.priority, rep);
    evaluations.push(evalResult);

    if (evalResult.priority === EXPECTATION_PRIORITY.REQUIRED) {
      requiredEvaluations.push(evalResult);
    } else if (evalResult.priority === EXPECTATION_PRIORITY.OPTIONAL) {
      optionalEvaluations.push(evalResult);
    } else {
      notImportantEvaluations.push(evalResult);
    }
  }

  // Determine Product Evaluation State
  let status = PRODUCT_EVALUATION_STATE.MATCH;
  const reasonCodes = [];

  // Check On-Chain Asset Verification
  const isVerifiedOnchain = verificationState && verificationState.verificationStatus === VERIFICATION_STATUS.VERIFIED;
  if (verificationState && !isVerifiedOnchain) {
    status = PRODUCT_EVALUATION_STATE.UNABLE_TO_VERIFY;
    reasonCodes.push(...(verificationState.reasonCodes || ["ASSET_VERIFICATION_FAILED"]));
  } else {
    // Check Required Expectations
    const hasRequiredUnknown = requiredEvaluations.some(e => e.state === MATCH_STATE.UNKNOWN || e.state === MATCH_STATE.SOURCE_CONFLICT);
    const hasRequiredMismatch = requiredEvaluations.some(e => e.state === MATCH_STATE.MISMATCH);
    const hasRequiredConditional = requiredEvaluations.some(e => e.state === MATCH_STATE.CONDITIONAL);

    if (hasRequiredUnknown) {
      status = PRODUCT_EVALUATION_STATE.UNABLE_TO_VERIFY;
      reasonCodes.push("REQUIRED_CAPABILITY_UNKNOWN");
    } else if (hasRequiredMismatch) {
      status = PRODUCT_EVALUATION_STATE.MISMATCH;
      const mismatchKeys = requiredEvaluations.filter(e => e.state === MATCH_STATE.MISMATCH).map(e => e.key);
      reasonCodes.push(...mismatchKeys.map(k => `REQUIRED_MISMATCH_${k}`));
    } else if (hasRequiredConditional) {
      status = PRODUCT_EVALUATION_STATE.CONDITIONAL_MATCH;
      const condKeys = requiredEvaluations.filter(e => e.state === MATCH_STATE.CONDITIONAL).map(e => e.key);
      reasonCodes.push(...condKeys.map(k => `REQUIRED_CONDITIONAL_${k}`));
    } else {
      status = PRODUCT_EVALUATION_STATE.MATCH;
      reasonCodes.push("ALL_REQUIRED_MATCH");
    }
  }

  // Optional warnings (do not disqualify)
  const optionalMismatches = optionalEvaluations.filter(e => e.state === MATCH_STATE.MISMATCH || e.state === MATCH_STATE.CONDITIONAL);
  const optionalWarnings = optionalMismatches.map(e => ({
    key: e.key,
    state: e.state,
    message: `Optional preference for '${e.shortLabel}' is not satisfied by ${rep.representationTicker}: ${e.explanation}`
  }));

  // Summary message
  let summary = "";
  if (status === PRODUCT_EVALUATION_STATE.MATCH) {
    summary = `${rep.representationTicker} satisfies all of your required expectations.`;
  } else if (status === PRODUCT_EVALUATION_STATE.CONDITIONAL_MATCH) {
    summary = `${rep.representationTicker} can satisfy your required expectations, subject to issuer-specific conditions (e.g. KYC, minimum size, or market session).`;
  } else if (status === PRODUCT_EVALUATION_STATE.MISMATCH) {
    const failedPrompts = requiredEvaluations.filter(e => e.state === MATCH_STATE.MISMATCH).map(e => e.shortLabel);
    summary = `${rep.representationTicker} does not satisfy your required expectation for: ${failedPrompts.join(", ")}.`;
  } else {
    summary = `${rep.representationTicker} could not be confidently verified against your required expectations.`;
  }

  return {
    productId: rep.productId,
    symbol: rep.representationTicker,
    underlyingSymbol: rep.underlyingSymbol,
    companyName: rep.companyName,
    issuer: rep.issuerProfile?.issuerName || "Unknown Issuer",
    mint: rep.mint,
    decimals: rep.decimals,
    tokenProgram: rep.tokenProgram,
    executionPreflightSupport: rep.executionPreflightSupport,
    executionPreflightSupported: rep.executionPreflightSupported,
    assetVerification: {
      status: verificationState?.verificationStatus || "VERIFIED",
      observedMultiplier: verificationState?.observed?.effectiveMultiplier?.activeMultiplier || null,
      checkedAt: verificationState?.checkedAt || new Date().toISOString()
    },
    evaluation: {
      status,
      reasonCodes,
      summary,
      required: requiredEvaluations,
      optional: optionalEvaluations,
      notImportant: notImportantEvaluations,
      optionalWarnings
    }
  };
}

/**
 * Creates immutable Product Preflight Handoff object
 */
export function createProductHandoff(productEvaluation) {
  if (!productEvaluation) return null;
  return {
    product_id: productEvaluation.productId,
    underlying_symbol: productEvaluation.underlyingSymbol,
    representation_symbol: productEvaluation.symbol,
    issuer: productEvaluation.issuer,
    network: "solana-mainnet",
    mint: productEvaluation.mint,
    decimals: productEvaluation.decimals,
    token_program: productEvaluation.tokenProgram,
    product_verification_status: productEvaluation.assetVerification?.status || "VERIFIED",
    verification_timestamp: productEvaluation.assetVerification?.checkedAt || new Date().toISOString(),
    execution_preflight_support: productEvaluation.executionPreflightSupport,
    execution_preflight_supported: productEvaluation.executionPreflightSupported
  };
}

/**
 * Validates request input and throws structured Error on failure
 */
export function validatePreflightRequestInput({ underlying, productId, expectations }) {
  if (!underlying && !productId) {
    throw new Error("INVALID_REQUEST: Either 'underlying' (e.g. 'AAPL') or 'product_id' (e.g. 'xstocks:aaplx:solana') must be provided.");
  }

  if (underlying && productId) {
    throw new Error("AMBIGUOUS_REQUEST: Provide either 'underlying' or 'product_id', not both.");
  }

  if (!Array.isArray(expectations) || expectations.length === 0) {
    throw new Error("INVALID_EXPECTATIONS: 'expectations' must be a non-empty array of expectation objects.");
  }

  const seenKeys = new Set();
  const normalizedExpectations = [];

  for (const exp of expectations) {
    if (!exp || typeof exp !== "object" || !exp.key) {
      throw new Error("MALFORMED_EXPECTATION: Each expectation must contain a 'key' property.");
    }

    const normKey = normalizeExpectationKey(exp.key);
    if (!normKey) {
      throw new Error(`UNKNOWN_EXPECTATION_KEY: Expectation key '${exp.key}' is not recognized.`);
    }

    if (seenKeys.has(normKey)) {
      throw new Error(`DUPLICATE_EXPECTATION_KEY: Duplicate expectation '${exp.key}' found in request.`);
    }
    seenKeys.add(normKey);

    let normPriority = EXPECTATION_PRIORITY.REQUIRED;
    if (exp.priority !== undefined && exp.priority !== null) {
      const pUpper = String(exp.priority).trim().toUpperCase();
      if (pUpper === EXPECTATION_PRIORITY.REQUIRED || pUpper === EXPECTATION_PRIORITY.OPTIONAL || pUpper === EXPECTATION_PRIORITY.NOT_IMPORTANT) {
        normPriority = pUpper;
      } else {
        throw new Error(`INVALID_PRIORITY: Priority '${exp.priority}' is invalid. Allowed values: REQUIRED, OPTIONAL, NOT_IMPORTANT.`);
      }
    }

    normalizedExpectations.push({
      key: normKey,
      priority: normPriority
    });
  }

  return {
    mode: underlying ? PREFLIGHT_MODE.UNDERLYING_DISCOVERY : PREFLIGHT_MODE.SPECIFIC_PRODUCT_CHECK,
    underlying: underlying ? underlying.trim().toUpperCase() : null,
    productId: productId ? productId.trim().toLowerCase() : null,
    normalizedExpectations
  };
}

/**
 * Main Product Preflight Evaluation Entrypoint
 */
export async function runProductPreflight({ underlying, productId, expectations, options = {} }) {
  const validated = validatePreflightRequestInput({ underlying, productId, expectations });
  const { mode, normalizedExpectations } = validated;
  const checkedAt = new Date().toISOString();

  if (mode === PREFLIGHT_MODE.UNDERLYING_DISCOVERY) {
    const canonicalUnderlying = validated.underlying;
    const security = getUnderlyingSecurity(canonicalUnderlying);
    if (!security) {
      throw new Error(`UNKNOWN_UNDERLYING: No registered tokenized stock representations found for underlying '${canonicalUnderlying}'.`);
    }

    // Live-verify only candidates for this specific underlying
    const productEvaluations = [];
    for (const rep of security.representations) {
      const repWithMeta = {
        ...rep,
        underlyingSymbol: security.symbol,
        companyName: security.companyName,
        assetClass: security.assetClass
      };

      const verificationState = await getOrFetchVerification(rep.productId, options);
      const evalResult = evaluateRepresentation(repWithMeta, normalizedExpectations, verificationState);
      productEvaluations.push(evalResult);
    }

    // Determine Underlying-Level Result State
    const matchProducts = productEvaluations.filter(p => p.evaluation.status === PRODUCT_EVALUATION_STATE.MATCH);
    const conditionalProducts = productEvaluations.filter(p => p.evaluation.status === PRODUCT_EVALUATION_STATE.CONDITIONAL_MATCH);
    const unableProducts = productEvaluations.filter(p => p.evaluation.status === PRODUCT_EVALUATION_STATE.UNABLE_TO_VERIFY);

    let overallResult;
    let consumerSummary;

    if (matchProducts.length > 1) {
      overallResult = UNDERLYING_RESULT_STATE.MULTIPLE_VERIFIED_MATCHES;
      consumerSummary = `Multiple verified tokenized representations for ${security.companyName} (${matchProducts.map(p => p.symbol).join(", ")}) satisfy all of your required expectations. Review their issuer and redemption differences below.`;
    } else if (matchProducts.length === 1) {
      overallResult = UNDERLYING_RESULT_STATE.MATCHES_REQUIRED_EXPECTATIONS;
      consumerSummary = `Representation ${matchProducts[0].symbol} satisfies all of your required expectations for ${security.companyName}.`;
    } else if (conditionalProducts.length > 0 && unableProducts.length === 0) {
      overallResult = UNDERLYING_RESULT_STATE.CONDITIONAL_MATCHES;
      consumerSummary = `Available tokenized representations for ${security.companyName} can satisfy your expectations only if you meet specific issuer conditions (e.g. KYC onboarding or minimum size).`;
    } else if (unableProducts.length > 0) {
      overallResult = UNDERLYING_RESULT_STATE.UNABLE_TO_VERIFY_PRODUCT;
      consumerSummary = `Could not confidently verify all required expectations or on-chain assets for ${security.companyName}.`;
    } else {
      overallResult = UNDERLYING_RESULT_STATE.NO_VERIFIED_PRODUCT_MATCH;
      const failedReqKeys = [...new Set(
        productEvaluations.flatMap(p => p.evaluation.required.filter(r => r.state === MATCH_STATE.MISMATCH).map(r => r.shortLabel))
      )];
      consumerSummary = `Neither currently verified ${security.companyName} representation satisfies your required expectation for: ${failedReqKeys.join(", ")}.`;
    }

    // Meaningful differences if multiple matches exist
    let meaningfulDifferences = [];
    if (matchProducts.length > 1) {
      const comparison = compareProducts(matchProducts[0].productId, matchProducts[1].productId);
      meaningfulDifferences = comparison.differences || [];
    }

    // Primary handoff if single match, or first match candidate
    const primaryHandoff = matchProducts.length > 0 ? createProductHandoff(matchProducts[0]) : null;

    return {
      request_status: "COMPLETED",
      mode: PREFLIGHT_MODE.UNDERLYING_DISCOVERY,
      underlying: security.symbol,
      company_name: security.companyName,
      checked_at: checkedAt,
      overall_result: overallResult,
      expectations: normalizedExpectations.map(e => ({
        key: e.key,
        priority: e.priority,
        prompt: CONSUMER_EXPECTATION_PROMPTS[e.key]?.prompt || e.key,
        shortLabel: CONSUMER_EXPECTATION_PROMPTS[e.key]?.shortLabel || e.key
      })),
      products: productEvaluations,
      meaningful_differences: meaningfulDifferences,
      consumer_summary: consumerSummary,
      handoff: primaryHandoff,
      technical_evidence: {
        verified_candidates_count: productEvaluations.length,
        match_count: matchProducts.length,
        conditional_count: conditionalProducts.length,
        unable_count: unableProducts.length
      }
    };
  } else {
    // Mode B: Specific Product Check
    const targetProduct = getProduct(validated.productId);
    if (!targetProduct) {
      throw new Error(`UNKNOWN_PRODUCT_ID: Product ID '${validated.productId}' is not registered in the canonical catalog.`);
    }

    const verificationState = await getOrFetchVerification(targetProduct.productId, options);
    const evalResult = evaluateRepresentation(targetProduct, normalizedExpectations, verificationState);
    const overallResult = evalResult.evaluation.status;
    const handoff = overallResult === PRODUCT_EVALUATION_STATE.MATCH || overallResult === PRODUCT_EVALUATION_STATE.CONDITIONAL_MATCH
      ? createProductHandoff(evalResult)
      : null;

    return {
      request_status: "COMPLETED",
      mode: PREFLIGHT_MODE.SPECIFIC_PRODUCT_CHECK,
      product_id: targetProduct.productId,
      symbol: targetProduct.representationTicker,
      underlying: targetProduct.underlyingSymbol,
      company_name: targetProduct.companyName,
      checked_at: checkedAt,
      overall_result: overallResult,
      expectations: normalizedExpectations.map(e => ({
        key: e.key,
        priority: e.priority,
        prompt: CONSUMER_EXPECTATION_PROMPTS[e.key]?.prompt || e.key,
        shortLabel: CONSUMER_EXPECTATION_PROMPTS[e.key]?.shortLabel || e.key
      })),
      product: evalResult,
      consumer_summary: evalResult.evaluation.summary,
      handoff,
      technical_evidence: {
        mint: targetProduct.mint,
        onchain_verification_status: verificationState?.verificationStatus || "VERIFIED",
        multiplier: verificationState?.observed?.effectiveMultiplier?.activeMultiplier || null
      }
    };
  }
}

/**
 * Backward compatibility helper for underlying expectation matching
 */
export function matchUnderlyingExpectations(underlyingOrRepresentationSymbol, userExpectations = {}) {
  let canonicalSymbol = underlyingOrRepresentationSymbol.toUpperCase();
  if (canonicalSymbol.endsWith("X") && canonicalSymbol.length > 2) {
    canonicalSymbol = canonicalSymbol.slice(0, -1);
  } else if (canonicalSymbol.endsWith("ON") && canonicalSymbol.length > 3) {
    canonicalSymbol = canonicalSymbol.slice(0, -2);
  }

  const expectationsArray = Array.isArray(userExpectations)
    ? userExpectations
    : Object.entries(userExpectations).map(([key, priority]) => ({
        key,
        priority
      }));

  const underlying = getUnderlyingSecurity(canonicalSymbol);
  if (!underlying) {
    return {
      underlyingSymbol: canonicalSymbol,
      verdict: PRODUCT_VERDICT.REQUIREMENT_MISMATCH,
      summary: `No verified tokenized representations found for underlying symbol '${canonicalSymbol}'.`,
      representationEvaluations: []
    };
  }

  const normalizedExpectations = expectationsArray.map(e => ({
    key: normalizeExpectationKey(e.key),
    priority: normalizePriority(e.priority)
  }));

  const representationEvaluations = [];
  const matchingRepresentations = [];

  for (const rep of underlying.representations) {
    const repWithMeta = {
      ...rep,
      underlyingSymbol: underlying.symbol,
      companyName: underlying.companyName,
      assetClass: underlying.assetClass
    };
    const evalResult = evaluateRepresentation(repWithMeta, normalizedExpectations, { verificationStatus: VERIFICATION_STATUS.VERIFIED });
    if (evalResult.evaluation.status === PRODUCT_EVALUATION_STATE.MATCH) {
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
      isMatch: evalResult.evaluation.status === PRODUCT_EVALUATION_STATE.MATCH,
      evaluations: evalResult.evaluation.required.concat(evalResult.evaluation.optional)
    });
  }

  let verdict;
  let summary;
  if (matchingRepresentations.length > 1) {
    verdict = PRODUCT_VERDICT.MULTIPLE_VERIFIED_MATCHES;
    summary = `Multiple tokenized representations (${matchingRepresentations.join(", ")}) satisfy all of your required expectations.`;
  } else if (matchingRepresentations.length === 1) {
    verdict = PRODUCT_VERDICT.MATCHES_REQUIRED_EXPECTATIONS;
    summary = `Representation '${matchingRepresentations[0]}' satisfies all of your required expectations.`;
  } else {
    verdict = PRODUCT_VERDICT.REQUIREMENT_MISMATCH;
    summary = `None of the available tokenized representations for '${underlying.companyName}' satisfy your required expectations.`;
  }

  return {
    underlyingSymbol: underlying.symbol,
    companyName: underlying.companyName,
    verdict,
    summary,
    matchingRepresentations,
    representationEvaluations
  };
}
