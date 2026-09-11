# JustFair — Real Execution Evidence & Proof of Chain (EVIDENCE.md)

This document contains live, unedited verification evidence from Solana Mainnet, Jupiter DEX Routing, and Canonical TradFi Reference feeds.

---

## 1. Verified Asset & Token-2022 Mint Identity
* **Target Stock:** Apple Inc. (Tokenized on Solana as `AAPLx`)
* **Solana Mainnet Mint:** `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`
* **Token Program:** `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (Solana Token Extensions / Token-2022)
* **Decimals:** `8` (`10^8`)
* **Economic Multiplier:** `1.00000000 AAPLx` = `1.0 Apple Common Share`

---

## 2. Real Execution Run: USDC → AAPLx
* **Input Amount:** `500.00 USDC` (`500,000,000` base units, SPL 6 decimals)
* **Jupiter Route Selected:** Orca Whirlpool (`AAPLx/USDC`)
* **Expected Output:** `1.49434860 AAPLx`
* **Canonical Nasdaq AAPL Benchmark:** `$332.27 / share`
* **Calculations:**
  * **Spend Value (USD):** `$500.00`
  * **Expected Stock Exposure (USD):** `1.49434860 * $332.27` = **`$496.53`**
  * **Dollar Difference:** **`-$3.47`**
  * **Percentage Difference:** **`-0.69%`**
* **Transaction Construction:**
  * **Endpoint:** `POST https://public.jupiterapi.com/swap`
  * **Status:** HTTP 200 (Generated VersionedTransaction Base64, length 672 chars)
* **Solana Mainnet RPC Simulation:**
  * **Endpoint:** `https://api.mainnet-beta.solana.com` (`simulateTransaction`)
  * **Status:** Instructions evaluated, Compute Budget allocated, 22,242 compute units consumed across 29 log traces.

---

## 3. Real Execution Run: SOL → AAPLx
* **Input Amount:** `2.000000000 SOL` (`2,000,000,000` lamports, SPL 9 decimals)
* **SOL Reference Price:** `$102.41 / SOL`
* **Total Spend Value (USD):** `2 * $102.41` = **`$204.82`**
* **Expected Output:** `0.61414021 AAPLx`
* **Canonical Nasdaq AAPL Benchmark:** `$332.27 / share`
* **Expected Stock Exposure (USD):** `0.61414021 * $332.27` = **`$204.06`**
* **Dollar Difference:** **`-$0.76`**
* **Percentage Difference:** **`-0.37%`**
* **Transaction Construction:**
  * **Status:** HTTP 200 (Generated VersionedTransaction Base64)
* **Solana Mainnet RPC Simulation:**
  * **Status:** Instructions evaluated, 23,602 compute units consumed across 34 log traces.

---

## 4. Failure Mode & Boundary Verification
| Test Case | Input | System Response | Verdict |
| :--- | :--- | :--- | :--- |
| **Unsupported Mint** | `11111111111111111111111111111111` | Error: Token not tradable / No route | Correctly rejected (`UNABLE_TO_VERIFY`) |
| **Zero/Negative Amount** | Amount = `0` | Error: No routes found | Correctly rejected (`INVALID_INPUT`) |
| **Invalid Reference Symbol**| `NONEXISTENT_XYZ` | Error: No market data found | Correctly rejected (`UNABLE_TO_VERIFY`) |
