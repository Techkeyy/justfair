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

## Decision 011: xStocks Issuer Truth, Distinct Redemption Models, & API Routing Integrity (Phase 12 / Order 011.1)
* **Context:** Director Order 011.1 corrected the current xStocks legal issuer identity, refined the redemption semantics to avoid over-generalizing xStocks eligibility, isolated Ondo redemption from xStocks, and verified server URL routing for colon-bearing product IDs.
* **Decision:**
  * **Current xStocks Issuer Identity:** Sourced from official [xStocks Product Legal Overview](https://docs.xstocks.fi/docs/product-legal-overview). Current legal issuer is **Backed Assets (JE) Limited** (a Jersey-based special purpose vehicle). Backed Assets GmbH in Switzerland / Liechtenstein operates as the Tokenization Service Provider.
    * **SUPERSEDED:** Current xStocks issuer represented as Backed Assets GmbH.
    * **REPLACED BY:** Backed Assets (JE) Limited (Jersey SPV) per current official Product Legal Overview.
  * **xStocks Redemption Semantics:** Direct primary issuance and redemption with Backed Assets (JE) Limited is available to eligible retail and institutional investors who complete issuer KYC onboarding and wallet whitelisting, with a \$5,000 minimum transaction size. Everyday retail traders exit on-chain via Solana DEX liquidity without KYC onboarding.
    * **SUPERSEDED:** Direct issuer redemption generalized as "Qualified/KYC investors only".
    * **REPLACED BY:** Issuer-specific redemption conditions (KYC required, wallet whitelisting required, \$5,000 minimum, retail eligible).
  * **Ondo Redemption Semantics:** Independently sourced from [Ondo Global Markets Documentation](https://docs.ondo.finance/ondo-stocks/onboarding-and-kyc). Direct primary redemption for cash/USDon requires platform KYC onboarding under Regulation S (strictly non-US persons). Everyday retail users exit via secondary solver and DEX routing without KYC.
  * **Collateral Protection Structure:** Modeled as `COLLATERAL_PROTECTION_STRUCTURE` preserving distinct legal realities:
    * *xStocks:* Bankruptcy-remote Jersey SPV (`Backed Assets (JE) Limited`) with asset-by-asset segregated custody pledged to a Security Trustee.
    * *Ondo:* Bankruptcy-remote BVI SPV (`Ondo Global Markets (BVI) Limited`) with collateral held at regulated custodial broker-dealer under a first-priority perfected security interest.
  * **Weekend Trading Semantics:** Modeled as `CONDITIONAL`, explicitly distinguishing on-chain technical transferability (24/7), venue availability, real liquidity presence, and off-hours market spreads/risk controls.
  * **API Route Disambiguation:** `/api/v1/products/compare/:symbol` is processed prior to generic `:productId` matches, preventing route collision. Product IDs containing colons (both raw `xstocks:aaplx:solana` and URL-encoded `xstocks%3Aaaplx%3Asolana`) decode and resolve deterministically.

## Decision 012: On-Chain Metadata Evidence Integrity & Independent Decoding (Phase 12 / Order 011.3)
* **Context:** Director Order 011.3 identified that previous machine-generated revalidation artifacts used `rep.metadataSymbol` and `rep.metadataName` to populate observed fields rather than independently decoding on-chain Token-2022 extensions.
* **Decision:**
  * **Strict Expected vs. Observed Separation:**
    * **SUPERSEDED:** Observed metadata fields populated from registry expected values.
    * **REPLACED BY:** Observed metadata (`observed_metadata_symbol`, `observed_metadata_name`, `observed_metadata_uri`, `observed_metadata_pointer`) is independently decoded directly from live SPL Token-2022 `tokenMetadata` (type 19) and `metadataPointer` (type 18) account extensions via RPC, or explicitly set to `null` / marked `METADATA_UNAVAILABLE`.
  * **Metadata Reason Codes Added:**
    * `METADATA_UNAVAILABLE`, `METADATA_DECODE_FAILURE`, `METADATA_POINTER_UNAVAILABLE`.
  * **Issuer-Specific Name Identity Validation:** `validateMetadataNameIdentity` ensures on-chain names match expected underlying security aliases without rejecting legitimate issuer-specific branding (e.g. `"Apple xStock"` for `AAPLx` or `"Apple (Ondo Tokenized)"` for `AAPLon`).
  * **Reproducible Revalidation Pipeline:** Created [`scripts/revalidate-product-registry.js`](file:///c:/Users/HomePC/desktop/JustFair/scripts/revalidate-product-registry.js) generating deterministic evidence at [`scratch/product_registry_revalidation.json`](file:///c:/Users/HomePC/desktop/JustFair/scratch/product_registry_revalidation.json) with 24/24 observable matches and 0 mismatches.

## Decision 013: Expectation Matcher Engine & Product Preflight Consumer API (Phase 13 / Order 012)
* **Context:** Director Order 012 establishes Phase 13, creating the deterministic Expectation Matcher engine and the `POST /api/v1/product-preflight` consumer API endpoint. Product Preflight evaluates user requirement profiles against verified product facts without subjective scores, rankings, or AI hallucinations.
* **Decision:**
  * **Two Preflight Modes:**
    1. `UNDERLYING_DISCOVERY` (Mode A): Takes an underlying symbol (e.g., `AAPL`) and user expectations, evaluates all registered representations (`AAPLx`, `AAPLon`), computes factual differences, and returns an overall underlying state.
    2. `SPECIFIC_PRODUCT_CHECK` (Mode B): Takes an exact product ID (e.g., `xstocks:aaplx:solana`) and evaluates ONLY that specific representation against user expectations in isolation, without injecting cross-product comparisons.
  * **10 Canonical Consumer Expectations:** `SELF_CUSTODY`, `DIRECT_SHARE_OWNERSHIP`, `ORDINARY_VOTING_RIGHTS`, `ECONOMIC_DIVIDEND_BENEFIT`, `CASH_DIVIDEND_PAYOUT`, `WALLET_TRANSFERABILITY`, `ONCHAIN_SECONDARY_TRADING`, `DIRECT_ISSUER_REDEMPTION`, `REDEMPTION_WITHOUT_KYC`, `WEEKEND_TRADING`.
  * **Expectation Priorities:** `REQUIRED`, `OPTIONAL`, `NOT_IMPORTANT`.
  * **Strict Deterministic States (No Percentage Scores or Rankings):**
    * *Expectation Level:* `MATCH`, `MISMATCH`, `CONDITIONAL`, `UNKNOWN`, `NOT_APPLICABLE`.
    * *Product Level:* `MATCH`, `MISMATCH`, `CONDITIONAL_MATCH`, `UNABLE_TO_VERIFY`.
    * *Underlying Level:* `MATCHES_REQUIRED_EXPECTATIONS`, `MULTIPLE_VERIFIED_MATCHES`, `CONDITIONAL_MATCHES`, `NO_VERIFIED_PRODUCT_MATCH`, `UNABLE_TO_VERIFY_PRODUCT`.
  * **Exact-Asset Verification Gate:** Products must be verified on Solana Token-2022 to receive `MATCH`. On-chain failure forces `UNABLE_TO_VERIFY`.
  * **Protective Consumer Guidance:** If a REQUIRED expectation mismatches, plain-language protective advice is generated (e.g., advising not to purchase if ordinary shareholder voting rights are required).
  * **Immutable Handoff Contract:** Valid matches export exact mint and metadata alongside `execution_preflight_support: "SUPPORTED"` (xStocks) or `"NOT_YET_SUPPORTED"` (Ondo).
  * **REST API:** `POST /api/v1/product-preflight` accepts both Mode A and Mode B JSON payloads with strict validation and standard error handling.

## Decision 015: Product Preflight Consumer UX & Non-Custodial Guided Flow (Phase 14 / Order 013)
* **Context:** Director Order 013 establishes Phase 14, turning the Product Preflight API engine into an intuitive 4-step consumer experience connecting Layer 1 (Product Preflight) with Layer 2 (Execution Preflight).
* **Decision:**
  * **Hero Split-White Canvas & Tagline:** Tagline established as *"Know what you're buying. Then check the fill."* with a "TWO CHECKS BEFORE YOU BUY" badge and "Two Mistakes" story section explaining (1) Right company / Wrong product vs. (2) Right product / Bad trade.
  * **Guided 4-Step User Journey:**
    1. *Step 1 — Choose Company:* 12 canonical underlyings (AAPL, NVDA, SPY, TSLA, MSFT, AMZN, GOOGL, META, COIN, AMD, MSTR, QQQ) with category filtering and instant search.
    2. *Step 2 — What Matters to You?:* 5 immediately visible primary expectations + 7 secondary checks in a collapsible accordion. Each card features toggles for `MUST HAVE` (Required) vs `NICE TO HAVE` (Optional) vs unselected.
    3. *Step 3 — See Verified Products:* Side-by-side representation cards rendered with equal prominence (e.g. `AAPLx` vs `AAPLon`), semantic SVG icons, plain-language explanations, "Verified on Solana" drawer with exact mint and copy button, Differences Matrix, "What happens if...?" scenarios accordion, and verified dividend safety callout.
    4. *Step 4 — Check the Trade:* User explicitly selects a representation (`AAPLx`) to hand off an immutable object to Layer 2 Execution Preflight ($500 USDC / SOL trade inspector). For unintegrated representations (`AAPLon`), an informational boundary button explicitly notes that Ondo GM trading pool integration is in progress without auto-switching.
  * **Strict State Isolation:** Changing company resets product results and handoffs; toggling expectations updates guidance dynamically without leaking state.
  * **Equal Prominence & Neutral Presentation:** Representations are presented side-by-side without subjective rankings or arbitrary scores.
  * **Automated Verification Battery:** 92/92 tests passing across unit, integration, streaming, and Playwright browser suites (11/11 browser test flows with screenshots captured in `docs/evidence/ui/`).
  * **Production Deployment:** Live on Vercel at `https://justfair-theta.vercel.app`.


