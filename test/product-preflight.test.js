// JustFair — Product Preflight / FinePrint Comprehensive Unit Test Suite
// Phase 12 — Primary-Source Product Registry & Verification Pipeline

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import {
  FACT_AUTHORITY_CLASS,
  FACT_EVIDENCE_STATUS,
  VERIFICATION_STATUS,
  VERIFICATION_REASON_CODES,
  MATCH_STATE,
  PRODUCT_VERDICT,
  EXECUTION_SUPPORT,
  CAPABILITY_KEYS,
  EXPECTATION_KEYS,
  EXPECTATION_PRIORITY
} from "../src/product/schema.js";

import {
  UNDERLYING_SECURITY_CATALOG,
  getUnderlyingSecurity,
  getAllUnderlyings,
  getRepresentations,
  getProduct,
  getAllProducts,
  getProductCapabilities,
  resolveEffectiveMultiplier
} from "../src/product/registry.js";

import {
  ISSUER_PROFILES,
  ISSUER_CAPABILITIES,
  SCENARIO_FACTS,
  DIVIDEND_CLAIM_SAFETY_FACT
} from "../src/product/issuerFacts.js";

import {
  extractObservedTokenState,
  compareExpectedVsObserved,
  verifyProductOnchain
} from "../src/product/verifier.js";

import {
  compareProducts,
  compareUnderlyingRepresentations
} from "../src/product/comparator.js";

import {
  COMPARISON_PROFILES,
  evaluateExpectationForRepresentation,
  matchUnderlyingExpectations
} from "../src/product/matcher.js";

import { handleRequest } from "../src/server.js";

test("1. Registry: Underlying -> Multiple Representations for all 12 securities", () => {
  const allUnderlyings = getAllUnderlyings();
  assert.equal(allUnderlyings.length, 12, "Must contain all 12 canonical underlying securities");

  const expectedSymbols = ["AAPL", "NVDA", "SPY", "TSLA", "MSFT", "AMZN", "GOOGL", "META", "COIN", "AMD", "MSTR", "QQQ"];
  for (const sym of expectedSymbols) {
    const security = getUnderlyingSecurity(sym);
    assert.ok(security, `Underlying ${sym} must exist in catalog`);
    assert.equal(security.symbol, sym);
    assert.ok(security.representations.length >= 2, `${sym} must have at least 2 representations (xStocks and Ondo)`);
    
    // Confirm exact tickers
    const tickers = security.representations.map(r => r.representationTicker);
    assert.ok(tickers.includes(`${sym}x`), `${sym} must have ${sym}x`);
    assert.ok(tickers.includes(`${sym}on`), `${sym} must have ${sym}on`);
  }
});

