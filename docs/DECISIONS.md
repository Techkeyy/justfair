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

## Decision 007: White + Purple UI Restructure (Dashboard + App Experience)
* **Context:** Director Order 007 required evolving JustFair's visual language from the dark theme into a clean, minimalist white canvas with purple primary accents, split into a high-impact Dashboard/Landing surface and an Application Workspace surface, with semantic inline SVGs replacing all raw emojis.
* **Decision:**
  * Restructure visual identity around modern fintech minimalism: `#FFFFFF` / `#F8FAFC` base, `#4F46E5` / `#6366F1` purple primary accent, high-contrast `#0F172A` typography.
  * Structure experience into dual-surface architecture:
    * `#dashboard-view`: Hero headline with value proposition, "Why JustFair" 3 core value cards, "How It Works" 4-step sequence, and Developer REST API showcase.
    * `#app-view`: Pre-Trade Safety Inspector workspace with tokenized stock selector chips, payment tabs, non-custodial safety banner (`PREVIEW ONLY · NO FUNDS MOVED`), wallet/simulation drawer, locked 3-metric result card (`YOU'RE SPENDING`, `EXPECTED [STOCK] EXPOSURE`, `DIFFERENCE`), and expandable route evidence accordion.
  * Eliminate all raw emojis across HTML and dynamic JS scripts, substituting semantic inline SVG icons.
  * Enforce zero long dashes and accessible text floor (>=14px for product text) verified via `audit_ui_text.py`.
  * Expand Playwright automated browser suite to 7 assertions capturing visual evidence in `docs/evidence/ui/`.
  * Redeploy and verify live on Vercel production edge (`https://justfair-theta.vercel.app`).

## Decision 008: Multi-Issuer Product Preflight (FinePrint) & Underlying Architecture Lock
* **Context:** Director Order 010 and 010.1 established Product Preflight ("Does this tokenized stock give me what I think it gives me?"), corrected the Solana ecosystem reality check regarding Ondo Stocks, separated legal holder rights from on-chain technical states, and introduced the Underlying $\to$ Multiple Representations data architecture.
* **Decision:**
  * Two-layer product promise: *"KNOW WHAT YOU'RE BUYING. THEN CHECK THE FILL."* (Layer 1: Product Preflight / FinePrint; Layer 2: Execution Preflight).
  * Multi-Issuer Architecture: Structure catalog around underlying securities (e.g. `AAPL`), containing multiple verified representations (`AAPLx` by Backed Assets, `AAPLon` by Ondo Finance). Users pick the company first; FinePrint discovers representations without forcing ticker familiarity.
  * Second-Issuer Reality Check & Kill Gate:
    * **Previous Status:** `SUPERSEDED_INCORRECT` (Preliminary finding claimed single issuer).
    * **Corrected Status:** `PASS` (Official primary evidence from Ondo Finance and live Solana Mainnet RPC confirmed Ondo Stocks active under Program ID `XzTT4XB8m7sLD2xi6snefSasaswsKCxx5Tifjondogm` with 565 deployed factory slots and 38+ live Token-2022 mints).
  * Strict Fact Authority Separation:
    * Legal facts (direct equity ownership, voting rights, bankruptcy claim structure, KYC redemption) sourced strictly from official issuer prospectuses/documentation (Backed Assets & Ondo Global Markets). Never infer legal standing from on-chain tokens.
    * Technical on-chain facts verified via Solana RPC `getAccountInfo` on SPL Token-2022 program state.
  * Match Engine Multi-Result Model:
    * If multiple representations satisfy user requirements, emit `MULTIPLE_VERIFIED_MATCHES` and display the comparison matrix without picking an arbitrary single winner.
    * If exactly one satisfies requirements, emit `MATCHES_REQUIRED_EXPECTATIONS`.
    * If none satisfy requirements, emit `REQUIREMENT_MISMATCH`.
  * Execution Preflight Boundary: xStocks representations are immediately executable in JustFair's Swap V2 pipeline; Ondo Stocks representations are clearly marked `EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION` until dedicated DEX routing is integrated in Phase 12/17.

## Decision 009: AAPLon Exact Mint Resolution, Total Return Dividend Reality, & Trading Availability Model (Order 010.2)
* **Context:** Primary source resolution from Ondo's official repository (`ondoprotocol/gm-solana-simulator`) confirmed the exact mainnet mint for `AAPLon`. Further analysis of Ondo's documentation and on-chain Token-2022 configuration clarified the dividend mechanics and separated wallet transferability from trading session availability.
* **Decision:**
  * **AAPLon Exact Mint:** Sourced from official `constants.rs` (`https://github.com/ondoprotocol/gm-solana-simulator`). Exact Solana Mainnet Mint: `123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo`. Verified live on Solana Mainnet RPC (Decimals: 9, Owner: SPL Token-2022, Active Multiplier: `1.003376073740221`).
  * **Dividend Truth Model:** Net dividends for both xStocks (`AAPLx`) and Ondo Stocks (`AAPLon`) are automatically reinvested into the underlying collateral / token economics (Total Return) via SPL Token-2022 `scaledUiAmountConfig` multipliers. Neither tokenized stock product pays cash/stablecoins directly into user wallets. If a user requires cash dividend payouts (`CASH_DIVIDEND_PAYOUTS: true`), Product Preflight truthfully emits `REQUIREMENT_MISMATCH` for both representations.
  * **Trading Availability vs. Wallet Transferability:**
    * `wallet_transferability`: 24/7 on-chain transfers between un-paused / un-frozen Solana wallets.
    * `trading_availability`: Session-dependent execution (Core Session 09:30-16:00 ET, Extended Sessions, with weekend / off-hours trading subject to broker limits and dynamic spreads).
  * **Execution Preflight Boundary:** `AAPLx` is supported by existing Swap V2 route engine; `AAPLon` is clearly labeled `EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION`.

