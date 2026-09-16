# JUSTFAIR — DIRECTOR TAKEOVER DOCUMENT

> Maintained by the builder. Another director must be able to take over from
> this file alone. Last updated: Phase 0 (2026-09-16).

---

## 1. PRODUCT

JUSTFAIR.

## 2. CURRENT PRODUCT DEFINITION

**JustFair crash-tests stock applications before users discover the financial bugs.**
A financial-correctness crash-testing platform for stock applications and
stock market infrastructure. Positioning: "Break your stock app before the
market does." Software may compile, return HTTP 200, execute a Solana
transaction, return a valid quote, or show a balance while still producing a
financially incorrect outcome. JustFair exists to find those failures.

## 3. LEGACY PRODUCT DEFINITION

Consumer-facing tokenized-stock pre-trade safety app ("Know what you're
buying. Then check the fill."): Product Preflight (token capability matching
against expectations, Steps 1–3) + Execution Preflight (Jupiter DEX quote
checking vs equity benchmarks, Step 4). Theses: product-comparison,
representation-truth as primary product, Jupiter-oriented execution
experience. This is NO LONGER the product direction.

## 4. WHAT CHANGED

Director Order 001 (2026-09-16) reset the product. Legacy JustFair continues
to run in production and is preserved untouched; its engineering is inventoried
for reuse. All new work serves the crash-testing platform (§2), starting with
a small number of excellent scenarios per Director Order 001 §5.

## 5. INTENDED USER

Developers and teams building: stock wallets, tokenized-stock wallets, DEXes,
tokenized-stock trading interfaces, portfolio apps, stock accounting apps,
stock-aware lending protocols, AI/autonomous trading agents, Solana
stock-related protocols, tokenized-stock market infra, issuers configuring
markets. No hardcoded wallet, no privileged account, no manual demo state, no
hidden operator intervention — any legitimate developer must be able to use it.

## 6. CORE PROBLEM

Stock apps fail financially while looking technically healthy: stale prices
treated as live, splits misread as losses, dividends mis-accounted, closed
markets priced as open, agent actions on stale data, divorce between a token
and its underlying. Users discover these bugs with real money.

## 7. CORE PROMISE

Point JustFair at a stock application, run financial scenarios, get PASS/FAIL
with replay, expected-vs-actual, root cause, and fix guidance — then re-run
the same scenario to PASS. Optionally gate CI on it.

## 8. REAL USER JOURNEY

CONNECT/CONFIGURE APPLICATION → CHOOSE OR RUN FINANCIAL SCENARIOS →
JUSTFAIR TESTS APPLICATION → PASS/FAIL → REPLAY FAILURE → EXPECTED VS
ACTUAL → ROOT CAUSE → FIX GUIDANCE → DEVELOPER FIXES → RE-RUN → PASS →
OPTIONALLY ADD TO CI. Replay + remediation are core features, not extras.

## 9. STOCKLANA TRACK STRATEGY

MAIN TRACK: core JustFair product ($100,000, Solana Foundation).
SPONSOR 1 — PRESTOCKS: Private Markets Test Suite ($5,000).
SPONSOR 2 — METEORA DBC: Market Structure / DBC Stress Lab ($5,000).
SPONSOR 3 — TESSERA: T-Token / Token-2022 financial-behavior correctness
(bounty: Best Use of Tessera, $6,000 — OpenAI/Kalshi T-Tokens).
SKIPPED (per standing order, NOT targets): Clawpump "Stocknized Agent"
($5,000, requires clawpump+Meteora stock pool launch).

HISTORICAL SPONSOR PLAN (Phases 0–3):
Pyth / PreStocks / Meteora.
- Pyth was investigated thoroughly (parser, session semantics, History
  API research, skip-truthful probe test). No credential was ever
  available; legacy prod key proven NOT entitled to equity feeds.
- STALE_CARRIED_FORWARD_EQUITY remains as a GENERIC MARKET-DATA
  SAMPLE/SCENARIO with truthful SIMULATED classification. Pyth is not
  load-bearing and never blocks release.

CURRENT SPONSOR PLAN (Phase 4+, locked):
PreStocks / Meteora DBC / Tessera.

Reason:
Director decision following sponsor-fit review (Director Order 005).

## 10. SPONSOR ROLES (CURRENT: PreStocks / Meteora DBC / Tessera)

- PRESTOCKS must be load-bearing for: private-company lifecycle, valuation
  changes, acquisition, conversion, IPO/public transition,
  expiration/deadline state, portfolio + agent handling.
- METEORA DBC must be load-bearing for: real DBC configs, real SDK behavior,
  quote simulation, curve behavior, liquidity stress, price-discovery stress,
  graduation behavior, live mainnet pool inspection where useful.
- TESSERA must be load-bearing for: T-Token / Token-2022 financial-behavior
  correctness (live TransferFeeConfig drives fee expectations; gross-vs-net
  accounting invariants).
- PYTH (HISTORICAL, Phases 0–3): was investigated as Public Markets suite
  backbone (parser, session semantics, History API). No entitled credential
  ever existed; per Director Order 005 it is NOT a sponsor track, blocks
  nothing, and its market-data scenario remains only as a truthfully
  labeled SIMULATED sample. Do not reintroduce it as a blocker.

## 11. MASTER DIRECTOR STANDARD SUMMARY

A product is NOT complete because code exists, tests pass, the API responds,
the page deploys, or a screenshot looks good. The intended user must complete
the promised workflow from the deployed product. Mocks are for dev tests
only — never proof of finished integrations. Simulations must be labeled.
No fake live states, no hardcoded prices, no fabricated sponsor data, no
"real-time" without real-time data. UNKNOWN never becomes PASS.

## 12. WORKSPACE / REPO / PRODUCTION

- Workspace: `C:\Users\HomePC\Desktop\JustFair` (DO NOT rename, move, or fork;
  no parallel app; no StockSpec).
