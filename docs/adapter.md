# JustFair Local Test-Target Adapter (v1)

## WHAT IT IS

Two tiny endpoints your application exposes so the **local** JustFair
runner (`node src/cli.js test`) can feed scenario inputs into your real
financial logic and judge what your app actually shows.

## WHY LOCAL

Your app stays on your machine. JustFair never needs remote access into
your systems, your keys, or your database. The CLI calls `localhost`;
nothing is uploaded, signed, or broadcast.

## ENDPOINT 1 — Manifest

`GET /justfair/v1/manifest`

```json
{
  "adapterVersion": "1",
  "name": "My Stock Wallet",
  "capabilities": ["underlying_price_display"]
}
```

`capabilities` lists what your app can report (e.g.
`underlying_price_display`, `lifecycle_position_state`,
`transfer_fee_accounting`). JustFair only
runs scenarios your adapter claims to support; anything else is skipped,
never failed.

## ENDPOINT 2 — Evaluate

`POST /justfair/v1/evaluate`

Input (JustFair sends only scenario inputs — never secrets):

```json
{
  "scenarioId": "STALE_CARRIED_FORWARD_EQUITY",
  "scenarioVersion": "1",
  "inputs": { "symbol": "AAPL", "referencePrice": 329.29, "...": "..." }
}
```

Output — ONLY OBSERVATIONS, i.e. what your app would display:

```json
{
  "displayedPrice": 329.29,
  "claimsLive": false,
  "label": "AAPL reference (market closed — last available)"
}
```

Never return a verdict:

```json
{ "pass": true }
```

```json
{ "verdict": "PASS" }
```

Verdict-like fields are ignored. JustFair owns PASS / FAIL /
UNABLE_TO_VERIFY, replay, root cause, and fix guidance.

## TRY IT

```bash
node examples/adapter-basic/server.mjs naive
node src/cli.js test --target http://127.0.0.1:<PORT>
```

See `examples/adapter-basic/README.md`. Reference implementation:
`test/fixtures/adapter-targets.js`.

## LIMITS (Phase 2)

Localhost targets only (`localhost`, `127.0.0.1`, `::1`). Responses are
capped (64 KB), calls time out (10 s), responses must be JSON objects.
