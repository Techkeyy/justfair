# JustFair

**Break your stock app before the market does.**

[Live product](https://justfair-theta.vercel.app) | [GitHub](https://github.com/Techkeyy/justfair) | [npm: justfair@1.0.5](https://www.npmjs.com/package/justfair)

A stock app can execute cleanly while showing the wrong financial result: a
stale price presented as live, a Token-2022 transfer fee omitted from the
recipient amount, an expired tokenized holding still valued, or an opening
trade size beyond the issuer's own impact policy. JustFair tests those
observations against labeled evidence and reports PASS, FAIL, or
UNABLE_TO_VERIFY with replay, root cause, and fix guidance.

## Who it is for

Developers and teams building stock wallets, tokenized-stock interfaces,
DEXes, portfolio and accounting apps, stock-aware lending, trading agents,
and tokenized-market infrastructure on Solana.

## Why this exists

HTTP 200, a successful transaction, or a balance displayed by an app does not
prove that the financial result is correct. JustFair gives the developer a
small local observation adapter, then independently checks the app's displayed
or calculated values against deterministic assertions and authoritative
evidence. The target reports observations only; JustFair owns the verdict.

## Public workflow

Requires Node.js 20 or newer. The public workflow needs no JustFair clone,
account, funds, private keys, signing, broadcasting, or trade execution.

1. Initialize the adapter scaffold in the project containing the app:

   ```sh
   npx justfair@latest init
   ```

   With the current public release, `justfair@latest` resolves to 1.0.5.
   The command creates `justfair.config.js` and `justfair-adapter.mjs` and
   never overwrites existing files.

2. Connect the adapter's observation assignments to values the app actually
   calculates or displays. The adapter exposes the normal JustFair interface:
   `GET /justfair/v1/manifest` and `POST /justfair/v1/evaluate`.

3. Start the app and then the adapter. The app may use any localhost port;
   the adapter reads the app and exposes JustFair's two test endpoints on its
   own localhost port.

4. Run the public package against the adapter:

   ```sh
   npx justfair@latest test --target http://localhost:3100 --open
   ```

5. Inspect the result. Every completed run saves the exact report to
   `./justfair-result.json` by default. `--out` selects another path and
   `--open` launches the local Replay Lab on `127.0.0.1`; the report stays
   local and is not uploaded to a cloud service.

6. If the result is FAIL, fix only the app, restart the app, and rerun the
   same command. The adapter must continue to report observations, never a
   verdict.

### Result meanings

| Result | Meaning |
|---|---|
| `PASS` | The observed value satisfies every assertion supported by the evidence. |
| `FAIL` | The target supplied an observation that violates an assertion. |
| `UNABLE_TO_VERIFY` | The target, evidence, or required input was unavailable or ambiguous. This is not a pass. |
| `CURVE CAPACITY` | A DBC quote reached the live curve's capacity boundary. It is a finding, not a safe-number certification. |

## Architecture

| Component | Responsibility |
|---|---|
| Stock app | Calculates or displays the value under test. |
| Observation adapter | Reads the app and returns observations through the localhost contract. |
| Scenario evidence | Supplies live chain state, authoritative event terms, or explicitly labeled simulations. |
| JustFair engine | Computes expectations, runs assertions, owns PASS/FAIL/UNABLE, and creates the replay. |
| Result artifact and Replay Lab | Preserve the exact report and show expected versus observed values, provenance, diagnosis, and timeline locally. |

## Scenarios and evidence boundaries

| Scenario | What it checks | Evidence boundary |
|---|---|---|
| `STALE_CARRIED_FORWARD_EQUITY` | A carried-forward price is not presented as live. | Simulated field semantics, explicitly labeled `simulated`. |
| `PRESTOCKS_EXPIRY_{BEFORE,NEAR,AFTER}` | Published conversion deadlines and expired-position representation. | Official PreStocks terms captured as an `authoritative_event_fixture`; the March 2027 event itself has not occurred. |
| `TESSERA_TRANSFER_FEE_ACCOUNTING` | The recipient amount accounts for a Token-2022 transfer fee. | Live Solana `TransferFeeConfig`; public owner proof covers T-OpenAI and T-Kalshi, not every Tessera asset. |
| `DBC_OPENING_WHALE` and `DBC_LAUNCH_SWEEP` | Opening size and policy stress against a bonding curve. | Live Meteora DBC configuration and SDK quote math; multi-config proof covers tested compatible classes, not every historical DBC variant. |

JustFair keeps evidence labels visible. Live chain state, authoritative event
fixtures, and simulations are not interchangeable claims.

## Solana integrations

- **Tessera**: live Token-2022 fee state drives the expectation. The verified
  public owner workflow has covered T-OpenAI and T-Kalshi at 20 basis points;
  the implementation does not claim identical configuration for all assets.
- **Meteora DBC**: live mainnet configuration reads and SDK quote simulation
  stress the issuer-declared impact policy without signing, funds, or trades.
  Three additional real configurations produced materially different results
  at the same 8% policy and reported curve capacity instead of a false PASS.
- **PreStocks**: published future expiry terms are a bounded lifecycle
  crash-test fixture, not a live March 2027 lifecycle feed.

## Adapter contract

Full specification: [docs/adapter.md](docs/adapter.md).

```text
GET  /justfair/v1/manifest
     {"adapterVersion":"1","name":"...","capabilities":[...]}

POST /justfair/v1/evaluate
     {"scenarioId","scenarioVersion","inputs"}
     -> observations only
```

Any `pass` or `verdict` field supplied by an adapter is ignored. JustFair
evaluates the observations itself.

## Security and local-first behavior

The product path has no private-key, seed-phrase, fund-custody, signing,
broadcast, or trade-execution flow. The CLI targets localhost and validates
constrained addresses and numeric inputs rather than fetching arbitrary URLs.
Replay reports are parsed and rendered as text in the browser with a 1 MB cap.
Sponsor credentials, where applicable to the legacy server routes, stay in
server-side environment variables and are never sent to adapters.

## Development

```sh
git clone https://github.com/Techkeyy/justfair.git
cd justfair
npm install

# Run the local server, default http://127.0.0.1:3001
npm start
```

The repository contributor path may use the local CLI directly:

```sh
node examples/adapter-basic/server.mjs naive
node src/cli.js test --target http://127.0.0.1:3000 --open
```

Environment variables are optional and server-side only: `PORT`,
`SOLANA_RPC_URL`, `JUPITER_API_KEY`, and `PYTH_API_KEY`. Never commit secrets;
local `.env` files are ignored.

## Verification

Canonical suites run with Node's test runner and Playwright:

```sh
node test/justfair-scenarios.test.js
node test/tessera.test.js
node test/dbc.test.js
node test/dbc-sweep.test.js
node test/cli.test.js
node test/e2e.test.js
node test/preflight.test.js
node test/product-preflight.test.js
node test/streaming.test.js
node test/browser.test.js
node test/smoke_prod.js
```

Current audit run: 291 discovered cases, 290 passed, 1 intentional skip, and
0 failed. The skipped case is the Pyth live probe without an entitled API key.
The aggregate includes live-network and browser checks, so upstream
availability can affect whether a run is conclusive.

## Web product

- **Home**: product thesis, RUN A TEST, and OPEN REPLAY LAB.
- **Test**: the local workflow, public command, and adapter contract.
- **Replay Lab**: a local artifact viewer with expected versus observed values,
  provenance, replay timeline, root cause, and guidance. PASS, FAIL, and
  UNABLE remain visually distinct.
- **DBC Launch Stress**: a real-config and issuer-policy sweep with first
  policy failure and first capacity boundary callouts.
- **System Health**: read-only service and upstream health information.

## Limitations

- There is no live Pyth equity integration; that scenario uses explicitly
  labeled simulated semantics.
- PreStocks lifecycle truth is an authoritative published-terms fixture, not
  a live lifecycle API, and the March 2027 expiry has not occurred.
- DBC results follow current pool/config state. Graduated or capacity-limited
  curves are reported as findings, not converted into PASS.
- No hosted arbitrary-target execution, accounts, database, cloud history, or
  CI packaging is provided. The CLI is localhost-only.
- Public mainnet RPCs can be rate-limited or transiently unavailable; those
  cases report `UNABLE_TO_VERIFY`, never PASS or FAIL.

## Deployment

The public web product is deployed at
[justfair-theta.vercel.app](https://justfair-theta.vercel.app). Vercel routes
`/api/*` to `api/index.js` and serves the static product from `public/`.

## License

[MIT License](LICENSE)
