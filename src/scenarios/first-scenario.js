// JustFair First Scenario: STALE_CARRIED_FORWARD_EQUITY (Phase 1)
// Proves Pyth is load-bearing: carried-forward detection uses official Pyth
// Pro availability semantics (feedUpdateTimestamp vs timestampUs).
//
// Evidence classification: SIMULATED — a deterministic fixture modeled on
// documented Pyth Pro field semantics, NOT a live Pyth response. Labeled as
// such in the result. Live Pyth evidence plugs in via src/scenarios/pyth.js
// once a Pro credential exists (owner action, DIRECTOR.md).

import { interpretPythUpdate, PYTH_SYMBOLS } from "./pyth.js";

// Fixture: Wednesday 2026-09-16, underlying market closed (overnight).
// Reference was generated at the previous close; consumption happens later.
// Timestamps in microseconds (Pyth convention).
const CONSUMED_AT_US = 1789449600000000; // 2026-09-16T08:00:00Z
const GENERATED_AT_US = 1789423800000000; // 2026-09-16T00:50:00Z (prior session)

const PYTH_SHAPED_UPDATE = {
  symbol: PYTH_SYMBOLS.AAPL_EQUITY,
  price: 329.29,
  timestampUs: CONSUMED_AT_US,
  feedUpdateTimestamp: GENERATED_AT_US,
  marketSession: "overnight"
};

const interpreted = interpretPythUpdate(PYTH_SHAPED_UPDATE);

export const STALE_CARRIED_FORWARD_EQUITY = {
  id: "STALE_CARRIED_FORWARD_EQUITY",
  title: "Carried-forward equity price must not be shown as live",
  category: "MARKET_DATA",
  version: "1",
  requiresCapabilities: ["underlying_price_display"],
  inputs: {
    symbol: "AAPL",
    referencePrice: PYTH_SHAPED_UPDATE.price,
    referenceGeneratedAtUs: GENERATED_AT_US,
    consumedAtUs: CONSUMED_AT_US,
    liveSession: "overnight",
    note: "The only underlying reference available was generated earlier; the live session has no fresh aggregate."
  },
  evidence: {
    classification: "simulated",
    source: "Pyth Pro field semantics (docs.pyth.network: carried-forward when feedUpdateTimestamp differs from timestampUs)",
    provenance: "deterministic fixture modeling Equity.US.AAPL/USD availability behavior; NOT a live Pyth response",
    pythShapedUpdate: PYTH_SHAPED_UPDATE,
    interpreted
  },
  assertions: [
    {
      id: "no-live-claim",
      expected: "A carried-forward underlying reference must not be presented as a fresh live underlying price",
      check: ({ observations }) => ({
        passed: observations && observations.claimsLive === false,
        actual: observations ? { claimsLive: observations.claimsLive ?? null, label: observations.label ?? null } : null
      })
    },
    {
      id: "no-invented-price",
      expected: "The displayed underlying price equals the supplied reference price",
      check: ({ inputs, observations }) => {
        const shown = observations ? Number(observations.displayedPrice) : NaN;
        return { passed: shown === inputs.referencePrice, actual: { displayedPrice: observations?.displayedPrice ?? null } };
      }
    }
  ],
  diagnose: (failed) => {
    if (failed.id === "no-live-claim") {
      return {
        failureCode: "STALE_REFERENCE_TREATED_AS_LIVE",
        rootCause: "The target labeled a carried-forward underlying price as fresh.",
        guidance: "Check source freshness/session state (feed generation time vs consumption time) before presenting the underlying value as a live reference."
      };
    }
    return {
      failureCode: "INVENTED_OBSERVATION",
      rootCause: "The target displayed a price different from the supplied reference.",
      guidance: "Display the reference value actually received from the source; never substitute an unrelated number."
    };
  }
};
