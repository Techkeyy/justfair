# JustFair — Real Execution Evidence & Proof of Chain (Order 003 Corrected)

This document contains live, unedited verification evidence from Solana Mainnet, Official Jupiter Swap V2 (`api.jup.ag/swap/v2/order`), and Official Nasdaq API (`api.nasdaq.com`).

---

## 1. Verified Asset & On-Chain Dynamic Effective Multiplier
* **Target Stock:** Apple Inc. Tokenized Stock (`AAPLx`)
* **Solana Mainnet Mint:** `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`
* **Token Program:** `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (Solana Token Extensions / Token-2022)
* **Decimals:** `8` (`10^8`)
* **Stored Multiplier:** `1.0026642075893797`
* **New Multiplier:** `1.0032690125398187`
* **New Multiplier Effective Timestamp:** `1786149000` (August 8, 2026, 00:30:00 UTC)
* **Current Unix Timestamp:** `1789177611` (September 12, 2026)
* **Current Effective Multiplier:** `1.0032690125398187`
* **Reasoning:** `newMultiplier effective timestamp (1786149000) has passed`
* **Corporate Action Safety Window:** `false` (Current time is well outside the ±2 hour activation transition)
* **Multiplier Source:** Solana Token-2022 `scaledUiAmountConfig` on-chain state via RPC `getAccountInfo`

---

## 2. Real Execution Run: USDC → AAPLx (Exact Preflight Mode via Jupiter Swap V2)
* **API Endpoint:** `https://api.jup.ag/swap/v2/order` (Swap V2)
* **Input Raw Amount:** `500000000` (500.00 USDC)
* **Input USD Value:** `$500.00`
* **Output Raw Amount:** `149679075` base units
* **Expected Stock Shares:** `1.501684 AAPL`
* **Benchmark Source:** `Nasdaq Official Public Equity Quote API (api.nasdaq.com)`
* **Benchmark Price:** `$332.58 / share`
* **Benchmark Timestamp:** `2026-09-12T00:46:51.809Z`
* **Reference Session:** `OVERNIGHT`
* **Current Market Session:** `OVERNIGHT`
* **Freshness Status:** `AFTER_HOURS_CLOSE`
* **Expected Stock Exposure:** `1.501684 * $332.58 = $499.43`
* **Dollar Difference:** `-$0.57`
* **Percentage Difference:** `-0.11%`
* **DEX Route:** Whirlpool $\to$ Raydium CLMM (Router: `metis`, Price Impact: `-0.001%`)
* **Transaction Construction:**
  * **Status:** Assembled VersionedTransaction Base64 in `orderData.transaction` (length: 776 chars)
* **Solana RPC Simulation:**
  * **Endpoint:** `https://api.mainnet-beta.solana.com` (`simulateTransaction`)
  * **Simulation Mode:** `EXACT_PREFLIGHT`
  * **Simulation Status:** `PASS`
  * **Exact `err` Field:** `null`
  * **Units Consumed:** `128,222 compute units`
  * **Logs Count:** `60 log traces`
* **Verification Status:** `UNABLE_TO_VERIFY` (Reason: `MARKET_CLOSED_OR_AFTER_HOURS` — truthfully blocks verified status during overnight market close)

---

## 3. Real Execution Run: SOL → AAPLx (Quote Precheck Mode via Jupiter Swap V2)
* **API Endpoint:** `https://api.jup.ag/swap/v2/order`
* **Input Raw Amount:** `2000000000` (2.000000000 SOL)
* **SOL Reference Price:** `$102.10 / SOL`
* **Total Spend Value:** `2 * $102.10 = $204.20`
* **Output Raw Amount:** `61151516` base units
* **Expected Stock Shares:** `0.613514 AAPL`
* **Benchmark Price:** `$332.58 / share`
* **Expected Stock Exposure:** `0.613514 * $332.58 = $204.04`
* **Dollar Difference:** `-$0.16`
* **Percentage Difference:** `-0.08%`
* **DEX Route:** JupiterZ
* **Simulation Mode:** `QUOTE_PRECHECK` (No wallet required)
* **Simulation Status:** `NOT_RUN` (`err: null`)
* **Verification Status:** `UNABLE_TO_VERIFY` (Reason: `MARKET_CLOSED_OR_AFTER_HOURS`)

