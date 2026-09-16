// JustFair Phase 4 Tessera Tests (node:test)
// T-OpenAI preferred; T-Kalshi cross-checked. Live Token-2022 reads +
// exact integer math + naive/correct engine proof.

import test from "node:test";
import assert from "node:assert/strict";

import {
  TESSERA_PRODUCTS,
  TOKEN_2022_PROGRAM_ID,
  getTesseraTransferFeeState,
  calculateNetReceipt,
  buildTesseraScenario
} from "../src/scenarios/tessera.js";
import { runScenario } from "../src/scenarios/scenario.js";
import { startFeeTarget, closeFixtureTarget } from "./fixtures/adapter-targets.js";

const LOCAL = { allowLocal: true, timeoutMs: 5000 };
const TOPENAI_MINT = "oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ";
const AAPLX_MINT = "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp"; // Token-2022, no transfer fee
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // legacy Token program

let cachedFeeState = null;
async function liveFeeState() {
  if (!cachedFeeState) {
    cachedFeeState = await getTesseraTransferFeeState(TOPENAI_MINT);
  }
  return cachedFeeState;
}

// Coded errors carry machine-readable `code` alongside the message.
async function assertRejectsCode(promise, code) {
  try {
    await promise;
  } catch (err) {
    assert.equal(err.code, code);
    return;
  }
  throw new Error(`Expected rejection with code ${code}`);
}

test("official product mapping resolves T-OpenAI to its verified mint", () => {
  assert.equal(TESSERA_PRODUCTS["T-OpenAI"].mint, TOPENAI_MINT);
  assert.ok(TESSERA_PRODUCTS["T-Kalshi"].mint.length >= 32);
});

test("live T-OpenAI mint is Token-2022 with an active 20bps fee config", async () => {
  const fee = await liveFeeState();
  assert.equal(fee.mint, TOPENAI_MINT);
  assert.equal(fee.program, TOKEN_2022_PROGRAM_ID);
  assert.equal(fee.decimals, 9);
  assert.equal(fee.basisPoints, 20);
  assert.ok(BigInt(fee.maximumFee) > 0n);
  assert.ok(typeof fee.capturedAt === "string" && fee.capturedAt.length > 0);
  assert.ok(fee.provenance.includes("TransferFeeConfig"));
});

test("live T-Kalshi mint carries the same fee program semantics", async () => {
  const fee = await getTesseraTransferFeeState(TESSERA_PRODUCTS["T-Kalshi"].mint);
  assert.equal(fee.program, TOKEN_2022_PROGRAM_ID);
  assert.equal(fee.decimals, 9);
  assert.equal(typeof fee.basisPoints, "number");
});

test("fee math: 1000 units at 20bps nets 998", () => {
  const r = calculateNetReceipt({ transferAmountUnits: "1000", feeBasisPoints: 20, maximumFeeUnits: "18446744073709551615" });
  assert.equal(r.calculatedFeeUnits, "2");
  assert.equal(r.actualFeeUnits, "2");
  assert.equal(r.expectedNetUnits, "998");
});

test("integer rounding matches ceil-division edges, never floats", () => {
  const max = "18446744073709551615";
  assert.equal(calculateNetReceipt({ transferAmountUnits: "1", feeBasisPoints: 20, maximumFeeUnits: max }).actualFeeUnits, "1");
  assert.equal(calculateNetReceipt({ transferAmountUnits: "1", feeBasisPoints: 20, maximumFeeUnits: max }).expectedNetUnits, "0");
  assert.equal(calculateNetReceipt({ transferAmountUnits: "499", feeBasisPoints: 20, maximumFeeUnits: max }).actualFeeUnits, "1");
  assert.equal(calculateNetReceipt({ transferAmountUnits: "500", feeBasisPoints: 20, maximumFeeUnits: max }).actualFeeUnits, "1");
  assert.equal(calculateNetReceipt({ transferAmountUnits: "500", feeBasisPoints: 20, maximumFeeUnits: max }).expectedNetUnits, "499");
});

