// JustFair DBC Launch Sweep Tests (node:test)
// Covers the deterministic sweep core (offline) plus live mainnet behavior
// against the known immutable DBC config
// (DLa32CJBWDp3YveqD3A8jexkUUzeTZPjEquf3Ur6BwEU, quoteMint SOL,
// migrationQuoteThreshold 10960000000). Live quote math is read-only:
// config + clock reads, local SDK math, no signing/broadcast/funds.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  DBC_SWEEP_SCENARIO_ID,
  DBC_SWEEP_DEFAULT_BPS,
  NATIVE_SOL_MINT,
  deriveSweepSizes,
  parseSweepSizes,
  summarizeSweep,
  sweepOverallStatus,
  formatHumanAmount,
  formatRawUnits,
  describeAmount,
  abbreviateMint,
  resolveQuoteAsset,
  runDbcSweep
} from "../src/scenarios/dbc-live.js";
import { DBC_LAUNCH_SWEEP } from "../src/scenarios/dbc.js";

const KNOWN_CONFIG = "DLa32CJBWDp3YveqD3A8jexkUUzeTZPjEquf3Ur6BwEU";

// ---------------- Pure grid derivation (offline, deterministic) ----------------

test("deriveSweepSizes builds the threshold grid without hardcoded amounts", () => {
  const r = deriveSweepSizes({ migrationQuoteThreshold: "10960000000" });
  assert.equal(r.ok, true);
  assert.deepEqual(r.sizes, [
    "10960000", "54800000", "109600000", "274000000", "548000000",
    "1096000000", "2740000000", "5480000000", "10960000000", "21920000000"
  ]);
  assert.equal(r.basis.migrationQuoteThreshold, "10960000000");
  // Ascending order guaranteed.
  const asBig = r.sizes.map(BigInt);
  for (let i = 1; i < asBig.length; i++) assert.ok(asBig[i] > asBig[i - 1]);
});

test("deriveSweepSizes refuses a missing or zero threshold honestly", () => {
  for (const bad of ["0", "", "not-a-number"]) {
    const r = deriveSweepSizes({ migrationQuoteThreshold: bad });
    assert.equal(r.ok, false);
    assert.equal(r.code, "DBC_NO_SWEEP_BASIS");
  }
});

test("parseSweepSizes sorts, dedupes, and validates caller sizes", () => {
  const r = parseSweepSizes(["3000", "1000", "2000", "1000"]);
  assert.equal(r.ok, true);
  assert.deepEqual(r.sizes, ["1000", "2000", "3000"]);
  assert.equal(parseSweepSizes([]).ok, false);
  assert.equal(parseSweepSizes(["0"]).code, "DBC_BAD_INPUT");
  assert.equal(parseSweepSizes(["-5"]).code, "DBC_BAD_INPUT");
  assert.equal(parseSweepSizes(["abc"]).code, "DBC_BAD_INPUT");
  assert.equal(parseSweepSizes(["1000000000000000001"]).code, "DBC_BAD_INPUT");
  const tooMany = Array.from({ length: 33 }, (_, i) => String(i + 1));
  assert.equal(parseSweepSizes(tooMany).code, "DBC_BAD_INPUT");
});

test("summarizeSweep counts and finds first failures with the previous pass", () => {
  const points = [
    { sizeQuoteUnits: "100", status: "PASS", observedImpactPct: 0.1 },
    { sizeQuoteUnits: "200", status: "PASS", observedImpactPct: 0.5 },
    { sizeQuoteUnits: "400", status: "FAIL", observedImpactPct: 9.1 },
    { sizeQuoteUnits: "800", status: "FAIL", observedImpactPct: 20.0 },
    { sizeQuoteUnits: "1600", status: "CAPACITY", observedImpactPct: null },
    { sizeQuoteUnits: "3200", status: "UNABLE", observedImpactPct: null }
  ];
  const { summary, firstPolicyFailure, firstCapacityFailure } = summarizeSweep(points);
  assert.deepEqual(summary, { passed: 2, failed: 2, capacity: 1, unable: 1, points: 6 });
  assert.deepEqual(firstPolicyFailure, {
    sizeQuoteUnits: "400",
    observedImpactPct: 9.1,
    previousPassSizeQuoteUnits: "200"
  });
  assert.deepEqual(firstCapacityFailure, { sizeQuoteUnits: "1600" });
});

