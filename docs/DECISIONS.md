# JustFair — Architecture & Engineering Decisions Log (DECISIONS.md)

## Decision 001: Asset Selection & Dynamic Multiplier Integration
* **Context:** Tokenized stocks on Solana (xStocks) use Token-2022 extensions where corporate actions / splits modify the multiplier over time. Hardcoded multipliers fail silently when corporate actions trigger.
* **Decision:** Dynamically resolve multiplier at runtime directly from the on-chain Token-2022 `scaledUiAmountConfig` extension using Solana RPC `getAccountInfo`.
* **Verification:** AAPLx active multiplier confirmed on-chain as `1.0026642075893797` with scheduled pending multiplier `1.0032690125398187`.

## Decision 002: Official Jupiter Swap API Architecture
* **Context:** `public.jupiterapi.com` was a temporary gateway and `quote-api.jup.ag` is deprecated.
* **Decision:** Migrate fully to official `https://api.jup.ag/swap/v1/quote` and `https://api.jup.ag/swap/v1/swap` with support for optional `JUPITER_API_KEY` header and client-side retry/backoff.

## Decision 003: Truthful Market Reference Labeling & Session Classification
* **Context:** Yahoo Finance is a market data aggregator, not the official Nasdaq primary feed.
* **Decision:** Label the source truthfully as `source_type: "MARKET_DATA_AGGREGATOR"`. Ingest Pyth market hours and compute canonical market session (`REGULAR`, `PRE_MARKET`, `POST_MARKET`, `OVERNIGHT`, `CLOSED`).

## Decision 004: Dual Simulation Architecture (Quote Precheck vs Exact Preflight)
* **Context:** A consumer product must allow users to inspect trade fairness before connecting a wallet, while also supporting exact on-chain simulation when a wallet is provided.
* **Decision:**
  * Mode A: **Quote Precheck** (no wallet required, calculates fair value from live DEX route, `simulation.status: "NOT_RUN"`).
  * Mode B: **Exact Preflight** (accepts arbitrary user public key, constructs VersionedTransaction, runs RPC `simulateTransaction`).
  * Strict simulation rule: `simulation.status === "PASS"` only if `result.value.err === null`. Any non-null error triggers `UNABLE_TO_VERIFY`.

## Decision 005: Deferred Verdict Thresholds
* **Context:** Hardcoding arbitrary FAIR/CAUTION/BAD_FILL percentage cutoffs without empirical market evidence violates research discipline.
* **Decision:** Emit raw financial metrics (`difference_usd`, `difference_pct`) with `verification_status: "VERIFIED" | "UNABLE_TO_VERIFY"`. Defer subjective threshold categorization to Phase 2.
