# JustFair

**Crash-test your stock app before the market does.**

**[Live product](https://justfair-theta.vercel.app)**

A swap can execute cleanly while the financial result is wrong: a stale
price shown as live, a stock split read as a loss, a dividend silently
mis-accounted, an expired token still valued. JustFair runs deterministic
financial scenarios against stock applications, reports PASS / FAIL /
UNABLE_TO_VERIFY with replay, root cause, and fix guidance — then the same
scenario re-runs to PASS.

## The user

Developers and teams building stock wallets, tokenized-stock interfaces,
DEXes, portfolio and accounting apps, stock-aware lending, trading agents,
and tokenized-market infrastructure on Solana. No privileged account, no
prepared demo state, no operator intervention required.

## The loop

```
ADD SMALL ADAPTER → RUN APP LOCALLY → RUN JUSTFAIR CLI
→ PASS / FAIL / UNABLE → RESULT ARTIFACT → OPEN IN REPLAY LAB
→ EXPECTED VS ACTUAL → ROOT CAUSE → FIX GUIDANCE
→ FIX → RE-RUN → PASS → (OPTIONAL CI)
```

## Using JustFair (No-Clone Developer Journey)

Requires Node.js 20+. No JustFair repository clone, account, funds, or private keys required.

### 1. Initialize configuration and adapter scaffold in your project:

```sh
npx justfair@latest init
```

Creates `justfair.config.js` and `justfair-adapter.mjs` in your current directory.

### 2. Connect your observation adapter bridge:

The adapter acts as a bridge querying your application logic on localhost.

```
YOUR STOCK APP (e.g. port 4000)
        ↓
OBSERVATION ADAPTER (e.g. port 3100)
        ↓
JUSTFAIR SCENARIO ENGINE
        ↓
PASS / FAIL / UNABLE
```

Start your adapter:

```sh
node justfair-adapter.mjs
```

### 3. Crash-test your app:

```sh
npx justfair@latest test --target http://localhost:3100 --open
```

`--open` launches Replay Lab locally on `127.0.0.1` with zero cloud telemetry.

Every completed run also saves the exact report to `./justfair-result.json`
in the directory where you ran the command (replaced on each run, `--out`
names a different path), so a previous result can be reopened later in
Replay Lab without rerunning.

---

## Contributing to JustFair

If you are developing or contributing to JustFair itself:

```sh
git clone https://github.com/Techkeyy/justfair.git
cd justfair
npm install

# Run against sample target
node examples/adapter-basic/server.mjs naive
node src/cli.js test --target http://127.0.0.1:3000 --open

# Run all test suites
npm test
```

Open `justfair-result.json` in Replay Lab (upload stays strictly in the browser with zero cloud telemetry) or explore interactive samples.

## Adapter contract (v1)

Your app exposes two localhost endpoints; JustFair judges only what your
app observably shows. Full spec: `docs/adapter.md`.

`GET /justfair/v1/manifest` →
`{"adapterVersion": "1", "name": "...", "capabilities": [...]}`

`POST /justfair/v1/evaluate` ←
`{"scenarioId", "scenarioVersion", "inputs"}` →
observations only (a `pass`/`verdict` field would be ignored).

## Scenario model

Identity, required capabilities, inputs, authoritative evidence
(live / historical / simulated / authoritative_event_fixture /
live_dbc_mainnet / live_tessera_token2022 — always labeled), deterministic
assertions, result (PASS / FAIL / UNABLE_TO_VERIFY), diagnosis
(failure code, expected, actual, root cause, guidance), ordered replay
timeline. Current scenarios:

| ID | Proves | Evidence |
|---|---|---|
| `STALE_CARRIED_FORWARD_EQUITY` | carried-forward prices are never shown as live | simulated (Pyth field semantics) |
| `PRESTOCKS_EXPIRY_{BEFORE,NEAR,AFTER}` | conversion deadlines survive; expired holdings lose ordinary value | authoritative event fixture (official PreStocks page) |
| `TESSERA_TRANSFER_FEE_ACCOUNTING` | Token-2022 fees are accounted gross-vs-net | live Token-2022 TransferFeeConfig |
| `DBC_OPENING_WHALE` | opening size stays within the issuer's impact policy | live Meteora DBC config + SDK quote math |

## Sponsor integrations (load-bearing, not logos)

- **PreStocks** — private-market lifecycle correctness (expiry/conversion
  handling against the official SpaceX conversion case).
- **Meteora DBC** — market-structure stress (real mainnet config reads +
  SDK quote simulation; issuer-declared policy, never a JustFair safety
  number).
- **Tessera** — T-Token financial behavior (live TransferFeeConfig drives
  expectations; T-OpenAI preferred).

Historical note: Pyth was investigated in earlier phases (parser, session
semantics) but no equity-entitled credential exists, so it is not a
sponsor track and blocks nothing. Earlier market-data code remains as a
generic simulated sample.

## Why Solana

Token-2022 mints carry the financial behavior under test (scaled-ui
multipliers, transfer fees) readable on-chain; unsigned `simulateTransaction`
lets scenarios verify execution semantics without signing, broadcasting,
custody, or funds.

## Zero-custody / security model

No private keys, seed phrases, fund holding, signing, broadcasting, or
trade execution anywhere. Sponsor keys are server-env only and never sent
to adapters. The CLI contacts localhost only. Replay uploads are parsed
client-side (1 MB cap) and rendered as text, never raw HTML. Server
endpoints validate constrained inputs (addresses, bounded numbers — never
URLs or keys) under the existing rate limiter.

## Setup

```sh
npm install
npm start            # local server, default http://127.0.0.1:3001
```

Environment variables (all optional, server-side only):

| Variable | Purpose |
| :--- | :--- |
| `PORT` | Local server port (default `3001`) |
| `SOLANA_RPC_URL` | Solana RPC endpoint (default mainnet-beta) |
| `JUPITER_API_KEY` | Jupiter API key |
| `PYTH_API_KEY` | Pyth key (streaming degrades truthfully without it; not required) |

Never commit secrets. `.env` files are git-ignored.

## Testing

```sh
node test/justfair-scenarios.test.js   # engine + adapter + fixtures
node test/tessera.test.js              # live T-Token reads + fee math
node test/dbc.test.js                  # live mainnet DBC reads + whale math
node test/cli.test.js                  # CLI exit codes + artifacts
node test/browser.test.js              # Playwright UI incl. Replay Lab
node test/e2e.test.js                  # deterministic HTTP contracts
node test/preflight.test.js            # legacy execution engine
node test/product-preflight.test.js    # legacy product matcher
node test/streaming.test.js            # streaming infra
node test/smoke_prod.js                # live production smoke (observational)
```

Counts at release: scenarios 25 · tessera 13 · dbc 5 · dbc-sweep 19 · cli 20
· browser 77 · e2e 16 · preflight 49 · product-preflight 52 · streaming 6. Live suites
hit real networks and report honestly; fixture suites are deterministic.

## The web product

- **Home** — thesis, RUN A TEST, OPEN REPLAY LAB.
- **Test** — local workflow, real CLI command, inline adapter spec.
- **Replay Lab** — upload a CLI artifact (stays in-browser), scenario list,
  expected vs actual, provenance, replay timeline, root cause, guidance;
  PASS / FAIL / UNABLE kept visually distinct; engine-generated samples
  labelled SAMPLE.
- **DBC Launch Stress** — config + YOUR POLICY form running the real sweep
  scenario server-side (read-only; no signing or funds).

The legacy Steps 1–4 consumer app remains served for its existing tests
and behavior but is no longer the flagship product.

## Deployment

Vercel (`vercel.json` routes `/api/*` to `api/index.js`, everything else
to `public/`). Node 22 runtime required:

```sh
npx vercel --prod --yes
```

## Limitations (honest)

- No live Pyth equity integration (no entitled credential); the market-data
  scenario runs on truthfully labeled simulated semantics.
- PreStocks lifecycle truth is an authoritative event fixture, not a live
  lifecycle API; listing data stays separate from lifecycle provenance.
- DBC quotes follow live pool/config state: graduated pools refuse swaps
  (reported, not faked); opening-whale uses pre-pool simulation math.
- No hosted arbitrary-target execution (localhost CLI only), no CI
  packaging yet, no accounts/database/cloud history.
- Public mainnet RPC is rate-limited; heavy enumeration is avoided by
  design (direct reads only).
- Upstream providers can transiently fail; failures report as
  UNABLE_TO_VERIFY, never as PASS or FAIL.
