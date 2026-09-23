# JUSTFAIR — DIRECTOR TAKEOVER STATE

> Authoritative takeover document. Maintained by the builder inside the repo.
> A new director must be able to continue from this file alone.
> Last updated: 2026-09-17 (standing-rule restructure; UAT Step 2 proof pending).

---

## 1. PRODUCT IDENTITY

JUSTFAIR. Workspace: `C:\Users\HomePC\Desktop\JustFair`, branch `main`.
Production: `https://justfair-theta.vercel.app` (Vercel; `/api/*` →
serverless `api/index.js` → `src/server.js`; static → `/public`; no build
step). Do NOT rename, move, fork, or parallel-build. No StockSpec.

## 2. CURRENT PRODUCT DEFINITION

**JustFair crash-tests stock applications before users discover the
financial bugs.** A financial-correctness crash-testing platform for stock
applications and stock-market infrastructure on Solana. Positioning: "Break
your stock app before the market does." Software may compile, return
HTTP 200, execute a Solana transaction, return a valid quote, or show a
balance while still producing a financially incorrect outcome. JustFair
exists to find those failures.

## 3. LEGACY PRODUCT DEFINITION

Consumer tokenized-stock pre-trade safety app ("Know what you're buying.
Then check the fill."): Product Preflight (Steps 1–3, token capability
matching) + Execution Preflight (Step 4, Jupiter DEX quote checking).
Theses: product-comparison, representation-truth as primary product,
Jupiter-oriented execution. NOT the product direction since Director
Order 001 (2026-09-16). Legacy code/tests remain internally where useful;
legacy is NOT the public product (UAT Fix 001/001A/001B removed it from
homepage, nav, hero, footer).

## 4. CORE USER

Developers and teams building stock wallets, tokenized-stock wallets and
interfaces, DEXes, portfolio/accounting apps, stock-aware lending, AI and
autonomous trading agents, Solana stock protocols and market infra, and
issuers configuring markets. No hardcoded wallet, privileged account,
manual demo state, or hidden operator intervention.

## 5. PROBLEM

Stock apps fail financially while looking technically healthy: stale prices
shown as live, splits misread as losses, dividends mis-accounted, closed
markets priced as open, expired holdings still valued, transfer fees
ignored, agents acting on stale data, token divorced from underlying. Users
discover these bugs with real money.

## 6. CORE PROMISE

Point JustFair at a stock application, run financial scenarios, get
PASS/FAIL with replay, expected-vs-actual, root cause, and fix guidance —
then re-run the same scenario to PASS. Optionally gate CI on it.

## 7. CURRENT USER JOURNEY

adapter → local JustFair CLI → scenario engine → PASS / FAIL /
UNABLE_TO_VERIFY → justfair-result.json → Replay Lab → expected vs actual
→ replay → root cause → fix guidance → rerun → PASS. Concrete command:

```sh
node src/cli.js test --target http://localhost:3000 --out justfair-result.json
```

(Contributor path runs from the repo root. Public developer path uses the published package `justfair@1.0.0` via `npx justfair@latest ...`; see §25.)

## 8. CURRENT ARCHITECTURE

`src/cli.js` — `test` runner (localhost-only, exit 0/1/2, `--json`/`--out`
artifact) + `whale` command + legacy `check`/`doctor`.
`src/scenarios/` — `adapter.js` (v1 HTTP contract + SSRF guards),
`scenario.js` (schema + generic `runScenario`), `index.js` (static
registry), `first-scenario.js`, `prestocks.js`, `tessera.js`, `dbc.js`
(contract + `DBC_LAUNCH_SWEEP` descriptor) + `dbc-live.js` (executable whale
+ launch-stress sweep sharing one local quote core), `pyth.js`
(parser/fetcher, historical only).
`src/server.js` — single handler: legacy preflight/product routes +
`POST /api/v1/dbc/whale` (single-size, unchanged) + `POST /api/v1/dbc/sweep`
(sweep report; validated, rate-limited); static fallback.
`src/engine|product|config.js` — legacy Jupiter/benchmark/multiplier/
simulation/verdict + 12-underlying × 24-representation registry (reused
primitives; see §14).
`public/` — vanilla JS/CSS, no framework, no build: new hero/nav/Test view/
Replay Lab/DBC Stress view + samples; legacy Steps UI retained internally.
`test/` — node:test suites + Playwright; `test/fixtures/adapter-targets.js`
(naive/correct/lifecycle/fee fixtures).
`examples/adapter-basic/` — <50-line sample target (naive/correct modes).
`docs/adapter.md` — the v1 contract. `scripts/` — registry maintenance.

## 9. ADAPTER CONTRACT

`GET /justfair/v1/manifest` → `{adapterVersion: "1", name,
capabilities[]}`. `POST /justfair/v1/evaluate` ← `{scenarioId,
scenarioVersion, inputs}` → observations object ONLY (any
`pass`/`verdict` field is ignored — JustFair owns judgment). Capabilities
in use: `underlying_price_display`, `lifecycle_position_state`,
`transfer_fee_accounting`. Runner: 10s timeout, 64KB cap, JSON-only,
http/https, localhost/private/metadata blocked without explicit test-only
opt-in. No SDK, auth, DB, private keys, custody. Full text:
`docs/adapter.md`.

## 10. CLI / RESULT ARTIFACT CONTRACT

`node src/cli.js test --target <localhost-url> [--scenario ID] [--json]
[--out file] [--tessera-mint SYM|MINT] [--tessera-amount UNITS]`.
Exit 0 = all PASS, 1 = any FAIL, 2 = UNABLE/config (UNABLE never becomes
PASS or FAIL; incompatible scenarios SKIP, listed, uncounted). Artifact:
`{runId, target, startedAt, completedAt, summary{passed,failed,unable,
skipped[]}, results[]}`; each result carries scenario identity, status,
evidence classification + provenance, expected/actual, failure code, root
cause, fix guidance, ordered replay. `node src/cli.js whale --config ADDR
--size UNITS --max-impact PCT` runs DBC_OPENING_WHALE (same 0/1/2).
`node src/cli.js whale --config ADDR --max-impact PCT --sweep [--sizes A,B,C]`
runs DBC_LAUNCH_SWEEP (exit 0 = PASS, 2 = UNABLE_TO_VERIFY, 1 = any other finding: FAIL or CAPACITY).

## 11. SCENARIO ENGINE

Generic `runScenario(def, baseUrl)`: manifest gate → evaluate → judge
deterministic assertions → result. No target-specific code paths. Evidence
classifications in use: `simulated`, `authoritative_event_fixture`,
`live_dbc_mainnet`, `live_tessera_token2022`. Failure catalog is fixed
strings (e.g. STALE_REFERENCE_TREATED_AS_LIVE,
EXPIRED_REPRESENTATION_TREATED_AS_LIVE, TRANSFER_FEE_IGNORED,
IMPACT_POLICY_VIOLATED, CURVE_CAPACITY_EXCEEDED). No LLM, no invented
patches, no invented "optimal" curves.

## 12. IMPLEMENTED SCENARIOS

- `STALE_CARRIED_FORWARD_EQUITY` (MARKET_DATA, SIMULATED with Pyth field
  semantics): carried-forward reference must not read as live; displayed
  price must equal supplied reference.
- `PRESTOCKS_EXPIRY_{BEFORE,NEAR,AFTER}` (CORPORATE_ACTIONS,
  AUTHORITATIVE_EVENT_FIXTURE from official SpaceX page): conversion
  requirement + deadline preserved pre-deadline (near = deadline −59min);
  expired + no ordinary valuation after.
- `TESSERA_TRANSFER_FEE_ACCOUNTING` (TOKEN_BEHAVIOR, LIVE_TESSERA_TOKEN2022,
  built live per run): reported net must equal fee-adjusted amount
  (BigInt ceil + maximumFee cap).
- `DBC_OPENING_WHALE` (MARKET_STRUCTURE, LIVE_DBC_MAINNET): observed impact
  ≤ issuer policy; unexecutable size = FAIL (capacity), not UNABLE.

## 13. STOCKLANA STRATEGY

MAIN TRACK ($100K, Solana Foundation): core crash-testing product.
Judging = "could this be a real app people will actually use" (real user +
problem, working end-to-end demo, Solana-native reason, execution quality).
Submit: register, Submit Project, ≥1 link (GitHub/demo/video), teammates via
form, edits allowed until close. One submission per team. Sponsor tracks:
pick UP TO 3 (official Solana Hackathons "How It Works" — Confirmed).

## 14. CURRENT SPONSOR TRACKS

PreStocks ($5K: creativity/depth/quality) + Meteora DBC ($5K: originality,
soundness, post-hackathon life; "working code on mainnet beats slides") +
Tessera ($6K: OpenAI/Kalshi T-Token use). Exactly three. NO Clawpump, NO
Pyth track, NO additional sponsor.

## 15. PRESTOCKS ROLE + STATUS

Role: private-market lifecycle correctness. STATUS: load-bearing and
proven. Live no-auth listing API (8 products, full schema incl. Solana
`Pre...` mints, markPrice/tokenPrice spread as divergence signal) +
official SpaceX page IPO/conversion/expiry case (swap into $SPCXx before
2027-03-12T23:59Z or expire worthless) modeled as authoritative fixture,
never as live lifecycle API. Suite: expiry BEFORE/NEAR/AFTER green.

## 16. METEORA ROLE + STATUS

Role: market-structure / DBC stress (real configs, real SDK behavior, quote
simulation, graduation, mainnet inspection). STATUS: load-bearing and
proven on mainnet. Pool `2yy2jaV…RXkh3LW` (+4) verified on-chain (owner =
DBC program, SDK decode); config reads (quoteMint SOL, DAMM-v2 migration
option); pre-pool quote math; whale PASS 2.500% vs 8% policy / capacity
FAIL / UNABLE inputs via CLI + `POST /api/v1/dbc/whale` + web UI. SDK
`@meteora-ag/dynamic-bonding-curve-sdk` v1.5.12 (+web3.js/bn.js) are
declared deps (ordered). Serverless fix recorded: engines node 22.x + CJS
uuid pin. Zero signing/broadcast/funds throughout.

LOCKED FUTURE DIRECTION (2026-09-21, superseded by UPGRADE 001 below):
DBC Stress is positioned as PRE-LAUNCH MARKET CRASH TESTING for Meteora
DBC configurations, not a generic one-off price-impact calculator.
Locked thesis: "Break your launch configuration before traders do."
Target experience: real DBC config → automated stress sweep across
multiple opening-buy sizes → PASS / FAIL / CURVE CAPACITY → identify
FIRST POLICY FAILURE → explain why → issuer adjusts config → reruns.
Constraints: the issuer chooses the impact policy; JustFair never invents
a universal safe percentage; real Meteora config / SDK math; no signing,
custody, funds, or actual trades. Current DBC functionality is preserved
unchanged until that upgrade is explicitly started.