- Repo: `https://github.com/techkeyy/justfair` — WARNING (Phase 0 finding):
  `git remote -v` returns EMPTY in this clone. No remote is configured, so
  push/pull state vs the GitHub repo is UNVERIFIED. Do not assume this clone
  has ever been pushed;wire the remote only on explicit director approval.
- Branch: `main`. Tree: CLEAN (`git status --short` empty at Phase 0 close).
- Production: `https://justfair-theta.vercel.app` (Vercel; routes `/api/*`
  → serverless `api/index.js` → `src/server.js`; all else → `/public`
  static. No build step).
- Latest commit at takeover: `840f321 chore(release): Step 4 clarity proof
  screenshot`. Full 15-commit log in §26 notes (kept in git history).

## 13. CURRENT ARCHITECTURE

Verified from repository reality (Phase 0 reads):

FRONTEND (`public/`, vanilla JS + CSS, no framework)
- `app.js` (~3,700 lines, ESM served statically): STOCK_META registry,
  UNDERLYING_CATALOG, EXPECTATIONS_CONFIG, `appState` (tracker truth model),
  data-driven trade cards (`renderTradeCard`/`renderCardBodyMarkup`),
  result renderer (`renderCardResult`), handoff revalidation, evidence
  accordion, Step 1–3 Product Preflight UI.
- `index.html` (landing + app views), `styles.css` (design tokens, cards,
  responsive), `assets/` (hero art, 12 stock SVGs).
- State: module-level `appState`; no router (view toggles).

BACKEND (`src/`, Node ESM, single dependency `@solana/kit`, no framework)
- `server.js`: one HTTP handler; routes GET health/stocks/prices/sol,
  stream/status, SSE `/stream`, products catalog/compare/verify,
  POST product-preflight + preflight; static fallback; rate limiting
  (60 req/min), 1 MB payload cap.
- `preflight.js`: `runPreflight` — Jupiter V2 order → Token-2022 multiplier
  → benchmark ladder → economics (single-price vs bid/ask-quote models) →
  alternative-route comparison → unsigned simulation → verdict.
- `engine/`: `benchmark.js` (Nasdaq direct, Alpaca session quotes w/ feed +
  provenance, xStocks indicative, CoinGecko SOL, Pyth registry + gated
  streaming, session/freshness taxonomy), `jupiter.js` (V2 order +
  alternatives, retry/backoff), `multiplier.js` (scaled-UI-amount effective
  multiplier + corporate-action window), `simulation.js` (unsigned
  `simulateTransaction` + human error normalizer), `economics.js` (pure
  calculator), `verdict.js` (MEASURED until calibration COMPLETE),
  `alpaca.js` (credential-gated adapter).
- `product/`: `registry.js` (12 underlyings × 24 representations, mints),
  `issuerFacts.js` (Backed/Ondo capability facts w/ provenance),
  `matcher.js` (expectation evaluation, REQUIRED/OPTIONAL, profiles),
  `verifier.js` (on-chain Token-2022 verification), `comparator.js`
  (cross-issuer differences), `schema.js` (enums).
- `config.js`: USDC+SOL payments, 12 xStocks mints, upstream endpoints,
  timeouts, server limits (all secrets via env, none hardcoded).
- `cli.js`: `check` + `doctor` commands (live multiplier + preflight probe).
- `api/index.js`: Vercel serverless adapter (6 lines).

SOLANA
- Default RPC `https://api.mainnet-beta.solana.com` (override
  `SOLANA_RPC_URL`). Reads mint `ScaledUiAmountConfig`
  (multiplier/new_multiplier/effective timestamp); unsigned simulation via
  `simulateTransaction(replaceRecentBlockhash, sigVerify:false)`; NEVER
  signs/broadcasts (no key handling anywhere; verified by grep + E2E
  zero-custody test).

FINANCIAL DATA
- xStocks price-data (indicative), Nasdaq direct tape, Alpaca session quotes
  (server-side key only; absent without), Jupiter V2 orders, CoinGecko SOL
  spot, Pyth groundwork (13-feed registry; live streaming BLOCKED without
  `PYTH_API_KEY` locally, OPERATIONAL in production which holds a key).

TEST INFRASTRUCTURE
- `node:test` suites: `preflight.test.js` (49), `product-preflight.test.js`
  (52), `streaming.test.js` (6), `e2e.test.js` (14, stubbed upstreams via
  fetch interception + ephemeral server).
- `browser.test.js` (59 Playwright tests, inline fixtures, evidence
  screenshots to `docs/evidence/ui/`).
- `smoke_prod.js` (production classifier: SUCCESS/TRANSIENT/FAILURE).
- `scripts/revalidate-product-registry.js` (registry maintenance).

DEPLOYMENT
- Vercel (`vercel.json` routes above). Env (server-side only):
  `PYTH_API_KEY`, `ALPACA_API_KEY_ID`, `ALPACA_API_SECRET_KEY`,
  `JUPITER_API_KEY` (optional), `SOLANA_RPC_URL`, `PORT`. `.env`
  git-ignored; test fixtures use dummy credential strings only.

SECURITY BOUNDARIES (verified, §19 upheld)
- No private keys/seed phrases anywhere (grep clean). No signing, no
  broadcast, no custody, no broker behavior. Frontend takes only a public
  address for simulation. E2E asserts no `/execute`/`sendTransaction`.

## 14. REUSE MATRIX

Format: CURRENT PURPOSE → NEW JUSTFAIR USE → DECISION → REASON → RISK.

- Vercel deployment → identical hosting → KEEP → prod proven, zero-config →
  none known.
- Node/server single-handler architecture → scenario API host → KEEP →
  simplest working thing; routes extend cleanly → may need SSE scale later.
- Frontend shell (vanilla JS/CSS) → new dev-tool UI base → ADAPT → no
  framework to fight; rebuild journey on it → large new UI may want
  components later.
- CSS/design system → visual primitives → REUSE PRIMITIVE → tokens/cards/
  badges already coherent → none.
- Step tracker navigation → N/A → RETIRE → consumer journey, not dev loop →
  remove when new UI lands.
