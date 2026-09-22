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

// Launch-stress sweep identity + sizing. Sweep sizes are derived from the
// REAL on-chain migrationQuoteThreshold (basis points of it), so the grid is
// deterministic and quote-asset-agnostic. No hardcoded SOL amounts.
export const DBC_SWEEP_SCENARIO_ID = "DBC_LAUNCH_SWEEP";
export const DBC_SWEEP_DEFAULT_BPS = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000];
export const DBC_SWEEP_MAX_POINTS = 32;

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
 * Single local quote for one opening size. Pure SDK math over already-fetched
 * state — zero RPC. Returns a discriminated result so callers can separate
 * curve-capacity exhaustion from infrastructure/quote failures.
 */
export function quoteSingleSize({ client, quoteConfig, currentPoint, sizeRaw }) {
  try {
    const q = client.pool.getQuoteFromInputAmount({
      config: quoteConfig,
      swapBaseForQuote: false,
      hasReferral: false,
      eligibleForFirstSwapWithMinFee: false,
      currentPoint,
      amountIn: new BN(sizeRaw)
    });
    return { ok: true, out: String(q.outputAmount ?? q.minimumAmountOut) };
  } catch (err) {
    if (/insufficient liquidity/i.test(err.message || "")) return { ok: false, capacity: true };
    return { ok: false, error: `Quote math failed: ${err.message}` };
  }
}

/**
 * Pure sweep grid: basis points of the REAL on-chain migrationQuoteThreshold.
 * Ascending, deduplicated raw-unit strings. No hardcoded asset amounts.
 */
export function deriveSweepSizes({ migrationQuoteThreshold, bps = DBC_SWEEP_DEFAULT_BPS }) {
  let threshold;
  try {
    threshold = BigInt(String(migrationQuoteThreshold));
  } catch {
    return { ok: false, code: "DBC_NO_SWEEP_BASIS", error: "migrationQuoteThreshold is not readable; supply explicit sizesQuoteUnits" };
  }
  if (threshold <= 0n) {
    return { ok: false, code: "DBC_NO_SWEEP_BASIS", error: "migrationQuoteThreshold is zero; supply explicit sizesQuoteUnits" };
  }
  const seen = new Set();
  for (const b of bps) {
    const n = Number(b);
    if (!Number.isFinite(n) || n <= 0) continue;
    const size = (threshold * BigInt(Math.floor(n))) / 10000n;
    if (size >= 1n) seen.add(size.toString());
  }
  const sizes = [...seen].map(BigInt).sort((a, b) => (a < b ? -1 : 1)).map(String);
  if (sizes.length === 0) {
    return { ok: false, code: "DBC_NO_SWEEP_BASIS", error: "no usable sweep sizes derive from this config; supply explicit sizesQuoteUnits" };
  }
  return { ok: true, sizes, basis: { migrationQuoteThreshold: threshold.toString(), bps: [...bps] } };
}

/**
 * Validate caller-supplied sweep sizes. Sorted ascending, deduplicated.
 */
export function parseSweepSizes(input) {
  const raw = Array.isArray(input) ? input : String(input ?? "").split(",");
  const seen = new Set();
  for (const v of raw) {
    const t = String(v ?? "").trim();
    if (!t) continue;
    let n;
    try {
      n = BigInt(t);
    } catch {
      return { ok: false, code: "DBC_BAD_INPUT", error: `sweep size is not an integer string: ${t}` };
    }
    if (n <= 0n || n > MAX_TRADE_UNITS) {
      return { ok: false, code: "DBC_BAD_INPUT", error: `sweep size must be within 1..${MAX_TRADE_UNITS}: ${t}` };
    }
    seen.add(n.toString());
  }
  const sizes = [...seen].map(BigInt).sort((a, b) => (a < b ? -1 : 1)).map(String);
  if (sizes.length === 0) return { ok: false, code: "DBC_BAD_INPUT", error: "supply at least one sweep size" };
  if (sizes.length > DBC_SWEEP_MAX_POINTS) {
    return { ok: false, code: "DBC_BAD_INPUT", error: `at most ${DBC_SWEEP_MAX_POINTS} sweep sizes per run` };
  }
  return { ok: true, sizes };
}

