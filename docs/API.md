# JustFair REST API Documentation (`/api/v1`)

The JustFair Equity Preflight API provides pre-trade economic safety and route verification for tokenized stocks on Solana.

---

## 1. Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status and version |
| `GET` | `/api/v1/stocks` | List supported payment assets and tokenized stocks registry |
| `POST` | `/api/v1/preflight` | Primary pre-trade fairness check and simulation engine |

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
* `stock` *(string, optional, default: "AAPLx")*: Tokenized stock symbol (`AAPLx`, `NVDAx`, `SPYx`, `TSLAx`).
* `amount` *(number, required)*: Quantity of payment asset to spend.
* `wallet` *(string, optional)*: User Solana public key.
  * **Omitted (Quote Precheck)**: Analyzes DEX route and fair value without transaction assembly.
  * **Provided (Exact Preflight)**: Assembles VersionedTransaction and executes non-broadcast RPC simulation.

### Response Body Schema
```json
{
  "request_status": "SUCCESS",
  "verification_status": "VERIFIED | UNABLE_TO_VERIFY",
  "verdict": "FAIR | CAUTION | BAD_FILL | UNABLE_TO_VERIFY",
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
    "provider": "Nasdaq Real-Time Stock Market Tape",
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

---

## 3. GET `/api/v1/stocks`

Returns active identity registry for supported tokens and stock mints.