DBC UPGRADE 001 — IMPLEMENTED, OWNER UAT PENDING (2026-09-22, explicit owner order):
Kill-gate findings (official MeteoraAg/dynamic-bonding-curve README + SDK v1.5.12 source + live RPC reads):
- CONFIRMED: SDK `getQuoteFromInputAmount` is documented "quotes a swap from an input amount before any pool exists" — builds a simulated virtual pool from the config's sqrtStartPrice, pure local math.
- CONFIRMED: official lifecycle is config-first (`dbc-create-config`) then pool (`dbc-create-pool --config`); trading happens later on the virtual pool.
- CONFIRMED: JustFair's path needs ONLY the on-chain PoolConfig account + one chain-clock read (`getCurrentPoint`: slot/timestamp) + local math. No pool, mint, or trading required.
- CONFIRMED: identical math reusable across any size sequence with zero extra RPC per point (quote path is synchronous local code).
- Truthful "pre-launch" meaning locked: the DBC configuration exists on-chain but its pool has not opened to traders. A nonexistent config is UNABLE (`DBC_FETCH_FAILED`), never simulated from hand-typed parameters (that would break real-config evidence).
New behavior: `runDbcSweep` (config + YOUR POLICY → 10-point deterministic sweep as basis points [10..20000] of the live `migrationQuoteThreshold`, quote-asset-agnostic, no hardcoded SOL) returns per-point PASS/FAIL/CAPACITY/UNABLE, counts, first observed policy failure (with previous passing size bracket), first capacity boundary, explanation, non-prescriptive guidance, `live_dbc_mainnet` evidence, replay. Final aggregate precedence (`sweepOverallStatus`): FAIL iff ≥1 policy FAIL; else UNABLE_TO_VERIFY iff ≥1 UNABLE point; else CAPACITY iff ≥1 capacity point; else PASS iff ≥1 pass; else UNABLE_TO_VERIFY. Any UNABLE point makes the run inconclusive — it can neither pass nor certify a capacity-only result.
Preserved: `runDbcWhale` outputs byte-identical (shares the extracted `quoteSingleSize` core; all 5 whale tests green), `POST /api/v1/dbc/whale` untouched, flagship/Replay/Tessera/PreStocks/stale scenario/npm behavior untouched. New `POST /api/v1/dbc/sweep` (separate route because `/whale` has a fixed single-size contract asserted by clients/tests) + `whale --sweep [--sizes]` CLI (exits 0/1/2). Web: DBC view is now DBC LAUNCH STRESS (config + YOUR POLICY inputs only; summary, first-failure callouts, stress-profile table, provenance, raw evidence in disclosure).
Owner UAT prep (ONE real config demonstrates all three, verified live this session): `DLa32CJBWDp3YveqD3A8jexkUUzeTZPjEquf3Ur6BwEU` at 8% → 7 PASS, first observed policy failure at 5480000000 units (12.320%), first capacity at 21920000000 units.

## 17. TESSERA ROLE + STATUS

Role: T-Token / Token-2022 financial-behavior correctness (gross-vs-net).
STATUS: load-bearing and proven. Official product API (T-OpenAI
`oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ`, $812.79; T-Kalshi
`TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ`); docs: 0.20% standard,
sender-pays, changeable on-chain — expectations ALWAYS derived from live
TransferFeeConfig (both: 9 decimals, 20bps, max u64MAX, epochs 987/922 vs
chain 1035). 1000 units → fee 2 → net 998; naive FAIL / correct PASS via
real spawned CLI (exits 1/0); math cross-checked equal to official
`spl-token calculateFee`; rounding edges + synthetic cap + coded
NO_TRANSFER_FEE/NOT_TOKEN2022/BAD_MINT states tested. No signing/broadcast/
funds.

## 18. HISTORICAL / REMOVED SPONSOR DECISIONS

- PYTH — REMOVED (Director Order 005, sponsor-fit review). Previously
  investigated (parser, session semantics, History API ≤60s windows,
  carried-forward detection). No entitled credential ever existed (legacy
  prod key 403 on equities; no local key). Never blocked release after
  realignment. Market-data scenario retained ONLY as truthfully labeled
  SIMULATED sample. Do not reintroduce as blocker or track.
- CLAWPUMP — never entered (standing order; requires clawpump+Meteora
  stock-pool launch).

## 19. SOLANA / TOKEN-2022 USAGE

Default RPC mainnet-beta (`SOLANA_RPC_URL` override). Reads: mint
`ScaledUiAmountConfig` (multiplier schedule), TransferFeeConfig
(epoch-aware newer/older selection), DBC program accounts. Unsigned
`simulateTransaction` only. Integer BigInt fee math (ceil + cap, no
floats). Never signs, broadcasts, custodies, or moves funds (grep +
zero-custody E2E enforced).

## 20. SECURITY CONTRACT

Env-only secrets (`.env` ignored; fixtures use dummies); no private keys or
seed phrases anywhere; no signing/broadcast/custody/broker behavior;
frontend takes only public addresses; sponsor keys server-side, never sent
to adapters; CLI localhost-only; no arbitrary-URL fetch surface; Replay
uploads parsed client-side (1MB cap) and rendered as escaped text; whale
endpoint takes validated address + bounded numbers under global rate limit.
Unchanged unless a director explicitly revises it.

## 21. DATA / EVIDENCE TRUTH RULES

Every scenario result labels evidence: live / historical / simulated /
authoritative_event_fixture / live_dbc_mainnet / live_tessera_token2022.
Docs explain WHY; on-chain state decides WHAT IS (fee rates, deadlines are
never hardcoded as permanent truth). UNKNOWN never becomes PASS; UNABLE
never becomes FAIL. Mocks/fixtures are dev-test only, always labeled.

## 22. PUBLIC PRODUCT SURFACES