test("summarizeSweep handles an all-pass sweep with no failures", () => {
  const { summary, firstPolicyFailure, firstCapacityFailure } = summarizeSweep([
    { sizeQuoteUnits: "10", status: "PASS", observedImpactPct: 0.01 }
  ]);
  assert.equal(summary.passed, 1);
  assert.equal(firstPolicyFailure, null);
  assert.equal(firstCapacityFailure, null);
});

test("sweep contract names issuer policy ownership and distinct outcomes", () => {
  assert.equal(DBC_LAUNCH_SWEEP.id, DBC_SWEEP_SCENARIO_ID);
  assert.ok(DBC_LAUNCH_SWEEP.policy.maxPriceImpactPct.includes("issuer"));
  for (const key of ["PASS", "FAIL", "CAPACITY", "UNABLE"]) {
    assert.ok(DBC_LAUNCH_SWEEP.pointStatuses[key], `missing point status ${key}`);
  }
  assert.ok(!/this launch is (safe|unsafe)/i.test(JSON.stringify(DBC_LAUNCH_SWEEP)), "contract must not declare launch safety");
  assert.ok(!/correct threshold/i.test(JSON.stringify(DBC_LAUNCH_SWEEP)), "contract must not bless a threshold");
});

// ---------------- Live sweep behavior (read-only mainnet) ----------------

test("live sweep: known config yields PASS points then a first policy failure", async () => {
  const r = await runDbcSweep({ configAddress: KNOWN_CONFIG, maxPriceImpactPct: 8 });
  assert.equal(r.scenarioId, DBC_SWEEP_SCENARIO_ID);
  assert.equal(r.status, "FAIL");
  assert.ok(r.summary.passed >= 5, `expected several PASS points, got ${r.summary.passed}`);
  assert.ok(r.summary.failed >= 1);
  assert.ok(r.firstPolicyFailure, "first policy failure must be identified");
  assert.ok(r.firstPolicyFailure.previousPassSizeQuoteUnits, "previous passing size must bracket the failure");
  assert.ok(
    BigInt(r.firstPolicyFailure.previousPassSizeQuoteUnits) < BigInt(r.firstPolicyFailure.sizeQuoteUnits),
    "previous pass must be smaller than the failure size"
  );
  assert.equal(r.evidence.classification, "live_dbc_mainnet");
  assert.equal(r.policy.source, "issuer-supplied");
  assert.equal(r.policy.maxPriceImpactPct, 8);
  assert.ok(r.explanation.includes("8%"));
  assert.ok(!/safe/i.test(r.guidance), `guidance must not declare safety: ${r.guidance.slice(0, 120)}`);
  assert.ok(r.replay.length >= 4);
});

test("live sweep: policy threshold belongs to user input, not hardcoded", async () => {
  const loose = await runDbcSweep({ configAddress: KNOWN_CONFIG, maxPriceImpactPct: 8 });
  const tight = await runDbcSweep({ configAddress: KNOWN_CONFIG, maxPriceImpactPct: 1 });
  assert.ok(loose.firstPolicyFailure && tight.firstPolicyFailure, "both policies must produce a first failure");
  assert.ok(
    BigInt(tight.firstPolicyFailure.sizeQuoteUnits) < BigInt(loose.firstPolicyFailure.sizeQuoteUnits),
    "tighter policy must fail at a smaller size"
  );
});

test("live sweep: curve capacity is distinct from policy FAIL", async () => {
  const r = await runDbcSweep({
    configAddress: KNOWN_CONFIG,
    maxPriceImpactPct: 8,
    sizesQuoteUnits: ["1000000000", "206185567000"]
  });
  assert.equal(r.points.length, 2);
  assert.equal(r.points[0].status, "PASS");
  assert.equal(r.points[1].status, "CAPACITY");
  assert.equal(r.points[1].observedImpactPct, null);
  assert.ok(r.firstCapacityFailure, "first capacity failure must be identified");
  assert.equal(r.firstCapacityFailure.sizeQuoteUnits, "206185567000");
  assert.equal(r.firstPolicyFailure, null);
});

