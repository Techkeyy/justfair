// JustFair Scenario #2: PRESTOCKS_EXPIRY_DEADLINE_HANDLING (Phase 2)
// Official source: PreStocks SpaceX product page (https://prestocks.com/spacex):
// "SpaceX has gone public! SpaceX PreStocks tokens must be swapped into
// $SPCXx or any other token before 11:59pm UTC on 12 March 2027, or they
// will expire worthless."
//
// This is PAGE-LEVEL AUTHORITATIVE CONTENT, not a live lifecycle API.
// Evidence classification is therefore AUTHORITATIVE_EVENT_FIXTURE —
// never LIVE API DATA. Deterministic injected timestamps drive the
// before / near / after states (no waiting until 2027).

export const PRESTOCKS_SOURCE_URL = "https://prestocks.com/spacex";
export const PRESTOCKS_CAPTURED_AT = "2026-09-16T09:00:00Z";
export const PRESTOCKS_DEADLINE_ISO = "2027-03-12T23:59:00Z";
export const PRESTOCKS_DEADLINE_US = Date.parse(PRESTOCKS_DEADLINE_ISO) * 1000;

// Deterministic evaluation moments (microseconds, unix).
export const PRESTOCKS_EVAL_BEFORE_US = Date.parse("2027-01-01T00:00:00Z") * 1000;
export const PRESTOCKS_EVAL_NEAR_US = Date.parse("2027-03-12T23:00:00Z") * 1000; // 59 min before
export const PRESTOCKS_EVAL_AFTER_US = Date.parse("2027-03-13T00:00:00Z") * 1000; // 1 min after

const BASE_EVIDENCE = {
  classification: "authoritative_event_fixture",
  source: "PRESTOCKS_OFFICIAL_PRODUCT_PAGE",
  source_url: PRESTOCKS_SOURCE_URL,
  captured_at: PRESTOCKS_CAPTURED_AT,
  event_type: "IPO_TRANSITION / CONVERSION_DEADLINE",
  event: "SpaceX has gone public; SpaceX PreStocks must be swapped into $SPCXx or another token before the deadline or expire worthless",
  deadline_iso: PRESTOCKS_DEADLINE_ISO,
  deadline_us: PRESTOCKS_DEADLINE_US,
  provenance: "official PreStocks product page text captured in Phase 2; NOT a live lifecycle API response"
};

function baseInputs(evaluatedAtUs) {
  return {
    symbol: "SPACEX",
    representation: "SpaceX PreStocks",
    convertInto: "$SPCXx or any other token",
    expiryOutcome: "expire worthless",
    deadlineUs: PRESTOCKS_DEADLINE_US,
    evaluatedAtUs
  };
}

function diagnoseLifecycle(failed, phase) {
  if (failed.id === "expired-marked") {
    return {
      failureCode: "EXPIRED_REPRESENTATION_TREATED_AS_LIVE",
      rootCause: "The target presents a post-deadline representation as an ordinary live holding.",
      guidance: "After a confirmed conversion/expiry deadline, mark the representation expired or transitioned and stop ordinary current valuation."
    };
  }
  if (failed.id === "no-ordinary-valuation") {
    return {
      failureCode: "EXPIRED_REPRESENTATION_TREATED_AS_LIVE",
      rootCause: "The target keeps ordinary valuation semantics for an expired representation.",
      guidance: "Gate current valuation on lifecycle state: expired representations must not carry a normal live value."
    };
  }
  return {
    failureCode: "LIFECYCLE_EVENT_IGNORED",
    rootCause: `The target does not surface the confirmed conversion requirement (${phase} deadline).`,
    guidance: "Preserve authoritative lifecycle state (conversion required + deadline) on the position before the deadline passes."
  };
}

function preDeadlineAssertions() {
  return [
    {
      id: "conversion-required-surfaced",
      expected: "The confirmed conversion requirement is surfaced on the position",
      check: ({ observations }) => ({
        passed: observations && observations.conversionRequired === true,
        actual: observations ? { conversionRequired: observations.conversionRequired ?? null } : null
      })
    },
    {
      id: "deadline-matches",
      expected: "The surfaced deadline equals the authoritative deadline",
      check: ({ inputs, observations }) => {
        const shown = observations ? Number(observations.deadlineUs) : NaN;
        return { passed: shown === inputs.deadlineUs, actual: { deadlineUs: observations?.deadlineUs ?? null } };
      }
    }
  ];
}

function postDeadlineAssertions() {
  return [
    {
      id: "expired-marked",
      expected: "The post-deadline representation is marked expired or transitioned",
      check: ({ observations }) => ({
        passed: observations && observations.expired === true,
        actual: observations ? { expired: observations.expired ?? null, label: observations.label ?? null } : null
      })
    },
    {
      id: "no-ordinary-valuation",
      expected: "No ordinary current valuation is presented for the expired representation",
      check: ({ observations }) => ({
        passed: observations && observations.ordinaryValuation === false,
        actual: observations ? { ordinaryValuation: observations.ordinaryValuation ?? null } : null
      })
    }
  ];
}

function buildVariant({ id, title, evaluatedAtUs, assertions, phase }) {
  return {
    id,
    title,
    category: "CORPORATE_ACTIONS",
    version: "1",
    requiresCapabilities: ["lifecycle_position_state"],
    inputs: baseInputs(evaluatedAtUs),
    evidence: { ...BASE_EVIDENCE },
    assertions,
    diagnose: (failed) => diagnoseLifecycle(failed, phase)
  };
}

export const PRESTOCKS_EXPIRY_BEFORE = buildVariant({
  id: "PRESTOCKS_EXPIRY_BEFORE",
  title: "Pre-deadline position preserves the conversion requirement",
  evaluatedAtUs: PRESTOCKS_EVAL_BEFORE_US,
  assertions: preDeadlineAssertions(),
  phase: "before the"
});

export const PRESTOCKS_EXPIRY_NEAR = buildVariant({
  id: "PRESTOCKS_EXPIRY_NEAR",
  title: "Near-deadline position still surfaces the conversion requirement",
  evaluatedAtUs: PRESTOCKS_EVAL_NEAR_US,
  assertions: preDeadlineAssertions(),
  phase: "near the"
});

export const PRESTOCKS_EXPIRY_AFTER = buildVariant({
  id: "PRESTOCKS_EXPIRY_AFTER",
  title: "Post-deadline representation is not treated as an ordinary live holding",
  evaluatedAtUs: PRESTOCKS_EVAL_AFTER_US,
  assertions: postDeadlineAssertions(),
  phase: "after the"
});

/**
 * Fetch current official PreStocks listing data (liveness check only).
 * Lifecycle truth stays in the authoritative fixture; this reports whether
 * the listing API is currently reachable and what it says — truthfully.
 */
export async function fetchPrestocksListing({ timeoutMs = 10000 } = {}) {
  const url = "https://prestocks.com/api/prestocks";
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return { reachable: false, httpStatus: res.status };
    const list = await res.json();
    if (!Array.isArray(list)) return { reachable: true, shape: "unexpected" };
    const spacex = list.find(p => p && p.symbol === "SPACEX") || null;
    return {
      reachable: true,
      productCount: list.length,
      spacex: spacex ? {
        symbol: spacex.symbol,
        contract_address: spacex.contract_address || null,
        tokenPrice: spacex.tokenPrice ?? null,
        markPrice: spacex.markPrice ?? null,
        impliedValuation: spacex.impliedValuation ?? null,
        supply: spacex.supply ?? null
      } : null
    };
  } catch (err) {
    return { reachable: false, error: err.message };
  }
}
