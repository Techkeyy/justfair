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
SPONSOR 1 — PYTH: Public Markets Test Suite (bounty prize = 3 months Pyth
Pro access, NOT cash).
SPONSOR 2 — PRESTOCKS: Private Markets Test Suite ($5,000).
SPONSOR 3 — METEORA DBC: Market Structure / DBC Stress Lab ($5,000).
SKIPPED (per standing order, NOT targets): Clawpump "Stocknized Agent"
($5,000, requires clawpump+Meteora pool launch) and Tessera "Best Use of
Tessera, Pre-IPO stocks" ($6,000, OpenAI/Kalshi T-Tokens).

## 10. SPONSOR ROLES

- PYTH must be load-bearing for: equity reference prices, tokenized-stock
  prices, freshness, historical data, market sessions, divergence,
  financial-invariant testing. Never a logo or fetch demo.
- PRESTOCKS must be load-bearing for: private-company lifecycle, valuation
  changes, acquisition, conversion, IPO/public transition,
  expiration/deadline state, portfolio + agent handling.
- METEORA DBC must be load-bearing for: real DBC configs, real SDK behavior,
  quote simulation, curve behavior, liquidity stress, price-discovery stress,
  graduation behavior, live mainnet pool inspection where useful.

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
  Public Markets scenarios. STATUS: LIKELY. Evidence: §17 Pyth findings
  (sessions per update, 60s range windows, OHLC, indices). Needs: key;
  design around 60s range limit + entitlement 403s.
- ASSUMPTION 3 — PreStocks data suffices for ≥1 meaningful private-market
  scenario. STATUS: LIKELY for product/price/divergence (live API verified
  this phase); lifecycle/acquisition/conversion/IPO/expiry API UNVERIFIED.
  Phase 1 check: product detail pages + FAQ.
- ASSUMPTION 4 — DBC SDK/config logic usable without custody or funded
  launch. STATUS: LIKELY. Evidence: read-only state/quote reads, devnet,
  no-funds inspection (docs). Creating pools still needs funds — crash-
  testing others' configs does not.
- ASSUMPTION 5 — arbitrary dev apps integrate via a small adapter/test-
  target contract. STATUS: UNVERIFIED. No evidence yet; Phase 1 design task
  (URL/API-adapter + fixture-injection seam). This is the product's
  riskiest unknown after the deadline question.

## 21. CURRENT BUILD PHASE

PHASE 0 (this order). No Phase 1 work started.

## 22. COMPLETED PHASES

- Legacy JustFair through owner-UAT bugfixes (017C + copy/UX passes) —
  preserved, production-green. See git log.
- PHASE 0: PASS (this report; criteria §24 all met — deadline contradiction
  recorded as risk, not blocker, since Timeline text + prior spec agree on
  Sep 18 4pm ET and work proceeds against the earlier date).

## 23. BLOCKERS

NONE that stop Phase 1 planning. (No remote configured limits push
verification only; deadline contradiction needs director confirmation but
building against Sep 18 is the safe posture.)

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

- `DIRECTOR.md` (CREATED, this file). Nothing else touched in Phase 0.

## 26. IMPORTANT COMMITS

- Phase 0 commit: `docs(phase0): add DIRECTOR.md takeover document`
  (single commit; hash recorded at commit time).
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
