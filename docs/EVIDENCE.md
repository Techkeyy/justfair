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

## 7. White + Purple Modern UI Restructure & Live Deployment (Order 007)
* **Design Transformation:**
  * Base canvas upgraded to crisp `#FFFFFF` / `#F8FAFC` light neutral theme with `#4F46E5` / `#6366F1` primary purple accents.
  * Dual-view product architecture: `#dashboard-view` (landing surface with hero, 3 value proposition cards, 4-step sequence, and developer API card) and `#app-view` (pre-trade safety inspector workspace).
  * 100% elimination of raw emojis; all icons replaced with crisp, semantic inline SVGs.
  * Verified zero long dashes and accessible text floor (>=14px for product text) via `audit_ui_text.py`.
* **Playwright Automated Browser Proof (`test/browser.test.js`):**
  * **Test Summary:** 7/7 PASS (0 Failures)
  * **Visual Artifacts Captured (`docs/evidence/ui/`):**
    1. `01_dashboard_desktop.png` — Dashboard landing with hero headline, value cards, step-by-step sequence, and API banner.
    2. `02_app_desktop.png` — Clean application workspace with stock selectors, payment tabs, and non-custodial safety banner.
    3. `03_app_result.png` — Live trade result rendering locked 3-metric hierarchy (`YOU'RE SPENDING`, `EXPECTED [STOCK] EXPOSURE`, `DIFFERENCE`).
    4. `04_app_unable_to_verify.png` — Verdict state banner showing `CAN'T VERIFY RIGHT NOW` / `MEASURED` with semantic SVG icons.
    5. `05_app_simulation.png` — Exact simulation mode badge with Solana RPC simulation confirmation (`err: null`).
    6. `06_dashboard_mobile.png` — Dashboard landing on 375x812 mobile viewport with zero horizontal overflow.
    7. `07_app_mobile.png` — Application workspace on 375x812 mobile viewport with zero horizontal overflow.
* **Live Production Deployment:**
  * **Live Production URL:** `https://justfair-theta.vercel.app`
  * **Deployment Id:** `dpl_2GB5muwLGKFBzyex4uyWMzwMUfr6`
  * **Production Smoke Test (`test/smoke_prod.js`):**
    * `GET /` $\to$ HTTP 200 (Dashboard & App views verified, locked hierarchy verified, zero-risk claim false)
    * `GET /api/v1/health` $\to$ HTTP 200 (`HEALTHY`)
    * `GET /api/v1/stocks` $\to$ HTTP 200 (4 stocks)
    * `POST /api/v1/preflight` $\to$ HTTP 200 (`SUCCESS`, live route economics returned)

---

## 8. Multi-Issuer On-Chain Evidence & Product Preflight Suite (Phase 11 / Order 010.1)

### 8.1 Second-Issuer Reality Check & Historical Correction Record
* **Previous Preliminary Finding:** Single verified issuer (Backed Assets xStocks).
* **Current Status:** `SUPERSEDED_INCORRECT`
* **Correction Finding:** Primary evidence from official Ondo Finance documentation and live Solana Mainnet RPC accounts confirms **Ondo Stocks is officially live on Solana** as of January 2026.
* **Second-Issuer Kill Gate:** `PASS`

