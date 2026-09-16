// JustFair Executable DBC Whale Scenario (Phase 3)
// Uses REAL Meteora SDK primitives over live mainnet state:
// fetch PoolConfig -> normalize to SwapQuoteConfig -> pre-pool swap quotes
// (marginal probe + proposed size) -> issuer-policy comparison.
//
// Read-only by construction: only Connection account reads + local quote
// math. No private keys, no signing, no broadcast, no funds. The SDK client is
// never given transaction builders in this module.

import { DynamicBondingCurveClient, getCurrentPoint } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { API_ENDPOINTS } from "../config.js";
import { evaluateWhalePolicy } from "./dbc.js";

export const DBC_PROGRAM_ID = "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN";
// Marginal-rate probe size in quote raw units (dust; documented, fixed).
export const DBC_MARGINAL_PROBE_UNITS = "1000";
const MAX_TRADE_UNITS = BigInt("1000000000000000000"); // 1e18 sanity cap

function str(v) {
  return v && typeof v.toBase58 === "function" ? v.toBase58() : String(v);
}

export function createDbcClient(rpcUrl) {
  const connection = new Connection(rpcUrl || API_ENDPOINTS.SOLANA_RPC, "confirmed");
  return { connection, client: DynamicBondingCurveClient.create(connection, "confirmed") };
}

function parseAddress(label, value) {
  try {
    const key = new PublicKey(String(value || "").trim());
    return { ok: true, key, address: key.toBase58() };
  } catch {
    return { ok: false, error: `${label} is not a valid Solana address` };
  }
}

function parsePositiveBigInt(label, value, cap = MAX_TRADE_UNITS) {
  try {
    const n = BigInt(String(value).trim());
    if (n <= 0n || n > cap) return { ok: false, error: `${label} must be within 1..${cap}` };
    return { ok: true, raw: String(value).trim() };
  } catch {
    return { ok: false, error: `${label} must be an integer string` };
  }
}

/**
 * Fetch a live DBC PoolConfig. Throws coded errors (never raw RPC shapes).
 */
export async function fetchDbcConfig({ rpcUrl, configAddress }) {
  const parsed = parseAddress("configAddress", configAddress);
  if (!parsed.ok) {
    const err = new Error(parsed.error);
    err.code = "DBC_BAD_ADDRESS";
    throw err;
  }
  const { connection, client } = createDbcClient(rpcUrl);
  try {
    const config = await client.state.getPoolConfig(parsed.key);
    if (!config) throw new Error("empty config");
    return { config, fetchedAt: new Date().toISOString(), configAddress: parsed.address };
  } catch (err) {
    if (err.code === "DBC_BAD_ADDRESS") throw err;
    const wrapped = new Error(`DBC config read failed: ${err.message}`);
    wrapped.code = "DBC_FETCH_FAILED";
    throw wrapped;
  }
}

function toQuoteConfig(config) {
  // Mechanical mapping PoolConfig -> SwapQuoteConfig (field names verified
  // against SDK v1.5.12 fetched objects; zero curve points excluded — the
  // fixed 20-slot array pads unused segments with zeros).
  const baseFee = config.poolFees?.baseFee || {};
  return {
    poolFees: {
      baseFee: {
        cliffFeeNumerator: baseFee.cliffFeeNumerator,
        firstFactor: baseFee.firstFactor ?? 0,
        secondFactor: baseFee.secondFactor,
        thirdFactor: baseFee.thirdFactor,
        baseFeeMode: baseFee.baseFeeMode ?? 0
      },
      dynamicFee: null
    },
    collectFeeMode: config.collectFeeMode ?? 0,
    sqrtStartPrice: config.sqrtStartPrice,
    migrationQuoteThreshold: config.migrationQuoteThreshold,
    curve: (config.curve || [])
      .filter(p => p && p.liquidity && !p.liquidity.isZero())
      .map(p => ({ sqrtPrice: p.sqrtPrice, liquidity: p.liquidity })),
    migrationSqrtPrice: config.migrationSqrtPrice
  };
}

/**
 * Pure impact math: effective rate vs marginal rate. Unit-free ratio.
 */
export function computeImpactPct({ outputAmount, amountIn, marginalOutput, marginalIn }) {
  const out = Number(outputAmount);
  const inp = Number(amountIn);
  const mOut = Number(marginalOutput);
  const mIn = Number(marginalIn);
  if (![out, inp, mOut, mIn].every(Number.isFinite) || inp <= 0 || mIn <= 0 || mOut <= 0) {
    return { ok: false, reason: "Non-numeric quote amounts" };
  }
  return { ok: true, observedImpactPct: (1 - (out / inp) / (mOut / mIn)) * 100 };
}

/**
 * Run DBC_OPENING_WHALE against a live config. Returns a standard scenario
 * result (status/assertions/diagnosis/replay/evidence). Never throws on
 * evaluation problems — those become UNABLE (or FAIL for capacity).
 */