---

## 4. Real Execution Run: Order 005 xStocks V2 & Consumer UI Integration Proof
* **xStocks API Probe:** `https://api.xstocks.fi/api/v2/public/assets/AAPLx/price-data` (Returned `{ quote: null }` during weekend market close, confirming truthful fallback to Nasdaq close tape).
* **Source-Aware Market Context:**
  * `session`: `CLOSED`
  * `underlying_reference_available`: `true`
  * `underlying_reference_provider`: `Nasdaq Real-Time Stock Market Tape`
  * `reference_eligibility`: `INELIGIBLE_CLOSED`
* **Consumer UI Endpoints Verified:**
  * `GET /` (HTTP 200, full responsive consumer HTML layout)
  * `GET /styles.css` (HTTP 200, zero design-skill audit warnings)
  * `GET /app.js` (HTTP 200, zero custody, zero transaction broadcast)
  * `POST /api/v1/preflight` (Quote check & Exact simulation modes)
* **Zero-Custody Guarantee:** Verified 0 occurrences of `/execute`, `sendTransaction`, private key inputs, or signature requests in repository.

---

## 5. Real Browser Proof: Playwright Visual Test Suite (Order 006)
* **Test Runner:** Playwright Chromium Headless (`test/browser.test.js`)
* **Test Results:** 6/6 PASS (0 Failures)
* **Visual Artifacts Captured (`docs/evidence/ui/`):**
  1. `01_initial_page.png` — Hero banner, default AAPLx/USDC inputs, zero-jargon headline, non-custodial safety assurance.
  2. `02_aaplx_usdc_result.png` — Big 3 plain-money metric tiles ($ Spend, Expected Shares, Cost per Share), MEASURED status banner.
  3. `03_market_closed_measured_result.png` — Truthful market session indicator (CLOSED/WEEKEND) and benchmark freshness.
  4. `04_expanded_trade_details.png` — Technical disclosure accordion showing Token-2022 multiplier, Jupiter V2 order latency, and DEX steps.
  5. `05_exact_simulation_result.png` — Exact simulation mode badge with Solana RPC simulation confirmation (`err: null`, 77,731 CUs).
  6. `06_failure_state.png` — Human-actionable error card for invalid amount input.
  7. `07_mobile_viewport.png` — Clean 375x812 iPhone viewport with zero horizontal overflow.

---

## 6. Live Production Deployment Proof (Order 006)
* **Live Production URL:** `https://justfair-theta.vercel.app`
* **Deployment Id:** `dpl_Nkn7iTNq9eo1wT92fcc56nW42TN1`
* **Target Environment:** Production (Vercel Global Edge Network)
* **Live Production Smoke Test Results:**
  * `GET /` $\to$ HTTP 200 (Complete responsive frontend application loaded)
  * `GET /api/v1/health` $\to$ HTTP 200 (`{"status":"HEALTHY","service":"JustFair Equity Preflight API","version":"1.0.0"}`)
  * `GET /api/v1/stocks` $\to$ HTTP 200 (4 tokenized stocks, 2 payment assets)
  * `POST /api/v1/preflight` (Quote Check: AAPLx + USDC) $\to$ HTTP 200 (Live Jupiter V2 route calculation, Token-2022 dynamic multiplier calculation, truthful market context)
  * `POST /api/v1/preflight` (Quote Check: NVDAx + SOL) $\to$ HTTP 200 (Live SOL-denominated quote routing)
  * `POST /api/v1/preflight` (Exact Simulation) $\to$ HTTP 200 (Solana RPC transaction simulation `status: PASS`, `err: null`, `units_consumed: 77731`)
  * `POST /api/v1/preflight` (Error Handling) $\to$ HTTP 400 (`reason_codes: ["INVALID_AMOUNT"]`)