- Product Preflight UI (Steps 1–3) → N/A → RETIRE → old thesis surface →
  keep until replacement exists.
- Product Preflight matcher → assertion primitive for agent-safety
  scenarios → ADAPT → deterministic REQUIRED/OPTIONAL evaluation already
  exists → API shape may need scenario-oriented wrapper.
- Product registry (24 mints) → verified asset catalog → ADAPT → extend
  with PreStocks mints (`Pre...`) → mint churn if issuers change.
- Issuer facts → ground truth for rights/corporate-action scenarios →
  ADAPT → only curated fact base available → needs PreStocks family added.
- Execution Preflight (`runPreflight`) → execution-scenario primitive →
  ADAPT → quote economics + verdicts reusable → coupled to Jupiter; adapter
  seam needed (§H assumption 5).
- Quote checking → trade/fill scenarios → ADAPT → same reason → same risk.
- Revalidation → scenario re-run primitive → REUSE PRIMITIVE → re-run is
  the core loop's heartbeat → none.
- Jupiter handoff → N/A → RETIRE → new product tests apps, doesn't route
  users to Jupiter → replay links may want an equivalent later.
- Token-2022 multiplier handling → corporate-action scenarios → KEEP →
  load-bearing and correct per official docs → RPC dependence.
- Solana unsigned simulation → safe execution primitive → KEEP → zero-
  custody verification without funds → RPC rate limits.
- RPC error normalization → failure readability → KEEP → small, proven →
  none.
- Freshness/session model → market-state scenarios → ADAPT → sessions,
  staleness, carried-forward semantics are scenario fuel → Pyth session
  vocabulary differs; map carefully.
- Route comparison (deltas) → expected-vs-actual differ → REUSE PRIMITIVE
  → delta math is generic → none.
- `node:test` harness → same → KEEP → zero-dep, green → none.
- Playwright browser system → scenario replay Mater → KEEP → headed
  replay needs real browsers → video weight (see §24 risks).
- E2E stub system → scenario fixtures → KEEP → determinism pattern proven
  → must label sim-vs-live per §11.
- Smoke/doctor scripts → scenario health checks → ADAPT → pattern fits →
  none.
- README/docs → rewrite for new product → ADAPT (later phase) →
  HACKATHON.md facts partially reusable; README describes legacy product →
  stale until rewritten.
- Env configuration → same pattern + new keys → KEEP → clean posture →
  new keys must stay server-side.

## 15. CURRENT TEST BASELINE

All runs 2026-09-16 ~07:45–08:05 UTC (overnight session), Node v24.14.0,
win32/pwsh. No fixes applied (Phase 0 rule).

| COMMAND | RESULT | PASS | FAIL | NOTES |
|---|---|---|---|---|
| `node test/preflight.test.js` | PASS | 49 | 0 | incl. session, V2/V3, 017C, sim-err suites |
| `node test/streaming.test.js` | PASS | 6 | 0 | registry + gated streaming |
| `node test/product-preflight.test.js` | PASS | 52 | 0 | incl. 4 owner-UAT regression cases |
| `node test/browser.test.js` | PASS | 59 | 0 | headed-capable Playwright, evidence captured |
| `node test/e2e.test.js` | **1 FAIL** | 13 | 1 | "Alpaca quote selects ask reference": expects `upstream_source Alpaca Market Data (IEX)` + `feed iex`, got overnight derived feed. LAYER: test assertion, not product — run happened in OVERNIGHT session (03:49 ET); the test branches on CLOSED but hardcodes IEX for all other sessions. Session-dependent; expected to pass in PRE/POST-market windows. NOT fixed in Phase 0 (awaiting director order). |
| `node test/smoke_prod.js` | PASS | — | 0 | no product failures vs production |
| `node src/cli.js doctor` | PASS | — | — | live multiplier 1.003269…, live preflight SUCCESS/UNABLE (indicative, honest overnight) |
| `node src/cli.js check` | SUCCESS | — | — | quote report rendered |
| lint/typecheck | N/A | — | — | none configured (no eslint/prettier/tsc) |
| build | N/A | — | — | none (static + serverless, no build step) |
| `npm audit` | NOT RUN | — | — | single runtime dep `@solana/kit` + playwright; run before submission |

## 16. CURRENT PRODUCTION STATE

`https://justfair-theta.vercel.app` (inspected 2026-09-16): health HEALTHY
v1.0.0; 12 stocks; stream auth SERVER_AUTHENTICATED_BEARER/OPERATIONAL
(production holds PYTH_API_KEY); homepage renders full legacy product with
current-main copy (017C wording present → prod matches repo HEAD); no console
errors observed via fetch; API product-preflight returns correct verdicts
(probed during prior UAT). Page load is NOT proof of journeys — owner UAT
not started (explicitly out of scope).

## 17. OFFICIAL DOCUMENT FINDINGS

Labels: Confirmed (official source) / Inferred / Unknown.

STOCKLANA (Confirmed: https://hackathons.solana.com/hackathons/stocklana)
- Prize $121,000 total ($100K main + 5+5+5+6 bounties); 576 registered; 79
  submissions at inspection.
- ⚠️ CONTRADICTORY DEADLINE ON OFFICIAL PAGE: header/countdown say
  SEP 25, 2026 ("10 days UNTIL SUBMISSIONS CLOSE"); Timeline section says
  "Submissions close: Friday 18 September, 4:00pm ET", judging through
  Oct 2. HACKATHON.md recorded only Sep 18. Director must confirm which
  governs — this is the single most schedule-sensitive fact in Phase 0.
- Main track $100K (Solana Foundation). Judging = one question: "could this
  be a real app people will actually use" (real user+problem, working
  end-to-end demo, Solana-native reason, execution quality).
