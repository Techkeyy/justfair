// JustFair — Product Preflight / FinePrint Comprehensive Unit Test Suite
// Phase 12 Final Truth Correction — Backed Assets (JE) Limited, Independent Redemptions & API Routing

import test from "node:test";
import assert from "node:assert/strict";

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

test("4. xStocks Legal Issuer Truth: Current issuer is Backed Assets (JE) Limited (Jersey SPV)", () => {
  const aaplxCaps = getProductCapabilities("xstocks:aaplx:solana");
  assert.equal(aaplxCaps.issuer.issuerName, "Backed Assets (JE) Limited");
  assert.equal(aaplxCaps.issuer.issuerJurisdiction, "Jersey (Channel Islands)");
  assert.equal(aaplxCaps.issuer.issuerLegalRole, "Issuer / Special Purpose Vehicle (Jersey)");
  assert.ok(aaplxCaps.issuer.documentationUrl.includes("docs.xstocks.fi/docs/product-legal-overview"));
});

test("5. xStocks Redemption Truth: Retail eligible, KYC required, $5000 minimum, not qualified-only", () => {
  const aaplxCaps = getProductCapabilities("xstocks:aaplx:solana");
  const redemption = aaplxCaps.capabilities[CAPABILITY_KEYS.DIRECT_ISSUER_REDEMPTION];
  assert.equal(redemption.evidenceStatus, FACT_EVIDENCE_STATUS.CONDITIONAL);
  assert.equal(redemption.kycRequired, true);
  assert.equal(redemption.walletWhitelistRequired, true);
  assert.equal(redemption.minimumDirectRedemptionUsd, 5000);
  assert.equal(redemption.qualifiedInvestorOnly, false);
  assert.ok(redemption.summary.includes("$5,000"));
});

test("6. Ondo Redemption Truth: Non-US Reg S KYC model isolated from xStocks", () => {
  const aaplonCaps = getProductCapabilities("ondo:aaplon:solana");
  const redemption = aaplonCaps.capabilities[CAPABILITY_KEYS.DIRECT_ISSUER_REDEMPTION];
  assert.equal(redemption.evidenceStatus, FACT_EVIDENCE_STATUS.CONDITIONAL);
  assert.equal(redemption.kycRequired, true);
  assert.ok(redemption.summary.includes("Regulation S"));
  assert.ok(redemption.summary.includes("Ondo Global Markets (BVI) Limited"));
  assert.notEqual(redemption.summary, getProductCapabilities("xstocks:aaplx:solana").capabilities[CAPABILITY_KEYS.DIRECT_ISSUER_REDEMPTION].summary);
});

test("7. Collateral Protection Structure: Factually distinct between Jersey SPV and BVI SPV", () => {
  const aaplxCaps = getProductCapabilities("xstocks:aaplx:solana");
  const aaplonCaps = getProductCapabilities("ondo:aaplon:solana");

  const xCollateral = aaplxCaps.capabilities[CAPABILITY_KEYS.COLLATERAL_PROTECTION_STRUCTURE];
  const ondoCollateral = aaplonCaps.capabilities[CAPABILITY_KEYS.COLLATERAL_PROTECTION_STRUCTURE];

  assert.ok(xCollateral.summary.includes("Backed Assets (JE) Limited"));
  assert.ok(xCollateral.summary.includes("Security Trustee"));

  assert.ok(ondoCollateral.summary.includes("Ondo Global Markets (BVI) Limited"));
  assert.ok(ondoCollateral.summary.includes("first-priority perfected security interest"));
});

test("8. Weekend Trading Model: Modeled as CONDITIONAL with liquidity context", () => {
  const aaplxCaps = getProductCapabilities("xstocks:aaplx:solana");
  const trading = aaplxCaps.capabilities[CAPABILITY_KEYS.WEEKEND_TRADING];
  assert.equal(trading.evidenceStatus, FACT_EVIDENCE_STATUS.CONDITIONAL);
  assert.ok(trading.reason.includes("market makers"));
});

