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
  * Implement documented ±15 minute (`900s`) corporate action safety window around multiplier transitions per xStocks integrator specs.
  * Require all verification prerequisites (fresh benchmark, simulation pass `err === null`, outside corporate action window) before emitting `VERIFIED`. Any prerequisite failure strictly returns `UNABLE_TO_VERIFY` with descriptive reason codes.

## Decision 005: xStocks V2 Benchmark Adapter, Source-Aware Market Context, & Gated Calibration
* **Context:** Integrator price data should leverage official `api.xstocks.fi/api/v2/public/assets/{SYMBOL}/price-data` while filtering internal DEX pool prices to isolate genuine underlying equity feeds (Nasdaq / Blue Ocean). Furthermore, provisional threshold percentages must not emit safety verdicts until regular tape calibration is complete.
* **Decision:**
  * Integrate xStocks V2 price-data adapter with fallback to direct Nasdaq tape feeds.
  * Implement source-aware session eligibility exposing structured `market_context` (REGULAR, PRE_MARKET, POST_MARKET, OVERNIGHT eligible; CLOSED/WEEKEND truthfully ineligible).
  * Enforce strict CoinGecko timestamp handling without manufacturing timestamps when upstream `last_updated_at` is absent.
  * Gate user-facing `FAIR`/`CAUTION`/`BAD_FILL` verdicts behind `THRESHOLD_CALIBRATION_STATUS === "COMPLETE"`, emitting `MEASURED` in production prior to tape calibration.
  * Migrate address validation to `@solana/kit` (`isAddress`) and remove legacy `@solana/web3.js`.
  * Add in-memory rate limiting (60 req/min), body limits (1MB), and fetch abort timeouts (7s) for public service resilience.

## Decision 006: Playwright Automated Visual Testing & Vercel Edge Serverless Deployment
* **Context:** A static configuration file (`vercel.json`) is insufficient proof of a live product. Comprehensive verification requires real browser rendering tests, automated visual screenshot capture, and public HTTPS edge serverless execution.
* **Decision:**
  * Implement headless Chromium browser testing via Playwright (`test/browser.test.js`), capturing full visual evidence for desktop and mobile viewports with zero horizontal overflow.
  * Implement unified HTTP handler in `src/server.js` and `api/index.js` supporting both streaming and pre-parsed bodies across local Node server and Vercel serverless functions.
  * Deploy unified production application to Vercel global edge network (`https://justfair-theta.vercel.app`).
  * Verify live production API endpoints (`/`, `/api/v1/health`, `/api/v1/stocks`, `/api/v1/preflight`) under both Quote Check and Exact Simulation modes.

