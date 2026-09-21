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
(contract) + `dbc-live.js` (executable whale), `pyth.js` (parser/fetcher,
historical only).
`src/server.js` — single handler: legacy preflight/product routes +
`POST /api/v1/dbc/whale` (validated, rate-limited); static fallback.
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

LOCKED FUTURE DIRECTION (2026-09-21, NOT implemented — record only):
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
UNABLE distinct, engine-generated SAMPLE-labeled samples). DBC Stress
(config/size/policy form → real server execution, same result model).
Footer: Product (Test/Replay/DBC) + Resources (System Health). Legacy Steps
UI remains served internally for tests/primitives, with NO public nav/hero/
footer entry.

## 23. PRODUCTION URL + DEPLOYMENT STATE

- Production URL: `https://justfair-theta.vercel.app` (Vercel; Node 22; `/api/*` → serverless, static → `/public`; no build step).
- Deployment Behavior: Git-integrated auto-deploy on push to `main`.
- Vercel Project: `prj_tpi4meN9oQoKPi4HIntgPHLAM5yP` (`justfair`), linked to GitHub repository `Techkeyy/justfair` on production branch `main`.
- Fallback/Debug Deploy Path: `npx vercel --prod --yes`.

## 24. TEST SUITE STATE

Current verified counts (2026-09-18 UX Upgrade 003 Public Release run):
- Unit & Preflight suite (`npm test`): 49 PASSED · 0 FAILED.
- Scenario & Integration suite (`node test/justfair-scenarios.test.js test/dbc.test.js test/tessera.test.js test/e2e.test.js`): 25 PASSED · 0 FAILED · 1 SKIPPED (Pyth live probe skipped without API key).
- CLI test suite (`node --test test/cli.test.js`): 15 PASSED · 0 FAILED (includes `init` scaffold with overwrite protection, init next-steps public-npx/connect-first guidance, `startLocalReportViewer` in-memory serving on 127.0.0.1, and `test --open`).
- Playwright Browser test suite (`node test/browser.test.js`): 72 PASSED · 0 FAILED (covers all guided onboarding flows, Step 2 actionability + readability assertions 61b/61c/61d, state-aware Replay Lab hero 62b/62c, mental model diagram, published `npx justfair@latest` commands, Replay Lab sample rendering, DBC stress testing, and responsive layouts).
- Total Automated Tests: 160 PASSED · 0 FAILED · 1 SKIPPED.
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
- OWNER UAT — REPLAY PASS-STATE PRESENTATION BUG (found during the above PASS run): PASS report rendered under "Understand a failure." + failure-specific subtitle. Fix applied (state-aware hero: neutral "Understand a result." when empty, "Understand a failure." on FAIL, "Verify a passing run." on all-PASS, "Understand what could not be verified." on UNABLE; neutral subtitle for all states; sample button "Stale Oracle Failure" → "Stale Price Failure" since the scenario is simulated carry-forward semantics, not a live oracle; scenario IDs and evidence semantics unchanged). Presentation-only; result schema, engine, verdicts, replay, viewer, protocol, npm behavior, and DBC untouched. New browser assertions 62b/62c. Browser suite 2026-09-21: 72 PASSED · 0 FAILED. Visual revalidation pending; overall FINISHED is NOT claimed.

## 26. CURRENT BLOCKERS

None. All technical, packaging, npm registry distribution, and test validation gates are fully resolved.

## 27. RELEASE / SUBMISSION BLOCKERS

- GITHUB / PUBLIC REPOSITORY: Public repository live at `https://github.com/Techkeyy/justfair`, tracks local `main`, connected to Vercel.
- NPM REGISTRY DISTRIBUTION: Live and verified at `https://www.npmjs.com/package/justfair` (`justfair@1.0.0`).
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
- `package.json`: 1.0.1 (init guidance fix; registry publish pending owner auth).
- `src/cli.js`: `runInitCommand` next steps teach connect → start app → start adapter → public npx test command (no bare `justfair test`).
- `test/cli.test.js`: new init next-steps test (no bare command, npx command present, connect-before-start, real-app observations, step order).
- `public/styles.css`: scoped `.code-body.code-wrap` wrap rule for the Step 2 example only (no global code-style change).
- `test/browser.test.js`: new assertions 62b (FAIL/PASS/UNABLE hero states + close reset) and 62c (sample rename); earlier 61c/61d (desktop/390px readability) and 61b (Step 2 actionability).
- `package.json`: normalized repository URL via `npm pkg fix`, published `justfair@1.0.0` to npm registry.
- `public/styles.css`: added styles for onboarding steps, code snippets, mental model diagram, and Replay Lab empty state.
- `public/app.js`: wired snippet copy buttons, report close button, and `/api/v1/local-artifact` local-first auto-open listener.
- `README.md`: separated into "Using JustFair (No-Clone Developer Journey)" and "Contributing to JustFair".
- `test/browser.test.js`: updated assertions to verify published `npx justfair@latest` onboarding commands across hero, test view, and Replay Lab.
- `DIRECTOR.md`: authoritative record of npm publication, test suites, real app proof, and UAT readiness.

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

UX UPGRADE 003 — OWNER CORE LOOP PASS; REPLAY PASS-STATE FIX APPLIED, OWNER REVALIDATION PENDING (NOT FINISHED).
Never report DONE, FINISHED, PRODUCTION READY, or SUBMISSION READY — owner human UAT is final authority.

## 35. EXACT NEXT ACTION

Present the state-aware Replay Lab hero on `https://justfair-theta.vercel.app/#replay` (empty / FAIL / PASS / UNABLE) to the owner for human visual revalidation. Do NOT claim visual PASS or overall FINISHED; the human owner/director decides. Do NOT start the DBC upgrade without an explicit order.