test("9. Exact-Asset Verifier: Wrong Mint Rejection", () => {
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

test("10. Exact-Asset Verifier: Wrong Token Program Rejection", () => {
  const expected = {
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
  };
  const observed = {
    exists: true,
    owner: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    decimals: 8,
    extensions: []
  };

  const res = compareExpectedVsObserved(expected, observed);
  assert.equal(res.status, VERIFICATION_STATUS.MISMATCH);
  assert.ok(res.reasonCodes.includes(VERIFICATION_REASON_CODES.TOKEN_PROGRAM_MISMATCH));
});

test("11. Exact-Asset Verifier: Decimals Mismatch Rejection", () => {
  const expected = {
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
  };
  const observed = {
    exists: true,
    owner: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
    decimals: 6,
    extensions: []
  };

  const res = compareExpectedVsObserved(expected, observed);
  assert.equal(res.status, VERIFICATION_STATUS.MISMATCH);
  assert.ok(res.reasonCodes.includes(VERIFICATION_REASON_CODES.DECIMALS_MISMATCH));
});

test("12. Exact-Asset Verifier: Issuer-Specific Extensions Check", () => {
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
    extensions: ["metadataPointer"]
  };

  const res = compareExpectedVsObserved(expectedXStock, observedMissing);
  assert.equal(res.status, VERIFICATION_STATUS.MISMATCH);
  assert.ok(res.reasonCodes.includes(VERIFICATION_REASON_CODES.EXPECTED_EXTENSION_MISSING));
});

test("13. Multiplier Model: Past effective timestamp resolves newMultiplier as active", () => {
  const multiplierInfo = {
    multiplier: "1.0026642075893797",
    newMultiplier: "1.0032690125398187",
    newMultiplierEffectiveTimestamp: 1786149000
  };
  const currentTs = 1789177611;

  const resolved = resolveEffectiveMultiplier(multiplierInfo, currentTs);
  assert.equal(resolved.activeMultiplier, "1.0032690125398187");
  assert.equal(resolved.isTransitionUpcoming, false);
  assert.equal(resolved.isTransitionActive, true);
});

test("14. Multiplier Model: Future effective timestamp keeps current multiplier as active", () => {
  const multiplierInfo = {
    multiplier: "1.0026642075893797",
    newMultiplier: "1.0040000000000000",
    newMultiplierEffectiveTimestamp: 1800000000
  };
  const currentTs = 1789177611;

  const resolved = resolveEffectiveMultiplier(multiplierInfo, currentTs);
  assert.equal(resolved.activeMultiplier, "1.0026642075893797");
  assert.equal(resolved.isTransitionUpcoming, true);
  assert.equal(resolved.isTransitionActive, false);
});

test("15. Multiplier Model: Default parity when multiplier is absent", () => {
  const resolved = resolveEffectiveMultiplier(null);
  assert.equal(resolved.activeMultiplier, "1.0");
  assert.equal(resolved.numericMultiplier, 1.0);
  assert.equal(resolved.isTransitionUpcoming, false);
});

test("16. UNKNOWN Preservation: Unmapped expectations return UNKNOWN without false coercion", () => {
  const rep = getProduct("xstocks:aaplx:solana");
  const evalResult = evaluateExpectationForRepresentation("HYPOTHETICAL_UNMAPPED_CAPABILITY", EXPECTATION_PRIORITY.REQUIRED, rep);
  assert.equal(evalResult.state, MATCH_STATE.UNKNOWN);
  assert.notEqual(evalResult.state, MATCH_STATE.MISMATCH);
});

test("17. Execution Support Boundary: Explicitly marks xStocks as SUPPORTED and Ondo as NOT_YET_SUPPORTED", () => {
  const aaplx = getProduct("xstocks:aaplx:solana");
  assert.equal(aaplx.executionPreflightSupport, EXECUTION_SUPPORT.SUPPORTED);
  assert.equal(aaplx.executionPreflightSupported, true);

  const aaplon = getProduct("ondo:aaplon:solana");
  assert.equal(aaplon.executionPreflightSupport, EXECUTION_SUPPORT.NOT_YET_SUPPORTED);
  assert.equal(aaplon.executionPreflightSupported, false);
});

test("18. Difference Engine: Cross-issuer comparison outputs factual differences without ranking", () => {
  const comparison = compareProducts("xstocks:aaplx:solana", "ondo:aaplon:solana");
  assert.equal(comparison.underlyingSymbol, "AAPL");
  assert.ok(comparison.differences.length >= 5, "Must identify key factual differences");
  assert.ok(comparison.sharedFacts.length >= 3, "Must state key shared realities");
  
  assert.equal(comparison.winner, undefined);
  assert.equal(comparison.score, undefined);
  assert.equal(comparison.rank, undefined);
});

test("19. Capability Normalization: Standard profiles match or mismatch deterministically", () => {
  const res1 = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_1_SELF_CUSTODY_EXPOSURE.expectations);
  assert.equal(res1.verdict, PRODUCT_VERDICT.MULTIPLE_VERIFIED_MATCHES);
  assert.equal(res1.matchingRepresentations.length, 2);

  const res2 = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_2_DIRECT_EQUITY_VOTING.expectations);
  assert.equal(res2.verdict, PRODUCT_VERDICT.REQUIREMENT_MISMATCH);
  assert.equal(res2.matchingRepresentations.length, 0);

  const res3 = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_3_TRANSFER_AND_ANON_REDEMPTION.expectations);
  assert.equal(res3.verdict, PRODUCT_VERDICT.REQUIREMENT_MISMATCH);

  const res4 = matchUnderlyingExpectations("AAPL", COMPARISON_PROFILES.PROFILE_4_CASH_DIVIDENDS.expectations);
  assert.equal(res4.verdict, PRODUCT_VERDICT.REQUIREMENT_MISMATCH);
});