- Bounties: Meteora DBC $5K ("working code on mainnet beats slides";
  originality/soundness/post-hackathon life); Clawpump Stocknized Agent $5K
  (requires clawpump+Meteora stock pool — SKIPPED per order); PreStocks $5K
  (creativity/depth/quality; API https://prestocks.com/api/prestocks);
  Tessera $6K (OpenAI/Kalshi T-Tokens — SKIPPED per order); Pyth = 3 months
  Pro access, feeds named `Equity.US.AAPL/USD`, `Crypto.AAPLX/USD`,
  `Crypto.AAPLON/USD` (centrality/soundness/post-hackathon life).
- Submission: register, Submit Project, ≥1 link (GitHub/demo/video),
  teammates via form, edits allowed until close. One submission per team.
  Sponsor-track selection limit: Unknown (not stated on page).

SOLANA (Confirmed: solana.com/docs, spl.solana.com, token-2022 program source)
- Token-2022 program `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (matches
  our config). Scaled UI Amount: `multiplier`/`new_multiplier`/
  `new_multiplier_effective_timestamp`; pre-timestamp uses old, at/after
  uses new; NO new tokens created; conversions use FLOATING POINT and are
  NOT guaranteed to round-trip (scenario fuel for split/dividend math bugs).
- Official integration guidance: users see UIAmount; dApps compute on RAW
  amounts and convert at edge; historical feeds should provide BOTH scaled
  and non-scaled amounts; historical multiplier values must be accessible
  for accurate history. Our multiplier engine follows this exactly.

PYTH (Confirmed: docs.pyth.network)
- Two products: Core (decentralized feeds; Hermes API; since 2026-08-26
  Hermes REQUIRES an API key) and Pro / ex-Lazer (subscription, bearer
  `ACCESS_TOKEN`, WS `wss://pyth-lazer-{0,1,2}.dourolabs.app/v1/stream`,
  SDK `@pythnetwork/pyth-lazer-sdk`, JS examples repo, MCP server
  `https://mcp.pyth.network/mcp`).
- Equity feeds carry per-session schedules (regular/pre/post/overnight) +
  `marketSession` per update; since 2026-03-23 closed-market Pro prices are
  CARRIED FORWARD — detect via `feedUpdateTimestamp` vs `timestampUs`
  mismatch (exact stale-data trap our scenarios should test).
- History API (`https://pyth.dourolabs.app/v1`, TradingView UDF): price-at-
  timestamp (µs), range (max 60-SECOND window — constrains bulk backfill
  design), OHLC; 401 no token / 403 not entitled / 404 unknown feed.
- 24/7 Pyth Indices exist (AAPL/NVDA/TSLA/MSFT/GOOGL/…); Blue Ocean 24/5
  partnership. Pro key acquisition via Pro portal (pricing page not opened:
  Unknown exact cost; bounty prize covers 3 months).

PRESTOCKS (Confirmed: LIVE fetch of https://prestocks.com/api/prestocks,
no auth, 2026-09-16)
- 8 products (ANDURIL, ANTHROPIC, FIGUREAI, KALSHI, NEURALINK, OPENAI,
  POLYMARKET, SPACEX). Schema per product: name/symbol/description/image/
  external_url/contract_address (Solana `Pre...` mints)/markPrice/
  markValuation/tokenPrice/impliedValuation/supply.
- SPL tokens, Jupiter-tradable (directly quotable like xStocks), 24/7, 1:1
  SPV-backed, NO legal rights (no ownership/voting/dividends), KYC only for
  mint/redeem, large-holder USDC redemption, IPO/acquisition → SPV
  distribution to holders. `tokenPrice` vs `markPrice` spread is a ready-made
  divergence signal.
- Lifecycle/acquisition/conversion/IPO-transition/expiry fields are NOT in
  the listing schema (appear editorially: blog/FAQ). Lifecycle-event API:
  UNVERIFIED — Phase 1 check: product detail pages + FAQ.

METEORA DBC (Confirmed: docs.meteora.ag, MeteoraAg GitHub)
- Permissionless bonding-curve launches; 1–16 curve segments; quote token,
  fee schedules, graduation threshold configurable; graduates to DAMM v1/v2
  pools; mainnet program `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`
  (same default on devnet).
- TS SDK `@meteora-ag/dynamic-bonding-curve-sdk` (+web3.js/spl-token/bn.js):
  config + pool creation, Token-2022 INCLUDING transfer-hook flows, swap
  QUOTES, swaps, fee claims, migration builders, STATE READS; mainnet
  migration keepers exist; docs MCP + `llms.txt`; devnet faucets.
- Read-only inspection + quote simulation need NO funds or custody.

## 18. SOURCE-OF-TRUTH TABLE

| INTEGRATION | CAPABILITY NEEDED | OFFICIAL API/SDK | VERSION | AUTH? | MAINNET? | HISTORICAL? | READ-ONLY? | SIMULATION? | LIMITS | FAILURE BEHAVIOR | LOAD-BEARING ROLE | OPEN QUESTION |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Solana RPC (mainnet-beta) | mint state, multiplier, unsigned sim | JSON-RPC + `@solana/kit` v8 | kit ^8.3.0 (repo) | No | Yes (default) | No (state is current-only) | Yes | Yes (`simulateTransaction`) | public rate limits | honest RPC errors (normalized) | corporate-action + execution primitives | none (proven in prod) |
| Pyth Core/Hermes | reference feeds, staleness signal | Hermes REST/SSE, `@pythnetwork/hermes-client` | post-2026-08-26 (key required) | API key (free tier TBD) | Feed accounts on mainnet | via Benchmarks service | Yes | N/A (data) | key-gated | stale flag when providers stall | fallback/session reference data | free key terms |
| Pyth Pro | sessions, history, carried-fwd detection, 24/7 indices | WS+REST `pyth.dourolabs.app`, `@pythnetwork/pyth-lazer-sdk` | current (ex-Lazer) | YES bearer (subscription) | Yes | YES (point/range≤60s/OHLC) | Yes | N/A (data) | 403 if not entitled | 401/403/404 coded; carried-forward flagged | Public Markets suite data backbone | key acquisition (bounty covers 3 mo) |
| PreStocks | private-market products + prices | `https://prestocks.com/api/prestocks` (verified live) | live schema §17 | No | Yes (SPL `Pre...` mints) | No (current snapshot only) | Yes | via Jupiter quotes | unknown rate limits | HTTP errors; thin markets | Private Markets suite catalog+prices | lifecycle-event endpoint? |
| Meteora DBC | curve configs, quotes, graduation | `@meteora-ag/dynamic-bonding-curve-sdk`, program `dbcij3LW…4DuSMaqN` | current docs | No (reads) | Yes + devnet | No (live state) | YES (state/quote reads) | YES (quote sim, devnet) | RPC-bound | tx simulation errors | DBC Stress Lab mechanics | equity-suitable curve params (design) |

