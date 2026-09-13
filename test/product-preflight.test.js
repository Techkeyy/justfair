// JustFair — Product Preflight / FinePrint Test Suite
// Phase 11 Final Truth Correction — Exact AAPLon Mint & Corrected Semantic Models

import test from "node:test";
import assert from "node:assert/strict";
import {
  EXPECTATION_PRIORITY,
  MATCH_STATE,
  PRODUCT_VERDICT,
  FACT_AUTHORITY,
  EXPECTATION_KEYS
} from "../src/product/schema.js";
import {
  getUnderlyingSecurity,
  getAllUnderlyings,
  SECOND_ISSUER_STATUS,
  ISSUER_FACTS
} from "../src/product/registry.js";
import {
  matchUnderlyingExpectations,
  COMPARISON_PROFILES,
  evaluateExpectationForRepresentation
} from "../src/product/matcher.js";

test("Registry: Exact AAPLon mint is mapped to official Ondo source", () => {
  const aapl = getUnderlyingSecurity("AAPL");
  assert.ok(aapl, "AAPL underlying must exist");

  const aaplon = aapl.representations.find(r => r.representationTicker === "AAPLon");
  assert.ok(aaplon, "AAPLon representation must exist");
  assert.equal(aaplon.mint, "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo", "Exact AAPLon mint address must match official Ondo source");
  assert.equal(aaplon.decimals, 9);
  assert.equal(aaplon.mintVerificationStatus, "VERIFIED_ONCHAIN");
  assert.ok(aaplon.officialMappingSource.includes("gm-solana-simulator"));
});

test("Second-Issuer Kill Gate: Verified PASS with historical superseding recorded", () => {
  assert.equal(SECOND_ISSUER_STATUS.gate, "PASS");
  assert.ok(SECOND_ISSUER_STATUS.supportedIssuers.some(i => i.includes("Ondo Global Markets")));
  assert.ok(SECOND_ISSUER_STATUS.supportedIssuers.some(i => i.includes("Backed Assets")));

  // Verify superseded claims log
  const supersededIds = SECOND_ISSUER_STATUS.supersededFindings.map(s => s.id);
  assert.ok(supersededIds.includes("AAPLON_MINT_STATUS"));
  assert.ok(supersededIds.includes("DIVIDEND_PAYOUT_MECHANISM"));
  assert.ok(supersededIds.includes("TRADING_AVAILABILITY_SEMANTICS"));
});

test("Profile 1 (Self-Custody & Economic Dividend Exposure): Returns MULTIPLE_VERIFIED_MATCHES", () => {
  const result = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_1_SELF_CUSTODY_EXPOSURE.expectations);

  assert.equal(result.verdict, PRODUCT_VERDICT.MULTIPLE_VERIFIED_MATCHES);
  assert.deepEqual(result.matchingRepresentations, ["AAPLx", "AAPLon"]);
  assert.equal(result.representationEvaluations.length, 2);
  assert.ok(result.summary.includes("Multiple tokenized representations"));
});

test("Profile 2 (Direct Shareholder & Voting): Returns REQUIREMENT_MISMATCH for all representations", () => {
  const result = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_2_DIRECT_EQUITY_VOTING.expectations);

  assert.equal(result.verdict, PRODUCT_VERDICT.REQUIREMENT_MISMATCH);
  assert.deepEqual(result.matchingRepresentations, []);
  assert.equal(result.representationEvaluations.every(r => !r.isMatch), true);
});

test("Profile 3 (Transferability & Anon Redemption): Returns REQUIREMENT_MISMATCH due to KYC requirement", () => {
  const result = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_3_TRANSFER_AND_ANON_REDEMPTION.expectations);

  assert.equal(result.verdict, PRODUCT_VERDICT.REQUIREMENT_MISMATCH);
  assert.deepEqual(result.matchingRepresentations, []);
});

test("Profile 4 (Cash Dividend Payouts): Returns REQUIREMENT_MISMATCH for both products (Total-Return Accretion)", () => {
  const result = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_4_CASH_DIVIDENDS.expectations);

  // Neither product pays cash dividends directly into wallet; both use multiplier accretion
  assert.equal(result.verdict, PRODUCT_VERDICT.REQUIREMENT_MISMATCH);
  assert.deepEqual(result.matchingRepresentations, []);

  const aaplxEval = result.representationEvaluations.find(r => r.representationTicker === "AAPLx");
  const aaplonEval = result.representationEvaluations.find(r => r.representationTicker === "AAPLon");

  const aaplxCash = aaplxEval.evaluations.find(e => e.key === EXPECTATION_KEYS.CASH_DIVIDEND_PAYOUTS);
  const aaplonCash = aaplonEval.evaluations.find(e => e.key === EXPECTATION_KEYS.CASH_DIVIDEND_PAYOUTS);

  assert.equal(aaplxCash.state, MATCH_STATE.MISMATCH);
  assert.equal(aaplonCash.state, MATCH_STATE.MISMATCH);
  assert.ok(aaplxCash.explanation.includes("Neither currently verified Apple representation pays ordinary Apple cash dividends directly into your wallet"));
});

test("Transferability vs Trading Availability: Models wallet movement separately from market trading", () => {
  const aapl = getUnderlyingSecurity("AAPL");
  const aaplon = aapl.representations.find(r => r.representationTicker === "AAPLon");

  const transferEval = evaluateExpectationForRepresentation(
    EXPECTATION_KEYS.WALLET_TRANSFERABILITY,
    EXPECTATION_PRIORITY.REQUIRED,
    aaplon
  );
  assert.equal(transferEval.state, MATCH_STATE.CONDITIONAL);
  assert.ok(transferEval.explanation.includes("24/7 on-chain wallet-to-wallet transferability"));

  const tradingEval = evaluateExpectationForRepresentation(
    EXPECTATION_KEYS.WEEKEND_OR_OFF_HOURS_TRADING,
    EXPECTATION_PRIORITY.REQUIRED,
    aaplon
  );
  assert.equal(tradingEval.state, MATCH_STATE.CONDITIONAL);
  assert.ok(tradingEval.explanation.includes("Off-Hours trading allows after-hours execution"));
});

test("Execution Preflight Boundary: Flag truthfully reflects current engine support", () => {
  const aapl = getUnderlyingSecurity("AAPL");
  const aaplx = aapl.representations.find(r => r.representationTicker === "AAPLx");
  const aaplon = aapl.representations.find(r => r.representationTicker === "AAPLon");

  assert.equal(aaplx.executionPreflightSupported, true);
  assert.equal(aaplon.executionPreflightSupported, false);
  assert.equal(aaplon.executionPreflightStatus, "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION");
});

test("Unknown Underlying Security: Returns NO_VERIFIED_PRODUCT_MATCH", () => {
  const result = matchUnderlyingExpectations("NONEXISTENT_SECURITY", {
    [EXPECTATION_KEYS.SYNTHETIC_PRICE_EXPOSURE]: EXPECTATION_PRIORITY.REQUIRED
  });

  assert.equal(result.verdict, PRODUCT_VERDICT.NO_VERIFIED_PRODUCT_MATCH);
  assert.deepEqual(result.matchingRepresentations, undefined);
});
