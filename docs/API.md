# JustFair REST API Documentation (`/api/v1`)

The JustFair Equity Preflight API provides pre-trade product truth and execution safety checks for tokenized stocks on Solana. Read-only and non-custodial: no endpoint executes trades, moves funds, or signs transactions.

---

## 1. Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status and version |
| `GET` | `/api/v1/stocks` | Supported payment assets and the 12 execution-supported tokenized stocks |
| `GET` | `/api/v1/products` | Master catalog: 12 underlyings, 24 representations (xStocks + Ondo) |
| `GET` | `/api/v1/products/:productId` | Single product capabilities (colon-bearing IDs supported, URL-encoded) |
| `GET` | `/api/v1/products/compare/:underlyingSymbol` | Side-by-side representation comparison, or `?a=&b=` product comparison |
| `GET` | `/api/v1/products/:productId/verify` | Live on-chain verification (`200` VERIFIED, `503` UNABLE_TO_VERIFY, `400` MISMATCH) |
| `POST` | `/api/v1/product-preflight` | Product Preflight: match expectations against verified representations |
| `POST` | `/api/v1/preflight` | Execution Preflight: quote check and optional exact simulation |
| `GET` | `/api/v1/prices`, `/api/v1/prices/sol` | Authoritative payment-asset spot prices |
| `GET` | `/api/v1/stream/status` | Streaming health posture |
| `GET` | `/api/v1/stream` | Live price stream (SSE; `503` without server-side key) |

---

## 2. POST `/api/v1/preflight`

### Request Body Schema
```json
{
  "inputAsset": "USDC",
  "stock": "AAPLx",
  "amount": 500,
  "wallet": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
}
```

* `inputAsset` *(string, optional, default: "USDC")*: Payment token symbol (`USDC`, `SOL`).
* `stock` *(string, optional, default: "AAPLx")*: Tokenized stock symbol. Only the 12 execution-supported xStocks (`AAPLx`, `NVDAx`, `SPYx`, `TSLAx`, `MSFTx`, `AMZNx`, `GOOGLx`, `METAx`, `COINx`, `AMDx`, `MSTRx`, `QQQx`).
* `amount` *(number, required, 0 < amount <= 10,000,000)*: Quantity of payment asset to spend.
* `wallet` *(string, optional)*: User Solana public key.
  * **Omitted (Quote Check)**: Analyzes the DEX route and reference economics without assembling any transaction.
  * **Provided (Exact Simulation)**: Constructs an unsigned transaction and runs a non-broadcast RPC simulation. Nothing is signed, broadcast, or moved.

### Response Body Schema
```json
{
  "request_status": "SUCCESS",
  "verification_status": "VERIFIED | UNABLE_TO_VERIFY",
  "verdict": "MEASURED | UNABLE_TO_VERIFY",
  "preflight_level": "QUOTE_CHECK | EXACT_SIMULATION",
  "reason_codes": [
    "ALL_PREREQUISITES_PASSED"
  ],
  "trade": {
    "input_asset": "USDC",
    "input_amount": 500,
    "input_usd_value": 500.00,
    "stock_symbol": "AAPLx",
    "canonical_stock": "AAPL",
    "token_mint": "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    "token_program": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
  },
  "benchmark": {
    "symbol": "AAPL",
    "price": 332.58,
    "source": "Nasdaq Official Public Equity Quote API (api.nasdaq.com)",
    "source_type": "OFFICIAL_MARKET_DATA_PROVIDER",
    "provider": "Nasdaq regular-session reference",
    "timestamp": "2026-09-12T00:46:51.809Z",
    "reference_session": "REGULAR",
    "current_market_session": "REGULAR",
    "freshness_status": "FRESH",
    "is_real_time": true
  },
  "economics": {
    "raw_out_amount": "149679075",
    "expected_stock_shares": 1.501684,
    "underlying_benchmark_price": 332.58,
    "expected_stock_exposure_usd": 499.43,
    "effective_price_per_share": 332.96,
    "difference_usd": -0.57,
    "difference_pct": -0.11,
    "multiplier": {
      "stored_multiplier": 1.0026642075893797,
      "new_multiplier": 1.0032690125398187,
      "new_multiplier_effective_timestamp": 1786149000,
      "current_multiplier": 1.0032690125398187,
      "current_multiplier_reason": "newMultiplier effective timestamp (1786149000) has passed",
      "is_inside_corporate_action_window": false,
      "source": "Solana Token-2022 scaledUiAmountConfig on-chain state"
    }
  },
  "dex_route": {
    "endpoint": "https://api.jup.ag/swap/v2/order",
    "router": "jupiterz",
    "mode": "ultra",
    "fee_bps": 10,
    "price_impact_pct": "-0.00105",
    "quote_obtained_at": "2026-09-12T00:46:51.395Z",
    "quote_fetch_latency_ms": 648,
    "steps": ["Whirlpool", "Raydium CLMM"]
  },
  "simulation": {
    "mode": "EXACT_SIMULATION",
    "status": "PASS",
    "err": null,
    "units_consumed": 128222,
    "logs_count": 60
  },
  "execution_time_ms": 1400
}
```

Market-hours truth: outside an eligible live reference the API still returns
`request_status: SUCCESS` with `verification_status: UNABLE_TO_VERIFY`,
`verdict: UNABLE_TO_VERIFY`, and a truthful reason code
(`MARKET_CLOSED_OR_AFTER_HOURS`, `STALE_REFERENCE`, or `REFERENCE_UNAVAILABLE`).
A current fairness verdict is only produced against an eligible live tape;
threshold calibration for graded verdicts is pending.

Failure states: `400` for `INVALID_AMOUNT`, `INVALID_PUBLIC_KEY`,
`UNSUPPORTED_PAYMENT_ASSET`, `UNSUPPORTED_STOCK_ASSET`, `MISSING_AMOUNT`;
upstream routing failures surface as `request_status: ERROR` with
`UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`, or `UPSTREAM_ERROR`.
Rate limiting returns `429` with `RATE_LIMITED`. Request bodies are capped at 1MB.

---

## 3. GET `/api/v1/stocks`

Returns active identity registry for supported tokens and stock mints.

---

## 4. Product Preflight

### POST `/api/v1/product-preflight`

```json
{
  "underlying": "AAPL",
  "expectations": [
    { "key": "SELF_CUSTODY", "priority": "REQUIRED" }
  ]
}
```

Priorities: `REQUIRED`, `OPTIONAL`. Malformed inputs are rejected with `400`.
Response carries `request_status: COMPLETED`, `overall_result`
(`MULTIPLE_VERIFIED_MATCHES`, `MATCHES_REQUIRED_EXPECTATIONS`,
`CONDITIONAL_MATCHES`, `NO_VERIFIED_PRODUCT_MATCH`, `UNABLE_TO_VERIFY_PRODUCT`)
and per-representation `evaluation.status` of `MATCH`, `CONDITIONAL_MATCH`,
`MISMATCH`, or `UNABLE_TO_VERIFY`. Ondo representations are product-verified
but marked `NOT_YET_SUPPORTED` for Execution Preflight — they are never
substituted with xStocks.

### GET `/api/v1/products`, `/api/v1/products/:productId`, `/api/v1/products/compare/*`, `/api/v1/products/:productId/verify`

Catalog, capability, comparison, and live on-chain verification reads.
Unknown product IDs return `404`.
