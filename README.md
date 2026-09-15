# JustFair

JustFair helps users verify what tokenized-stock product they are considering and inspect the proposed execution before money moves.

Live production: https://justfair-theta.vercel.app

## The user problem

Tokenized stocks introduce two distinct risks that standard swap interfaces do not show:

1. **Wrong product** — the token may carry different rights (voting, dividends, redemption) than the buyer assumes.
2. **Bad fill** — even the right token can trade at poor economics versus the underlying stock.

## Two preflight layers, one four-step app

1. **Choose Company** — 12 canonical underlyings (AAPL, NVDA, SPY, TSLA, MSFT, AMZN, GOOGL, META, COIN, AMD, MSTR, QQQ).
2. **What Matters** — declare must-haves and nice-to-haves (self-custody, dividends, voting, redemption, …).
3. **Check Product (Product Preflight)** — compares all 24 verified representations (xStocks + Ondo) against expectations: `MATCH`, `CONDITIONAL_MATCH`, `MISMATCH`, or `UNABLE_TO_VERIFY`. Neutral: no silent substitution, no ranking.
4. **Check Trade (Execution Preflight)** — an independent scrolling feed of the 12 execution-supported xStocks representations. Directly accessible via the tracker; never requires Steps 1–3 and never inherits their state. Explicit representation → USDC/SOL → amount → CHECK TRADE.

Support boundary: xStocks representations are execution-supported; Ondo representations are product-verified but `NOT_YET_SUPPORTED` for Execution Preflight.

## Zero-custody model

- Normal Quote Check is walletless (`wallet: null`).
- Optional Exact Transaction Simulation uses only a public Solana address (wallet connect or manual entry) to run a non-broadcast RPC simulation.
- No endpoint executes trades, moves funds, requests signatures, or asks for seed phrases/private keys.

## Architecture and data sources

- Backend: Node HTTP API in `src/` (`server.js`, `preflight.js`, `product/`, `engine/`).
- Frontend: static `public/` app (no build step).
- Data: Jupiter Swap V2 routes, Solana mainnet RPC (Token-2022 state), session-aware equity references (Nasdaq direct tape, timestamped Alpaca session quotes, xStocks indicative extended-hours data), CoinGecko SOL spot, optional Pyth streaming.
- A current fairness verdict is only produced against an eligible live reference; otherwise the check completes truthfully as `UNABLE_TO_VERIFY` (`MARKET_CLOSED_OR_AFTER_HOURS`, `STALE_REFERENCE`, `INDICATIVE_REFERENCE_UNVERIFIED`, or `REFERENCE_UNAVAILABLE`).

## Setup

Requires Node.js 18+.

```sh
npm install
npm start            # local server, default http://127.0.0.1:3001
```

Environment variables (all optional):

| Variable | Purpose |
| :--- | :--- |
| `PORT` | Local server port (default `3001`) |
| `SOLANA_RPC_URL` | Solana mainnet RPC endpoint |
| `JUPITER_API_KEY` | Jupiter API key (server-side only) |
| `PYTH_API_KEY` | Pyth streaming key (server-side only; streaming degrades truthfully without it) |

Never commit secrets. `.env` files are git-ignored.

## Testing

```sh
node test/browser.test.js          # Playwright UI suite (local server, headed-capable)
node test/product-preflight.test.js
node test/preflight.test.js
node test/streaming.test.js
node test/e2e.test.js              # deterministic contract tests (external providers stubbed at the fetch boundary)
node test/smoke_prod.js            # live production smoke (observational)
```

Deterministic suites are fixture-controlled and release-gating: `e2e.test.js`
stubs Jupiter/xStocks/Nasdaq/CoinGecko/Solana-RPC responses while exercising
JustFair's real HTTP routing, validation, economics, and response contracts,
so the same code plus the same fixtures yields the same result on every run.

Live integration smoke (`smoke_prod.js` plus headed production runs) tests
real external APIs observationally: results are classified as SUCCESS,
UPSTREAM TRANSIENT, or PRODUCT FAILURE. A transient upstream failure never
fails the deterministic build and is never presented as a successful quote.

## Deployment

Vercel (`vercel.json` routes `/api/*` to `api/index.js`, everything else to `public/`):

```sh
npx vercel --prod --yes
```

## API usage

See [docs/API.md](docs/API.md). Core calls:

```sh
curl -X POST https://justfair-theta.vercel.app/api/v1/product-preflight \
  -H "Content-Type: application/json" \
  -d '{"underlying": "AAPL", "expectations": [{"key": "SELF_CUSTODY", "priority": "REQUIRED"}]}'

curl -X POST https://justfair-theta.vercel.app/api/v1/preflight \
  -H "Content-Type": "application/json" \
  -d '{"inputAsset": "USDC", "stock": "AAPLx", "amount": 500}'
```

## Limitations

- Execution Preflight covers the 12 xStocks representations only.
- Equity references are session-aware extended-hours coverage where a current verifiable reference is available — never claimed 24/7. The ladder is: current regular-session reference (Nasdaq direct preferred), current timestamped Alpaca session quote (IEX pre/post-market, overnight feed), latest indicative reference (timestamp unverified, never certified), last available dated reference, unavailable.
- An indicative xStocks price (live number, no source timestamp) is shown as indicative with upstream provenance (on-chain providers plus Nasdaq/Blue Ocean); it never certifies fairness.
- Free Alpaca/IEX data is real-time single-exchange coverage, not full SIP consolidated tape.
- Fairness verdicts require an eligible live equity reference; off-hours checks report reference value against the last available reference without certifying fairness.
- Graded FAIR/CAUTION/BAD_FILL verdicts are pending live-tape calibration; production returns `MEASURED` or `UNABLE_TO_VERIFY`.
- Upstream providers (Jupiter, Nasdaq, RPC) can transiently fail; failures are reported truthfully, never filled with fake data.