## 19. SECURITY CONTRACT

Upheld and verified in Phase 0 (grep + E2E zero-custody test + secrets scan):
no private keys/seed phrases, no fund holding, no arbitrary signing, no
broadcast of user trades, no broker behavior, no Jupiter silent execution, no
privileged secrets in frontend (all server-env). Simulation is inspect-only.
This contract carries into the new product unchanged unless a director
explicitly revises it.

## 20. LOAD-BEARING ASSUMPTIONS

- ASSUMPTION 1 — enough real/historical public-market state exists for
  meaningful scenarios. STATUS: LIKELY. Evidence: Pyth history/sessions/
  carried-forward semantics (docs); Nasdaq/indicative ladder already live in
  repo. Needs: Pro key + entitlement for target feeds.
- ASSUMPTION 2 — Pyth covers current+historical/session needs for first
  Public Markets scenarios. STATUS: SUPERSEDED (Phase 4 sponsor
  realignment — Pyth is not a sponsor track). Research preserved in §17;
  market-data scenario remains a truthfully labeled SIMULATED sample.
- ASSUMPTION 3 — PreStocks data suffices for ≥1 meaningful private-market
  scenario. STATUS: CONFIRMED (Phase 1). Evidence: live listing API (8
  products, full schema) + official SpaceX page IPO/conversion/expiry case
  (§21B). Lifecycle modeled as authoritative event fixtures, not live API.
- ASSUMPTION 4 — DBC SDK/config logic usable without custody or funded
  launch. STATUS: CONFIRMED (Phase 3, mainnet state read). Evidence: live
  mainnet pool+config reads + pre-pool quote math via official SDK, zero
  signing/broadcast/funds (§21B). Live quote on graduated pools correctly
  refused per state; active-pool quoting proven via the same math path.
- ASSUMPTION 5 — arbitrary dev apps integrate via a small adapter/test-
  target contract. STATUS: LIKELY (was UNVERIFIED). Evidence: v1 HTTP
  contract + two independent fixture targets + generic runner proven
  (§21B). Remaining: arbitrary remote-URL path (SSRF-safe hosted
  execution) NOT YET PROVEN — no public endpoint wired in Phase 1.

## 21. CURRENT BUILD PHASE

PHASE 1 (Director Order 002, in progress). No Phase 2 work started.

## 21B. PHASE 1 WORK LOG (continuous)

- Remote: `git ls-remote https://github.com/techkeyy/justfair.git` →
  "Repository not found." Subtask STOPPED per order §8; NO remote added.
  Remote wiring = BLOCKED with evidence (repo inaccessible anonymously —
  private, renamed, or never pushed; unverifiable from here).
- E2E flake: reproduced across sessions (OVERNIGHT 13/14 FAIL →
  PRE_MARKET 14/14 PASS, same code). Root cause PROVEN: engine selects feed
  by session (`benchmark.js:175`, correct); test hardcoded IEX for all
  non-CLOSED sessions. Fixed test-only (`test/e2e.test.js` derives
  expected feed/upstream from live session; covers regular/pre/post/
  overnight/closed). Commit `0f6144e`. No engine behavior changed.
- Pyth entitlement probe (non-secret, public prod endpoint): prod
  `/api/v1/stream` connects; SOL flows via CoinGecko; upstream Pyth equity
  feed returns **HTTP 403 "Not entitled … asset type 'equity'"**. The
  legacy production PYTH_API_KEY authenticates but is NOT entitled to
  equity feeds — it is NOT a valid credential for our target feeds. Local
  shell has no PYTH_API_KEY at all.
- Pyth key path (official docs): sign up free at app.pyth.com (Pyth Terminal)
  → log in → "View your API key" → trial Pro key; use as
  `Authorization: Bearer` server-side ONLY (frontend must use short-lived
  JWT via POST /auth/token). Note tension: May-2026 Pyth post says API
  access needs paid Starter/Pro (from $500/mo, 14-day trial). OWNER ACTION
  REQUIRED — PYTH PRO KEY. Phase 1 continues on deterministic fixtures;
  INTEGRATION PROVEN gate cannot pass without a key.
- Adapter decision (MAIN PRODUCT DECISION): versioned HTTP test adapter —
  `GET /justfair/v1/manifest` (`adapterVersion/name/capabilities`) +
  `POST /justfair/v1/evaluate` (`scenarioId/scenarioVersion/inputs` →
  observations object). Smallest workable: no SDK, no auth, no DB; target
  owns only observable behavior; JustFair never reads target verdicts
  (runner has no verdict field at all). Rejected: uploaded-code execution,
  full-app exposure, SDK ceremony. SSRF: scheme allowlist (http/https),
  localhost/private/metadata blocked without explicit test-only opt-in,
  10s timeout, 64KB cap, JSON-only; NO public endpoint wired in Phase 1,
  so arbitrary-user URL support is NOT YET PROVEN (runner is a library +
  localhost fixtures only).
- Scenario core: `src/scenarios/` — `adapter.js` (contract + guards),
  `scenario.js` (schema + `runScenario`: manifest gate → evaluate → judge),
  `pyth.js` (official carried-forward semantics parser + keyed fetcher),
  `first-scenario.js` (STALE_CARRIED_FORWARD_EQUITY v1, evidence labeled
  SIMULATED). Result states PASS/FAIL/UNABLE_TO_VERIFY; timeouts, missing
  caps, malformed/oversized responses, unreachable targets → UNABLE, never
  PASS or FAIL. No LLM, no invented patches; deterministic failure catalog
  (STALE_REFERENCE_TREATED_AS_LIVE + INVENTED_OBSERVATION).
