# JustFair Demo Script — 2:35 (Owner Records)

> Primary causal loop MUST be Tessera. Do not spend the video listing tests.
> Show causal outcome evidence. Total budget 2:35; hard stop 3:00.

## 0:00–0:15 — Problem

Say (on camera or voiceover, homepage visible):

"A stock app can execute technically correctly and still show the wrong
financial result."

Cut to the REAL FAILURE card on the homepage (TESSERA_TRANSFER_FEE_ACCOUNTING:
expected 998, app reported 1000, FAIL).

## 0:15–0:30 — JustFair

Terminal visible. Say:

"JustFair crash-tests stock apps before the market does. Public npm package,
a small local adapter, no custody, no signing, no funds."

Type (do not run yet):

```sh
npx justfair@latest init
```

## 0:30–1:25 — TESSERA core loop (must be the clearest portion)

Terminal A: stock app running (wrong state). Terminal B: adapter running.

1. Run:
   ```sh
   npx justfair@latest test --target http://localhost:3100 --tessera-mint T-OpenAI --tessera-amount 1000 --scenario TESSERA_TRANSFER_FEE_ACCOUNTING --open
   ```
2. Hold on FAIL: `TRANSFER_FEE_IGNORED`, expected 998, reported 1000.
3. Replay Lab opens — scroll WHAT HAPPENED → EXPECTED vs YOUR APP → root
   cause → fix guidance. Say: "JustFair reads the live Token-2022 fee
   config itself and calculates 998. The app said 1000."
4. Edit exactly one line in the app (fee flag false → true). Restart ONLY
   the app. Say: "Only the app changes. Same adapter, same command."
5. Rerun the exact same command. Hold on PASS (1 passed · 0 failed).

## 1:25–1:55 — DBC LAUNCH STRESS breadth

Browser on `#dbc` (production or local). Config prefilled, YOUR POLICY 8.

1. Click RUN LAUNCH STRESS TEST.
2. Hold the stress profile: PASS rows, FIRST OBSERVED POLICY FAILURE,
   FIRST CAPACITY BOUNDARY. Say: "Real mainnet config, the issuer's own
   policy — 8% fails here, 25% reaches capacity. JustFair never invents a
   safe number."
3. If time allows, show that the same 8% policy was also exercised against
   three additional real mainnet configurations. Their economics differ, and
   each reports CURVE CAPACITY when quoting ends rather than becoming a PASS.
   This breadth is for the tested compatible DBC classes, not every historical
   DBC variant.

## 1:55–2:20 — PRESTOCKS breadth (future-event framing, mandatory wording)

Say verbatim framing at the start:

"This one crash-tests published future expiry terms — it is NOT a live
March-2027 event."

Then: wrong expired-as-live app → FAIL `EXPIRED_REPRESENTATION_TREATED_AS_LIVE`
→ corrected app → PASS, same command. Keep it to ~25 seconds.

## 2:20–2:35 — Close

Homepage + npm visible. Say:

"Public npm, local-first Replay, zero custody. Break your stock app before
the market does."

End card: GitHub URL, live product URL, npm `justfair@1.0.5`.
