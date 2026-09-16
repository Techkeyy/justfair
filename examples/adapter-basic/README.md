# JustFair Example Test Target (SAMPLE)

Shows a developer the smallest possible integration: two tiny endpoints
that expose what their app already displays, so the local JustFair runner
can judge it. No SDK. Plain `node:http`.

## Run it

```bash
node server.mjs naive     # contains the financial bug (labels stale LIVE)
node server.mjs correct   # handles the same condition properly
```

Each prints `READY <mode> http://127.0.0.1:<PORT>`.

## Test it

```bash
node ../../src/cli.js test --target http://127.0.0.1:<PORT>
```

Naive mode → FAIL (`STALE_REFERENCE_TREATED_AS_LIVE`) with replay +
fix guidance. Correct mode → PASS. Same scenario, same runner.

## What you must implement in your own app

1. `GET /justfair/v1/manifest` →
   `{ "adapterVersion": "1", "name": "My Stock Wallet",
     "capabilities": ["underlying_price_display"] }`
2. `POST /justfair/v1/evaluate` ←
   `{ "scenarioId": "...", "scenarioVersion": "1", "inputs": {...} }` →
   return ONLY what your app would show, e.g.
   `{ "displayedPrice": 329.29, "claimsLive": false,
     "label": "AAPL reference (market closed — last available)" }`

Never return a verdict (`pass`/`verdict` fields are ignored — JustFair
owns the judgment). Never send secrets; the runner sends only scenario
inputs. Full contract: `docs/adapter.md`.