test("maximum-fee cap binds on large amounts (synthetic config)", () => {
  const r = calculateNetReceipt({ transferAmountUnits: "100000", feeBasisPoints: 20, maximumFeeUnits: "50" });
  assert.equal(r.calculatedFeeUnits, "200");
  assert.equal(r.actualFeeUnits, "50");
  assert.equal(r.expectedNetUnits, "99950");
});

test("our math matches official spl-token calculateFee exactly", async () => {
  const spl = await import("@solana/spl-token");
  const fee = await liveFeeState();
  const cfg = {
    newerTransferFee: { epoch: BigInt(fee.newerEpoch), maximumFee: BigInt(fee.maximumFee), transferFeeBasisPoints: fee.basisPoints },
    olderTransferFee: { epoch: 0n, maximumFee: BigInt(fee.maximumFee), transferFeeBasisPoints: fee.olderBasisPoints }
  };
  for (const amt of ["1", "499", "500", "1000", "123456789"]) {
    const mine = calculateNetReceipt({ transferAmountUnits: amt, feeBasisPoints: fee.basisPoints, maximumFeeUnits: fee.maximumFee });
    const official = spl.calculateFee(cfg.newerTransferFee, BigInt(amt));
    assert.equal(mine.actualFeeUnits, String(official), `fee mismatch at ${amt}`);
  }
});

test("naive target FAILS with TRANSFER_FEE_IGNORED and full remediation", async () => {
  const fee = await liveFeeState();
  const def = buildTesseraScenario({ symbol: "T-OpenAI", mint: fee.mint, transferAmountUnits: "1000", feeState: fee });
  const h = await startFeeTarget({ behavior: "naive" });
  try {
    const result = await runScenario(def, h.baseUrl, LOCAL);
    assert.equal(result.status, "FAIL");
    assert.equal(result.diagnosis.failureCode, "TRANSFER_FEE_IGNORED");
    assert.ok(result.diagnosis.expected.includes("998"));
    assert.equal(result.diagnosis.actual.reportedNetRecipientAmount, "1000");
    assert.ok(result.diagnosis.rootCause.length > 10);
    assert.ok(result.diagnosis.guidance.length > 10);
    const labels = result.replay.map(e => e.label);
    assert.ok(result.replay.length >= 5);
    for (const stage of ["Scenario issued", "Target manifest accepted", "Target observations collected", "Invariant violated"]) {
      assert.ok(labels.includes(stage), `replay must include stage: ${stage}`);
    }
    assert.equal(result.evidence.classification, "live_tessera_token2022");
    assert.equal(result.evidence.mint, TOPENAI_MINT);
    assert.equal(result.evidence.transferFeeBasisPoints, 20);
  } finally {
    await closeFixtureTarget(h);
  }
});

test("correct target PASSES the same live-fee scenario", async () => {
  const fee = await liveFeeState();
  const def = buildTesseraScenario({ symbol: "T-OpenAI", mint: fee.mint, transferAmountUnits: "1000", feeState: fee });
  const h = await startFeeTarget({ behavior: "correct" });
  try {
    const result = await runScenario(def, h.baseUrl, LOCAL);
    assert.equal(result.status, "PASS");
    assert.equal(result.diagnosis, null);
  } finally {
    await closeFixtureTarget(h);
  }
});

test("malformed fee evidence is rejected, never run", () => {
  try {
    buildTesseraScenario({ symbol: "T-OpenAI", mint: TOPENAI_MINT, transferAmountUnits: "1000", feeState: {} });
  } catch (err) {
    assert.equal(err.code, "TESSERA_MALFORMED_EVIDENCE");
    return;
  }
  throw new Error("Expected TESSERA_MALFORMED_EVIDENCE");
});

test("mint without TransferFeeConfig yields coded UNABLE path state", async () => {
  await assertRejectsCode(getTesseraTransferFeeState(AAPLX_MINT), "TESSERA_NO_TRANSFER_FEE");
});

test("non-Token-2022 mint yields coded state", async () => {
  await assertRejectsCode(getTesseraTransferFeeState(USDC_MINT), "TESSERA_NOT_TOKEN2022");
});

test("garbage mint string fails validation without network", async () => {
  await assertRejectsCode(getTesseraTransferFeeState("not-a-mint!!"), "TESSERA_BAD_MINT");
});