test("2. Exact xStocks Mint Verification across all 12 assets", () => {
  const xstockExpectedMints = {
    AAPLx: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    NVDAx: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    SPYx: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    TSLAx: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    MSFTx: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
    AMZNx: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
    GOOGLx: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
    METAx: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
    COINx: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
    AMDx: "XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF",
    MSTRx: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ",
    QQQx: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ"
  };

  for (const [ticker, mint] of Object.entries(xstockExpectedMints)) {
    const prod = getProduct(`xstocks:${ticker.toLowerCase()}:solana`);
    assert.ok(prod, `Product xstocks:${ticker.toLowerCase()}:solana must be retrievable`);
    assert.equal(prod.mint, mint);
    assert.equal(prod.decimals, 8);
    assert.equal(prod.tokenProgram, "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
  }
});

test("3. Exact Ondo Mint Verification across all 12 assets from official constants.rs", () => {
  const ondoExpectedMints = {
    AAPLon: "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo",
    NVDAon: "gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo",
    SPYon: "k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo",
    TSLAon: "KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo",
    MSFTon: "FRmH6iRkMr33DLG6zVLR7EM4LojBFAuq6NtFzG6ondo",
    AMZNon: "14Tqdo8V1FhzKsE3W2pFsZCzYPQxxupXRcqw9jv6ondo",
    GOOGLon: "bbahNA5vT9WJeYft8tALrH1LXWffjwqVoUbqYa1ondo",
    METAon: "fDxs5y12E7x7jBwCKBXGqt71uJmCWsAQ3Srkte6ondo",
    COINon: "5u6KDiNJXxX4rGMfYT4BApZQC5CuDNrG6MHkwp1ondo",
    AMDon: "14diAn5z8kjrKwSC8WLqvBqqe5YmihJhjxRxd8Z6ondo",
    MSTRon: "FSz4ouiqXpHuGPcpacZfTzbMjScoj5FfzHkiyu2ondo",
    QQQon: "HrYNm6jTQ71LoFphjVKBTdAE4uja7WsmLG8VxB8ondo"
  };

  for (const [ticker, mint] of Object.entries(ondoExpectedMints)) {
    const prod = getProduct(`ondo:${ticker.toLowerCase()}:solana`);
    assert.ok(prod, `Product ondo:${ticker.toLowerCase()}:solana must be retrievable`);
    assert.equal(prod.mint, mint);
    assert.equal(prod.decimals, 9);
    assert.equal(prod.tokenProgram, "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
  }
});

test("4. Exact-Asset Verifier: Wrong Mint Rejection", () => {
  const expected = {
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
  };
  const observed = { exists: false };

  const res = compareExpectedVsObserved(expected, observed);
  assert.equal(res.status, VERIFICATION_STATUS.MISMATCH);
  assert.ok(res.reasonCodes.includes(VERIFICATION_REASON_CODES.MINT_NOT_FOUND));
});

test("5. Exact-Asset Verifier: Wrong Token Program Rejection", () => {
  const expected = {
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" // Token-2022
  };
  const observed = {
    exists: true,
    owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // Legacy SPL Token
    decimals: 8,
    extensions: []
  };

  const res = compareExpectedVsObserved(expected, observed);
  assert.equal(res.status, VERIFICATION_STATUS.MISMATCH);
  assert.ok(res.reasonCodes.includes(VERIFICATION_REASON_CODES.TOKEN_PROGRAM_MISMATCH));
});

test("6. Exact-Asset Verifier: Decimals Mismatch Rejection", () => {
  const expected = {
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
  };
  const observed = {
    exists: true,
    owner: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    decimals: 6, // Mismatched decimals
    extensions: []
  };

  const res = compareExpectedVsObserved(expected, observed);
  assert.equal(res.status, VERIFICATION_STATUS.MISMATCH);
  assert.ok(res.reasonCodes.includes(VERIFICATION_REASON_CODES.DECIMALS_MISMATCH));
});

test("7. Exact-Asset Verifier: Issuer-Specific Extensions Check", () => {
  const expectedXStock = {
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate"]
  };
  const observedMissing = {
    exists: true,
    owner: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    decimals: 8,
    extensions: ["metadataPointer"] // Missing scaledUiAmountConfig and permanentDelegate
  };

  const res = compareExpectedVsObserved(expectedXStock, observedMissing);
  assert.equal(res.status, VERIFICATION_STATUS.MISMATCH);
  assert.ok(res.reasonCodes.includes(VERIFICATION_REASON_CODES.EXPECTED_EXTENSION_MISSING));
});

test("8. Multiplier Model: Past effective timestamp resolves newMultiplier as active", () => {
  const multiplierInfo = {
    multiplier: "1.0026642075893797",
    newMultiplier: "1.0032690125398187",
    newMultiplierEffectiveTimestamp: 1786149000 // In the past (Aug 2026)
  };
  const currentTs = 1789177611; // Sept 2026

  const resolved = resolveEffectiveMultiplier(multiplierInfo, currentTs);
  assert.equal(resolved.activeMultiplier, "1.0032690125398187");
  assert.equal(resolved.isTransitionUpcoming, false);
  assert.equal(resolved.isTransitionActive, true);
});

test("9. Multiplier Model: Future effective timestamp keeps current multiplier as active", () => {
  const multiplierInfo = {
    multiplier: "1.0026642075893797",
    newMultiplier: "1.0040000000000000",
    newMultiplierEffectiveTimestamp: 1800000000 // In the future
  };
  const currentTs = 1789177611;

  const resolved = resolveEffectiveMultiplier(multiplierInfo, currentTs);
  assert.equal(resolved.activeMultiplier, "1.0026642075893797");
  assert.equal(resolved.isTransitionUpcoming, true);
  assert.equal(resolved.isTransitionActive, false);
});

test("10. Multiplier Model: Default parity when multiplier is absent", () => {
  const resolved = resolveEffectiveMultiplier(null);
  assert.equal(resolved.activeMultiplier, "1.0");
  assert.equal(resolved.numericMultiplier, 1.0);
  assert.equal(resolved.isTransitionUpcoming, false);
});

test("11. Legal Fact Inheritance: Issuer-level facts compose cleanly onto representation", () => {
  const aaplxCaps = getProductCapabilities("xstocks:aaplx:solana");
  assert.ok(aaplxCaps, "AAPLx capabilities must be composed");
  assert.equal(aaplxCaps.issuer.issuerName, "Backed Assets GmbH");
  assert.equal(aaplxCaps.issuer.legalStructure, "Tracker Certificate / Structured Debt Security (Tokenized Tracker)");
  assert.equal(aaplxCaps.capabilities[CAPABILITY_KEYS.DIRECT_SHARE_OWNERSHIP].value, false);
  assert.equal(aaplxCaps.capabilities[CAPABILITY_KEYS.SELF_CUSTODY].value, true);

  const aaplonCaps = getProductCapabilities("ondo:aaplon:solana");
  assert.ok(aaplonCaps, "AAPLon capabilities must be composed");
  assert.equal(aaplonCaps.issuer.issuerName, "Ondo Global Markets (BVI) Limited");
  assert.equal(aaplonCaps.issuer.legalStructure, "Tokenized Securities / Equity-Backed Structured Notes (Ondo Stocks)");
});

test("12. Fact Isolation: Facts from one issuer family never bleed into another", () => {
  const aaplxCaps = getProductCapabilities("xstocks:aaplx:solana");
  const aaplonCaps = getProductCapabilities("ondo:aaplon:solana");

  assert.notEqual(aaplxCaps.issuer.issuerId, aaplonCaps.issuer.issuerId);
  assert.notEqual(aaplxCaps.issuer.documentationUrl, aaplonCaps.issuer.documentationUrl);
  assert.equal(aaplxCaps.decimals, 8);
  assert.equal(aaplonCaps.decimals, 9);
});

test("13. UNKNOWN Preservation: Unmapped expectations return UNKNOWN without false coercion", () => {
  const rep = getProduct("xstocks:aaplx:solana");
  const evalResult = evaluateExpectationForRepresentation("HYPOTHETICAL_UNMAPPED_CAPABILITY", EXPECTATION_PRIORITY.REQUIRED, rep);
  assert.equal(evalResult.state, MATCH_STATE.UNKNOWN);
  assert.notEqual(evalResult.state, MATCH_STATE.MISMATCH);
});

test("14. Execution Support Boundary: Explicitly marks xStocks as SUPPORTED and Ondo as NOT_YET_SUPPORTED", () => {
  const aaplx = getProduct("xstocks:aaplx:solana");
  assert.equal(aaplx.executionPreflightSupport, EXECUTION_SUPPORT.SUPPORTED);
  assert.equal(aaplx.executionPreflightSupported, true);

  const aaplon = getProduct("ondo:aaplon:solana");
  assert.equal(aaplon.executionPreflightSupport, EXECUTION_SUPPORT.NOT_YET_SUPPORTED);
  assert.equal(aaplon.executionPreflightSupported, false);
});

test("15. Difference Engine: Cross-issuer comparison outputs factual differences without ranking", () => {
  const comparison = compareProducts("xstocks:aaplx:solana", "ondo:aaplon:solana");
  assert.equal(comparison.underlyingSymbol, "AAPL");
  assert.ok(comparison.differences.length >= 5, "Must identify key factual differences");
  assert.ok(comparison.sharedFacts.length >= 3, "Must state key shared realities");
  
  // Confirm no subjective winner or rank exists
  assert.equal(comparison.winner, undefined);
  assert.equal(comparison.score, undefined);
  assert.equal(comparison.rank, undefined);
});

test("16. Capability Normalization: Standard profiles match or mismatch deterministically", () => {
  // Profile 1: Self-Custody & Economic Dividend Exposure -> Both match!
  const res1 = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_1_SELF_CUSTODY_EXPOSURE.expectations);
  assert.equal(res1.verdict, PRODUCT_VERDICT.MULTIPLE_VERIFIED_MATCHES);
  assert.equal(res1.matchingRepresentations.length, 2);

  // Profile 2: Direct Equity & Voting Rights -> Both fail!
  const res2 = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_2_DIRECT_EQUITY_VOTING.expectations);
  assert.equal(res2.verdict, PRODUCT_VERDICT.REQUIREMENT_MISMATCH);
  assert.equal(res2.matchingRepresentations.length, 0);

  // Profile 3: Transfer & Anon Redemption -> Both fail!
  const res3 = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_3_TRANSFER_AND_ANON_REDEMPTION.expectations);
  assert.equal(res3.verdict, PRODUCT_VERDICT.REQUIREMENT_MISMATCH);

  // Profile 4: Cash Dividends Paid Directly -> Both fail (Total Return)!
  const res4 = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_4_CASH_DIVIDENDS.expectations);
  assert.equal(res4.verdict, PRODUCT_VERDICT.REQUIREMENT_MISMATCH);
});

