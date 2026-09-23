# JustFair — Stocklana Submission Package (Owner Review Draft — NOT SUBMITTED)

> Every material claim below is labeled in the internal claim table at the
> bottom. Polished copy avoids label jargon but never exceeds the labeled
> evidence. Nothing here has been submitted anywhere.

## PROJECT NAME

JustFair

## PRIMARY TAGLINE

Break your stock app before the market does.

## ONE-LINER

Local-first crash testing that finds financial-correctness bugs in stock apps before they can reach users with real money at stake.

## SHORT DESCRIPTION

JustFair crash-tests stock applications and tokenized-market infrastructure on Solana. A developer adds a small observation adapter to their running app, runs deterministic financial scenarios from the public `justfair` npm package, and gets PASS / FAIL / UNABLE with replay, root cause, and fix guidance — then reruns the same scenario to PASS. Local-first, zero custody, no signing, no fund movement.

## FULL DESCRIPTION

Stock apps fail financially while looking technically healthy: a stale price shown as live, a Token-2022 transfer fee ignored in the recipient amount, an expired tokenized holding still valued, an opening trade size that breaches the issuer's own impact policy. If these bugs reach production, users can encounter financially incorrect results with real money at stake.

JustFair exists to break the app first. The developer exposes two small localhost endpoints describing what their app displays. JustFair's scenario engine evaluates financial invariants against labeled evidence — live Solana chain state, authoritative market events, or explicitly labeled simulations. The target returns observations only; JustFair independently computes PASS / FAIL / UNABLE from those observations and its authoritative scenario evidence. Failures come with expected-vs-actual, root cause, remediation guidance, and an ordered replay; the developer fixes only their app and reruns the exact same command until it passes.