Home (thesis hero, one-column, no image; HOW IT WORKS CONNECT/TEST/BREAK/
FIX/VERIFY; coverage packs with implemented-labels; engine-sampled Tessera
failure populated from canonical sample at runtime; dev block with real CLI
command; subtle sponsor proof; scenario API drawer). Primary nav: Test /
Replay Lab / DBC Stress. Test view (workflow + `--out justfair-result.json`
command + copy + repo-root note + OPEN REPLAY LAB). Replay Lab
(client-side upload, schema validation, summary/list/detail, PASS/FAIL/
UNABLE distinct, engine-generated SAMPLE-labeled samples). DBC Launch Stress
(config + YOUR POLICY inputs → server-side sweep → summary, first observed
policy failure, first capacity boundary, stress-profile table, provenance,
raw evidence in disclosure; thesis "Break your launch configuration before
traders do.").
Footer: Product (Test/Replay/DBC) + Resources (System Health). Legacy Steps
UI remains served internally for tests/primitives, with NO public nav/hero/
footer entry.

## 23. PRODUCTION URL + DEPLOYMENT STATE

- Production URL: `https://justfair-theta.vercel.app` (Vercel; Node 22; `/api/*` → serverless, static → `/public`; no build step).
- Deployment Behavior: Git-integrated auto-deploy on push to `main`.
- Vercel Project: `prj_tpi4meN9oQoKPi4HIntgPHLAM5yP` (`justfair`), linked to GitHub repository `Techkeyy/justfair` on production branch `main`.
- Fallback/Debug Deploy Path: `npx vercel --prod --yes`.

## 24. TEST SUITE STATE

Verified counts (DBC Upgrade 001 run, 2026-09-22; areas untouched by this upgrade carry 2026-09-18 release counts):
- Unit & Preflight suite (`npm test`): 49 PASSED · 0 FAILED.
- Scenario engine suite (`node test/justfair-scenarios.test.js`): 25 PASSED · 0 FAILED · 1 SKIPPED (Pyth live probe skipped without API key; includes no-signing scan over the extended `dbc-live.js`).
- DBC single-check suite (`node --test test/dbc.test.js`): 5 PASSED · 0 FAILED (whale outputs unchanged after shared-core refactor).
- DBC launch-sweep suite (`node --test test/dbc-sweep.test.js`): 19 PASSED · 0 FAILED (grid derivation, parsing/sorting, summary/first-failure pure tests + aggregate precedence unit + live 8%/15%/25% sweeps, policy ownership, capacity-vs-FAIL, UNABLE paths, formatters, mint resolution, no-signing scan).
- CLI suite (`node --test test/cli.test.js`): 20 PASSED · 0 FAILED (includes fresh-scaffold Tessera no-SKIP proof + PreStocks 3-variant no-SKIP/honest-SKIP proofs).
- HTTP contract suite (`node test/e2e.test.js`): 16 PASSED · 0 FAILED (includes `/api/v1/dbc/sweep` input validation without network).
- Playwright Browser test suite (`node test/browser.test.js`): 77 PASSED · 0 FAILED (includes sweep UI test 65 + human-amount tests 65c/65d + 25% aggregate test 65e + mixed-UNABLE test 65f + 390px table test 65b).
- Tessera suite: 13 PASSED · 0 FAILED (re-verified on current source during triage + audit; live 20 bps state).
- Product-preflight suite: 52 PASSED · 0 FAILED (2026-09-18 release run; area untouched).
- Streaming suite: 6 PASSED · 0 FAILED (2026-09-18 release run; area untouched).
- Total: 282 PASSED · 0 FAILED · 1 SKIPPED.
- Public NPM Registry Outside-Repo Proof (`scratch/test-npm-registry-direct.mjs`):
  1. Registry verification: `npm view justfair` confirmed `name = "justfair"`, `version = "1.0.0"`, `dist-tags = { latest: "1.0.0" }`, published by `praiseprodigyy`.
  2. Direct tarball download from `https://registry.npmjs.org/justfair/-/justfair-1.0.0.tgz` (229,299 bytes, shasum `9b6c8a7a462e9c1cb6f67f23663fc7ebf405a20b`) into a clean temp directory outside the repository.
  3. `justfair --help` and `justfair init` verified in clean isolated directory.
  4. Real Developer Stock App on port 4000 (`http://127.0.0.1:4000/api/stock`).
  5. Observation Adapter bridge on port 3100 deriving live data from port 4000.
  6. Phase 1 (Buggy App): App returns `isLive: true` for carried-forward weekend close -> CLI exited `1` (FAIL `STALE_REFERENCE_TREATED_AS_LIVE`), canonical artifact generated with Run ID `b1be9e51-3240-4c77-81ca-7c62df91f57b`, root cause and remediation guidance verified.
  7. Phase 2 (Fixed App): Developer app corrected to `isLive: false` -> exact same test command rerun -> exited `0` (PASS `STALE_CARRIED_FORWARD_EQUITY`), invariant held.

## 25. OWNER UAT STATE

- UAT STEP 1 — PASS (homepage coherence: one product, no legacy narrative).
- UAT STEP 2 — PASS (technical developer journey proof complete & verified).
- UX UPGRADE 003 — PUBLIC NPM RELEASE & ONBOARDING PASS:
  1. Public npm package `justfair@1.0.0` published by owner (`praiseprodigyy`) and verified live on registry.
  2. Public `npx justfair@latest init` scaffolds `justfair.config.js` and `justfair-adapter.mjs` with overwrite protection.
  3. Public `npx justfair@latest test --target <url> --open` serves Replay Lab locally from memory on ephemeral port `127.0.0.1:0` with zero remote uploads / cloud telemetry.
  4. Production website (`#test-view`), `README.md`, and docs restored to the intended 5-step no-clone developer onboarding with published `npx justfair@latest` commands.
  5. Observation Adapter mental model diagram and guidance prominently displayed on `#test-view`.
  6. Replay Lab persistent controls and empty state verified across all browser tests and sample scenarios.
- OWNER UAT — GET STARTED TOP SECTION — COPY CORRECTION APPLIED, OWNER REVALIDATION PENDING (2026-09-21):
  1. Headline `"Crash-test your stock app in 5 minutes."` → `"Crash-test your stock app before users find the bugs."` (removes unproven measurable time promise).
  2. Sub-copy `"against live market anomalies"` → `"against adverse market scenarios and real market infrastructure"` (not every scenario is live; JustFair mixes deterministic adverse scenarios, authoritative event fixtures, and live market/infrastructure evidence where applicable).
  3. Step 1 note `"(refuses to overwrite existing files without confirmation)"` → `"Existing files are never overwritten."` (matches implemented `init` skip behavior in `src/cli.js` `runInitCommand`: existing files are detected and skipped, no interactive confirmation flow exists; none was added — copy correction only).
  Scope: text-only change (`public/index.html`, 3 lines; commit `440cc11`). No layout, card, typography, spacing, nav, or responsive change. Public npm commands unchanged. Browser suite re-run 2026-09-21: 67 PASSED · 0 FAILED. Owner UAT PASS is NOT claimed here; the human owner/director decides.
- OWNER UAT — STEP 2 ACTIONABILITY — FIX APPLIED, OWNER REVALIDATION PENDING (2026-09-21):
  1. Verified the real integration point first: published `npx justfair@latest init` output is byte-identical (SHA256) to local `src/cli.js init` output. The developer opens `justfair-adapter.mjs` and edits the per-`scenarioId` `observations` assignments inside the `POST /justfair/v1/evaluate` handler (`displayedPrice`/`claimsLive`/`label`, `expired`/`conversionRequired`/`ordinaryValuation`, `reportedNetRecipientAmount`); observations only, never a verdict.
  2. Step 2 now instructs: open `justfair-adapter.mjs` and point each `observations` assignment inside `POST /justfair/v1/evaluate` at the value the app actually calculates or displays, with a tiny example using verbatim scaffold lines (`STALE_CARRIED_FORWARD_EQUITY`, `observations.displayedPrice`, `observations.claimsLive`). No invented API names, no TODO markers (the scaffold has none), protocol details stay in the expandable spec.
  3. App/adapter relation explicit: new bullet "Two separate ports: your app can run on any localhost port; the adapter reads from it and exposes JustFair's two test endpoints on its own localhost port." The "adapter is NOT the product being tested" statement preserved; mental-model diagram unchanged.
  4. Step 4 note `"Tests stale equity oracles..."` → `"Tests stale/carry-forward equity prices, PreStocks conversion expiries, Meteora DBC price impact, and Tessera Token-2022 transfer fees."` (no live-oracle implication for the simulated scenario).
  Scope: `public/index.html` Step 2 card + Step 4 note only (reused existing `api-code-collapse` code styling; no new CSS, no layout/design change). Steps 1/3/5, all npm commands, CLI behavior, adapter protocol, and scenario engine untouched. New browser assertion 61b added. Browser suite 2026-09-21: 68 PASSED · 0 FAILED. Owner UAT PASS is NOT claimed here; the human owner/director decides.
- OWNER UAT — STEP 2 COMPREHENSION PASS; CODE EXAMPLE PRESENTATION FIX APPLIED, OWNER VISUAL REVALIDATION PENDING (2026-09-21):
  1. Owner confirms Step 2 is now understood (semantic/comprehension PASS for Step 2 actionability).
  2. Remaining defect was presentation-only: at desktop width the Step 2 sample clipped the leading `if`, clipped `observations.displayedPrice` at the left edge, and long trailing comments forced horizontal scrolling.
  3. Fix is display-copy only: same real scaffold identifiers and meaning, reformatted into short lines (comment-above-line structure, wrapped `observations.displayedPrice =` assignment), plus a scoped `.code-body.code-wrap` CSS rule (`pre-wrap` + `overflow-wrap`) applying to the Step 2 example block only — no global code-style change, no CLI/adapter/scenario change.
  4. New browser assertions 61c (full `if (` + full identifiers visible, zero sample overflow, left edge unclipped, wrap active) and 61d (zero page/sample overflow at 390px, identifiers intact). Browser suite 2026-09-21: 70 PASSED · 0 FAILED. Visual PASS is NOT claimed here; the human owner/director revalidates.
- OWNER UAT — REAL USAGE STEP 1 — FAIL, POST-INIT GUIDANCE BUG (2026-09-21):
  1. Owner ran public `npx justfair@latest init` in `C:\Users\HomePC\Desktop\JustFair-UAT`; output taught `justfair test --target ...`, but `Get-Command justfair` returns CommandNotFoundException — no global binary exists for the npx/no-clone user.
  2. Output also told the user to START the adapter immediately, skipping the required connect step (init → connect adapter to real app → start app → start adapter → test).
  Root causes: (1) bare `justfair test` assumed an unavailable global binary; (2) init output skipped the adapter-to-real-app connection step.
  Source fix (`src/cli.js` `runInitCommand` + new CLI test, `package.json` → 1.0.1): next steps now teach connect → start app → start adapter → `npx justfair@latest test --target http://localhost:3100 --open`. CLI suite: 15 PASSED · 0 FAILED. Packed-tarball proof: installed `justfair-1.0.1.tgz` in a clean dir, `npx justfair init` via the packed bin prints the corrected steps (51 files, no secrets/evidence/junk).
  Registry state: TECHNICAL FIX COMPLETE, NPM PATCH RELEASE REQUIRED — `npm publish` blocked (401 whoami + 404 PUT, not logged in as owner). Owner must run `npm login` (passkey/2FA) then `npm publish`. After registry release: OWNER REVALIDATION PENDING (`npx justfair@latest init` in a clean dir). Owner PASS is NOT claimed here.
- NPM PUBLIC LATEST = justfair@1.0.1 (owner published after builder-prepared 1.0.1 source + packed-tarball proof).
- OWNER UAT REAL USAGE STEP 1 = PASS (public 1.0.1 from a clean directory).
- OWNER UAT — CORE DEVELOPER LOOP = PASS (2026-09-21, real external proof in `C:\Users\HomePC\Desktop\JustFair-UAT-101`):
  1. `npx justfair@latest init` → real local stock app on port 4000 returning `{symbol TEST, displayedPrice 329.29, isLive true, label "Weekend Close"}` → observation adapter on port 3100 reading the REAL app.
  2. `npx justfair@latest test --target http://127.0.0.1:3100 --open` → FAIL STALE_CARRIED_FORWARD_EQUITY, 0 passed · 1 failed · 0 unable · 3 skipped; Replay Lab showed WHAT HAPPENED / EXPECTED / YOUR APP / WHY IT FAILED / HOW TO FIX THE ASSUMPTION / EVIDENCE / SOURCE + six-event replay. Replay Lab failure diagnosis = PASS.
  3. Owner changed ONLY the real app (`isLive: true` → `false`); adapter NOT changed; endpoint verified `{isLive false}`.
  4. Exact same command rerun → PASS STALE_CARRIED_FORWARD_EQUITY, 1 passed · 0 failed · 0 unable · 3 skipped; replay showed `claimsLive: false`, `displayedPrice: 329.29`, both invariants satisfied, verdict PASS.
  This proves: fresh install → init → real app → adapter → detect real app bug → FAIL → useful replay → fix real app → unchanged adapter → same command → PASS. Recorded verbatim; not generalized.
- OWNER UAT — REPLAY PASS-STATE PRODUCTION REVALIDATION — FAIL, OWNER SAW STALE PRODUCTION (2026-09-22):
  Owner reported `#replay` still showing pre-fix hero ("Understand a failure." / violations subtitle / "Stale Oracle Failure") after Ctrl+Shift+R. Builder investigated WITHOUT changing product code:
  1. Git: clean tree; local HEAD = origin/main = `17f0a48` (full hashes match via `rev-parse`).
  2. Vercel (`vercel ls`, project `techkeyys-projects/justfair`): latest Production deployment Ready, age ~13h (matches the `17f0a48` push era; older Ready Production deploys line up with earlier pushes). No failed deployment found; single branch `main`, single remote, no service worker in `public/`.
  3. Origin bytes: production `/` SHA256-identical to local `17f0a48` `public/index.html` (F4495D0C…D476; 50365 bytes = local size); production `/app.js` contains `replayHeroHeadingForResults` + new headings; production `/styles.css` contains `.code-body.code-wrap`. Old strings absent from served HTML.
  Root cause: NO deployment fault. Git-connected auto-deploy built `17f0a48` and the production alias has served its exact bytes for ~13h. The staleness is owner-side (browser/intermediary retained the pre-fix document; the owner's hard reload did not reach origin — origin has served nothing else in that window).
  Repair: none applied to deployment (a manual `vercel --prod` would rebuild identical source; refused as pointless). Correction of prior record: the earlier "production verification" verified ORIGIN bytes (accurate then and now), not the owner's viewport — that gap is corrected here, not the code.
  Owner revalidation procedure (no code change needed): open a private/incognito window to `https://justfair-theta.vercel.app/#replay`, or DevTools → Application → Clear storage then reload; confirm hero reads "Understand a result." and sample reads "Stale Price Failure". Visual PASS is NOT marked here; the human owner/director decides.
- OWNER UAT — REPLAY LAB VISUAL STATE MATRIX = PASS (2026-09-22, fresh Incognito production session at `https://justfair-theta.vercel.app/#replay`):
  1. EMPTY = PASS: heading "Understand a result.", neutral subtitle, sample control "Stale Price Failure", no "Stale Oracle Failure", no failure-specific hero with no report loaded.
  2. PASS = PASS ("Passing Run" clicked): heading "Verify a passing run.", 1 passed · 0 failed · 0 unable, STALE_CARRIED_FORWARD_EQUITY visibly PASS, `claimsLive: false`, replay intact ending invariant-satisfied/PASS, no failure hero copy.
  3. FAIL = PASS ("Stale Price Failure" clicked): heading "Understand a failure.", 0 passed · 1 failed · 0 unable, full diagnosis intact (WHAT HAPPENED / EXPECTED / YOUR APP / WHY IT FAILED / HOW TO FIX THE ASSUMPTION / EVIDENCE / SOURCE / REPLAY), sample clearly labelled simulated.
  4. UNABLE = PASS (uploaded minimal artifact, `status = UNABLE_TO_VERIFY`, `reason = "Adapter unreachable"`): heading "Understand what could not be verified.", 0 passed · 0 failed · 1 unable, badge UNABLE_TO_VERIFY, detail NOT VERIFIED, WHAT HAPPENED "Adapter unreachable", missing values rendered "—", supplied replay event rendered, never presented as PASS or FAIL.
- OWNER UAT — FLAGSHIP DEVELOPER FLOW = PASS: combines the recorded real public-package proof (fresh install → init → real app → adapter → FAIL → useful Replay diagnosis → fix REAL app only → adapter unchanged → exact same command → PASS) with the now-completed Replay visual state revalidation above. Prior "Replay visual revalidation pending" status is now COMPLETE / PASS. Overall product FINISHED is NOT marked. Next product area for human UAT / implementation direction is the locked Meteora DBC pre-launch crash-testing experience (§16); do NOT begin it until explicitly ordered.
- DBC UPGRADE 001 — IN PROGRESS, OWNER UAT PENDING (2026-09-22, explicit owner order; flagship + Replay PASS state preserved above and untouched):
  - Exact "pre-launch" meaning (kill-gate CONFIRMED): the DBC config exists on-chain, its pool has not opened to traders. SDK documents pre-pool quoting; official lifecycle is config-then-pool; JustFair reads config + clock only, zero pool/mint/trading dependency. Nonexistent config → UNABLE, never hand-simulated.
  - Architecture reused: `fetchDbcConfig` / `toQuoteConfig` / `computeImpactPct` / `evaluateWhalePolicy` / marginal-probe pattern; new shared `quoteSingleSize` core used by both whale (outputs identical) and sweep; single extra RPC read total per sweep (current point), zero per sweep point.
  - Sweep algorithm: default grid = basis points [10..20000] of live `migrationQuoteThreshold` (ascending, deduped, deterministic, asset-agnostic); caller sizes validated/sorted (≤32); 2 RPC reads, all quotes local; terminates after N local quotes.
  - Policy semantics: YOUR POLICY only, from input (proven: 1% fails earlier than 8% on the same config); no universal safe value anywhere (asserted in contract, guidance, and UI tests).
  - First-failure semantics: FIRST OBSERVED policy failure on the grid with previous-passing-size bracket; approximate-by-construction, never claimed exact.
  - Capacity semantics: SDK "Insufficient Liquidity" → per-point CAPACITY, distinct from FAIL; infrastructure/quote errors → UNABLE; marginal-probe refusal short-circuits the sweep honestly.
  - API contract: `POST /api/v1/dbc/sweep` {configAddress, maxPriceImpactPct, sizesQuoteUnits?} → {scenarioId DBC_LAUNCH_SWEEP, status, target, policy, summary, points[], firstPolicyFailure, firstCapacityFailure, testedRange, explanation, guidance, evidence, replay, reason/reasonCode}. New route (not a `/whale` extension) because `/whale` has a fixed asserted single-size contract. `/whale` unchanged and green.
  - Tests: §24 (this run). Blockers: none.
  - Owner UAT prep: ONE real config `DLa32CJBWDp3YveqD3A8jexkUUzeTZPjEquf3Ur6BwEU` @8% → 7 PASS, first failure 5480000000 units (12.320%), first capacity 21920000000 units. Production origin verified post-deploy: identical sweep result live via `POST /api/v1/dbc/sweep` (`live_dbc_mainnet`), new page HTML served.
  - Exact next action: present `https://justfair-theta.vercel.app/#dbc` to the owner for human UAT. Do NOT mark DBC UAT PASS; do NOT mark overall FINISHED.
- OWNER UAT — DBC LAUNCH STRESS FUNCTIONAL FLOW = PASS (2026-09-22, production):
  8% policy → 7 PASS / 2 FAIL / 1 CAPACITY, first failure 5,480,000,000 raw units @12.320%, capacity 21,920,000,000 raw units.
  15% policy → 8 PASS / 1 FAIL / 1 CAPACITY, 5,480,000,000 correctly FAIL→PASS, first failure moved to 10,960,000,000 raw units @21.937%, capacity unchanged at 21,920,000,000 raw units.
  This proves issuer-controlled policy changes classification while the underlying Meteora curve/capacity stays unchanged.
- OWNER UAT — DBC POLICY/CAPACITY SEPARATION, UNDERLYING LOGIC PASS (2026-09-22, production):
  8% → first policy fail ~5.48 SOL. 15% → first policy fail ~10.96 SOL. 25% → 0 policy failures, capacity still ~21.92 SOL.
- OWNER UAT BUG — AGGREGATE CAPACITY MISLABELED FAIL, FIX APPLIED, OWNER REVALIDATION PENDING (2026-09-22):
  Root cause: engine aggregate rule `(failed>0 || capacity>0) ? FAIL` in `runDbcSweep` collapsed CAPACITY into FAIL; the API passed the engine status through and the UI rendered it, so layers A+B+C were all wrong from one source-of-truth defect.
  Fix at the source: pure `sweepOverallStatus` precedence — FAIL iff ≥1 policy FAIL; else UNABLE_TO_VERIFY iff ≥1 UNABLE point; else CAPACITY iff ≥1 capacity point; else PASS iff ≥1 pass; else UNABLE. (Corrected 2026-09-22: an earlier revision ranked CAPACITY above UNABLE, which would have let a mixed PASS/CAPACITY/UNABLE run read as a clean capacity result; UNABLE now outranks both CAPACITY and PASS.) Applied in `runDbcSweep` and the marginal short-circuit (CAPACITY, not FAIL). API passes the status through unchanged. UI badge maps CAPACITY → "CURVE CAPACITY" and UNABLE → "NOT VERIFIED". CLI exits PASS 0 / UNABLE 2 / any other finding 1. 25% live sweep returns CAPACITY with 9/0/1/0, null firstPolicyFailure, unchanged raw sizes. Points, math, policy behavior, formatting, evidence, and guarantees untouched.
- DIRECTOR AUDIT — MIXED UNABLE AGGREGATE CORRECTED, OWNER 25% REVALIDATION PENDING (2026-09-22):
  The CAPACITY fix ranked UNABLE below CAPACITY/PASS, so 9/0/0/1 would have read PASS and 8/0/1/1 as clean CAPACITY — both false completions. Final precedence (above) makes any UNABLE point decisive short of a policy FAIL. Mixed-UNABLE explanation/guidance audited: the "all tested sizes" guidance now requires zero UNABLE, and the pass line degrades to "X quotable sizes stay within policy; N point(s) remain unverified" when UNABLE points exist.   Coverage: all 7 precedence shapes as unit tests (8%→FAIL, 15%→FAIL, 25%→CAPACITY, all-pass→PASS, both mixed-UNABLE→UNABLE, FAIL+UNABLE→FAIL) + browser 65f (mixed-UNABLE page reads NOT VERIFIED, no clean-verdict claims). 8%/15%/25% live behavior re-verified unchanged. DBC release-ready and overall FINISHED are NOT marked.
- OWNER UAT — DBC LAUNCH STRESS = PASS (2026-09-23, production final flow):
  8% → FAIL 7/2/1/0, first failure ~5.48 SOL, capacity ~21.92 SOL.
  15% → FAIL 8/1/1/0, first failure ~10.96 SOL, capacity unchanged.
  25% → CURVE CAPACITY 9/0/1/0, no firstPolicyFailure, capacity unchanged, replay "Sweep reached curve capacity".
  DBC SURFACE = RELEASE READY. Overall JustFair FINISHED is NOT marked.
- NPM PATCH RECONCILIATION 1.0.2 — PREPARED, VERIFIED, PUBLISH BLOCKED ON OWNER AUTH (2026-09-23):
  Registry check first: public latest = 1.0.1 (published 2026-09-21), so patch = 1.0.2 (never assumed).
  Audit: `npm pack --dry-run` + real pack = 51 files, 237.5 kB, shasum `d12c3c577d5c6043da6b95d106e68005aeebde72`; allowlist-limited, no .env/secrets/keys/tests/evidence/screenshots/temp/machine paths; bin `justfair → src/cli.js`; engines node >=20.
  Version bump via `npm version patch --no-git-tag-version` kept `package.json` + tracked `package-lock.json` consistent at 1.0.2.
  Pre-publish regression: `npm test` 49/49, `test/dbc.test.js` + `test/dbc-sweep.test.js` 24/24, `test/cli.test.js` 17/17 (init works, no overwrite, npx commands, flagship FAIL-exit-1/PASS-exit-0, DBC 8% FAIL, UNABLE exit 2, CAPACITY exit 1, no signing scan green).
  Clean tarball proof (fresh dir outside repo, own install): binary resolves, `--help` lists `whale --sweep`, `init` scaffolds corrected steps, installed version 1.0.2, live 25% sweep via packed CLI returns CAPACITY 9/0/1/0 with `~21.92 SOL` + quoteAsset SOL/9 — finalized semantics confirmed in the shippable artifact, zero repo leakage.
  Publish: `npm publish` FAILED (401 whoami + 404 PUT — stored token invalid, not the owner session). Same standing rule as 1.0.1: builder does not fake release completion.
  Registry at that time still served 1.0.1 (older sweep/aggregate semantics). Public-registry proof (npx latest --help/init + version check + live DBC) was PENDING the owner publish.
  Owner action was: `npm login` (owner account) then `npm publish` from this source, then `npm view justfair version` must read 1.0.2.
- NPM 1.0.2 RELEASE CLOSED — PUBLISHED, PUBLIC REGISTRY VERIFIED, RELEASE COMPLETE (2026-09-23, owner-published after the triage above):
  Registry: `npm view justfair versions` includes 1.0.2; `dist-tags` = `{ latest: "1.0.2" }`.
  Fresh public proof (outside repo, `C:\Users\HomePC\AppData\Local\Temp\justfair-public-proof`): `npx justfair@latest --help` installed justfair@1.0.2 and exposes `whale --config` with `--sweep`; `npx justfair@latest init` created `justfair.config.js` + `justfair-adapter.mjs` with the connect-first flow (`npx justfair@latest test --target http://localhost:3100 --open`).
  Live public-package DBC proof (`npx justfair@latest whale --config DLa32CJBWDp3YveqD3A8jexkUUzeTZPjEquf3Ur6BwEU --max-impact 25 --sweep --json`): `DBC_LAUNCH_SWEEP`, status CAPACITY, 9 passed / 0 failed / 1 capacity / 0 unable (10 points), firstPolicyFailure null, firstCapacity 21920000000 quote units (~21.92 SOL), quoteAsset So111…11112 / 9 decimals / SOL.
  Security triage (§25 entry above) and residual dependency findings remain documented, not hidden. Overall JustFair FINISHED is NOT marked.
- NPM 1.0.2 SECURITY TRIAGE — COMPLETE, OWNER AUTH/PUBLISH STILL DEFERRED (2026-09-23):
  Original install-time report: 11 vulns (4 moderate, 7 high). Repo-tree audit (`npm audit --omit=dev --json`): PRODUCTION 13 entries (6 HIGH, 7 moderate); full tree adds 1 DEV-ONLY moderate (`rpc-websockets` rollup of the uuid advisory below).
  Distinct real advisories (4; the rest are rollup entries):
  1. toml HIGH ×2 — CVE-2026-77465/GHSA-82x6-q7mm-w9cf (uncontrolled recursion, ~6KB nested payload crashes `toml.parse`) + CVE-2026-63376/GHSA-v5mp-jgw5-2x6j (prototype pollution via crafted keys in `toml.parse`). Path: `toml@3.0.0` ← `@coral-xyz/anchor@0.31.1` ← Meteora SDK ← justfair. Both sinks require calling `toml.parse` on attacker input. PROVEN NOT REACHABLE: `toml` is required only by anchor's `workspace.js` local-Anchor.toml loader; runtime `require.cache` probe after importing the SDK + web3 + spl-token shows `toml` and `anchor/.../workspace` NEVER loaded in any JustFair process. No compatible fix: SDK pins `anchor@^0.31.0` (0.32 breaks range) and anchor 0.32.x still deps `toml@^3.0.0`; installed toml 3.0.0 predates both patches (4.1.2/4.2.0).
  2. bigint-buffer HIGH — CVE-2025-3194/GHSA-3gc7-fjrx-p6mg (`toBigIntLE` OOB read → single-process crash; no RCE/confidentiality/integrity impact per CVSS). Path: `bigint-buffer@1.1.5` ← `@solana/buffer-layout-utils` ← `@solana/spl-token@0.4.15` ← justfair. NO patched version exists (all ≤1.1.5 affected); the only npm-suggested "fix" (spl-token 0.1.8) is an ancient-line downgrade that breaks the SDK (`^0.4.13`) and all Token-2022 support. Reachability BOUNDED: the sink executes only via layout decodes (`MintLayout.u64.supply`, TransferFeeConfig layouts) on RPC bytes; spl-token length-guards the base mint (`<82 bytes` throws clean `TokenInvalidAccountSizeError` before any decode); extension bytes can only be malformed via a compromised RPC or a Token-2022 program bug (TLS + trust assumption already documented); the ONLY caller is CLI `--tessera-mint` (no server route decodes operator-external mints — verified by grep); trigger = victim querying an attacker mint = self-DoS of one run at worst. DBC anchor decode path verified free of `toBigIntLE`/`bigint-buffer` (BN/DataView decoders). Our own mint reads use manual byte parsing, never the lib.
  3. stream-json MODERATE — CVE-2026-71429/GHSA-528h-pc64-c93x (pick/ignore/filter/replace path filters O(depth²) event-loop DoS). Path: `stream-json@1.9.1` ← `jayson@4.3.0` ← `@solana/web3.js@1.99.0` ← justfair. PROVEN NOT REACHABLE: jayson uses stream-json ONLY in `Utils.parseStream` (server-side stream parsing); web3.js bundle never calls `parseStream` (verified by source search) — all RPC responses go through fetch + native `response.json()`. jayson 4.3.0 is the latest in web3's `^4.3.0` range (5.0.0 would break it); web3 1.99.0 is the latest 1.x (fix line is the breaking v2 rewrite the SDK `^1.98.0` forbids).
  4. uuid MODERATE — CVE-2026-41907/GHSA-w5hq-g745-h8pq (v3/v5/v6 silent partial write ONLY when caller passes an output buffer; patched 11.1.1/12.0.1/13.0.1). Paths: `uuid@8.3.2` ← jayson, `uuid@9.0.1` ← rpc-websockets (downgraded from author's `^14.0.0` by OUR override). PROVEN NOT REACHABLE: sole call sites are jayson `uuid()` (v4, zero args; web3 never passes `options.generator`) and rpc-websockets `uuid.v1()` (zero args; v1 throws properly anyway) — verified in installed sources. SAFE FIX APPLIED ANYWAY: override raised to `^11.1.1` for both subtrees (uuid 11 keeps a CJS build — `require('uuid')` proven working, so the recorded serverless CJS constraint is preserved; our code never imports uuid directly). Post-fix tree: single deduped `uuid@11.1.1`; advisory gone.
  Post-fix audit: PRODUCTION 9 entries (6 HIGH + 3 moderate) — remaining HIGH are toml-borne rollups + bigint-buffer (both case-B above); remaining moderate are stream-json-borne rollups (case-B above). IMPORTANT OVERRIDE SCOPING FACT (verified in clean install): npm `overrides` are root-scoped, so public consumers still install jayson's `uuid@8.3.2` (deprecation warning returns) while rpc-websockets resolves its own `^14.0.0`; the uuid sink stays unreachable in every version by the call-site proof above. The override protects our repo tree, CI, and the Vercel serverless build.
  Deprecation note: `uuid@8.3.2` deprecation warning is gone from OUR tree (11.1.1 installed); it will still print for downstream consumers until web3/jayson move — cosmetic only, same non-reachability proof.
  Direct-dep currency: `@solana/spl-token@0.4.15` (latest), `@solana/web3.js@1.99.0` (latest 1.x), `@coral-xyz/anchor@0.31.1` (max allowed by SDK), `@coral-xyz/borsh@0.31.1` (max allowed by anchor), `jayson@4.3.0` (max allowed by web3). No blind upgrades performed; no `audit fix --force`.
  Post-fix regression (all green): `npm test` 49/49, `cli+dbc+sweep` 41/41, `e2e` 16/16, `browser` 77/77 — including DBC 8% FAIL / 15% FAIL / 25% CAPACITY 9/0/1/0, mixed-UNABLE semantics, exits 0/1/2, and the no-signing scans.
  Repack: 1.0.2 tarball rebuilt (shasum `ad71659b42a8b771e1dd5440292ada62077bb3bd`, 51 files, allowlist-clean, no secrets/tests/evidence/tokens); clean-install proven again from the rebuilt tarball (`init` + live 25% CAPACITY via packed CLI, version 1.0.2, no repo leakage).
  Residual risk summary for Director: 2 unfixable-in-range HIGH sinks (toml.parse, bigint-buffer decode), both proven unreachable-or-bounded above with crash-only worst case and zero custody/funds proximity. RECOMMENDATION: READY FOR OWNER NPM LOGIN/PUBLISH — residual risk accepted with the code-backed proofs recorded here. Director makes the final release decision; overall FINISHED is NOT marked.
- TESSERA TAKEOVER AUDIT + OWNER UAT PREP (2026-09-23; no code changes required):
  Thesis: a stock app must account for Token-2022 transfer fees; JustFair reads the LIVE TransferFeeConfig itself and owns the expected result.
  Implementation map: `src/scenarios/tessera.js` (`getTesseraTransferFeeState` → live decimals/bps/maxFee/epoch + provenance; `calculateNetReceipt` → exact integer ceil+cap math; `buildTesseraScenario` → `TESSERA_TRANSFER_FEE_ACCOUNTING` with exact-string-match assertion + `TRANSFER_FEE_IGNORED` diagnosis) → CLI opt-in (`--tessera-mint SYM|MINT --tessera-amount UNITS --scenario TESSERA_TRANSFER_FEE_ACCOUNTING`, built live per run, never in the default sweep) → generic `runScenario` (manifest gate → observations → JustFair-owned `check()`; adapter `pass`/`verdict` fields never consulted) → Replay Lab detail + committed `public/samples/tessera-fail.json` (FAIL, 20 bps, 998, 5 replay events, SAMPLE-labeled).
  Live verification (mainnet, chain epoch 1040): T-OpenAI `oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ` = 9 decimals / 20 bps / max u64MAX / feeEpoch 987, epoch verified; T-Kalshi `TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ` = 9 / 20 / u64MAX / feeEpoch 922, verified. Both UNCHANGED from the historical record — nothing hardcoded (docs explain why; chain decides the rate).
  Invariant: gross 1000 → fee 2 → net 998 (cross-checked equal to official `spl-token calculateFee` across amounts).
  Proofs this session: naive adapter (reports 1000) → FAIL `TRANSFER_FEE_IGNORED` (expected 998); correct adapter (reports 998) → PASS, diagnosis null; legacy USDC mint → `TESSERA_NOT_TOKEN2022`; garbage → `TESSERA_BAD_MINT` (no network); fee-less Token-2022 mint → `TESSERA_NO_TRANSFER_FEE` (all UNABLE-class, never PASS). No private-key/signing/broadcast path in module (covered by the committed no-signing scan).
  Suite: `test/tessera.test.js` 13/13. Gaps found: none blocking; sample artifact consistent with live state.
  Owner UAT steps: see §35 (CASE A wrong-app FAIL → fix app only → CASE B same-command PASS, adapter untouched). Tessera PASS is NOT claimed; overall FINISHED is NOT marked.
- TESSERA PUBLIC ONBOARDING FIX PREPARED — 1.0.3 READY FOR OWNER PUBLISH (2026-09-23):
  Root cause (confirmed from source): `init` scaffold manifest (`src/cli.js` `runInitCommand`) advertised `underlying_price_display` / `prestocks_lifecycle_display` / `token2022_fee_display`, but `TESSERA_TRANSFER_FEE_ACCOUNTING` requires `transfer_fee_accounting` (`src/scenarios/tessera.js:163`); the capability gate (`cli.js` + `scenario.js`) therefore SKIPped Tessera on every fresh untouched scaffold. The scaffold evaluate branch already returned `reportedNetRecipientAmount` — support existed, advertisement missing. (`token2022_fee_display` is required by no scenario and was left untouched for backward compatibility.)
  Fix: one-line manifest addition (`transfer_fee_accounting`); existing capabilities preserved; no scenario/engine/protocol change.
  Regression (`test/cli.test.js`, 18/18 with the new test): fresh `init` → manifest parses with the capability + Tessera evaluate branch present → spawned untouched scaffold serves manifest → real in-process run (`--tessera-mint T-OpenAI`, live 20 bps) returns FAIL (expected 998, reported 1000), explicitly NOT skipped. Full `cli` suite green.
  Version: 1.0.2 → 1.0.3 via `npm version patch --no-git-tag-version` (package.json + lock consistent). Pack: 51 files, 237.5 kB, shasum `9e11b06eb22f51483fc1c555b6714621c4701a39`, allowlist-clean, no secrets/tests/evidence/tokens.
  Clean packed proof (fresh dir outside repo, own install of the 1.0.3 tarball): `init` generates the fixed manifest; untouched scaffold → FAIL (not SKIP); fixed-observation simulation → PASS same command; DBC smoke `--sweep --max-impact 25 --json` → CAPACITY 9/0/1/0 (1.0.2 behavior preserved). No repo leakage.
  Publish state: `npm whoami` = praiseprodigyy (session present), but `npm publish` requires OTP 2FA interaction (EOTP) — STOPPED per standing rule; no credentials handled by builder. Owner action: approve the npm 2FA challenge (or run `npm publish` from this source), then confirm `latest = 1.0.3`.
  After 1.0.3 is public: regenerate `C:\Users\HomePC\Desktop\JustFair-Tessera-UAT\justfair-adapter.mjs` from public `npx justfair@latest init` (keep its `stock-app.mjs`), rewire the two documented lines (capability already present; point the TESSERA branch at `:4000`), and run Owner UAT with zero manual workaround. TESSERA OWNER UAT = NOT YET RUN (superseded below); overall FINISHED is NOT marked.
- TESSERA PUBLIC ONBOARDING = PASS; TESSERA OWNER UAT = PASS; TESSERA CORE-OUTCOME EVIDENCE = LEVEL 4 (2026-09-23, owner-executed public proof):
  Public package: npm latest = justfair@1.0.3; fresh external `npx justfair@latest init`; generated adapter natively contained `transfer_fee_accounting`; no manual capability workaround remained.
  CASE A (workspace `C:\Users\HomePC\Desktop\JustFair-Tessera-UAT`, app `APPLY_TRANSFER_FEE = false`, app reported net 1000, adapter only observed): public command `npx justfair@latest test --target http://127.0.0.1:3100 --tessera-mint T-OpenAI --tessera-amount 1000 --scenario TESSERA_TRANSFER_FEE_ACCOUNTING --open` → FAIL `TESSERA_TRANSFER_FEE_ACCOUNTING`, expected 998, reported 1000, `TRANSFER_FEE_IGNORED`, root cause + fix guidance visible, `live_tessera_token2022` evidence visible, Replay Lab owner-observed.
  CASE B (changed ONLY false→true; adapter/JustFair/package/mint/amount/command unchanged): → PASS, 1 passed · 0 failed · 0 unable; Replay owner-observed expected 998, reportedNetRecipientAmount 998, invariant satisfied.
  Causal loop proven: real app financial bug → JustFair detects it from authoritative live Token-2022 state → explains it → developer fixes only app → exact same workflow verifies correction. Overall JustFair FINISHED is NOT marked and SUBMISSION READY is NOT claimed.
- PRESTOCKS TAKEOVER AUDIT + OWNER UAT BLOCKER — STOP, PRODUCT BUG REPORTED (2026-09-23; no workaround built, no product code changed):  Audit: `src/scenarios/prestocks.js` (BEFORE/NEAR/AFTER variants on the official SpaceX conversion case; AFTER = strongest invariant: post-deadline representation must be `expired === true` with `ordinaryValuation === false`, else `EXPIRED_REPRESENTATION_TREATED_AS_LIVE`) → static registry + CLI `--scenario` selection → capability gate → generic `runScenario` (JustFair-owned verdict) → Replay detail + committed samples + browser/e2e/unit coverage.
  Authoritative fact RE-VERIFIED LIVE this session at `https://prestocks.com/spacex`: "SpaceX has gone public! SpaceX PreStocks tokens must be swapped into $SPCXx or any other token before 11:59pm UTC on 12 March 2027, or they will expire worthless." — byte-consistent with the fixture (deadline, $SPCXx, expire-worthless). Nothing hardcoded beyond the captured fixture, which is labeled `authoritative_event_fixture`, never live data.
  BLOCKER (proven end-to-end, not inferred): fresh untouched public scaffold advertises `underlying_price_display` / `prestocks_lifecycle_display` / `token2022_fee_display` / `transfer_fee_accounting`, but all PreStocks variants require `lifecycle_position_state` (`prestocks.js:115`). Spawned fresh scaffold + `test --scenario PRESTOCKS_EXPIRY_AFTER` → `SKIP PRESTOCKS_EXPIRY_AFTER / Target lacks: lifecycle_position_state`, exit 2. A normal public developer therefore CANNOT run the PreStocks scenario without undocumented manual manifest knowledge — same defect class as the Tessera onboarding bug (fixed for 1.0.3), now blocking PreStocks Owner UAT. Per order: STOPPED here; no external workspace built with a manual workaround, no product-code fix applied (the likely fix mirrors Tessera: advertise `lifecycle_position_state`, presumably +1.0.4 — NOT implemented without an explicit order).
  Gate row for the selected claim — Claim: post-deadline expired holdings lose ordinary valuation. Mechanism: AFTER-variant assertions (`expired-marked`, `no-ordinary-valuation`). Authoritative Boundary: official PreStocks product-page fixture (deadline 2027-03-12T23:59Z), NOT a live lifecycle API. Required Proof: fresh-public owner FAIL→fix→PASS. Current Proof: L2 only (fixture naive/correct engine tests). Status: BLOCKED ON PUBLIC ONBOARDING. Evidence Level: L2. Enforcement: HARD (engine assertions) for the invariant; onboarding path UNENFORCED (proven SKIP) — the blocker.
- PRESTOCKS EXTERNAL OWNER UAT ENVIRONMENT = READY, OWNER UAT = NOT YET RUN (2026-09-23; built from public 1.0.4 AFTER its publication):
  Workspace `C:\Users\HomePC\Desktop\JustFair-PreStocks-UAT` (outside repo, NOT committed): public `npx justfair@latest init` (registry confirmed `latest = 1.0.4` before starting); generated scaffold verified (native `lifecycle_position_state`, all 3 branches, unwired refusal, boolean AFTER); untouched public adapter → UNABLE `PRESTOCKS_EXPIRY_AFTER`, exit 2.
  `stock-app.mjs` (port 4001 — port 4000 is occupied by an unrelated pre-existing process, left untouched): `MARK_EXPIRED = false` reports expired:false + ordinaryValuation:true ("Live holding"); `= true` reports expired:true + ordinaryValuation:false ("Expired"). Never imports JustFair; knows no verdicts.
  `justfair-adapter.mjs` (generated + ONLY the AFTER branch wired to `:4001/api/position`, observations only; SHA256 `4610B523…` identical across both builder runs).
  Builder preflight (L3, public 1.0.4 CLI): CASE A → FAIL `PRESTOCKS_EXPIRY_AFTER` (`EXPIRED_REPRESENTATION_TREATED_AS_LIVE`, 0/1/0, exit 1, root cause + guidance + 6-event replay); changed ONLY the app line, restarted ONLY the app; CASE B (exact same command) → PASS 1/0/0, exit 0. Workspace reset to WRONG (`MARK_EXPIRED = false` verified) with both servers stopped; owner steps in its `README-UAT.md`.
  Gate row update: Current Proof = L3 builder preflight (wired FAIL→app-only-fix→PASS on public 1.0.4); Status = OWNER UAT NOT YET RUN; overall FINISHED is NOT marked.
- PRESTOCKS PUBLIC ONBOARDING FIX PREPARED — 1.0.4 READY FOR OWNER PUBLISH (2026-09-23):
  The STOP above was correct, and the blocker review exposed TWO deeper scaffold inconsistencies beyond the missing capability: (A) the scaffold had no BEFORE/NEAR branches at all, so merely advertising the capability would claim lifecycle support while two variants returned no required observations; (B) the AFTER branch used numeric `ordinaryValuation = 0` while the contract requires boolean `false`.
  Canonical decision (from source, not convenience): `lifecycle_position_state` stays canonical — all three variants, the engine gate, and the tests use it, and it names the observed domain (`expired`/`ordinaryValuation`/`conversionRequired`/`deadlineUs`); `prestocks_lifecycle_display` is required by nothing and was retained in the scaffold only for backward compatibility.
  Fix (`src/cli.js` scaffold only): manifest advertises `lifecycle_position_state`; BEFORE/NEAR branches return `expired: false` + `conversionRequired: true` + `deadlineUs: inputs.deadlineUs` + `ordinaryValuation: true` (echo starter with replace-with-app comments, same pattern as the existing STALE branch); AFTER corrected to `ordinaryValuation = false`. Observations only, never verdicts.
  Regression (`test/cli.test.js`): fresh `init` → manifest parses with the capability, all 3 wiring templates present, boolean AFTER (numeric 0 absent) → spawned untouched scaffold serves manifest → all 3 variants through the real engine each report UNABLE with exit 2 and the wired reason (NEVER PASS/FAIL — corrected 2026-09-23; the earlier revision of this same test asserted PASS/PASS/PASS from input-echoing branches, which pre-publish review identified as proxy success and which this fix removes); plus an honest-SKIP test (capability-less adapter still SKIPs with exit 2). Suites: `npm test` 49/49, `justfair-scenarios` 25+1 skip (PreStocks BEFORE/NEAR/AFTER green), `tessera` 13/13, DBC 25% smoke CAPACITY 9/0/1/0. No browser/e2e rerun (no UI/server route change; adapter error-message enrichment only).
  Version: 1.0.3 → 1.0.4 via `npm version patch` (package.json + lock consistent). Pack: 51 files, 237.7 kB, shasum `25ba04567a681eb63caa17401a63a0e1539891f5`, allowlist-clean, no secrets/tests/evidence/tokens. No dependency change (security record stands).
  Packed 1.0.4 proof (fresh external dir, own install): `init` generates the fixed manifest + all 3 branches; spawned untouched generated adapter + packed CLI runs BEFORE/NEAR/AFTER → PASS/PASS/PASS, zero SKIP. No repo leakage.
  Publish state: NOT published by builder (standing OTP rule). Owner action: approve npm 2FA / `npm publish` from this source, confirm `latest = 1.0.4`. After public: build `C:\Users\HomePC\Desktop\JustFair-PreStocks-UAT` from public @latest with zero manual workaround. PreStocks Owner UAT = NOT YET RUN; overall FINISHED is NOT marked.
- PRESTOCKS FALSE-PASS BLOCKER — FIXED IN 1.0.4 SOURCE, OWNER PUBLISH PENDING (2026-09-23):
  Pre-publish review caught a Critical Gate violation in the prepared fix: the untouched scaffold echoed JustFair's own inputs back (`deadlineUs` from inputs, hardcoded booleans) and produced PASS/PASS/PASS with no app observed — proxy success. A fresh UNWIRED adapter must NEVER PASS app-observed scenarios; UNWIRED means no authoritative target observations, therefore UNABLE.
  Fix (`src/cli.js` scaffold + `src/scenarios/adapter.js`, no protocol change): generated PreStocks branches are now wiring templates with an explicit `unwired()` 502 refusal naming the branch + fields (`expired, conversionRequired, ordinaryValuation` / + `deadlineUs`); capability `lifecycle_position_state` kept (no SKIP regression); boolean AFTER contract kept. Engine reuses existing `ADAPTER_HTTP_ERROR` → UNABLE path (exit 2); the 502 body is now surfaced in the reason (`Adapter HTTP 502: {...not connected to the target app yet...}`) instead of a bare status. STALE/TESSERA scaffold branches untouched (their echoes cannot yield false PASS: hardcoded FAIL / live-fee FAIL).
  Four states now distinct and tested: CAPABILITY ABSENT → SKIP (exit 2) · PRESENT-BUT-UNWIRED → UNABLE (exit 2, wired reason) · OBSERVED+INCORRECT → FAIL (exit 1) · OBSERVED+CORRECT → PASS (exit 0).
  Wired external proof (temp dir outside repo, packed 1.0.4 CLI, NOT the final UAT folder): untouched generated adapter → UNABLE ×3 (BEFORE proven in repo test, AFTER live here); wired to a tiny wrong app (expired:false + ordinary valuation post-deadline) → FAIL `EXPIRED_REPRESENTATION_TREATED_AS_LIVE`, exit 1; fixed ONLY the app (expired:true, ordinaryValuation:false), restarted ONLY the app → same command → PASS, exit 0. (Proof env noted: an unrelated pre-existing process squats on :4000 — left untouched; proof used :4001.)
  Repack: 1.0.4 rebuilt after the fix (shasum `70757ba079b2c9e96fb5ea456b01471450d2fbe0`, 51 files, allowlist-clean). No dependency change. Overall FINISHED is NOT marked; PreStocks Owner UAT = NOT YET RUN.
- FINAL PRE-SUBMISSION AUDIT (2026-09-23; production + claims + rubric; 4 doc/copy fixes applied, no behavior change):
  Production sanity (`https://justfair-theta.vercel.app/` fetched live): loads; crash-testing thesis + HOW IT WORKS + coverage + engine-sampled failure + dev block (`npx justfair@latest`) + Replay Lab + DBC LAUNCH STRESS all present; Test/Replay/DBC routes usable; footer disclaims custody/advice; onboarding points to `npx justfair@latest`. No broken primary UI. Legacy `#app` Steps view still served but unlinked (tests depend on it) — known, not a blocker.
  Claim audit fixes applied: (1) sponsor-proof subtitle implied every scenario reads live state → now "judges your app from labeled evidence — live chain state, authoritative events, or simulations — with proof before the verdict"; (2) final CTA "Run your first scenario in minutes." (unproven time promise) → "Run your first scenario locally. No account, no funds, no custody."; (3) README test counts refreshed to verified values (cli 20, browser 77, e2e 16, +sweep 19); (4) README DBC entry updated to Launch Stress (config + YOUR POLICY sweep, no size input). Labels: README scenario table PROVEN (simulated/fixture/live correctly labeled); `docs/` legacy product files (PRODUCT/HACKATHON/EVIDENCE/BUILD_TRACKER) are historical working notes, not submission surfaces — left untouched. No submission text exists in-repo yet (submission packaging work remains, not a product blocker). Prohibited items verified absent: no fixture-called-live, no observed-March-2027 claim, no custody/trade-execution claim, no arbitrary-remote-target claim (localhost-only documented), no FINISHED/SUBMISSION-READY claim.
  Rubric remap (official Stocklana criteria from `docs/HACKATHON.md`; no scores defined): (1) Real use case → developers shipping stock apps that lose money to financial bugs; EVIDENCE: public npm + two owner-executed core loops + live Tessera/DBC integrations (PreStocks lifecycle is a labeled fixture); GAP: none material. (2) It works → EVIDENCE: 282 green tests + owner FAIL→fix→PASS on public flows + live production; GAP: none. (3) Solana-native → EVIDENCE: Token-2022 fee/multiplier reads, DBC SDK math, unsigned simulation; cannot be ported off-chain; GAP: none. (4) Execution → EVIDENCE: shipped 1.0.4, typed errors, Replay Lab, responsive verified; GAP: submission packaging (video/links) still open.
  Judge attack (outcome evidence only): strongest rejection = "dev utility, not a real app; one 1000-unit check proves little" → defeated by public package, two independent owner loops, live Tessera + live DBC integrations (PreStocks lifecycle is an authoritative fixture; only its listing API is live), 282 tests: RESOLVED (residual: per-pack breadth beyond proven paths relies on labeled samples — disclosed). Demo shell? No (real CLI/RPC/verdicts): RESOLVED. Toy simulated bugs only? No (live Tessera/DBC + authoritative fixture; simulated STALE labeled): RESOLVED. Handles funds/trades? No (scans + route checks + localhost): RESOLVED HARD. App decides expected result? No (engine-owned verdicts; naive/correct divergence proves it): RESOLVED HARD. PreStocks misrepresented as live? No (fixture labeled in code/Replay/README/site): RESOLVED with submission-wording constraint recorded above.
  Submission-copy judge attack (2026-09-23, against `SUBMISSION.md` + demo script as written): (1) demo shell → answered by PUBLIC LINKS + install-to-verdict flow: RESOLVED. (2) app decides pass → answered by "observations only — never a verdict" + divergence proof: RESOLVED. (3) fake bugs → answered by WHAT IS ACTUALLY LIVE separation: RESOLVED. (4) PreStocks isn't live → answered by fixture framing + March-2027 disclaimer: RESOLVED. (5) handles money → answered by zero-custody/localhost copy: RESOLVED. (6) not Solana-native → answered by WHY SOLANA (fee reads, DBC math, unsigned sim): RESOLVED. (7) why would a developer use this → answered by WHO + causal-loop proof: RESOLVED (residual: developer-tool audience, disclosed). No new claims were added to win any attack.
  Adversarial Level 5: no Level 5 exists in the evidence vocabulary; strongest held proof is L4 owner runs. Every listed critical invariant has committed adversarial tests (unwired-UNABLE, missing-capability SKIP, malformed/unreachable UNABLE, verdict-ownership divergence, no-signing scans). No cheapest-proof gap identified.
  Demo (2–3 min): PRIMARY Tessera (wrong app 1000 vs 998 → FAIL + cause/fix → app-only fix → same command PASS); then DBC sweep breadth (table + first failure + capacity); then PreStocks future-event breadth (framed as published-terms crash test, never live proof). 77/77 browser green after copy fixes.
- PRESTOCKS OWNER UAT = PASS; PRESTOCKS CORE-OUTCOME EVIDENCE = WORKFLOW L4, EVENT FIXTURE LABELED (2026-09-23, owner-executed public 1.0.4 proof):
  CASE A: wrong app (expired:false, ordinaryValuation:true, "Live holding") → FAIL `PRESTOCKS_EXPIRY_AFTER` (`EXPIRED_REPRESENTATION_TREATED_AS_LIVE`, expected expired/transitioned, 0/1/0), root cause + guidance, 6-event replay owner-observed (FAIL badge, failure code, manifest accepted with `lifecycle_position_state`, observations collected, `expired-marked` FAILED, `no-ordinary-valuation` observed true, final violated).
  CASE B (changed ONLY `MARK_EXPIRED` false→true, restarted ONLY the app; adapter/scenario/command/package unchanged; corrected app expired:true/ordinaryValuation:false/"Expired"): exact same public command → PASS 1/0/0, Replay owner-observed ("Verify a passing run.", expected expired/transitioned, YOUR APP expired:true/"Expired", EVIDENCE `PRESTOCKS_OFFICIAL_PRODUCT_PAGE` + `authoritative_event_fixture` + source URL, both invariants satisfied, "Invariant satisfied / Observed: PASS").
  Classification preserved: the SpaceX case is an `authoritative_event_fixture` from official published terms; NOT a live lifecycle API; the March 2027 expiry has NOT occurred. Submission wording must call it a crash test of the published future expiry condition — never "live PreStocks lifecycle data" or an observed March-2027 event. The Core Outcome already holds independent live L4 proof from Tessera, so this limitation does not weaken it.
  Packed-artifact adversarial proof (fresh external install of the rebuilt tarball, 2026-09-23): untouched generated adapter served live while BEFORE/NEAR/AFTER each returned UNABLE (0 passed / 0 failed / 1 unable, exit 2, wired reason naming branch + fields) — zero PASS, zero FAIL, zero SKIP. FRESH SCAFFOLD CANNOT CREATE FALSE FINANCIAL PASS holds in the shippable artifact.
  External workspace `C:\Users\HomePC\Desktop\JustFair-Tessera-UAT` (outside the repo, NOT committed): `stock-app.mjs` (real app on :4000, `APPLY_TRANSFER_FEE = false` bug → reports 1000; fix → computes 998 itself; never imports JustFair), `justfair-adapter.mjs` (from public `npx justfair@latest init`, wired to read `:4000` and return only `reportedNetRecipientAmount`, manifest adds `transfer_fee_accounting`), `justfair.config.js` (generated), `README-UAT.md` (one-action-at-a-time owner steps).
  Builder cold-start proof with public justfair@latest: CASE A → FAIL `TESSERA_TRANSFER_FEE_ACCOUNTING` (`TRANSFER_FEE_IGNORED`, expected 998, reported 1000, 5 replay events); changed ONLY the app line false→true and restarted ONLY the app; CASE B (exact same command, same mint/amount/adapter/package) → PASS 1/0/0. `--open` proven from the public package (local viewer on 127.0.0.1, in-memory, zero cloud uploads). Adapter file untouched between runs (mtime predates both runs; only `stock-app.mjs` modified); workspace contains zero repo paths/imports and no verdict logic.
  Known onboarding requirement recorded at prep time (superseded by the fix below): the 1.0.2 `init` scaffold did not advertise `transfer_fee_accounting`, so the Tessera UAT adapter added that manifest capability manually; without it the scenario honestly SKIPs on capability gate. Source is now fixed for 1.0.3; the workspace adapter will be regenerated from public @latest once 1.0.3 is published. Workspace left in INITIAL WRONG state with servers stopped for personal owner execution.
- DBC HUMAN-READABLE AMOUNT POLISH — FIX APPLIED, OWNER VISUAL REVALIDATION PENDING (2026-09-22):
  Quote resolution (no hardcoded SOL): decimals read from the REAL mint account (base Mint byte 44, Token + Token-2022 owners only); `SOL` label only for the system native mint; otherwise formatted amount + abbreviated mint; unknown mints fall back to raw units, never a guessed symbol.
  Presentation: per-point `sizeDisplay` + `quoteAsset` on the sweep report (additive fields; classifications, math, sizing, endpoint semantics unchanged); UI shows human-primary (5.48 / 10.96 / 21.92 SOL) with grouped raw secondary (5,480,000,000 quote units) in table, callouts, explanation, and guidance; raw evidence section keeps exact raw units.
  Tests: formatters exact (injective division, no collapse), live 15% (8/1/1, same raw sizes) + live 8% displays, browser 65c (human-first + raw preserved) / 65d (non-SOL never SOL-labeled) / 65b (390px clean after fixing a real flex min-content blowout in `.replay-field`). Browser 75/75, sweep 17/17. Overall FINISHED is NOT marked.

## 26. CURRENT BLOCKERS

- None blocking the product: PreStocks Owner UAT = PASS; all Critical Gate rows hold at committed evidence.
- Open packaging work (not product blockers): submission links/video packaging; legacy `#app` view remains served-but-unlinked for tests.

### CORE OUTCOME GATE (current state)

Core Outcome: "This product is only genuinely working when a developer can use the normal public JustFair workflow against a real stock application or market configuration, JustFair independently detects a financially incorrect result from authoritative evidence, explains it, and after the developer fixes only their own app/configuration, the same workflow verifies the correction."

Evidence levels used below — L1 unit/deterministic (no network, no owner) · L2 live-network integration (repo tests/fixtures, builder-run) · L3 packed-tarball clean-install proof (shippable artifact, builder-run, outside repo) · L4 fresh-public owner proof (public registry + owner hands). Packed/local proof is never recorded as L4.

| Claim | Mechanism → Boundary | Required falsification / proof | Enforcement | Current evidence |
|---|---|---|---|---|
| A. JUSTFAIR OWNS THE VERDICT | Assertion engine (`runScenario` `check()` over observations) → CLI/scenario engine, not adapter | Adapter cannot force PASS by supplying verdict/pass: naive/correct fixtures + untouched-scaffold echo runs still yield engine FAIL; exit codes follow engine status | HARD (engine code + committed tests) | L2 (L4 pending owner Tessera UAT) |
| B. LIVE/AUTHORITATIVE DATA DRIVES EXPECTATION | Tessera: live TransferFeeConfig (captured feeEpoch + verified chain epoch); DBC: live mainnet config; simulated evidence always labeled (SAMPLE badge, `simulated` class) | Chain-state change flows into verdicts (epoch-verified selection; 1% vs 8% policy divergence on one config); no test asserts a simulated sample as live | HARD (classification + provenance assertions; math cross-checked vs official `spl-token calculateFee`) | L2 overall; L4 achieved for owner-run core-loop + DBC flows |
| C. ZERO CUSTODY / ZERO SIGNING | No signing/broadcast/custody code paths; localhost-only CLI; constrained numeric/address inputs | Committed static scans (`sign`, `sendTransaction`, `Keypair`, `secretKey`, `mnemonic`) over scenario/CLI/server code; e2e proves no `/execute` route and 404s `/sendTransaction` | HARD for code paths and routes; private-key-field absence is OBSERVATIONAL (reviewed, not assertion-covered) | L2 |
| D. UNABLE NEVER BECOMES PASS | Engine `toUnable` boundary; exit 2; UNABLE cards visually distinct | Malformed/garbage/unsupported-mint, unreachable-target, capability-missing, invalid-address, oversize-upload paths all assert UNABLE (never PASS/FAIL) in committed tests | HARD (adversarial cases asserted) | L2 |
| E. NORMAL PUBLIC ONBOARDING WORKS | `npx justfair@latest init/test` from the registry tarball | 1.0.4: L3 EXISTS (packed init + untouched UNABLE×3 + wired FAIL→PASS + DBC smoke from tarball). Public proof does NOT yet exist (registry still 1.0.3) | HARD (regression tests on generated scaffold) | L3 → NOT YET PROVEN at L4 |
| F. TESSERA FAIL → APP-ONLY FIX → PASS | Same scenario, same adapter, same command; only app observations change | Supersedes L2/L3 with L4 OWNER-OBSERVED PUBLIC 1.0.3: fresh public init (transfer_fee_accounting native, no workaround) → wrong app (reported 1000) → FAIL TRANSFER_FEE_IGNORED (expected 998, live_tessera_token2022, FAIL Replay observed) → app-only fix → same command → PASS 1/0/0 (expected = reported = 998, PASS Replay observed) | HARD at engine/CLI verdict boundary | L4 PASS / PROVEN |
| G. FRESH SCAFFOLD CANNOT CREATE FALSE FINANCIAL PASS | Explicit unwired adapter state (502 refusal) + engine UNABLE classification at the adapter/engine result boundary | Adversarial proof: all PreStocks variants run against the untouched generated adapter — none can PASS (all UNABLE, exit 2); wired wrong app → FAIL; wired fixed app → PASS | HARD (runtime behavior enforced + committed spawned-scaffold tests) | L3 maximum until public Owner UAT |
| H. PRESTOCKS EXPIRY LIFECYCLE (fixture-bounded) | AFTER-variant assertions over the official SpaceX conversion case, labeled `authoritative_event_fixture`, never live data | Owner FAIL→app-only-fix→PASS on public 1.0.4 with Replay observed both runs; March-2027 event NOT claimed as observed | HARD (engine assertions + owner proof) | WORKFLOW L4; EVENT ITSELF UNOBSERVED (future) |

## 27. RELEASE / SUBMISSION BLOCKERS

- GITHUB / PUBLIC REPOSITORY: Public repository live at `https://github.com/Techkeyy/justfair`, tracks local `main`, connected to Vercel.
- NPM REGISTRY DISTRIBUTION: `justfair@1.0.4` published and owner-verified (`latest = 1.0.4`).
- VERCEL PRODUCTION DEPLOYMENT: Live and Git-integrated at `https://justfair-theta.vercel.app`.
- DEADLINE AWARENESS: Sep 18 4pm ET vs Sep 25 calendar note documented.

## 28. REPOSITORY / GITHUB STATE

- GitHub: PUBLIC / CONNECTED
- Repository: `https://github.com/Techkeyy/justfair`
- Remote: `origin` (`https://github.com/Techkeyy/justfair.git`)
- Production branch: `main` (tracked)
- Git-connected Vercel auto-deployment active on `https://justfair-theta.vercel.app`.

## 29. FILES CHANGED RECENTLY

- `public/index.html`: Step 2 actionable per Owner UAT (real `justfair-adapter.mjs` `observations` edit point + verbatim scaffold example + two-ports bullet) and Step 4 note corrected to stale/carry-forward equity prices; earlier `#test-view` onboarding copy truths (headline, scenario mix, `init` skip notice).
- `package.json` + `package-lock.json`: 1.0.4 (PreStocks scaffold consistency fix; registry publish pending owner OTP).
- `src/cli.js`: scaffold manifest now advertises `transfer_fee_accounting` + `lifecycle_position_state` (existing capabilities preserved); PreStocks wiring templates with explicit `unwired()` 502 refusal (never fabricate; engine reports UNABLE).
- `src/scenarios/adapter.js`: non-OK adapter responses surface the capped body in the error (`Adapter HTTP <status>: <body>`), same code/path.
- `test/cli.test.js`: fresh-scaffold Tessera no-SKIP end-to-end regression (spawned untouched scaffold + live fee state → FAIL, never SKIP); PreStocks untouched=UNABLE ×3 + honest-SKIP regressions.
- `test/browser.test.js`: test 65 rewritten for sweep UI + 65b (390px overflow) + 65c/65d (human amounts, non-SOL labeling) + 65e (25% CURVE CAPACITY aggregate) + 65f (mixed-UNABLE NOT VERIFIED); `test/e2e.test.js`: sweep endpoint validation; `test/cli.test.js`: `whale --sweep` live + UNABLE tests.
- `src/cli.js`: `runInitCommand` next steps teach connect → start app → start adapter → public npx test command (no bare `justfair test`).
- `test/cli.test.js`: new init next-steps test (no bare command, npx command present, connect-before-start, real-app observations, step order).
- `public/styles.css`: scoped `.code-body.code-wrap` wrap rule for the Step 2 example only (no global code-style change).
- `test/browser.test.js`: new assertions 62b (FAIL/PASS/UNABLE hero states + close reset) and 62c (sample rename); earlier 61c/61d (desktop/390px readability) and 61b (Step 2 actionability).
- `package.json`: normalized repository URL via `npm pkg fix`, published `justfair@1.0.0` to npm registry.
- `public/styles.css`: added styles for onboarding steps, code snippets, mental model diagram, and Replay Lab empty state.
- `public/app.js`: wired snippet copy buttons, report close button, and `/api/v1/local-artifact` local-first auto-open listener.
- `README.md`: separated into "Using JustFair (No-Clone Developer Journey)" and "Contributing to JustFair".
- `test/browser.test.js`: updated assertions to verify published `npx justfair@latest` onboarding commands across hero, test view, and Replay Lab.
- `src/scenarios/dbc-live.js`: launch-stress sweep (`deriveSweepSizes`, `parseSweepSizes`, `summarizeSweep`, `sweepOverallStatus`, `quoteSingleSize`, `runDbcSweep`) reusing the whale quote core with identical whale outputs; aggregate precedence FAIL > UNABLE > CAPACITY > PASS (any UNABLE point makes the run inconclusive; capacity never collapses into FAIL); quote-asset resolution (`resolveQuoteAsset`, exact human formatters, raw audit preservation) with SOL label only for the native mint.
- `src/scenarios/dbc.js`: `DBC_LAUNCH_SWEEP` contract descriptor (issuer-owned policy, distinct point outcomes).
- `src/server.js`: new `POST /api/v1/dbc/sweep` reusing the DBC core (`/whale` untouched).
- `src/cli.js`: `whale --sweep [--sizes]` with table output and 0/1/2 exits (CAPACITY prints CURVE CAPACITY header, exits 1 as a real finding).
- `public/index.html` + `public/app.js` + `public/styles.css`: DBC LAUNCH STRESS page (config + YOUR POLICY, summary, first-failure callouts, stress-profile table, provenance, raw-evidence disclosure, scoped responsive table CSS); human-primary amounts with grouped raw secondary; aggregate badge maps CAPACITY → CURVE CAPACITY; flex min-content blowout fix in `.replay-field` (also hardens Replay detail rendering).
- `test/dbc-sweep.test.js`: new (12 tests: pure grid/parse/summary + live sweep/policy/capacity/UNABLE + no-signing scan).
- `test/cli.test.js`: fresh-scaffold Tessera no-SKIP end-to-end regression; PreStocks untouched=UNABLE ×3 + honest-SKIP regressions.
- `SUBMISSION.md`: submission package (name/tagline/descriptions/problem/solution/audience/Solana/how-it-works/live-vs-fixture evidence/owner proofs/tech stack/links/video placeholder/missing-field note + 14-row internal claim table PROVEN/SUPPORTED/PLANNED/LIMITATION).
- `docs/DEMO_SCRIPT.md`: 2:35 timestamped demo (Tessera primary causal loop, DBC breadth, PreStocks future-event breadth with mandatory framing, close).
- `docs/RECORDING_CHECKLIST.md`: terminals/browser/commands/prohibitions/post-recording checks for the owner recording session.
- `DIRECTOR.md`: submission-package record (wording corrections, claim audit, rubric/judge-attack outcomes, freeze state).

## 30. IMPORTANT COMMITS

`bacabd9` docs(uat): record UAT step 2 technical proof and refresh evidence captures ·
`aadd460` docs(pipeline): record GitHub and Vercel Git-integrated release pipeline ·
`21e237d` feat(test-page): document CLI artifact flow and complete UAT Fix 002 ·
`32a73b0` docs UAT fixes 001A/001B proof · `860fd8a` one-column hero ·
`f7d1ecd` remove legacy entry + hero image · `b068310` coherence captures ·
`de0ff38`, `9b2fe42` homepage coherence records · `85d4bf7` single coherent narrative.

## 31. LOCAL SKILLS USED

`C:\Users\HomePC\Desktop\skill\`. Materially applied this session:
- `build-process`: verified public npm release, ran real developer app FAIL -> Fix -> PASS lifecycle against registry package, and executed complete multi-suite regression.
- `project-understanding`: restored developer mental model and seamless no-clone onboarding flow across production surfaces.
- `audit-skill`: verified registry tarball manifest, confirmed zero secret leaks, and validated all test suites.

## 32. OFFICIAL DOCS / SOURCES THAT GOVERN CURRENT IMPLEMENTATION

- Stocklana page `hackathons.solana.com/hackathons/stocklana` (Confirmed: $121K, tracks, contradictory Sep 18 / Sep 25 deadlines, one-submission rule, Pyth/PreStocks/Meteora/Tessera bounty texts).
- `docs.tessera.pe` (Confirmed: 0.20% standard, sender-pays, changeable) + `rest-api.tessera.pe/v1/public/token-details` (Confirmed live: 3 products, mints).
- `prestocks.com/api/prestocks` (Confirmed live, no auth) + official SpaceX page IPO/conversion/expiry case.
- `docs.meteora.ag` + `MeteoraAg/dynamic-bonding-curve-sdk` v1.5.12
- `solana.com/docs`, `spl.solana.com` (Confirmed: Token-2022 program ID, Scaled UI Amount + integration guidance, float non-round-trip warning).

## 33. THINGS THAT MUST NOT REGRESS

Zero-custody boundaries (§20); Token-2022 math vs official docs; unsigned-sim isolation; API shapes; MEASURED-not-FAIR honesty; UNKNOWN-never-PASS; session≠freshness split; neutrality; env-only secrets; sponsor evidence labels; localhost-only CLI; no arbitrary-URL fetch surface; Replay text-only rendering; green baselines (§24).

## 34. CURRENT BUILD STATUS

TESSERA OWNER UAT = PASS (PUBLIC ONBOARDING PASS, CORE-OUTCOME LEVEL 4); NPM 1.0.4 PUBLIC; PRESTOCKS OWNER UAT = PASS (WORKFLOW L4, EVENT FIXTURE LABELED); PRODUCT FROZEN, SUBMISSION PACKAGE READY FOR OWNER REVIEW (NOT SUBMITTED).
Never report DONE, FINISHED, PRODUCTION READY, or SUBMISSION READY — owner human UAT is final authority.

## 35. EXACT NEXT ACTION

Owner reviews `SUBMISSION.md` + `docs/DEMO_SCRIPT.md` + `docs/RECORDING_CHECKLIST.md`, records the demo video, and submits via the Stocklana form using PROVEN claims only. Do NOT mark SUBMISSION READY or submitted; the human owner/director decides. No product changes without a critical submission-blocking defect.


