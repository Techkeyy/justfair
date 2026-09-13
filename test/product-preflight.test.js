// JustFair — Product Preflight / FinePrint Test Suite
// Phase 11 Correction — Multi-Issuer Truth Model & Cross-Product Expectation Verification

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

test("Registry: Underlying Catalog structures multiple representations under same security", () => {
  const aapl = getUnderlyingSecurity("AAPL");
  assert.ok(aapl, "AAPL underlying must exist");
  assert.equal(aapl.symbol, "AAPL");
  assert.equal(aapl.companyName, "Apple Inc.");
  assert.equal(aapl.representations.length, 2, "AAPL should have 2 representations (AAPLx and AAPLon)");

  const repTickers = aapl.representations.map(r => r.representationTicker);
  assert.deepEqual(repTickers, ["AAPLx", "AAPLon"]);
});

test("Second-Issuer Kill Gate: Verified PASS with Ondo Stocks on Solana", () => {
  assert.equal(SECOND_ISSUER_STATUS.gate, "PASS");
  assert.ok(SECOND_ISSUER_STATUS.supportedIssuers.some(i => i.includes("Ondo Global Markets")));
  assert.ok(SECOND_ISSUER_STATUS.supportedIssuers.some(i => i.includes("Backed Assets")));
  assert.equal(SECOND_ISSUER_STATUS.previousRecord.status, "SUPERSEDED_INCORRECT");
});

test("Fact Isolation: Issuer-specific legal facts and programs do not leak across representations", () => {
  const aapl = getUnderlyingSecurity("AAPL");
  const aaplx = aapl.representations.find(r => r.representationTicker === "AAPLx");
  const aaplon = aapl.representations.find(r => r.representationTicker === "AAPLon");

  assert.equal(aaplx.issuer.issuerName, "Backed Assets GmbH");
  assert.equal(aaplon.issuer.issuerName, "Ondo Global Markets (BVI) Limited");

  assert.equal(aaplx.holderRights.dividendHandling.mechanism, "TOKEN_2022_MULTIPLIER_ACCRETION");
  assert.equal(aaplon.holderRights.dividendHandling.mechanism, "STABLECOIN_PAYOUT_OR_MULTIPLIER");
});

test("Profile 1 (Self-Custody & Exposure): Returns MULTIPLE_VERIFIED_MATCHES for both AAPLx and AAPLon", () => {
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

test("Profile 4 (Cash Dividend Payouts): Differentiates between stablecoin payout and multiplier accretion", () => {
  const result = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_4_CASH_DIVIDENDS.expectations);

  // AAPLon supports cash dividend in stablecoin (or multiplier); AAPLx only supports multiplier accretion
  assert.equal(result.verdict, PRODUCT_VERDICT.MATCHES_REQUIRED_EXPECTATIONS);
  assert.deepEqual(result.matchingRepresentations, ["AAPLon"]);
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
  const result = matchUnderlyingExpectations("NONEXISTENT_STOCK", {
    [EXPECTATION_KEYS.SYNTHETIC_PRICE_EXPOSURE]: EXPECTATION_PRIORITY.REQUIRED
  });

  assert.equal(result.verdict, PRODUCT_VERDICT.NO_VERIFIED_PRODUCT_MATCH);
  assert.deepEqual(result.matchingRepresentations, undefined);
});