test("live sweep: bad config becomes UNABLE without network dependence", async () => {
  const r = await runDbcSweep({ configAddress: "NOTANADDRESS", maxPriceImpactPct: 8 });
  assert.equal(r.status, "UNABLE_TO_VERIFY");
  assert.equal(r.reasonCode, "DBC_BAD_ADDRESS");
  assert.deepEqual(r.points, []);
});

test("live sweep: bad policy and bad sizes become UNABLE", async () => {
  const badPolicy = await runDbcSweep({ configAddress: KNOWN_CONFIG, maxPriceImpactPct: "x" });
  assert.equal(badPolicy.status, "UNABLE_TO_VERIFY");
  assert.equal(badPolicy.reasonCode, "DBC_BAD_INPUT");
  const badSizes = await runDbcSweep({ configAddress: KNOWN_CONFIG, maxPriceImpactPct: 8, sizesQuoteUnits: ["0"] });
  assert.equal(badSizes.status, "UNABLE_TO_VERIFY");
  assert.equal(badSizes.reasonCode, "DBC_BAD_INPUT");
});

test("sweep module has no signing/broadcast path", () => {
  const src = readFileSync(new URL("../src/scenarios/dbc-live.js", import.meta.url), "utf8");
  assert.ok(!/\bsign\b/i.test(src), "must not contain signing");
  assert.ok(!/sendTransaction|Keypair|secretKey|mnemonic/i.test(src), "must not contain broadcast/custody primitives");
  assert.ok(!/create[A-Z]\w*Transaction|buildTransaction|Transaction\(/i.test(src), "must not build transactions");
});

test("human formatting is exact and never collapses distinct values", () => {
  assert.equal(formatHumanAmount("5480000000", 9), "5.48");
  assert.equal(formatHumanAmount("10960000000", 9), "10.96");
  assert.equal(formatHumanAmount("21920000000", 9), "21.92");
  assert.equal(formatHumanAmount("10960000", 9), "0.01096");
  assert.equal(formatHumanAmount("1000000000", 9), "1");
  assert.equal(formatHumanAmount("1000", 6), "0.001");
  assert.equal(formatHumanAmount("1000", 0), "1000");
  assert.equal(formatHumanAmount("1000", null), null);
  assert.equal(formatHumanAmount("1000", 19), null);
  assert.equal(formatRawUnits("10960000000"), "10,960,000,000");
  assert.equal(formatRawUnits("1000"), "1,000");
});

test("describeAmount prefers human units but always preserves raw audit text", () => {
  const sol = { mint: NATIVE_SOL_MINT, decimals: 9, symbol: "SOL" };
  assert.deepEqual(describeAmount("5480000000", sol), {
    primary: "~5.48 SOL",
    secondary: "5,480,000,000 quote units"
  });
  const other = { mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", decimals: 6, symbol: null };
  const named = describeAmount("1500000", other);
  assert.ok(named.primary.startsWith("~1.5 EPjF…Dt1v"), `got ${named.primary}`);
  assert.ok(!named.primary.includes("SOL"), "non-SOL mint must never be labeled SOL");
  assert.equal(named.secondary, "1,500,000 quote units");
  const unknown = describeAmount("1000", { mint: "AbC", decimals: null, symbol: null });
  assert.equal(unknown.primary, "1,000 quote units");
  assert.equal(unknown.secondary, null);
  assert.equal(abbreviateMint(NATIVE_SOL_MINT).length < NATIVE_SOL_MINT.length, true);
});

test("resolveQuoteAsset reads real mint metadata without guessing symbols", async () => {
  const { Connection } = await import("@solana/web3.js");
  const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
  const sol = await resolveQuoteAsset({ connection, quoteMint: NATIVE_SOL_MINT });
  assert.deepEqual(sol, { mint: NATIVE_SOL_MINT, decimals: 9, symbol: "SOL" });
  const usdc = await resolveQuoteAsset({
    connection,
    quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  });
  assert.equal(usdc.decimals, 6);
  assert.equal(usdc.symbol, null);
  const bogus = await resolveQuoteAsset({ connection, quoteMint: "NOTANADDRESS" });
  assert.equal(bogus.decimals, null);
  assert.equal(bogus.symbol, null);
});

test("live sweep at 15%: 8 PASS, first failure and capacity unchanged in raw units", async () => {
  const r = await runDbcSweep({ configAddress: KNOWN_CONFIG, maxPriceImpactPct: 15 });
  assert.equal(r.status, "FAIL");
  assert.deepEqual(
    { passed: r.summary.passed, failed: r.summary.failed, capacity: r.summary.capacity, unable: r.summary.unable },
    { passed: 8, failed: 1, capacity: 1, unable: 0 }
  );
  assert.equal(r.firstPolicyFailure.sizeQuoteUnits, "10960000000");
  assert.equal(r.firstPolicyFailure.sizeDisplay, "~10.96 SOL");
  assert.equal(r.firstPolicyFailure.previousPassSizeQuoteUnits, "5480000000");
  assert.ok(Math.abs(r.firstPolicyFailure.observedImpactPct - 21.937) < 0.01);
  assert.equal(r.firstCapacityFailure.sizeQuoteUnits, "21920000000");
  assert.deepEqual(r.quoteAsset, { mint: NATIVE_SOL_MINT, decimals: 9, symbol: "SOL" });
  assert.ok(r.points.every((p) => typeof p.sizeDisplay === "string" && p.sizeDisplay.length > 0));
  assert.ok(r.explanation.includes("~10.96 SOL") && r.explanation.includes("10,960,000,000 quote units"));
  assert.ok(r.guidance.includes("~10.96 SOL"));
});

test("live sweep at 8%: human displays match the same raw sizes", async () => {
  const r = await runDbcSweep({ configAddress: KNOWN_CONFIG, maxPriceImpactPct: 8 });
  assert.equal(r.firstPolicyFailure.sizeQuoteUnits, "5480000000");
  assert.equal(r.firstPolicyFailure.sizeDisplay, "~5.48 SOL");
  assert.equal(r.firstCapacityFailure.sizeQuoteUnits, "21920000000");
  const bySize = Object.fromEntries(r.points.map((p) => [p.sizeQuoteUnits, p.sizeDisplay]));
  assert.equal(bySize["5480000000"], "~5.48 SOL");
  assert.equal(bySize["10960000000"], "~10.96 SOL");
  assert.equal(bySize["21920000000"], "~21.92 SOL");
});

test("aggregate precedence is deterministic without network use", () => {
  assert.equal(sweepOverallStatus({ passed: 7, failed: 2, capacity: 1, unable: 0 }), "FAIL");
  assert.equal(sweepOverallStatus({ passed: 8, failed: 1, capacity: 1, unable: 0 }), "FAIL");
  assert.equal(sweepOverallStatus({ passed: 9, failed: 0, capacity: 1, unable: 0 }), "CAPACITY");
  assert.equal(sweepOverallStatus({ passed: 10, failed: 0, capacity: 0, unable: 0 }), "PASS");
  assert.equal(sweepOverallStatus({ passed: 0, failed: 0, capacity: 0, unable: 3 }), "UNABLE_TO_VERIFY");
  assert.equal(sweepOverallStatus({}), "UNABLE_TO_VERIFY");
});

test("live sweep at 25%: capacity without policy failure is CAPACITY, never FAIL", async () => {
  const r = await runDbcSweep({ configAddress: KNOWN_CONFIG, maxPriceImpactPct: 25 });
  assert.equal(r.status, "CAPACITY");
  assert.deepEqual(
    { passed: r.summary.passed, failed: r.summary.failed, capacity: r.summary.capacity, unable: r.summary.unable },
    { passed: 9, failed: 0, capacity: 1, unable: 0 }
  );
  assert.equal(r.firstPolicyFailure, null);
  assert.equal(r.firstCapacityFailure.sizeQuoteUnits, "21920000000");
  assert.equal(r.firstCapacityFailure.sizeDisplay, "~21.92 SOL");
});
