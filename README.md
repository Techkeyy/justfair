# JustFair

[Live product](https://justfair-theta.vercel.app) · [GitHub](https://github.com/Techkeyy/justfair) · [npm package](https://www.npmjs.com/package/justfair) · [MIT license](LICENSE)

**Break your stock app before the market does.**

JustFair is financial-correctness crash testing for developers building stock
applications and stock-market infrastructure on Solana. It observes what a
target application calculates or displays, establishes expected financial truth
from labeled evidence, and reports PASS, FAIL, UNABLE, or CURVE CAPACITY with a
replay and diagnosis.

> *"The app executed normally. How do I know the financial result it showed was
> actually correct?"*

## Who it is for

Developers building tokenized-stock applications, stock wallets, trading
interfaces, agents, portfolio and accounting applications, and stock-market
infrastructure on Solana.

## Why this exists

An app's own unit tests can confirm that its code runs, and a quote or swap
tool can confirm that a route can be simulated. Neither necessarily checks
whether the value the app displays matches the financial behavior of the live
asset or market configuration it is describing.

JustFair fills that boundary with a small observations-only adapter and an
independent scenario engine. The target app supplies observations. JustFair
supplies the expectation, compares the invariant, owns the verdict, and saves
the report. That makes a fee-bearing transfer, expired position, stale
reference, or DBC launch stress point testable before it reaches users.

```text
Stock app calculation or display
              |
              v
       Observation adapter       <- app tests often stop here
              |
              v
       JustFair evidence + invariant comparison
              |
              v
          PASS / FAIL / UNABLE
```

## What it does

1. **Scaffolds** a localhost adapter with `npx justfair@latest init`, producing
   `justfair.config.js` and `justfair-adapter.mjs`.
2. **Observes** the running app through the adapter's manifest and evaluate
   endpoints; the output is the app's value, never an adapter verdict.
3. **Establishes** expected truth from live chain state, authoritative
   published terms, or explicitly labeled simulations.
4. **Compares** the observation with deterministic assertions owned by the
   JustFair engine.
5. **Reports** PASS, FAIL, UNABLE, or CURVE CAPACITY with expected versus
   observed values, provenance, root cause, guidance, and an ordered replay.
6. **Persists** the exact report to `justfair-result.json` and can open that
   same in-memory report in the local Replay Lab.

## Why this financial-correctness lane matters

The concrete failure is easy to miss in a technically healthy application: a
Token-2022 transfer can execute while the recipient amount still shows the
gross value. In the owner-tested T-Kalshi workflow, live 20 bps evidence made
1000 base units net 998, so an external app reporting 1000 produced a JustFair
FAIL. The app-only correction changed the same public run to PASS. Meteora
DBC stress adds a second boundary: independent live configurations can have
different economics, and a quote capacity boundary must not be presented as a
safe PASS.

## Public quickstart

The public workflow requires Node.js 20 or newer. It does not require a
JustFair clone, account, funds, private keys, signing, broadcasting, trade
execution, or financial advice.

### Install and initialize

```sh
npx justfair@latest init
```

At this audit point, the public registry still resolves `justfair@latest` to
1.0.5. This repository contains the unreleased 1.0.6 patch that makes Tessera
epoch-RPC failure fail closed; the owner must publish 1.0.6 before blind UAT.

### Configure and health-check

Open the generated `justfair-adapter.mjs` and connect each observation
assignment to the value your real app calculates or displays. Then start the
app and adapter:

```sh
node justfair-adapter.mjs
npx justfair@latest doctor
```

The adapter exposes:

```text
GET  /justfair/v1/manifest
     {"adapterVersion":"1","name":"...","capabilities":[...]}

POST /justfair/v1/evaluate
     {"scenarioId","scenarioVersion","inputs"}
     -> observations only
```

JustFair does not ask the adapter for a verdict. Any adapter `pass` or
`verdict` field is ignored. The adapter reports observations; JustFair owns
expected truth and the verdict.

### Run

```sh
npx justfair@latest test --target http://localhost:3100 --open
```

Exit codes are stable:

- `0`: all selected scenarios PASS.
- `1`: at least one scenario FAILed after sufficient evidence was available.
- `2`: UNABLE, configuration, capability, target, or infrastructure failure.

Every completed run automatically saves the exact report to
`./justfair-result.json`. `--open` launches the local Replay Lab for that same
report on `127.0.0.1`; the report is served in memory and is not uploaded to a
cloud service.

### Offline repository fixture

Contributors can try the deterministic sample without external application
code:

```sh
node examples/adapter-basic/server.mjs naive
node src/cli.js test --target http://127.0.0.1:3000 --open
```

The fixture demonstrates the engine-owned FAIL/PASS boundary. It is not live
market evidence.

## Result semantics

| Result | Meaning |
|---|---|
| `PASS` | The observed application behavior satisfied the tested financial invariant. |
| `FAIL` | JustFair obtained sufficient authoritative evidence and the observed application result violated the invariant. |
| `UNABLE_TO_VERIFY` | JustFair could not obtain enough trustworthy evidence to make the claim. It is not a PASS. |
| `CURVE CAPACITY` | The tested market or curve could not successfully quote at that stress point. It is a finding, never a PASS. |

JustFair reports correctness of the tested observation. It does not guarantee
that an investment, route, token, or market is safe.

## How I tried to break it

| Adversarial input | Exercised result |
|---|---|
| Malformed or unreachable adapter | `UNABLE_TO_VERIFY`, never PASS or FAIL |
| Missing capability or untouched lifecycle branch | Honest SKIP or UNABLE, never a fabricated financial PASS |
| Missing `TransferFeeConfig` or malformed mint | Coded Tessera error mapped to UNABLE |
| Epoch RPC failure while reading Tessera fee state | `TESSERA_FETCH_FAILED` and UNABLE; no assumed fee schedule |
| DBC quote reaches capacity | `CURVE CAPACITY`, distinct from PASS and policy FAIL |
| Artifact write failure | Warning preserves the scenario verdict and exit semantics |
| `--json` and `--open` paths | Machine-safe output and local Replay without cloud upload |
| Wrong external observation followed by app-only correction | Same public workflow changes FAIL to PASS when the invariant is corrected |

**Missing or unresolved evidence never returns PASS.** Rules decide the verdict
deterministically; the adapter only supplies observations.

## Architecture

```text
Stock application
       ↓
Observations adapter
       ↓
JustFair scenario engine ← authoritative evidence
       ↓
Invariant comparison
       ↓
PASS / FAIL / UNABLE / CURVE CAPACITY
       ↓
Local artifact and Replay Lab
```

| Module | Job |
|---|---|
| `src/cli.js` | Scaffolds adapters, dispatches scenarios, persists reports, serves local Replay. |
| `src/scenarios/adapter.js` | Validates the v1 localhost protocol and normalizes target failures. |
| `src/scenarios/scenario.js` | Runs assertions, owns verdicts, and builds replay events. |
| `src/scenarios/tessera.js` | Reads live Token-2022 fee state and computes integer net amounts. |
| `src/scenarios/dbc-live.js` | Reads Meteora configs and classifies live quote stress. |
| `src/scenarios/prestocks.js` | Tests published future expiry terms as an event fixture. |
| `public/` | Serves the local-first product, Replay Lab, and DBC Stress surfaces. |

## Live integrations and evidence boundaries

### Tessera

The tested public owner workflow covers T-OpenAI and T-Kalshi. Both use live
Solana Token-2022 `TransferFeeConfig` evidence, including the active epoch,
fee basis points, maximum fee, and integer fee math. This does not claim every
Tessera asset has identical fee configuration.

### Meteora DBC

JustFair performs read-only launch-stress testing against real Meteora DBC
configurations and SDK quote math. Owner testing exercised multiple independent
mainnet configurations under the same policy and obtained materially different
stress profiles. The claim is bounded to the tested compatible DBC classes,
not every historical or current configuration variant.

### PreStocks

JustFair crash-tests published future expiry and lifecycle terms as an
`authoritative_event_fixture`. The March 2027 event has **not occurred yet**.
It must not be described as live March 2027 lifecycle evidence.

### Simulated and bounded scenarios

The stale-reference scenario uses explicitly labeled simulated field semantics.
Simulation, authoritative event terms, and live chain evidence remain separate
classifications in the report and Replay Lab.

## Security and local-first behavior

JustFair does not custody funds, request seed phrases or private keys, sign
user transactions, execute trades, or provide financial advice. The CLI targets
localhost and validates constrained addresses and numeric inputs rather than
fetching arbitrary URLs. Replay reports are parsed and rendered as text in
the browser with a 1 MB cap.

## Developing JustFair

Using JustFair requires only the public npm workflow above. Developing JustFair
itself uses the repository:

```sh
git clone https://github.com/Techkeyy/justfair.git
cd justfair
npm install
npm test
node test/e2e.test.js
node test/browser.test.js
```

Optional server-side environment variables are `PORT`, `SOLANA_RPC_URL`,
`JUPITER_API_KEY`, and `PYTH_API_KEY`. Local `.env` files are ignored and
secrets must never be committed.

## Current verification

The post-cleanup 1.0.6 release-candidate audit found 291 cases: 290 passed, 1
intentional Pyth skip, and 0 failed. Live-network availability can affect
whether a run is conclusive.

## Deployment

The public web product is deployed at
[justfair-theta.vercel.app](https://justfair-theta.vercel.app). Vercel routes
`/api/*` to `api/index.js` and serves the static product from `public/`.

## License

[MIT License](LICENSE)