- Vertical slice (same contract, no target-specific code): naive fixture
  → FAIL (expected STALE_REFERENCE_TREATED_AS_LIVE + replay + guidance);
  correct fixture → PASS; re-run deterministic. Suite
  `test/justfair-scenarios.test.js` 17/17.
- PreStocks lifecycle: CONFIRMED. Official product page
  https://prestocks.com/spacex states: "SpaceX has gone public! SpaceX
  PreStocks tokens must be swapped into $SPCXx or any other token before
  11:59pm UTC on 12 March 2027, or they will expire worthless." Exact
  candidate: EXPIRY_DEADLINE_HANDLING (portfolio must surface the
  conversion deadline; must not value post-deadline holdings at live
  mark). Lifecycle detail is page-level authoritative content → model as
  authoritative event fixture, never as live lifecycle API.
- Meteora kill-gate: CONFIRMED. SDK `@meteora-ag/dynamic-bonding-curve-sdk`
  v1.5.12 on npm (no funds to install); read-only pool/config inspection +
  quote simulation + devnet faucets per official docs; program
  `dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN`. Intended Phase-later
  calls: client.init → pool/config state reads → swap-quote simulation →
  graduation-progress reads. No custody, launch, funds, or issuance needed.
- Phase 2 CLI: `node src/cli.js test --target http://localhost:PORT
  [--scenario ID] [--json] [--out file]` (localhost-only enforced).
  Exit 0 = all PASS, 1 = any FAIL, 2 = UNABLE/config. Incompatible
  scenarios SKIP (listed, uncounted). Manual rerun proof: example adapter
  naive → FAIL exit 1 (STALE_REFERENCE_TREATED_AS_LIVE + replay), correct
  → PASS exit 0. Same scenario/runner/evidence/invariant. Example:
  `examples/adapter-basic/` (<50 lines, naive/correct modes). Contract doc:
  `docs/adapter.md`. Artifact: {runId,target,startedAt,completedAt,
  summary,results} via --json/--out.
- PreStocks scenario #2 live: PRESTOCKS_EXPIRY_{BEFORE,NEAR,AFTER} through
  the generic engine (3 variants, injected timestamps, one invariant
  family). Naive AFTER → FAIL EXPIRED_REPRESENTATION_TREATED_AS_LIVE;
  correct → PASS all three. Live listing API re-verified in-test
  (SPACEX shape asserted when reachable, honest unreachable otherwise).
- Meteora reality proof (Phase 2, read-only): SDK v1.5.12 installed
  --no-save (repo manifests verified untouched; dep lives in gitignored
  node_modules only). Discovery via official program: VirtualPool
  discriminator (IDL bytes d5e005d16245775c) + IDL-derived 424-byte size →
  82,288 devnet VirtualPool accounts. Live state read of pool
  11iuqvcUBTL4FrqytcnJVoNgRoEh3mpDK2cLa41BV8n (config, creator, baseMint,
  vaults, baseReserve 999262737704611265, quoteReserve 19698005,
  sqrtPrice, migrationProgress 0 = active bonding, poolType 1 =
  Token-2022). Live quote math: 1,000,000,000 base units → outputAmount 25,
  tradingFee 1 (pure local math over fetched state). Signed: nothing.
  Broadcast: nothing. Funds: none. Caveat: mainnet-beta stalls
  getProgramAccounts from public endpoints, so enumeration ran on devnet
  (same program ID both networks per docs); mainnet single-account reads
  use the identical getAccountInfo path our engine already uses daily.
  DBC_OPENING_WHALE stays CONTRACT_ONLY in Phase 2 (SDK-backed execution
  deferred to Phase 3 to avoid adding the dep); pure policy comparator
  tested.
- Pyth: key STILL ABSENT at Phase 2 close → Scenario #1 stays
  SIMULATED_PYTH_SEMANTICS; skip-truthful live probe test added (runs only
  with a key, never commits credentials). INTEGRATION PROVEN still blocked.