test("17. Transferability & Trading Availability: Modeled as CONDITIONAL with clear context", () => {
  const aaplxCaps = getProductCapabilities("xstocks:aaplx:solana");
  const transfer = aaplxCaps.capabilities[CAPABILITY_KEYS.WALLET_TRANSFERABILITY];
  assert.equal(transfer.evidenceStatus, FACT_EVIDENCE_STATUS.CONDITIONAL);
  assert.ok(transfer.reason.includes("freeze"));

  const trading = aaplxCaps.capabilities[CAPABILITY_KEYS.WEEKEND_TRADING];
  assert.equal(trading.evidenceStatus, FACT_EVIDENCE_STATUS.CONDITIONAL);
});

test("18. Reusable Dividend-Claim Safety Fact: Verified false claim requirement", () => {
  assert.equal(DIVIDEND_CLAIM_SAFETY_FACT.factKey, "DOCUMENTED_DIVIDEND_CLAIM_TX_REQUIRED");
  assert.equal(DIVIDEND_CLAIM_SAFETY_FACT.status, FACT_EVIDENCE_STATUS.VERIFIED_FALSE);
  assert.ok(DIVIDEND_CLAIM_SAFETY_FACT.userFacingStatement.includes("does not require you to sign a separate dividend-claim transaction"));
});