/**
 * Pure sweep summary: counts plus first observed policy failure and first
 * capacity failure over ascending points. The policy value itself always
 * comes from caller input, never from a hardcoded threshold.
 */
export function summarizeSweep(points) {
  const summary = { passed: 0, failed: 0, capacity: 0, unable: 0, points: points.length };
  let firstPolicyFailure = null;
  let firstCapacityFailure = null;
  let previousPassSize = null;
  for (const p of points) {
    if (p.status === "PASS") {
      summary.passed++;
      previousPassSize = p.sizeQuoteUnits;
    } else if (p.status === "FAIL") {
      summary.failed++;
      if (!firstPolicyFailure) {
        firstPolicyFailure = {
          sizeQuoteUnits: p.sizeQuoteUnits,
          observedImpactPct: p.observedImpactPct,
          previousPassSizeQuoteUnits: previousPassSize
        };
      }
    } else if (p.status === "CAPACITY") {
      summary.capacity++;
      if (!firstCapacityFailure) firstCapacityFailure = { sizeQuoteUnits: p.sizeQuoteUnits };
    } else {
      summary.unable++;
    }
  }
  return { summary, firstPolicyFailure, firstCapacityFailure };
}

// Quote-asset presentation. Decimals are read from the REAL mint account
// (base Mint layout byte 44, shared by Token and Token-2022); the SOL label
// applies ONLY to the system native mint address. Unknown mints fall back
// to raw units with an abbreviated mint — never a guessed symbol.
export const NATIVE_SOL_MINT = "So11111111111111111111111111111111111111112";
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export function abbreviateMint(mint) {
  const s = String(mint || "");
  return s.length > 12 ? `${s.slice(0, 4)}…${s.slice(-4)}` : s;
}

export function formatRawUnits(raw) {
  try {
    return BigInt(String(raw)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } catch {
    return String(raw);
  }
}

/**
 * Exact human amount: raw / 10^decimals with trailing zeros trimmed.
 * Division by a power of ten is injective, so distinct raw values never
 * collapse. Returns null when decimals are unknown.
 */
export function formatHumanAmount(raw, decimals) {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) return null;
  let neg = false;
  let digits;
  try {
    let n = BigInt(String(raw));
    if (n < 0n) {
      neg = true;
      n = -n;
    }
    digits = n.toString();
  } catch {
    return null;
  }
  if (decimals === 0) return `${neg ? "-" : ""}${digits}`;
  const padded = digits.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, -decimals).replace(/^0+(?=\d)/, "");
  const fracPart = padded.slice(-decimals).replace(/0+$/, "");
  const body = fracPart ? `${intPart || "0"}.${fracPart}` : (intPart || "0");
  return `${neg ? "-" : ""}${body}`;
}

/**
 * Primary/secondary display for one raw amount. Human units are primary
 * only when decimals are known; raw grouped units are always preserved
 * as secondary audit text in that case, or as primary when unknown.
 */
export function describeAmount(raw, quoteAsset) {
  const grouped = `${formatRawUnits(raw)} quote units`;
  const decimals = quoteAsset?.decimals;
  const human = formatHumanAmount(raw, decimals);
  if (human === null) return { primary: grouped, secondary: null };
  const unit = quoteAsset?.symbol || abbreviateMint(quoteAsset?.mint);
  return { primary: `~${human} ${unit}`, secondary: grouped };
}