test("20. Reusable Dividend-Claim Safety Fact: Verified false claim requirement", () => {
  assert.equal(DIVIDEND_CLAIM_SAFETY_FACT.factKey, "DOCUMENTED_DIVIDEND_CLAIM_TX_REQUIRED");
  assert.equal(DIVIDEND_CLAIM_SAFETY_FACT.status, FACT_EVIDENCE_STATUS.VERIFIED_FALSE);
  assert.ok(DIVIDEND_CLAIM_SAFETY_FACT.userFacingStatement.includes("does not require you to sign a separate dividend-claim transaction"));
});

test("21. What-Happens-If Scenario Coverage: Complete data for DIVIDEND, STOCK_SPLIT, REDEMPTION", () => {
  for (const issuerKey of ["BACKED_ASSETS_JE", "ONDO_GLOBAL_MARKETS"]) {
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

test("22. REST API: GET /api/v1/products returns master catalog with 12 underlyings", async () => {
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

test("23. REST API: GET /api/v1/products/:productId supports colon-bearing product IDs and URL-encoded IDs", async () => {
  // Raw colon
  const req1 = { method: "GET", url: "/api/v1/products/xstocks:aaplx:solana", headers: { host: "localhost" } };
  let statusCode1;
  let responseData1;
  const res1 = {
    writeHead: (code) => { statusCode1 = code; },
    end: (body) => { responseData1 = JSON.parse(body); }
  };
  await handleRequest(req1, res1);
  assert.equal(statusCode1, 200);
  assert.equal(responseData1.product.representationTicker, "AAPLx");
  assert.equal(responseData1.product.issuer.issuerName, "Backed Assets (JE) Limited");

  // URL-encoded colon
  const req2 = { method: "GET", url: "/api/v1/products/xstocks%3Aaaplx%3Asolana", headers: { host: "localhost" } };
  let statusCode2;
  let responseData2;
  const res2 = {
    writeHead: (code) => { statusCode2 = code; },
    end: (body) => { responseData2 = JSON.parse(body); }
  };
  await handleRequest(req2, res2);
  assert.equal(statusCode2, 200);
  assert.equal(responseData2.product.representationTicker, "AAPLx");
});

test("24. REST API: GET /api/v1/products/compare/AAPL routes properly without colliding with :productId", async () => {
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

test("25. REST API: GET /api/v1/products/:productId/verify executes live onchain check", async () => {
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

test("26. Canonical 12 Underlyings Integrity Gate: MSTR present, PLTR absent", () => {
  const CANONICAL_12 = ["AAPL", "NVDA", "SPY", "TSLA", "MSFT", "AMZN", "GOOGL", "META", "COIN", "AMD", "MSTR", "QQQ"];
  const allUnderlyings = getAllUnderlyings();
  assert.equal(allUnderlyings.length, 12, "Must contain exactly 12 canonical underlying securities");
  
  const underlyingSymbols = allUnderlyings.map(u => u.symbol);
  assert.deepEqual(underlyingSymbols, CANONICAL_12, "Canonical underlying symbols must match exact locked list");
  
  // Explicit MSTR presence check
  assert.ok(underlyingSymbols.includes("MSTR"), "MSTR must be present in canonical underlyings");
  const mstrSecurity = getUnderlyingSecurity("MSTR");
  assert.ok(mstrSecurity, "MSTR security must exist");
  assert.equal(mstrSecurity.representations.length, 2, "MSTR must have both xStocks and Ondo representations");
  assert.ok(getProduct("xstocks:mstrx:solana"), "xstocks:mstrx:solana must exist");
  assert.ok(getProduct("ondo:mstron:solana"), "ondo:mstron:solana must exist");
  
  // Explicit PLTR exclusion check
  assert.equal(underlyingSymbols.includes("PLTR"), false, "PLTR must NOT be in canonical scope");
  assert.equal(getUnderlyingSecurity("PLTR"), null, "PLTR must return null from getUnderlyingSecurity");
  assert.equal(getProduct("xstocks:pltrx:solana"), null, "PLTR xstock must return null");
  assert.equal(getProduct("ondo:pltron:solana"), null, "PLTR Ondo token must return null");
});

test("27. Address Integrity & Uniqueness: 24 valid 32-byte Base58 mints with zero duplicates", () => {
  const allProducts = getAllProducts();
  assert.equal(allProducts.length, 24, "Master catalog must contain exactly 24 representations");
  
  const seenMints = new Set();
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  
  for (const prod of allProducts) {
    assert.ok(prod.mint, `Product ${prod.productId} must have a mint address`);
    assert.ok(base58Regex.test(prod.mint), `Mint ${prod.mint} for ${prod.productId} must be valid base58`);
    assert.ok(!seenMints.has(prod.mint), `Duplicate mint detected across representations: ${prod.mint}`);
    seenMints.add(prod.mint);
    
    // Check official symbol matches product registry symbol
    assert.ok(prod.representationTicker, `Product ${prod.productId} must have representationTicker`);
    assert.ok(prod.metadataSymbol, `Product ${prod.productId} must have metadataSymbol`);
    assert.equal(prod.metadataSymbol, prod.representationTicker, `metadataSymbol ${prod.metadataSymbol} must match representationTicker ${prod.representationTicker}`);
  }
  
  assert.equal(seenMints.size, 24, "Must have 24 unique mint addresses");
});

test("28. Source Provenance Integrity: All 24 representations back to official primary sources", () => {
  const allProducts = getAllProducts();
  
  for (const prod of allProducts) {
    assert.ok(prod.provenance, `Product ${prod.productId} must have provenance object`);
    assert.ok(prod.provenance.officialMappingSource, `Product ${prod.productId} must have officialMappingSource`);
    assert.ok(prod.provenance.authorityClass, `Product ${prod.productId} must have authorityClass`);
    assert.ok(prod.provenance.dateChecked, `Product ${prod.productId} must have dateChecked`);
    
    if (prod.productId.startsWith("xstocks:")) {
      assert.ok(
        prod.provenance.officialMappingSource.startsWith("https://xstocks.fi/assets/"),
        `xStocks product ${prod.productId} mapping source must be official xStocks asset endpoint`
      );
    } else if (prod.productId.startsWith("ondo:")) {
      assert.ok(
        prod.provenance.officialMappingSource.includes("ondoprotocol/gm-solana-simulator") ||
        prod.provenance.officialMappingSource.includes("ondo.finance"),
        `Ondo product ${prod.productId} mapping source must be official Ondo repository or docs`
      );
    }
  }
});

test("29. Suspicious & Hallucinated Address Rejection Gate", () => {
  const suspiciousAddresses = [
    "XsP7bQK5qdensityptth5sLdSC5Vn8kFm3c2b814s",
    "XsGoogLptth5sLdSC5Vn8kFm3c2b814spk7k1B3PkW",
    "GooGL7M3rZ4G7D5nE3aYnK5Gj6m7hP8rZ7D4sMondo",
    "XsMetaptth5sLdSC5Vn8kFm3c2b814spk7k1B3PkW5s",
    "MEtA4G7D5nE3aYnK5Gj6m7hP8rZ7D4sM6tL3kFondo",
    "XsAMDptth5sLdSC5Vn8kFm3c2b814spk7k1B3PkW5sM",
    "AMd5nE3aYnK5Gj6m7hP8rZ7D4sM6tL3kF9PnG5ondo",
    "XsCoinptth5sLdSC5Vn8kFm3c2b814spk7k1B3PkW5s",
    "CoInE3aYnK5Gj6m7hP8rZ7D4sM6tL3kF9PnG5vondo",
    "XsSPYptth5sLdSC5Vn8kFm3c2b814spk7k1B3PkW5sM",
    "SPyYnK5Gj6m7hP8rZ7D4sM6tL3kF9PnG5vR8sBondo",
    "XsQQQptth5sLdSC5Vn8kFm3c2b814spk7k1B3PkW5sM",
    "QQqK5Gj6m7hP8rZ7D4sM6tL3kF9PnG5vR8sBoondo",
    "XsPLTRtth5sLdSC5Vn8kFm3c2b814spk7k1B3PkW5s",
    "PLtrGj6m7hP8rZ7D4sM6tL3kF9PnG5vR8sBondo"
  ];
  
  const allProducts = getAllProducts();
  const registeredMints = new Set(allProducts.map(p => p.mint));
  
  for (const suspicious of suspiciousAddresses) {
    assert.equal(
      registeredMints.has(suspicious),
      false,
      `Suspicious/synthetic address '${suspicious}' must NEVER exist in the actual registry`
    );
  }
});

