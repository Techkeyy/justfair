# JustFair — Architecture & Engineering Decisions Log (DECISIONS.md)

## Decision 001: Asset Selection & Token Standards
* **Context:** We need liquid, canonical tokenized equities on Solana mainnet.
* **Decision:** Choose **xStocks** (issued under Solana Token Extensions / Token-2022).
* **Rationale:**
  * Mint verification confirms active liquidity pools on Raydium and Orca.
  * Verified 8-decimal precision (`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`).
  * 1:1 economic multiplier (1.0 token = 1 share of underlying stock).
  * Initial test asset locked: **AAPLx** (`XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`), followed by NVDAx, SPYx, TSLAx.

## Decision 002: DEX Aggregator & Routing Provider
* **Context:** We need real-time, executable route finding across all Solana AMMs without hardcoding single pools.
* **Decision:** Use **Jupiter DEX Routing API** (`public.jupiterapi.com` / `api.jup.ag/swap/v1`).
* **Rationale:**
  * Old host `quote-api.jup.ag` is deprecated (returns DNS ENOTFOUND).
  * `public.jupiterapi.com` provides real-time quotes, multi-hop routing (Whirlpool, Raydium, Meteora), and transaction construction.
  * When `quote.platformFee` is detected, pass `feeAccount` or user ATA to enable valid VersionedTransaction generation.

## Decision 003: Independent Underlying Equity Benchmark Source
* **Context:** JustFair must never compare an on-chain DEX price to itself. It requires an independent TradFi market truth.
* **Decision:** Use **Nasdaq/TradFi Market Reference API** supplemented with Pyth Equity Feed metadata.
* **Rationale:**
  * Fetches real-world market prices (`regularMarketPrice`, previous close, exchange metadata).
  * Pyth metadata confirms market trading hours (`is_open`, `next_open`, `next_close`) to flag weekend/after-hours market session risks.

## Decision 004: Transaction Simulation Safety & Zero-Custody Guarantee
* **Context:** User trades must be simulated on Solana mainnet without broadcasting transactions or moving user funds.
* **Decision:** Execute `simulateTransaction` directly against Solana Mainnet RPC with `sigVerify: false` and `replaceRecentBlockhash: true`.
* **Rationale:**
  * Provides genuine pre-flight execution analysis (compute unit consumption, log traces, instruction errors).
  * Purely non-custodial: private keys and signatures are never requested or stored.