export async function resolveQuoteAsset({ connection, quoteMint }) {
  const mint = String(quoteMint || "").trim();
  const unknown = { mint, decimals: null, symbol: null };
  if (!mint) return unknown;
  if (mint === NATIVE_SOL_MINT) return { mint, decimals: 9, symbol: "SOL" };
  try {
    const key = new PublicKey(mint);
    const info = await connection.getAccountInfo(key);
    if (!info || !info.data || info.data.length < 82) return unknown;
    const owner = str(info.owner);
    if (owner !== TOKEN_PROGRAM_ID && owner !== TOKEN_2022_PROGRAM_ID) return unknown;
    const decimals = info.data[44];
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) return unknown;
    return { mint, decimals, symbol: null };
  } catch {
    return unknown;
  }
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

  let marginalOut, quoteOut;
  try {
    const { connection, client } = createDbcClient(rpcUrl);
    const quoteConfig = toQuoteConfig(config);
    const currentPoint = await getCurrentPoint(connection, Number(config.activationType ?? 0));
    const marginal = quoteSingleSize({ client, quoteConfig, currentPoint, sizeRaw: DBC_MARGINAL_PROBE_UNITS });
    if (!marginal.ok) throw new Error(marginal.capacity ? "Insufficient Liquidity" : marginal.error.replace(/^Quote math failed: /, ""));
    const quote = quoteSingleSize({ client, quoteConfig, currentPoint, sizeRaw: size.raw });
    if (!quote.ok) throw new Error(quote.capacity ? "Insufficient Liquidity" : quote.error.replace(/^Quote math failed: /, ""));
    marginalOut = marginal.out;
    quoteOut = quote.out;
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

  const out = quoteOut;
  const mOut = marginalOut;
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

/**
 * DBC launch-stress sweep: evaluate a deterministic sequence of hypothetical
 * opening-buy sizes against ONE issuer-supplied impact policy, reusing the
 * identical real Meteora quote math as runDbcWhale.
 *
 * Sizes are caller-supplied (sizesQuoteUnits) or derived from the REAL
 * on-chain migrationQuoteThreshold. Exactly two RPC reads per run (config +
 * current point); every sweep point is local math. Read-only: no signature,
 * broadcast, custody, funds, or actual trades.
 */
export async function runDbcSweep({ rpcUrl, configAddress, maxPriceImpactPct, sizesQuoteUnits = null, quoteSymbol = "SOL" }) {
  const replay = [{ at: "T0", label: "Launch sweep issued", expected: DBC_SWEEP_SCENARIO_ID, observed: "inputs prepared" }];
  const unable = (reason, code) => ({
    scenarioId: DBC_SWEEP_SCENARIO_ID,
    status: "UNABLE_TO_VERIFY", reason, reasonCode: code,
    target: null, policy: null, quoteAsset: null, summary: null, points: [],
    firstPolicyFailure: null, firstCapacityFailure: null,
    testedRange: null, explanation: null, guidance: null,
    evidence: null,
    replay: [...replay, { at: "T+run", label: "Sweep inconclusive", expected: "decisive evidence", observed: reason }]
  });

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

  let sizes;
  let sizesBasis;
  if (sizesQuoteUnits !== null && sizesQuoteUnits !== undefined) {
    const parsed = parseSweepSizes(sizesQuoteUnits);
    if (!parsed.ok) return unable(parsed.error, parsed.code);
    sizes = parsed.sizes;
    sizesBasis = "caller-supplied";
  } else {
    const derived = deriveSweepSizes({ migrationQuoteThreshold: config.migrationQuoteThreshold?.toString?.() ?? String(config.migrationQuoteThreshold ?? "") });
    if (!derived.ok) return unable(derived.error, derived.code);
    sizes = derived.sizes;
    sizesBasis = `basis points ${derived.basis.bps.join("/")} of migrationQuoteThreshold ${derived.basis.migrationQuoteThreshold}`;
  }

  const evidence = {
    classification: "live_dbc_mainnet",
    source: "METEORA_DBC_PROGRAM",
    program: DBC_PROGRAM_ID,
    network: "mainnet-beta",
    config: normalizedConfig,
    captured_at: fetchedAt,
    sweep: { sizesBasis, pointCount: sizes.length, policySource: "issuer-supplied maxPriceImpactPct" },
    provenance: "config + quote math via @meteora-ag/dynamic-bonding-curve-sdk over mainnet RPC; read-only, no signature"
  };

  const env = createDbcClient(rpcUrl);
  const quoteAsset = await resolveQuoteAsset({ connection: env.connection, quoteMint: str(config.quoteMint) });
  evidence.quoteAsset = quoteAsset;

  const displayOf = (sizeRaw) => describeAmount(sizeRaw, quoteAsset).primary;

  let client, quoteConfig, currentPoint, marginalOut;
  try {
    client = env.client;
    quoteConfig = toQuoteConfig(config);
    currentPoint = await getCurrentPoint(env.connection, Number(config.activationType ?? 0));
    const marginal = quoteSingleSize({ client, quoteConfig, currentPoint, sizeRaw: DBC_MARGINAL_PROBE_UNITS });
    if (!marginal.ok) {
      if (marginal.capacity) {
        return sweepCapacityShortCircuit({ replay, evidence, normalizedConfig, tolerance, sizes, quoteAsset });
      }
      return unable(marginal.error, "DBC_QUOTE_FAILED");
    }
    marginalOut = marginal.out;
  } catch (err) {
    return unable(`Quote setup failed: ${err.message}`, "DBC_QUOTE_FAILED");
  }
  replay.push({ at: "T+marginal", label: "Marginal rate probed", expected: "baseline rate", observed: `${marginalOut}/${DBC_MARGINAL_PROBE_UNITS}` });

  const points = [];
  for (const sizeRaw of sizes) {
    const sizeDisplay = displayOf(sizeRaw);
    const q = quoteSingleSize({ client, quoteConfig, currentPoint, sizeRaw });
    if (!q.ok) {
      if (q.capacity) {
        points.push({ sizeQuoteUnits: sizeRaw, sizeDisplay, status: "CAPACITY", observedImpactPct: null, outputAmount: null, reason: "curve reports insufficient capacity for this opening size" });
      } else {
        points.push({ sizeQuoteUnits: sizeRaw, sizeDisplay, status: "UNABLE", observedImpactPct: null, outputAmount: null, reason: q.error });
      }
      continue;
    }
    const math = computeImpactPct({ outputAmount: q.out, amountIn: sizeRaw, marginalOutput: marginalOut, marginalIn: DBC_MARGINAL_PROBE_UNITS });
    if (!math.ok) {
      points.push({ sizeQuoteUnits: sizeRaw, sizeDisplay, status: "UNABLE", observedImpactPct: null, outputAmount: q.out, reason: math.reason });
      continue;
    }
    const verdict = evaluateWhalePolicy({ observedImpactPct: math.observedImpactPct, maxPriceImpactPct: tolerance });
    if (verdict.withinPolicy === null) {
      points.push({ sizeQuoteUnits: sizeRaw, sizeDisplay, status: "UNABLE", observedImpactPct: null, outputAmount: q.out, reason: "Non-numeric impact" });
    } else if (verdict.withinPolicy) {
      points.push({ sizeQuoteUnits: sizeRaw, sizeDisplay, status: "PASS", observedImpactPct: math.observedImpactPct, outputAmount: q.out, reason: null });
    } else {
      points.push({ sizeQuoteUnits: sizeRaw, sizeDisplay, status: "FAIL", observedImpactPct: math.observedImpactPct, outputAmount: q.out, reason: `impact exceeds issuer policy of ${tolerance}%` });
    }
  }
  replay.push({ at: "T+sweep", label: "Sweep evaluated", expected: `${sizes.length} opening sizes`, observed: "per-point results recorded" });

  const { summary, firstPolicyFailure, firstCapacityFailure } = summarizeSweep(points);
  const testedRange = {
    minSizeQuoteUnits: sizes[0],
    maxSizeQuoteUnits: sizes[sizes.length - 1],
    minSizeDisplay: displayOf(sizes[0]),
    maxSizeDisplay: displayOf(sizes[sizes.length - 1])
  };
  const decisive = summary.passed + summary.failed + summary.capacity;
  const status = (summary.failed > 0 || summary.capacity > 0) ? "FAIL" : decisive > 0 ? "PASS" : "UNABLE_TO_VERIFY";

  const explainedFirstFailure = firstPolicyFailure && {
    ...firstPolicyFailure,
    sizeDisplay: displayOf(firstPolicyFailure.sizeQuoteUnits),
    previousPassSizeDisplay: firstPolicyFailure.previousPassSizeQuoteUnits
      ? displayOf(firstPolicyFailure.previousPassSizeQuoteUnits)
      : null
  };
  const explainedFirstCapacity = firstCapacityFailure && {
    ...firstCapacityFailure,
    sizeDisplay: displayOf(firstCapacityFailure.sizeQuoteUnits)
  };
  const explanation = buildSweepExplanation({ config: normalizedConfig, tolerance, sizes, summary, firstPolicyFailure: explainedFirstFailure, firstCapacityFailure: explainedFirstCapacity, quoteAsset });
  const guidance = buildSweepGuidance({ tolerance, summary, firstPolicyFailure: explainedFirstFailure, firstCapacityFailure: explainedFirstCapacity, quoteAsset });
  const verdictLabel = status === "PASS" ? "Sweep within issuer policy" : status === "FAIL" ? "Sweep crossed policy or capacity" : "Sweep inconclusive";

  return {
    scenarioId: DBC_SWEEP_SCENARIO_ID,
    status,
    target: normalizedConfig,
    policy: { maxPriceImpactPct: tolerance, source: "issuer-supplied" },
    quoteAsset,
    summary: { ...summary, points: points.length },
    points,
    firstPolicyFailure: explainedFirstFailure,
    firstCapacityFailure: explainedFirstCapacity,
    testedRange,
    explanation,
    guidance,
    evidence,
    replay: [...replay, { at: "T+verdict", label: verdictLabel, expected: `policy ${tolerance}%`, observed: explanation }]
  };
}

/**
 * Marginal dust probe itself exceeds curve capacity: no opening size can
 * quote, so every sweep point is CAPACITY (attempted: false beyond the probe
 * would add no evidence — the probe already proves the curve unquotable).
 */
function sweepCapacityShortCircuit({ replay, evidence, normalizedConfig, tolerance, sizes, quoteAsset }) {
  const displayOf = (sizeRaw) => describeAmount(sizeRaw, quoteAsset).primary;
  const points = sizes.map((sizeRaw) => ({
    sizeQuoteUnits: sizeRaw,
    sizeDisplay: displayOf(sizeRaw),
    status: "CAPACITY",
    observedImpactPct: null,
    outputAmount: null,
    reason: "marginal probe already exceeds curve capacity; no opening size can quote"
  }));
  const { summary, firstCapacityFailure } = summarizeSweep(points);
  const explainedFirstCapacity = firstCapacityFailure && {
    ...firstCapacityFailure,
    sizeDisplay: displayOf(firstCapacityFailure.sizeQuoteUnits)
  };
  const explanation = `No opening size can quote against ${normalizedConfig}: even the marginal probe exceeds curve capacity.`;
  return {
    scenarioId: DBC_SWEEP_SCENARIO_ID,
    status: "FAIL",
    target: normalizedConfig,
    policy: { maxPriceImpactPct: tolerance, source: "issuer-supplied" },
    quoteAsset,
    summary: { ...summary, points: points.length },
    points,
    firstPolicyFailure: null,
    firstCapacityFailure: explainedFirstCapacity,
    testedRange: { minSizeQuoteUnits: sizes[0], maxSizeQuoteUnits: sizes[sizes.length - 1] },
    explanation,
    guidance: "Quotes stop succeeding at every tested opening size because the curve reports insufficient capacity. Add early-curve liquidity or revise the configuration, then rerun this sweep.",
    evidence,
    replay: [...replay,
      { at: "T+marginal", label: "Marginal probe refused", expected: "baseline rate", observed: "SDK: Insufficient Liquidity" },
      { at: "T+verdict", label: "Curve unquotable", expected: `policy ${tolerance}%`, observed: explanation }]
  };
}

function buildSweepExplanation({ config, tolerance, sizes, summary, firstPolicyFailure, firstCapacityFailure, quoteAsset }) {
  const range = `from ${describeAmount(sizes[0], quoteAsset).primary} to ${describeAmount(sizes[sizes.length - 1], quoteAsset).primary}`;
  const parts = [`Tested ${sizes.length} hypothetical opening buys ${range} against ${config} at your ${tolerance}% policy.`];
  if (firstPolicyFailure) {
    const at = `${firstPolicyFailure.sizeDisplay || describeAmount(firstPolicyFailure.sizeQuoteUnits, quoteAsset).primary} (${formatRawUnits(firstPolicyFailure.sizeQuoteUnits)} quote units)`;
    const held = firstPolicyFailure.previousPassSizeQuoteUnits
      ? ` Policy still holds at ${firstPolicyFailure.previousPassSizeDisplay || describeAmount(firstPolicyFailure.previousPassSizeQuoteUnits, quoteAsset).primary}.`
      : "";
    parts.push(`First observed policy failure at ${at} (${firstPolicyFailure.observedImpactPct.toFixed(3)}% observed).${held}`);
  } else if (summary.failed === 0 && summary.passed > 0) {
    parts.push(`All ${summary.passed} quotable sizes stay within your ${tolerance}% policy.`);
  }
  if (firstCapacityFailure) {
    const at = `${firstCapacityFailure.sizeDisplay || describeAmount(firstCapacityFailure.sizeQuoteUnits, quoteAsset).primary} (${formatRawUnits(firstCapacityFailure.sizeQuoteUnits)} quote units)`;
    parts.push(`Quotes stop succeeding at ${at} (curve reports insufficient capacity).`);
  }
  if (summary.unable > 0) parts.push(`${summary.unable} point(s) could not be quoted for infrastructure reasons, reported as UNABLE, never as PASS or FAIL.`);
  return parts.join(" ");
}

function buildSweepGuidance({ tolerance, summary, firstPolicyFailure, firstCapacityFailure, quoteAsset }) {
  const lines = [];
  if (firstPolicyFailure) {
    const at = `${firstPolicyFailure.sizeDisplay || describeAmount(firstPolicyFailure.sizeQuoteUnits, quoteAsset).primary} (${formatRawUnits(firstPolicyFailure.sizeQuoteUnits)} quote units)`;
    lines.push(`Price impact crosses your configured ${tolerance}% policy beginning around ${at}. To move that boundary, adjust the curve or liquidity distribution around the expected opening price region and rerun this sweep.`);
  }
  if (firstCapacityFailure) {
    const at = `${firstCapacityFailure.sizeDisplay || describeAmount(firstCapacityFailure.sizeQuoteUnits, quoteAsset).primary} (${formatRawUnits(firstCapacityFailure.sizeQuoteUnits)} quote units)`;
    lines.push(`Quotes stop succeeding at ${at} because the curve reports insufficient capacity. Reduce the largest hypothetical opening size, add early-curve liquidity, or revise the migration-threshold economics, then rerun.`);
  }
  if (!firstPolicyFailure && !firstCapacityFailure && summary.passed > 0) {
    lines.push(`All tested sizes stay within your policy. Rerun with a tighter policy or larger sizes to probe further.`);
  }
  if (summary.unable > 0) lines.push(`UNABLE points reflect quoting infrastructure, not the curve. Retry them before treating the sweep as complete.`);
  return lines.join(" ");
}