Coverage today: stale/carry-forward equity references, PreStocks conversion deadlines and expired holdings, Token-2022 transfer-fee accounting on live T-Tokens, and Meteora DBC launch-stress sweeps (PASS / FAIL / CURVE CAPACITY with first-policy-failure findings against the issuer's own policy).

## PROBLEM

Software that compiles, returns HTTP 200, executes a transaction, or shows a balance can still produce a financially incorrect outcome — and for stock applications, that incorrectness can reach users with real money on the line. JustFair provides a local-first workflow for testing that financial logic before release.

## SOLUTION

A public npm-distributed crash-testing workflow (`npx justfair@latest init` → connect adapter → `npx justfair@latest test --target <localhost> --open`) plus a local Replay Lab, backed by deterministic scenario assertions over honestly labeled evidence, with strict PASS / FAIL / UNABLE semantics and zero custody.

## WHO IT IS FOR

Developers and teams building stock wallets, tokenized-stock interfaces, DEXes, portfolio and accounting apps, stock-aware lending, trading agents, and tokenized-market infrastructure on Solana — anyone whose app displays financial state derived from Solana programs.

## WHY SOLANA

The financial behavior under test lives on Solana: Token-2022 transfer fees and multiplier schedules are readable on-chain, Meteora bonding curves are simulatable from real mainnet configs without signing, and unsigned transaction simulation verifies execution semantics without broadcasting. These checks are Solana-specific: moving them off Solana would remove the Token-2022, Meteora DBC, and Solana execution primitives that provide their authoritative state.

## HOW IT WORKS

1. `npx justfair@latest init` scaffolds `justfair.config.js` and `justfair-adapter.mjs` (existing files never overwritten).
2. The developer connects the adapter's observation hooks to values their app actually calculates or displays.
3. The app runs on any localhost port; the adapter reads from it and exposes JustFair's two test endpoints on its own localhost port.
4. `npx justfair@latest test --target http://localhost:3100 --open` runs scenarios; Replay Lab opens locally with zero cloud telemetry.
5. On FAIL: inspect WHAT HAPPENED, EXPECTED vs YOUR APP, root cause, fix guidance, and replay. Fix only the app. Rerun the same command to PASS.

## WHAT IS ACTUALLY LIVE

- Tessera scenarios read the LIVE Token-2022 TransferFeeConfig of real T-Tokens on Solana mainnet (fee parameters and epoch verified per run).
- DBC sweeps read LIVE Meteora bonding-curve configs on mainnet and run real SDK quote math read-only (no signing, no funds, no trades).
- PreStocks lifecycle scenarios test the PUBLISHED future expiry condition from the official PreStocks SpaceX conversion terms (deadline 12 March 2027 23:59 UTC), explicitly labeled as an authoritative event fixture — this is a crash test of published terms, not a live lifecycle feed, and the March 2027 event has not occurred.
- Market-data stale-reference scenarios are explicitly labeled simulations.

## CORE PROOF

Using only the public package against real external apps, the owner twice demonstrated the full causal loop: wrong app → JustFair FAIL with diagnosis → fix ONLY the app → exact same command → PASS. (1) Token-2022 fee ignored (reported 1000 vs fee-adjusted 998, live 20 bps state). (2) Expired holding shown as live (post-deadline ordinary valuation vs expired marking, published expiry terms). DBC sweeps additionally proved issuer-policy control: the same config yields FAIL at 8%, FAIL at 15%, and CURVE CAPACITY at 25%.

## TECH STACK

Node.js 20+ CLI distributed via npm (`justfair`, bin `justfair`); vanilla JS/CSS web surfaces (no framework, no build step) served by a single Node HTTP handler, deployed Git-integrated on Vercel; Solana mainnet reads via `@solana/web3.js`, `@solana/spl-token`, `@solana/kit`, and `@meteora-ag/dynamic-bonding-curve-sdk` (read-only; unsigned simulation only); deterministic Node test suites (unit + live-network + Playwright browser).

## PUBLIC LINKS

- GITHUB: https://github.com/Techkeyy/justfair
- LIVE PRODUCT: https://justfair-theta.vercel.app
- NPM: justfair@1.0.4 — https://www.npmjs.com/package/justfair
- DEMO VIDEO: (placeholder — no video URL exists yet; at least one of GitHub / live demo / video satisfies the known form requirement)

## MISSING PLATFORM FIELD

The recorded Stocklana form requirements (`docs/HACKATHON.md`) document only: project name, at least one openable link, and teammates via the form. No other exact field names are documented in-repo. Any additional fields encountered on the real form (e.g. track selection, video URL, description length limits) must be filled from the copy above without inventing new claims, and this file updated to list them.

---

## INTERNAL CLAIM TABLE (not for pasting into the form)

| # | Material claim (as worded above or implied) | Label | Evidence |
|---|---|---|---|
| 1 | Public npm workflow exists (`init`/`test`, no clone) | PROVEN | Registry justfair@1.0.4; owner-executed fresh installs; committed CLI tests |
| 2 | External app FAIL → app-only fix → same-command PASS | PROVEN | Two owner-executed public causal loops (Tessera, PreStocks) with observed Replays |
| 3 | Tessera uses live Token-2022 transfer-fee state | PROVEN | Per-run on-chain reads (decimals/bps/maxFee/epoch verified); math cross-checked vs official `spl-token calculateFee` |
| 4 | DBC uses live market/config evidence | PROVEN | Live mainnet config reads + SDK quote math; owner sweeps at 8/15/25% |
| 5 | Replay explains expected vs observed + root cause/fix | PROVEN | Owner-observed FAIL and PASS Replays; committed sample artifacts; browser assertions |
| 6 | Zero-custody product path (no keys/signing/broadcast/funds) | PROVEN | Committed static scans; e2e route checks; localhost-only CLI; constrained inputs |
| 7 | Localhost adapter workflow | PROVEN | Contract + owner-executed flows on 127.0.0.1 |
| 8 | PreStocks tests published future expiry terms | PROVEN | Fixture byte-consistent with live official page (re-verified 2026-09-23); labeled `authoritative_event_fixture` in code/Replay/README/site |
| 9 | PreStocks March 2027 expiry was observed live | LIMITATION | Event is future; must never be claimed. Submission copy above does not claim it |
| 10 | CLI targets localhost only | LIMITATION | No remote-target execution; documented |
| 11 | JustFair executes/signs/broadcasts trades or handles funds | LIMITATION | It does not; must never be claimed |
| 12 | AGENT SAFETY scenario breadth | PLANNED | Coverage card states scenarios land as adapters mature; not a current capability |
| 13 | Market-data stale-reference path | SUPPORTED | Works end-to-end; evidence is explicitly labeled simulated (not live equity data) |
| 14 | 282 automated tests green | SUPPORTED | Verified counts across committed suites (unit + live-network + browser); live suites depend on real networks |
