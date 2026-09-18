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

(Run from the repo root. No `npx`/`npm -g` distribution exists.)

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

Current verified counts (2026-09-18 UX Upgrade 003 run):
- Unit / Scenario / Integration test suite (`npm test` & native suites): 97 PASSED · 0 FAILED · 1 SKIPPED (Pyth live probe skipped without API key).
- CLI test suite (`node --test test/cli.test.js`): 14 PASSED · 0 FAILED (includes `init` scaffold with overwrite protection, `startLocalReportViewer` in-memory serving on 127.0.0.1, and `test --open`).
- Clean Outside-Repo Proof: Packaged `justfair-1.0.0.tgz` (51 files, 229.2 kB), installed into clean temporary directory outside the repository, executed `npx justfair init`, verified scaffold files, started adapter, ran `npx justfair test --target http://127.0.0.1:3100 --out justfair-result.json`, and verified exact exit codes and disk artifact.

## 25. OWNER UAT STATE

- UAT STEP 1 — PASS (homepage coherence: one product, no legacy narrative).
- UAT STEP 2 — PASS (technical proof complete & verified; human UAT revealed onboarding friction).
- UX UPGRADE 003 — TECHNICAL PROOF COMPLETE · PENDING HUMAN OWNER UAT REVALIDATION:
  1. No-clone CLI packaging implemented with `"bin": { "justfair": "src/cli.js" }` and clean `files` whitelist (51 files, zero secrets).
  2. `justfair init` scaffolds `justfair.config.js` and `justfair-adapter.mjs` with overwrite protection.
  3. `justfair test --target <url> --open` serves Replay Lab locally from memory on ephemeral port `127.0.0.1:0` with zero remote uploads / cloud telemetry.
  4. `#test-view` rebuilt into a 5-step guided developer onboarding flow with one-click copyable commands.
  5. Replay Lab empty state modernized to prevent unprompted failure rendering while offering interactive samples and local upload.

## 26. CURRENT BLOCKERS

1. Post-UX-003 owner UAT revalidation.
2. npm registry authentication: npm token in `~/.npmrc` returned 401 Unauthorized against `registry.npmjs.org`. Packaging and local tarball execution are fully functional; public `npx` commands on production are documented accurately.
3. Final submission materials and final compliance verification.

## 27. RELEASE / SUBMISSION BLOCKERS

- GITHUB / PUBLIC DISTRIBUTION: Public repository live at `https://github.com/Techkeyy/justfair`, tracks local `main`, connected to Vercel.
- NPM REGISTRY DISTRIBUTION: Packaged via npm tarball; registry publication gated on valid npm auth.
- Deadline contradiction (official page: SEP 25 header vs Sep 18 4pm ET timeline) — build against Sep 18; confirm with organizer.

## 28. REPOSITORY / GITHUB STATE

- GitHub: PUBLIC / CONNECTED
- Repository: `https://github.com/Techkeyy/justfair`
- Remote: `origin` (`https://github.com/Techkeyy/justfair.git`)
- Production branch: `main` (tracked)
- Git-connected Vercel auto-deployment active on `https://justfair-theta.vercel.app`.

## 29. FILES CHANGED RECENTLY

- `package.json`: added binary entrypoint `"bin": { "justfair": "src/cli.js" }`, `"files"` whitelist, keywords, and description.
- `src/cli.js`: added `runInitCommand` (`justfair init`), `startLocalReportViewer`, and `--open` flag for local Replay Lab viewing.
- `public/index.html`: updated `#test-view` to 5-step guided developer onboarding; updated `#replay-view` with clean instructional empty state.
- `public/styles.css`: added styles for onboarding step cards, code snippet boxes, and Replay empty state.
- `public/app.js`: wired snippet copy buttons, report close button, and `/api/v1/local-artifact` local-first auto-open listener.
- `test/cli.test.js`: added 3 test cases for `init`, `startLocalReportViewer`, and `test --open`.
- `README.md`: updated quickstart with no-clone developer journey.

## 30. IMPORTANT COMMITS

`bacabd9` docs(uat): record UAT step 2 technical proof and refresh evidence captures ·
`aadd460` docs(pipeline): record GitHub and Vercel Git-integrated release pipeline ·
`21e237d` feat(test-page): document CLI artifact flow and complete UAT Fix 002 ·
`32a73b0` docs UAT fixes 001A/001B proof · `860fd8a` one-column hero ·
`f7d1ecd` remove legacy entry + hero image · `b068310` coherence captures ·
`de0ff38`, `9b2fe42` homepage coherence records · `85d4bf7` single coherent narrative.

## 31. LOCAL SKILLS USED

`C:\Users\HomePC\Desktop\skill\`. Materially applied this session:
- `build-process`: implemented `init` command, in-memory local report viewer (`--open`), packaged tarball with `npm pack`, executed clean outside-repo installation in temporary environment, verified scenario execution, and ensured continuous auto-deployment pipeline.
- `project-understanding`: resolved developer onboarding friction by structuring a clear 5-step journey and zero-egress local Replay Lab viewer.
- `audit-skill`: verified tarball contents against `.env` and test captures, checked schema compliance, and validated exit codes.

## 32. OFFICIAL DOCS / SOURCES THAT GOVERN CURRENT IMPLEMENTATION

- Stocklana page `hackathons.solana.com/hackathons/stocklana` (Confirmed: $121K, tracks, contradictory Sep 18 / Sep 25 deadlines, one-submission rule, Pyth/PreStocks/Meteora/Tessera bounty texts).
- `docs.tessera.pe` (Confirmed: 0.20% standard, sender-pays, changeable) + `rest-api.tessera.pe/v1/public/token-details` (Confirmed live: 3 products, mints).
- `prestocks.com/api/prestocks` (Confirmed live, no auth) + official SpaceX page IPO/conversion/expiry case.
- `docs.meteora.ag` + `MeteoraAg/dynamic-bonding-curve-sdk` v1.5.12
- `solana.com/docs`, `spl.solana.com` (Confirmed: Token-2022 program ID, Scaled UI Amount + integration guidance, float non-round-trip warning).

## 33. THINGS THAT MUST NOT REGRESS

Zero-custody boundaries (§20); Token-2022 math vs official docs; unsigned-sim isolation; API shapes; MEASURED-not-FAIR honesty; UNKNOWN-never-PASS; session≠freshness split; neutrality; env-only secrets; sponsor evidence labels; localhost-only CLI; no arbitrary-URL fetch surface; Replay text-only rendering; green baselines (§24).

## 34. CURRENT BUILD STATUS

UX UPGRADE 003 READY FOR OWNER UAT.
Never report DONE, FINISHED, PRODUCTION READY, or SUBMISSION READY — owner human UAT is final authority.

## 35. EXACT NEXT ACTION

Submit UX Upgrade 003 implementation and proofs to Human Owner for UAT revalidation.