test("19. What-Happens-If Scenario Coverage: Complete data for DIVIDEND, STOCK_SPLIT, REDEMPTION", () => {
  for (const issuerKey of ["BACKED_ASSETS", "ONDO_GLOBAL_MARKETS"]) {
    const scenarios = SCENARIO_FACTS[issuerKey];
    assert.ok(scenarios.DIVIDEND, `${issuerKey} must cover DIVIDEND`);
    assert.ok(scenarios.STOCK_SPLIT, `${issuerKey} must cover STOCK_SPLIT`);
    assert.ok(scenarios.REDEMPTION, `${issuerKey} must cover REDEMPTION`);

    assert.ok(scenarios.DIVIDEND.plainLanguageExplanation);
    assert.ok(scenarios.DIVIDEND.mechanism);
    assert.ok(scenarios.DIVIDEND.commonMisconception);
    assert.ok(scenarios.DIVIDEND.primarySource);
  }
});

test("20. Exact-Asset Verifier Live Check: Verifies live account against Solana Mainnet RPC", async () => {
  const result = await verifyProductOnchain("xstocks:aaplx:solana");
  assert.ok(result.productId, "Result must contain productId");
  assert.ok(["VERIFIED", "UNABLE_TO_VERIFY"].includes(result.verificationStatus), `Status must be VERIFIED or UNABLE_TO_VERIFY (RPC dependent), got: ${result.verificationStatus}`);
  assert.equal(result.expected.decimals, 8);
  assert.equal(result.expected.tokenProgram, "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
});

test("21. REST API: GET /api/v1/products returns master catalog with 12 underlyings", async () => {
  const req = { method: "GET", url: "/api/v1/products", headers: { host: "localhost" } };
  let statusCode;
  let responseData;
  const res = {
    writeHead: (code) => { statusCode = code; },
    end: (body) => { responseData = JSON.parse(body); }
  };

  await handleRequest(req, res);
  assert.equal(statusCode, 200);
  assert.equal(responseData.status, "SUCCESS");
  assert.equal(responseData.underlying_count, 12);
  assert.equal(responseData.product_count, 24);
});

test("22. REST API: GET /api/v1/products/:productId returns detailed product card", async () => {
  const req = { method: "GET", url: "/api/v1/products/xstocks:aaplx:solana", headers: { host: "localhost" } };
  let statusCode;
  let responseData;
  const res = {
    writeHead: (code) => { statusCode = code; },
    end: (body) => { responseData = JSON.parse(body); }
  };

  await handleRequest(req, res);
  assert.equal(statusCode, 200);
  assert.equal(responseData.status, "SUCCESS");
  assert.equal(responseData.product.representationTicker, "AAPLx");
  assert.equal(responseData.product.decimals, 8);
  assert.ok(responseData.product.capabilities);
  assert.ok(responseData.product.scenarios);
});

test("23. REST API: GET /api/v1/products/compare/AAPL returns cross-issuer differences", async () => {
  const req = { method: "GET", url: "/api/v1/products/compare/AAPL", headers: { host: "localhost" } };
  let statusCode;
  let responseData;
  const res = {
    writeHead: (code) => { statusCode = code; },
    end: (body) => { responseData = JSON.parse(body); }
  };

  await handleRequest(req, res);
  assert.equal(statusCode, 200);
  assert.equal(responseData.underlyingSymbol, "AAPL");
  assert.ok(responseData.differences.length > 0);
  assert.ok(responseData.sharedFacts.length > 0);
});

test("24. REST API: GET /api/v1/products/:productId/verify executes live onchain check", async () => {
  const req = { method: "GET", url: "/api/v1/products/xstocks:aaplx:solana/verify", headers: { host: "localhost" } };
  let statusCode;
  let responseData;
  const res = {
    writeHead: (code) => { statusCode = code; },
    end: (body) => { responseData = JSON.parse(body); }
  };

  await handleRequest(req, res);
  assert.ok([200, 503].includes(statusCode));
  assert.equal(responseData.productId, "xstocks:aaplx:solana");
  assert.ok(["VERIFIED", "UNABLE_TO_VERIFY"].includes(responseData.verificationStatus));
});
