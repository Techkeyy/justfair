// JustFair Phase 3 DBC Whale Tests (node:test)
// Live mainnet reads against a known immutable DBC config
// (Burpee/SOL config DLa32CJBWDp3YveqD3A8jexkUUzeTZPjEquf3Ur6BwEU,
// discovered via public meteora-dbc listing, verified on-chain:
// owner = DBC program, SDK decode OK). Config bytes are immutable, so
// quote math over them is deterministic.

import test from "node:test";
import assert from "node:assert/strict";

import {
  DBC_PROGRAM_ID,
  fetchDbcConfig,
  computeImpactPct,
  runDbcWhale
} from "../src/scenarios/dbc-live.js";

const KNOWN_CONFIG = "DLa32CJBWDp3YveqD3A8jexkUUzeTZPjEquf3Ur6BwEU";

test("live config read returns real mainnet DBC fields", async () => {
  const { config, configAddress } = await fetchDbcConfig({ configAddress: KNOWN_CONFIG });
  assert.equal(configAddress, KNOWN_CONFIG);
  assert.equal(config.quoteMint.toBase58(), "So11111111111111111111111111111111111111112");
  assert.equal(Number(config.migrationOption), 1); // DAMM v2 destination
  assert.ok(Array.isArray(config.curve) && config.curve.length > 0);
});

test("live whale PASS: 1 SOL opening stays within an 8% issuer policy", async () => {
  const result = await runDbcWhale({
    configAddress: KNOWN_CONFIG,
    tradeSizeQuoteUnits: "1000000000",
    maxPriceImpactPct: 8
  });
  assert.equal(result.status, "PASS");
  const impact = result.assertions[0].actual.observedImpactPct;
  assert.ok(impact > 2.0 && impact < 3.0, `impact in sane range, got ${impact}`);
  assert.equal(result.evidence.classification, "live_dbc_mainnet");
  assert.equal(result.evidence.program, DBC_PROGRAM_ID);
  assert.ok(result.replay.length >= 4);
  assert.equal(result.diagnosis, null);
});

test("live whale FAIL: $20k-equivalent size exceeds curve capacity", async () => {
  const result = await runDbcWhale({
    configAddress: KNOWN_CONFIG,
    tradeSizeQuoteUnits: "206185567000",
    maxPriceImpactPct: 8
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.diagnosis.failureCode, "CURVE_CAPACITY_EXCEEDED");
  assert.ok(result.diagnosis.rootCause.length > 10);
  assert.ok(result.diagnosis.guidance.length > 10);
});

test("invalid inputs yield UNABLE without network dependence", async () => {
  const bad = await runDbcWhale({ configAddress: "NOTANADDRESS", tradeSizeQuoteUnits: "1000", maxPriceImpactPct: 8 });
  assert.equal(bad.status, "UNABLE_TO_VERIFY");
  assert.equal(bad.reasonCode, "DBC_BAD_ADDRESS");
  const zero = await runDbcWhale({ configAddress: KNOWN_CONFIG, tradeSizeQuoteUnits: "0", maxPriceImpactPct: 8 });
  assert.equal(zero.status, "UNABLE_TO_VERIFY");
  const nan = await runDbcWhale({ configAddress: KNOWN_CONFIG, tradeSizeQuoteUnits: "1000", maxPriceImpactPct: "x" });
  assert.equal(nan.status, "UNABLE_TO_VERIFY");
});

test("computeImpactPct is exact on fixture numbers", () => {
  const r = computeImpactPct({ outputAmount: "3191984343181", amountIn: "1000000000", marginalOutput: "3273827", marginalIn: "1000" });
  assert.equal(r.ok, true);
  assert.ok(Math.abs(r.observedImpactPct - 2.5) < 0.01, `got ${r.observedImpactPct}`);
  assert.equal(computeImpactPct({ outputAmount: "x", amountIn: "1", marginalOutput: "1", marginalIn: "1" }).ok, false);
});