### 8.2 Live On-Chain Solana RPC Account Evidence for Ondo Global Markets
* **Program ID:** `XzTT4XB8m7sLD2xi6snefSasaswsKCxx5Tifjondogm` ([Solscan](https://solscan.io/account/XzTT4XB8m7sLD2xi6snefSasaswsKCxx5Tifjondogm))
* **Program Owner:** `BPFLoaderUpgradeab1e11111111111111111111111`
* **Total Program Accounts:** `2,842`
* **Token Factory Limit Accounts (115 bytes):** `565` deployed token slots
* **Live Token-2022 Mints on Solana:** `38+` verified active tokens including:
  * `NVDAon` (NVIDIA Ondo Tokenized): `gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo` (Decimals: 9)
  * `DELLon` (Dell Technologies Ondo Tokenized): `cFDP5SsUBeKrV1RkKHdaofHBSfRW8cBd7DiaPTSLAon` (Decimals: 9)
  * `ISRGon` (Intuitive Surgical Ondo Tokenized): `1MGRpPrkhEsCm2GCWD3rsvEU77xTTLAzfKXeFgFondo` (Decimals: 9)
  * `BABAon` (Alibaba Ondo Tokenized): `1zvb9ELBFShBCWKEk5jRTJAaPAwtVt7quEXx1X4ondo` (Decimals: 9)
  * `TSMon` (Taiwan Semiconductor Ondo Tokenized): `keybg184d4vyXeQdFqs4o99YsMg7xBthxTJ6Ky3ondo` (Decimals: 9)

#### 8.3 Exact AAPLon Solana Mint Resolution & Live Mainnet Account Dump
* **Primary Source:** Ondo Finance Official `ondoprotocol/gm-solana-simulator/constants.rs` ([GitHub Repository](https://github.com/ondoprotocol/gm-solana-simulator))
* **Target Security:** Apple Inc. Tokenized Stock (`AAPLon` by Ondo Finance)
* **Solana Mainnet Mint:** `123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo`
* **Token Program:** `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (SPL Token-2022)
* **Decimals:** `9`
* **Current Supply:** `365087714670` raw units (`365.087714670` base tokens)
* **Mint Authority:** `9foMHsSDq7nMg4WPusSz9eY7tyxyukqborA8GyU5cUxD`
* **Freeze Authority:** `51QVCuHfL1FeNjd8BDeffCKhCcAYoULnVB3yjNhShiuK`
* **`scaledUiAmountConfig` Multiplier:** `1.003376073740221` (New multiplier: `1.003376073740221`, Effective timestamp: `1788344044`)
* **Metadata Name:** `"Apple (Ondo Tokenized)"`
* **Metadata Symbol:** `"AAPLon"`
* **Metadata URI:** `"https://app.ondo.finance/api/v2/assets/AAPLon/sol_metadata.json"`
* **Token-2022 Extensions Present:**
  * `scaledUiAmountConfig` (Type 14)
  * `metadataPointer` (Type 18)
  * `pausableConfig` (Type 19)
  * `defaultAccountState` (Type 12, initialized)
  * `confidentialTransferMint` (Type 10)
  * `transferHook` (Type 14)
  * `tokenMetadata` (Type 19)

### 8.4 Backed Assets AAPLx Solana Mainnet Account Dump
* **Target Stock:** Apple Inc. Tokenized Stock (`AAPLx` by Backed Assets)
* **Solana Mainnet Mint:** `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`
* **Token Program:** `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (SPL Token-2022)
* **Decimals:** `8`
* **Mint Authority:** `7pt9tkctJPK7PPNQJ77GKg8ZffSF6QxoMiCFYHxrtaCj`
* **Freeze Authority:** `JDq14BWvqCRFNu1krb12bcRpbGtJZ1FLEakMw6FdxJNs`
* **`scaledUiAmountConfig` Multiplier:** `1.0032690125398187`
* **Extensions:** `scaledUiAmountConfig`, `permanentDelegate`, `pausableConfig`, `defaultAccountState: initialized`, `metadataPointer`, `tokenMetadata` (`https://xstocks-metadata.backed.fi/tokens/Solana/AAPLx/metadata.json`).

### 8.5 Product Preflight Multi-Issuer Test Suite (`test/product-preflight.test.js`)
* **Test Results:** 24/24 PASS (0 Failures)
* **Verified Test Cases:**
  1. `✔ 1. Registry: Underlying -> Multiple Representations for all 12 securities`
  2. `✔ 2. Exact xStocks Mint Verification across all 12 assets`
  3. `✔ 3. Exact Ondo Mint Verification across all 12 assets from official constants.rs`
  4. `✔ 4. Exact-Asset Verifier: Wrong Mint Rejection`
  5. `✔ 5. Exact-Asset Verifier: Wrong Token Program Rejection`
  6. `✔ 6. Exact-Asset Verifier: Decimals Mismatch Rejection`
  7. `✔ 7. Exact-Asset Verifier: Issuer-Specific Extensions Check`
  8. `✔ 8. Multiplier Model: Past effective timestamp resolves newMultiplier as active`
  9. `✔ 9. Multiplier Model: Future effective timestamp keeps current multiplier as active`
  10. `✔ 10. Multiplier Model: Default parity when multiplier is absent`
  11. `✔ 11. Legal Fact Inheritance: Issuer-level facts compose cleanly onto representation`
  12. `✔ 12. Fact Isolation: Facts from one issuer family never bleed into another`
  13. `✔ 13. UNKNOWN Preservation: Unmapped expectations return UNKNOWN without false coercion`
  14. `✔ 14. Execution Support Boundary: Explicitly marks xStocks as SUPPORTED and Ondo as NOT_YET_SUPPORTED`
  15. `✔ 15. Difference Engine: Cross-issuer comparison outputs factual differences without ranking`
  16. `✔ 16. Capability Normalization: Standard profiles match or mismatch deterministically`
  17. `✔ 17. Transferability & Trading Availability: Modeled as CONDITIONAL with clear context`
  18. `✔ 18. Reusable Dividend-Claim Safety Fact: Verified false claim requirement`
  19. `✔ 19. What-Happens-If Scenario Coverage: Complete data for DIVIDEND, STOCK_SPLIT, REDEMPTION`
  20. `✔ 20. Exact-Asset Verifier Live Check: Verifies live account against Solana Mainnet RPC`
  21. `✔ 21. REST API: GET /api/v1/products returns master catalog with 12 underlyings`
  22. `✔ 22. REST API: GET /api/v1/products/:productId returns detailed product card`
  23. `✔ 23. REST API: GET /api/v1/products/compare/AAPL returns cross-issuer differences`
  24. `✔ 24. REST API: GET /api/v1/products/:productId/verify executes live onchain check`

---

## 9. Phase 12 Live Solana Mainnet Verification Evidence (12 Underlyings, 24 Assets)

### 9.1 Live Mainnet Proof Matrix
All 24 token representations verified directly against Solana Mainnet Beta via RPC `getAccountInfo` (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`):

| Underlying | Asset | Solana Mainnet Mint | Decimals | Active Multiplier | Program Owner | On-Chain Verification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AAPL** | `AAPLx` | `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp` | 8 | `1.0032690125` | Token-2022 | `VERIFIED` |
| **AAPL** | `AAPLon` | `123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo` | 9 | `1.0033760737` | Token-2022 | `VERIFIED` |
| **NVDA** | `NVDAx` | `Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh` | 8 | `1.0009180758` | Token-2022 | `VERIFIED` |
| **NVDA** | `NVDAon` | `gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo` | 9 | `1.0017152488` | Token-2022 | `VERIFIED` |
| **SPY** | `SPYx` | `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W` | 8 | `1.0039092400` | Token-2022 | `VERIFIED` |
| **SPY** | `SPYon` | `k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo` | 9 | `1.0077209102` | Token-2022 | `VERIFIED` |
| **TSLA** | `TSLAx` | `XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB` | 8 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **TSLA** | `TSLAon` | `KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo` | 9 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **MSFT** | `MSFTx` | `XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX` | 8 | `1.0045820905` | Token-2022 | `VERIFIED` |
| **MSFT** | `MSFTon` | `FRmH6iRkMr33DLG6zVLR7EM4LojBFAuq6NtFzG6ondo` | 9 | `1.0057308569` | Token-2022 | `VERIFIED` |
| **AMZN** | `AMZNx` | `Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg` | 8 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **AMZN** | `AMZNon` | `14Tqdo8V1FhzKsE3W2pFsZCzYPQxxupXRcqw9jv6ondo` | 9 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **GOOGL** | `GOOGLx` | `XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN` | 8 | `1.0019267224` | Token-2022 | `VERIFIED` |
| **GOOGL** | `GOOGLon` | `bbahNA5vT9WJeYft8tALrH1LXWffjwqVoUbqYa1ondo` | 9 | `1.0024603266` | Token-2022 | `VERIFIED` |
| **META** | `METAx` | `Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu` | 8 | `1.0016490258` | Token-2022 | `VERIFIED` |
| **META** | `METAon` | `fDxs5y12E7x7jBwCKBXGqt71uJmCWsAQ3Srkte6ondo` | 9 | `1.0022791067` | Token-2022 | `VERIFIED` |
| **COIN** | `COINx` | `Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu` | 8 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **COIN** | `COINon` | `5u6KDiNJXxX4rGMfYT4BApZQC5CuDNrG6MHkwp1ondo` | 9 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **AMD** | `AMDx` | `XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF` | 8 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **AMD** | `AMDon` | `14diAn5z8kjrKwSC8WLqvBqqe5YmihJhjxRxd8Z6ondo` | 9 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **MSTR** | `MSTRx` | `XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ` | 8 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **MSTR** | `MSTRon` | `FSz4ouiqXpHuGPcpacZfTzbMjScoj5FfzHkiyu2ondo` | 9 | `1.0000000000` | Token-2022 | `VERIFIED` |
| **QQQ** | `QQQx` | `Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ` | 8 | `1.0019546534` | Token-2022 | `VERIFIED` |
| **QQQ** | `QQQon` | `HrYNm6jTQ71LoFphjVKBTdAE4uja7WsmLG8VxB8ondo` | 9 | `1.0033528542` | Token-2022 | `VERIFIED` |

---

## 10. Phase 13 Expectation Matcher Engine & Consumer API Test Proofs (Order 012)

### 10.1 Automated Test Execution
* **Test Suite:** `test/product-preflight.test.js`
* **Total Tests:** 45 / 45 PASS (0 Failures)
* **Execution Time:** ~1.6s

### 10.2 Profile Acceptance Proofs
| Profile ID | Description | User Expectations | Overall Underlying Result | Product Results | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Profile A** | Self-Custody & Dividends | `SELF_CUSTODY` (REQ), `ECONOMIC_DIVIDEND_BENEFIT` (REQ) | `MULTIPLE_VERIFIED_MATCHES` | `AAPLx`: MATCH<br>`AAPLon`: MATCH | Both issuers pass on-chain verification & capability matching. |
| **Profile B** | Corporate Voting Rights | `ORDINARY_VOTING_RIGHTS` (REQ) | `NO_VERIFIED_PRODUCT_MATCH` | `AAPLx`: MISMATCH<br>`AAPLon`: MISMATCH | Truthfully prevents users from buying tokenized equity expecting voting shares. |
| **Profile C** | Cash Dividend Payouts | `CASH_DIVIDEND_PAYOUT` (REQ) | `NO_VERIFIED_PRODUCT_MATCH` | `AAPLx`: MISMATCH<br>`AAPLon`: MISMATCH | Neither issuer pays cash dividends directly into user wallets. |
| **Profile D** | Self-Custody + Cash Div (Opt) | `SELF_CUSTODY` (REQ), `CASH_DIVIDEND_PAYOUT` (OPT) | `MULTIPLE_VERIFIED_MATCHES` | `AAPLx`: MATCH (Warning)<br>`AAPLon`: MATCH (Warning) | Optional preference mismatch generates clear warning without disqualifying match. |
| **Profile E** | Direct Issuer Redemption | `DIRECT_ISSUER_REDEMPTION` (REQ) | `CONDITIONAL_MATCHES` | `AAPLx`: CONDITIONAL<br>`AAPLon`: CONDITIONAL | Direct redemption requires issuer KYC, whitelisting, and min sizes ($5,000 / Reg S). |
| **Profile F** | Anonymous Redemption | `REDEMPTION_WITHOUT_KYC` (REQ) | `NO_VERIFIED_PRODUCT_MATCH` | `AAPLx`: MISMATCH<br>`AAPLon`: MISMATCH | Direct issuer redemption without KYC is impossible under current regulatory frameworks. |
| **Profile G** | In-Kind Share Redemption | `IN_KIND_SHARE_REDEMPTION` (REQ) | `CONDITIONAL_MATCHES` | `AAPLx`: CONDITIONAL<br>`AAPLon`: MISMATCH | AAPLx supports in-kind share conversion via xPort/Alpaca onboarding; Ondo settles in cash/USDon under Reg S. |

### 10.3 Mode B Specific Product Check Proof
* **Input Payload:** `mode: "SPECIFIC_PRODUCT_CHECK"`, `product_id: "xstocks:aaplx:solana"`, `expectations: [{ key: "ORDINARY_VOTING_RIGHTS", priority: "REQUIRED" }]`
* **Result:** `overall_result: "MISMATCH"`
* **Isolation Guarantee:** Output contains ONLY evaluation for `xstocks:aaplx:solana`, with zero cross-product comparisons or third-party product data injected.

---

## 11. Production Deployment & Live Verification Proofs (Order 012.1)

### 11.1 Deployment Artifacts
* **Target URL:** `https://justfair-theta.vercel.app`
* **Deployment URL:** `https://justfair-1l6ug5exo-techkeyys-projects.vercel.app`
* **Deployment ID:** `dpl_9zn4v81WHsha9v5DUFVbBz1jYK85`
* **Ready State:** `READY`

### 11.2 Live HTTP Smoke Test Proofs
* `[1] GET /api/v1/health` -> HTTP 200 (`status: "HEALTHY"`)
* `[2] POST /api/v1/product-preflight` (Profile A: AAPL) -> HTTP 200 (`MULTIPLE_VERIFIED_MATCHES`, AAPLx: MATCH, AAPLon: MATCH)
* `[3] POST /api/v1/product-preflight` (Profile B: AAPL) -> HTTP 200 (`NO_VERIFIED_PRODUCT_MATCH`)
* `[4] POST /api/v1/product-preflight` (Profile C: AAPL) -> HTTP 200 (`NO_VERIFIED_PRODUCT_MATCH`)
* `[5] POST /api/v1/product-preflight` (Profile E: AAPL) -> HTTP 200 (`CONDITIONAL_MATCHES`)
* `[6] POST /api/v1/product-preflight` (Profile G: AAPL) -> HTTP 200 (`CONDITIONAL_MATCHES`, AAPLx: CONDITIONAL_MATCH, AAPLon: MISMATCH)
* `[7] POST /api/v1/product-preflight` (Mode B: `xstocks:aaplx:solana` with Voting) -> HTTP 200 (`MISMATCH`, Mint: `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`, zero cross-product injection)
* `[8] POST /api/v1/product-preflight` (Validation Suite) -> HTTP 400 for unknown ticker, unknown product ID, unknown expectation, duplicate keys, invalid priority, and mode ambiguity.
* `[9] Route Regression` -> `GET /api/v1/products` (12 underlyings, 24 products), `GET /api/v1/products/compare/AAPL` (HTTP 200), `POST /api/v1/preflight` (HTTP 200).