- Phase 3 Meteora mainnet: discovery via public meteora-dbc pool listing
  (GeckoTerminal, third-party), VERIFIED on-chain (owner = DBC program +
  SDK decode). Burpee/SOL pool 2yy2jaV8EQY64twJ2fxTbykBFyatPSnmtLicmRXkh3LW
  (+4 more): all graduated (progress 3) — active bonding pools graduate in
  minutes. Full state+config read on mainnet-beta (reserves, sqrtPrice,
  migration state, poolType, quoteMint SOL, migrationOption DAMM v2).
  Quote on graduated pool honestly refused by SDK ("Virtual pool is
  completed") → state-read PASS / quote-unavailable-per-state. Quote math
  proven on the same code path via pre-pool simulation for the whale.
- DBC_OPENING_WHALE executable: real PoolConfig → SwapQuoteConfig mapping
  → getQuoteFromInputAmount (marginal probe + size) → impact vs issuer
  policy. Live: 1 SOL on Burpee config = 2.500% → PASS vs 8%; $20k-equiv =
  SDK "Insufficient Liquidity" → FAIL CURVE_CAPACITY_EXCEEDED (documented
  mapping: unexecutable size is a violation, not UNABLE). CLI `whale`
  command (0/1/2) + POST /api/v1/dbc/whale (validated, rate-limited, no
  secrets/keys/URLs in input). SDK added as repo dep (1.5.12 + web3.js
  1.99 + bn 5.2.5) — explicitly ordered, manifests recorded.

## 22. COMPLETED PHASES

- Legacy JustFair through owner-UAT bugfixes (017C + copy/UX passes) —
  preserved, production-green. See git log.
- PHASE 0: PASS (this report; criteria §24 all met — deadline contradiction
  recorded as risk, not blocker, since Timeline text + prior spec agree on
  Sep 18 4pm ET and work proceeds against the earlier date).
- PHASE 1: PARTIALLY BLOCKED — all engineering gates PASS except live Pyth
  Pro proof, which needs an owner credential (key absent locally; legacy
  prod key proven NOT entitled to equity feeds). No code reason blocks it:
  fetcher, parser, and fixture-shaped proofs are green.
- PHASE 2: ENGINEERING PASS (Pyth live leg still blocked on the same owner
  key). Proven: localhost CLI loop (naive FAIL exit 1 → correct PASS exit
  0), PreStocks expiry scenario family through the generic engine,
  real DBC state+quote proof without custody/funds/signing, all suites
  green (preflight 49, streaming 6, product 52, browser 59, e2e 14,
  scenarios 25, cli 6).
- PHASE 3: PASS (Pyth live leg still blocked on the same owner key).
  Proven: mainnet DBC state+config read, executable whale (PASS 2.500% /
  FAIL capacity / UNABLE inputs) via CLI + server endpoint + web UI,
  reconstructed surfaces (home/test/replay/dbc) with 7 new browser tests,
  all suites green (preflight 49, streaming 6, product 52, browser 66,
  e2e 15, scenarios 25, cli 9, dbc 5, smoke clean).
- PHASE 2 CORRECTION (recorded Phase 3): the Phase 2 Meteora proof ran on
  DEVNET, not mainnet. Mainnet integration was NOT proven in Phase 2.
- PHASE 3 (in progress): mainnet DBC proof via direct known-pool reads;
  DBC_OPENING_WHALE executable on real SDK math; web reconstruction
  (home/test/replay/dbc-stress); legacy consumer UI demoted, not deleted.
- Phase 3 production incident + fix: /api/v1/dbc/whale failed live with
  ERR_REQUIRE_ESM (Vercel runtime predates require(esm); rpc-websockets
  pulls ESM-only uuid v14). Fixed with engines node 22.x AND a targeted
  npm override (rpc-websockets -> uuid ^9 CJS, v1() API-stable); local
  behavior identical (whale PASS 2.500% before/after). Lesson: local Node
  24 masked a serverless-runtime gap — verify deploy-target runtime for
  new native/CJS-mixed deps.
- Phase 3 legacy decision (explicit): legacy Steps UI + its 59 browser
  tests stay served and green (demote-not-delete). Rationale: harness +
  prod behavior depend on it; full retirement is a later-phase director
  call. New thesis is primary (hero/nav/CTAs).
- Phase 3 test maintenance: legacy "no @solana/web3.js" hygiene test now
  encodes the ordered Meteora exception (SDK present + imports confined to
  src/scenarios/dbc-live.js). One transient browser flake observed (65/66,
  unidentified, non-repeating; 3 subsequent full runs 66/66).
- Phase 4 Tessera truth (official API + docs + mainnet, 2026-09-16):
  T-OpenAI mint oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ ($812.79,
  8259 holders) + T-Kalshi TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ;
  both Token-2022, 9 decimals, TransferFeeConfig 20bps, max u64MAX
  (cap unreachable naturally → covered in unit tests), epochs 987/922
  vs chain 1035. Docs: 0.20% standard, sender-pays, changeable on-chain.
  Scenario TESSERA_TRANSFER_FEE_ACCOUNTING (live_tessera_token2022):
  1000 units → fee 2 → net 998; naive FAIL / correct PASS proven via
  real spawned CLI (exits 1/0) + suites (13/13 incl. official spl-token
  calculateFee cross-check, rounding edges, cap, coded
  NO_TRANSFER_FEE/NOT_TOKEN2022/BAD_MINT states). No signing/broadcast/
  funds. Sample tessera-fail.json engine-generated with capture time.
- Phase 4 GitHub: `gh auth status` = logged in as Techkeyy, but
  techkeyy/justfair does NOT resolve and no justfair repo exists in the
  account listing → OWNER ACTION REQUIRED — GITHUB REPOSITORY ACCESS.
  Nothing created, nothing pushed.
- Phase 4 nav coherence: Dashboard/App/How/API tabs removed from primary
  nav (no test depended on them); Test / Replay Lab / DBC Stress remain;
  legacy app reachable via hero + footer (secondary, not flagship).
- PHASE 4: PASS — OWNER UAT PENDING. Tessera live end-to-end, all suites
  green (preflight 49, streaming 6, product 52, browser 67, e2e 15,
  scenarios 25, cli 11, dbc 5, tessera 13, smoke clean), README rewritten,
  release hardening done. Pyth explicitly NOT a blocker (sponsor
  realignment); GitHub access is the remaining release blocker.
- UAT FIX 001 (homepage coherence): 7 legacy consumer sections removed
  from the public homepage (two-mistakes, pillars, two-layer comparison,
  $500 example, old 4-step, proof stats, wallet-framed API) + Preflight
  badge, Open App header CTA, Start-a-Preflight hero/footer CTAs, legacy
  footer framing. Replaced with HOW IT WORKS (CONNECT/TEST/BREAK/FIX/
  VERIFY), WHAT JUSTFAIR TESTS (5 packs, implemented-labeled), engine-
  sampled Tessera failure (runtime-populated from canonical sample),
  dev integration block, subtle sponsor proof, scenario API drawer.
  Legacy app code/tests untouched and green; entry via footer legacy
  link. Section tests 2-7 rewritten to current truth; absence regressions
  added (no preflight narrative/badge/CTA on homepage).
- UAT FIX 001 (homepage coherence): removed 7 legacy consumer sections
  (two-mistakes, pillars, two-layer comparison, $500 example, old 4-step
  how-it-works, proof stats, wallet-framed API) + Preflight badge, Open
  App header CTA, Start-a-Preflight hero CTA, legacy footer framing.
  Replaced with HOW IT WORKS (CONNECT/TEST/BREAK/FIX/VERIFY), WHAT
  JUSTFAIR TESTS (5 packs), engine-sampled failure example (populated
  from /samples/tessera-fail.json at runtime), dev integration block,
  subtle sponsor proof, rewritten API drawer (/api/v1/dbc/whale).
  Legacy app code/tests untouched and green; entry via footer legacy
  link (all 12 app-entry test clicks repointed). Stale section tests
  2-7 rewritten to current truth; new absence regressions added.

## 23. BLOCKERS

1. Git remote / GitHub repo: `git ls-remote
   https://github.com/techkeyy/justfair.git` → "Repository not found";
   `gh auth status` = logged in as Techkeyy, but no justfair repo exists
   in the account listing. NO remote added, nothing created/pushed.
   Submission needs a public repo link — OWNER ACTION REQUIRED.
2. Pyth Pro credential: HISTORICAL ONLY — legacy prod key proven NOT
   entitled to equity feeds; no local key. Per sponsor realignment this
   blocks NOTHING (not a sponsor track, not required for release).

## 24. OPEN RISKS

1. Deadline contradiction (Sep 18 4pm ET vs Sep 25 header) — confirm with
   organizer; build against Sep 18 (~2 days).
2. No git remote in this clone — cannot verify GitHub parity; wire only on
   approval. Submission needs a public repo link.
3. E2E Alpaca test is session-dependent (fails in OVERNIGHT windows) —
   flaky gate for future CI; needs session-agnostic rewrite in Phase 1.
4. Repo weight: 1.09 GB worktree / 364 MB git objects; 53 videos remain
   TRACKED in history (gitignore covers new ones only); `scratch/` (40+
   scripts) tracked. Clone cost + submission hygiene.
5. No lint/typecheck configured; single-dep footprint is a strength, keep.
6. Pyth Pro key + feed entitlement unresolved (bounty covers 3 months;
   acquisition path open).
7. Assumption 5 (adapter contract) entirely unverified — biggest product
   risk.
8. Production holds PYTH_API_KEY (operational) — key rotation/ownership
   must be confirmed with owner; local dev cannot exercise streaming.

## 25. FILES CHANGED

- Phase 0: `DIRECTOR.md` (created).
- Phase 1: `test/e2e.test.js` (session-agnostic feed expectations, test-only);
  `src/scenarios/adapter.js` + `scenario.js` + `pyth.js` +
  `first-scenario.js` (new engine); `test/fixtures/adapter-targets.js` +
  `test/justfair-scenarios.test.js` (new proof).
- Phase 2: `src/cli.js` (local `test` runner); `src/scenarios/index.js`
  (registry) + `prestocks.js` (scenario #2) + `dbc.js` (whale contract);
  `src/scenarios/scenario.js` (+`authoritative_event_fixture`);
  `examples/adapter-basic/` (sample target); `docs/adapter.md`;
  `test/cli.test.js` + `test/justfair-scenarios.test.js` (Phase 2 cover);
  `test/fixtures/adapter-targets.js` (+lifecycle target).
- Phase 3: `src/scenarios/dbc-live.js` (executable whale) +
  `src/cli.js` (`whale` cmd) + `src/server.js` (`POST /api/v1/dbc/whale`);
  `package.json`/`package-lock.json` (SDK trio, ordered);
  `public/index.html` (new hero/nav/test/replay/dbc views + footer) +
  `public/app.js` (view routing, Replay Lab, DBC form) +
  `public/styles.css` (Phase 3 section) + `public/samples/*.json`
  (engine-generated); `test/browser.test.js` (7 new surface tests) +
  `test/e2e.test.js` (hero + whale-route tests) + `test/dbc.test.js` +
  `test/cli.test.js` (whale CLI tests); `package.json` engines 22.x +
  uuid override (serverless compat).

## 26. IMPORTANT COMMITS

- Phase 0 commit: `docs(phase0): add DIRECTOR.md takeover document`
  (single commit; hash recorded at commit time).
- Phase 1: `0f6144e test(e2e): make market-session expectations deterministic`
  → `9d256e8 feat(adapter): define JustFair test-target contract` →
  `930b726 feat(scenarios): prove first financial correctness vertical slice`
  → `9da35c2 feat(pyth): add server-side public-market evidence adapter` →
  `docs(director): record phase 1 validation state` (this file).
- Prior history (legacy product, preserved): `840f321` Step 4 clarity
  screenshot → `7bbdc69` Step 4 UX pass → `8e8b3d4` sim-error normalization
  → `e7c7a43` product-match contradiction fix → `192756e` copy
  disclosures → `cc07930` 017C quote-safe routes → `c6abda1` 017B
  execution-reference split → `9844a42` 017A Alpaca provenance →
  `20bb126` Alpaca session quotes → earlier Jupiter/benchmark/UAT work.

## 27. CURRENT USER-FACING STATUS

Legacy JustFair live and green at https://justfair-theta.vercel.app
(consumer pre-trade safety). New crash-testing product: NOT STARTED (by
design). No demo, no scenarios, no new UI exist yet.

## 28. NEXT DIRECTOR ORDER

Recommended PHASE 1 (awaiting order, DO NOT START): (a) confirm deadline +
wire git remote; (b) make E2E session-agnostic; (c) verify Pyth Pro key
path + one entitled equity feed end-to-end (cheapest risky-core proof);
(d) validate PreStocks lifecycle surface; (e) draft the test-target adapter
contract (assumption 5); (f) pick the SMALL scenario set (2–4) proving one
category end to end with replay + fix guidance.

## 29. THINGS THAT MUST NOT BE REGRESSED

Zero-custody boundaries (§19); Token-2022 multiplier math (matches official
docs); unsigned-simulation isolation; API contracts (`/api/v1/*` shapes);
MEASURED-not-FAIR honesty; UNKNOWN-never-PASS; session≠freshness split;
neutrality (no substitution); env-only secrets; green baselines in §15
(modulo the documented session-dependent E2E case).

## 30. EXACT STATUS LANGUAGE

Legacy product: production-green, preserved, FROZEN pending director orders.
New product: NO CODE WRITTEN. Phase 0: PASS (below). Never report DONE,
FINISHED, SHIPPED, PRODUCTION READY, or SUBMISSION READY for the new
product — none apply.