export async function runDbcWhale({ rpcUrl, configAddress, tradeSizeQuoteUnits, maxPriceImpactPct, quoteSymbol = "SOL" }) {
  const startedAt = new Date().toISOString();
  const replay = [{ at: "T0", label: "Whale scenario issued", expected: "DBC_OPENING_WHALE", observed: "inputs prepared" }];
  const unable = (reason, code) => ({
    status: "UNABLE_TO_VERIFY", reason, reasonCode: code, assertions: [], diagnosis: null,
    evidence: null, replay: [...replay, { at: "T+run", label: "Run inconclusive", expected: "decisive evidence", observed: reason }]
  });

  const size = parsePositiveBigInt("tradeSizeQuoteUnits", tradeSizeQuoteUnits);
  if (!size.ok) return unable(size.error, "DBC_BAD_INPUT");
  const tolerance = Number(maxPriceImpactPct);
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 100) {
    return unable("maxPriceImpactPct must be a number within 0..100", "DBC_BAD_INPUT");
  }

  let fetched;
  try {
    fetched = await fetchDbcConfig({ rpcUrl, configAddress });
  } catch (err) {
    return unable(err.message, err.code || "DBC_FETCH_FAILED");
  }
  const { config, fetchedAt, configAddress: normalizedConfig } = fetched;
  replay.push({ at: "T+config", label: "Live DBC config read", expected: normalizedConfig, observed: `quoteMint ${str(config.quoteMint)}` });

  const evidence = {
    classification: "live_dbc_mainnet",
    source: "METEORA_DBC_PROGRAM",
    program: DBC_PROGRAM_ID,
    network: "mainnet-beta",
    config: normalizedConfig,
    captured_at: fetchedAt,
    provenance: "config + quote math via @meteora-ag/dynamic-bonding-curve-sdk over mainnet RPC; read-only, no signing"
  };

  let quote, marginal;
  try {
    const { connection, client } = createDbcClient(rpcUrl);
    const quoteConfig = toQuoteConfig(config);
    const currentPoint = await getCurrentPoint(connection, Number(config.activationType ?? 0));
    const base = { config: quoteConfig, swapBaseForQuote: false, hasReferral: false, eligibleForFirstSwapWithMinFee: false, currentPoint };
    marginal = client.pool.getQuoteFromInputAmount({ ...base, amountIn: new BN(DBC_MARGINAL_PROBE_UNITS) });
    quote = client.pool.getQuoteFromInputAmount({ ...base, amountIn: new BN(size.raw) });
  } catch (err) {
    if (/insufficient liquidity/i.test(err.message || "")) {
      const diagnosis = {
        failureCode: "CURVE_CAPACITY_EXCEEDED",
        expected: `Opening purchase fits the curve within ≤ ${tolerance}% impact`,
        actual: { outcome: "trade size exceeds curve capacity", detail: "SDK refused the quote: Insufficient Liquidity" },
        rootCause: "The proposed curve cannot absorb a purchase of this size at any price.",
        guidance: "Add early-curve liquidity, raise the migration threshold economics, or reduce the opening purchase size, then rerun this scenario."
      };
      return {
        status: "FAIL", target: normalizedConfig,
        assertions: [{ id: "within-issuer-policy", expected: diagnosis.expected, actual: diagnosis.actual, passed: false, error: null }],
        diagnosis, evidence,
        replay: [...replay,
          { at: "T+quote", label: "Whale quote attempted", expected: "executable quote", observed: "SDK: Insufficient Liquidity" },
          { at: "T+verdict", label: "Capacity violated", expected: diagnosis.expected, observed: "trade size exceeds curve capacity" }]
      };
    }
    return unable(`Quote math failed: ${err.message}`, "DBC_QUOTE_FAILED");
  }

  const out = quote.outputAmount ?? quote.minimumAmountOut;
  const mOut = marginal.outputAmount ?? marginal.minimumAmountOut;
  const math = computeImpactPct({ outputAmount: String(out), amountIn: size.raw, marginalOutput: String(mOut), marginalIn: DBC_MARGINAL_PROBE_UNITS });
  if (!math.ok) return unable(math.reason, "DBC_QUOTE_FAILED");
  const observedImpactPct = math.observedImpactPct;
  const verdict = evaluateWhalePolicy({ observedImpactPct, maxPriceImpactPct: tolerance });

  const expectedText = `Opening purchase impact ≤ ${tolerance}% (issuer policy)`;
  const actualText = `${observedImpactPct.toFixed(3)}% price impact on ${size.raw} quote units`;
  replay.push(
    { at: "T+marginal", label: "Marginal rate probed", expected: "baseline rate", observed: `${mOut}/${DBC_MARGINAL_PROBE_UNITS}` },
    { at: "T+quote", label: "Whale quote computed", expected: "quoted output", observed: `${out} for ${size.raw}` }
  );

  if (verdict.withinPolicy) {
    return {
      status: "PASS", target: normalizedConfig,
      assertions: [{ id: "within-issuer-policy", expected: expectedText, actual: { observedImpactPct, outputAmount: String(out) }, passed: true, error: null }],
      diagnosis: null, evidence,
      replay: [...replay, { at: "T+verdict", label: "Within issuer policy", expected: expectedText, observed: actualText }]
    };
  }
  return {
    status: "FAIL", target: normalizedConfig,
    assertions: [{ id: "within-issuer-policy", expected: expectedText, actual: { observedImpactPct, outputAmount: String(out) }, passed: false, error: null }],
    diagnosis: {
      failureCode: "IMPACT_POLICY_VIOLATED",
      expected: expectedText,
      actual: { observedImpactPct, outputAmount: String(out) },
      rootCause: "The proposed curve provides insufficient depth around the opening price region for this trade size.",
      guidance: "Adjust the curve/liquidity distribution around the expected opening price and rerun this scenario."
    },
    evidence,
    replay: [...replay, { at: "T+verdict", label: "Policy violated", expected: expectedText, observed: actualText }]
  };
}
