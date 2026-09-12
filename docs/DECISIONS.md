# JustFair — Architecture & Engineering Decisions Log (DECISIONS.md)

## Decision 001: Asset Selection & Dynamic Effective Multiplier Resolution
* **Context:** Tokenized stocks on Solana (xStocks) use Token-2022 `scaledUiAmountConfig` with `multiplier`, `newMultiplier`, and `newMultiplierEffectiveTimestamp`.
* **Decision:** Implement exact Solana Scaled UI Amount semantics:
  `IF currentUnixTimestamp >= newMultiplierEffectiveTimestamp: currentMultiplier = newMultiplier; ELSE: currentMultiplier = multiplier;`
* **Verification:** AAPLx active effective multiplier confirmed as `1.0032690125398187` because effective timestamp `1786149000` (Aug 2026) has passed for current build date (Sept 2026).

## Decision 002: Official Jupiter Swap V2 Migration
* **Context:** Jupiter Swap V1 / Metis is deprecated and superseded by Swap V2.
* **Decision:** Migrate production pipeline to `https://api.jup.ag/swap/v2/order`.
  * Quote Precheck: Call without `taker` parameter $\to$ receives quote/route economics with `transaction: null`.
  * Exact Preflight: Call with `taker=<userPublicKey>` $\to$ receives assembled VersionedTransaction for RPC simulation.
  * No `/execute` call exists anywhere in the codebase.

## Decision 003: Production Benchmark via Official Nasdaq Quote API
* **Context:** We require an independent, authoritative market reference without relying on unofficial data scrapers.
* **Decision:** Connect directly to `https://api.nasdaq.com/api/quote/${symbol}/info` (assetclass `stocks` or `etf`), providing official real-time tape quotes, bid/ask spreads, and trade timestamps.

## Decision 004: Corporate Action Safety Window & Stale Data Gating
* **Context:** Multiplier transitions and after-hours/stale market sessions create pricing ambiguity.
* **Decision:**
  * Implement ±2 hour (`7200s`) corporate action safety window around multiplier transitions.
  * Require all verification prerequisites (fresh benchmark, simulation pass `err === null`, outside corporate action window) before emitting `VERIFIED`. Any prerequisite failure strictly returns `UNABLE_TO_VERIFY` with descriptive reason codes.
