# JustFair — Product Specification

## 1. Product Summary
> **JustFair** helps **everyday retail investors** verify the true economic fairness of tokenized stock trades on Solana **by simulating live execution routes and comparing the expected exposure against real-world canonical market benchmarks in plain dollar terms before executing.**

* **Core Consumer Line:** *"Before you buy the stock, check the fill."*
* **Primary Wedge:** Consumer-facing pre-trade safety analyzer + reusable Equity Preflight API.

---

## 2. The User & Problem
* **Primary User:** A normal investor who wants to buy tokenized stocks on Solana (e.g. Apple, Nvidia, S&P 500) without understanding DEX routing, AMM pool liquidity depth, slippage parameters, Token-2022 transfer mechanics, market trading sessions, or raw transaction simulation logs.
* **The Core Problem:** A user can say *"I want to spend $500 buying Apple,"* but has no way to know whether the proposed Solana DEX route actually delivers ~$500 worth of underlying Apple stock exposure, or if they are getting silently drained by low on-chain liquidity, off-market spreads, or excessive slippage.
* **The Solution:** JustFair intercepts the proposed trade, fetches real-time independent TradFi market benchmarks, calculates the net dollar difference, simulates transaction execution on Solana RPC, and outputs a deterministic verdict: `FAIR`, `CAUTION`, `BAD_FILL`, or `UNABLE_TO_VERIFY`.

---

## 3. Real vs. Simulated vs. Safety Boundary
| Component | Reality Status | Mechanism |
| :--- | :--- | :--- |
| **Solana Mainnet Assets** | **100% REAL** | Verified Token-2022 stock mints (AAPLx, NVDAx, SPYx, TSLAx) |
| **DEX Quotes & Routing** | **100% REAL** | Real-time Jupiter DEX aggregator quote engine (`api.jup.ag` / `public.jupiterapi.com`) |
| **Underlying Equity Benchmark** | **100% REAL** | Canonical Nasdaq / S&P market reference feeds (Yahoo Finance / Pyth metadata) |
| **Transaction Construction** | **100% REAL** | Real unsigned VersionedTransaction payload constructed via Jupiter Swap API |
| **Transaction Execution** | **SIMULATED ONLY** | Solana RPC `simulateTransaction` with `sigVerify: false`. **ZERO funds moved. ZERO broadcast. ZERO custody.** |

---

## 4. Supported Initial Assets
* **Input Payment Assets:**
  1. `USDC` (`EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`, SPL, 6 decimals)
  2. `SOL` (`So11111111111111111111111111111111111111112`, Native SPL wrapped, 9 decimals)
* **Initial Candidate Stock Assets (xStocks on Solana Token-2022):**
  1. `AAPLx` (Apple Inc. — Mint: `XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`, Token-2022, 8 decimals, Multiplier: 1 token = 1 share)
  2. `NVDAx` (NVIDIA Corp. — Mint: `Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh`, Token-2022, 8 decimals, Multiplier: 1 token = 1 share)
  3. `SPYx` (SPDR S&P 500 ETF — Mint: `XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W`, Token-2022, 8 decimals, Multiplier: 1 token = 1 share)
  4. `TSLAx` (Tesla Inc. — Mint: `XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB`, Token-2022, 8 decimals, Multiplier: 1 token = 1 share)

---

## 5. Explicit Non-Goals (Scope Boundary)
* NO AI stock picker or speculative sentiment analyzer
* NO automated trading bot or execution keeper
* NO lending or leverage vaults
* NO custom token or token generation event
* NO smart contract deployments unless strictly proven necessary
* NO multi-chain bridges
* NO custodial wallet or private key management
* NO trade broadcast or funds movement
