// JustFair Consumer Product End-to-End Test Suite (Director Order 005 Block B Gate)
//
// DETERMINISTIC suite (Director Order 014A): external-provider calls
// (Jupiter, xStocks, Nasdaq, CoinGecko, Solana RPC) are stubbed at the fetch
// boundary with fixed fixtures, while JustFair's own HTTP routing,
// validation, economics, matcher, and response contracts run for real.
// Same code + same fixture -> same result every run, no network weather.
// Live-provider behavior belongs in test/smoke_prod.js (observational).
import { createServer } from "../src/server.js";
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS } from "../src/config.js";
import { clearMarketReferenceCache } from "../src/engine/benchmark.js";
import { calculateMarketSession } from "../src/preflight.js";

const FIXTURE_OUT_AMOUNT = "151127287";
const FIXTURE_PRICE = 330.30;
const FIXTURE_MULTIPLIER = "1.0";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function jupiterOrderFixture(inputMint, outputMint, router, ammKey, outAmount) {
  return {
    outAmount,
    router,
    mode: "ultra",
    feeBps: 10,
    priceImpactPct: "0.01",
    routePlan: [{
      swapInfo: { label: router === "metis" ? "Meteora" : "Whirlpool", ammKey, inputMint, outputMint }
    }],
    transaction: "FIXTURE_BASE64_TRANSACTION"
  };
}

// Intercepts ONLY external upstream hosts. Same-process localhost traffic
// (the JustFair server under test) always passes through untouched.
function installUpstreamStubs() {
  const realFetch = globalThis.fetch;
  const EXTERNAL_HOSTS = [
    "api.jup.ag", "quote-api.jup.ag", "api.xstocks.fi", "api.nasdaq.com",
    "api.coingecko.com", "publicnode.com", "mainnet-beta.solana.com",
    "solana.com", "hermes.pyth.network", "pyth.network", "douro",
    "data.alpaca.markets"
  ];
  globalThis.fetch = async (url, options = {}) => {
    const urlStr = typeof url === "string" ? url : String(url?.url || url);
    const isExternal = EXTERNAL_HOSTS.some(h => urlStr.includes(h));
    if (!isExternal) return realFetch(url, options);
    const u = new URL(urlStr);

    // Jupiter V2 order + V6 quote fallback (canonical + distinct alternative)
    if (urlStr.includes("jup.ag")) {
      const inputMint = u.searchParams.get("inputMint") || "";
      const outputMint = u.searchParams.get("outputMint") || "";
      const excluded = u.searchParams.get("excludeRouters") || "";
      const alt = excluded.length > 0;
      // Per-test override for spread-position fixtures (017B); default unchanged.
      const forcedOut = globalThis.__E2E_JUPITER_OUT;
      return jsonResponse(jupiterOrderFixture(
        inputMint, outputMint,
        alt ? "metis" : "jupiterz",
        alt ? "ALTAMMKEY11111111111111111111111111111111111" : "CANONAMMKEY1111111111111111111111111111111",
        typeof forcedOut === "string" && !alt ? forcedOut : (alt ? "150900000" : FIXTURE_OUT_AMOUNT)
      ));
    }
    // xStocks price-data: fresh dated reference (timestamp = now)
    if (urlStr.includes("api.xstocks.fi")) {
      if (globalThis.__E2E_XSTOCKS_BARE) {
        return jsonResponse({ quote: 330.94 });
      }
      return jsonResponse({
        quote: {
          price: FIXTURE_PRICE,
          provider: "Fixture Reference Tape",
          timestamp: new Date().toISOString(),
          isRealTime: false
        }
      });
    }
    // Alpaca latest quote: 401 by default (credential-absent mode);
    // per-test fixture when __E2E_ALPACA is set (never real credentials).
    if (urlStr.includes("data.alpaca.markets")) {
      const fixture = globalThis.__E2E_ALPACA;
      if (fixture && fixture.ok) {
        return jsonResponse({ quote: fixture.quote });
      }
      return jsonResponse({ message: "forbidden" }, 401);
    }
    // Nasdaq fallback: no usable quote (xStocks fixture wins deterministically)
    if (urlStr.includes("api.nasdaq.com")) {
      return jsonResponse({ data: {} });
    }
    // CoinGecko SOL spot: fresh fixed quote
    if (urlStr.includes("api.coingecko.com")) {
      return jsonResponse({ solana: { usd: 101.50, last_updated_at: Math.floor(Date.now() / 1000) } });
    }
    // Solana RPC: multiplier account + simulation success
    if (options?.method === "POST" && options?.body) {
      let method = "";
      try { method = JSON.parse(options.body).method || ""; } catch {}
      if (method === "getAccountInfo") {
        return jsonResponse({
          result: {
            value: {
              data: {
                parsed: {
                  info: {
                    decimals: 8,
                    extensions: [{
                      extension: "scaledUiAmountConfig",
                      state: { multiplier: FIXTURE_MULTIPLIER, newMultiplier: null, newMultiplierEffectiveTimestamp: 0 }
                    }]
                  }
                }
              }
            }
          }
        });
      }
      if (method === "simulateTransaction") {
        return jsonResponse({ result: { value: { err: null, unitsConsumed: 42000, logs: ["ok"] } } });
      }
    }
    return jsonResponse({ error: "unstubbed upstream in deterministic e2e" }, 500);
  };
  return () => { globalThis.fetch = realFetch; };
}

async function runE2ETests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR CONSUMER PRODUCT E2E TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`TEST: ${name} ... `);
      await fn();
      console.log("PASS ✅");
      passed++;
    } catch (err) {
      console.log(`FAIL ❌\n  Error: ${err.message}`);
      failed++;
    }
  }

  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const TEST_PORT = server.address().port;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
  const restoreFetch = installUpstreamStubs();

  // Deterministic economics derived from the fixed fixtures above.
  function expectedQuoteMath(inputUsd) {
    const shares = parseInt(FIXTURE_OUT_AMOUNT, 10) / Math.pow(10, 8) * parseFloat(FIXTURE_MULTIPLIER);
    const exposure = shares * FIXTURE_PRICE;
    return {
      shares: parseFloat(shares.toFixed(6)),
      exposure: parseFloat(exposure.toFixed(2)),
      diffPct: parseFloat(((exposure - inputUsd) / inputUsd * 100).toFixed(2))
    };
  }

  // Reason-code taxonomy mirrors src/preflight.js: the code must follow the
  // returned freshness, whatever the wall-clock weekday is.
  function expectedReasonCode(freshness) {
    if (freshness === "AFTER_HOURS_CLOSE") return "MARKET_CLOSED_OR_AFTER_HOURS";
    if (freshness === "STALE") return "STALE_REFERENCE";
    if (freshness === "INDICATIVE_UNVERIFIED") return "INDICATIVE_REFERENCE_UNVERIFIED";
    return "REFERENCE_UNAVAILABLE";
  }

  function assertTaxonomy(data) {
    const freshness = data.benchmark?.freshness_status;
    const eligibility = data.benchmark?.market_context?.reference_eligibility;
    if (!freshness || !eligibility) throw new Error("Benchmark taxonomy missing");
    if (eligibility !== "ELIGIBLE" && data.verification_status !== "UNABLE_TO_VERIFY") {
      throw new Error(`Ineligible (${eligibility}) must yield UNABLE_TO_VERIFY`);
    }
    if (eligibility === "ELIGIBLE") {
      if (data.verification_status !== "VERIFIED") throw new Error("Eligible reference must verify");
      if (data.verdict !== "MEASURED") throw new Error(`Eligible check must read MEASURED, got ${data.verdict}`);
      if (!data.reason_codes.includes("ALL_PREREQUISITES_PASSED")) throw new Error("Expected ALL_PREREQUISITES_PASSED");
    } else if (!data.reason_codes.includes(expectedReasonCode(freshness))) {
      throw new Error(`Freshness ${freshness} must yield ${expectedReasonCode(freshness)}, got ${data.reason_codes.join(",")}`);
    }
  }

  try {
    // 1. App Loads (HTML Serving) — approved production hero contract
    await test("App root (GET /) loads with crash-testing hero and new surfaces", async () => {
      const res = await fetch(`${BASE_URL}/`);
      if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
      const html = await res.text();

      if (!html.includes("Break your stock app") || !html.includes("before the market does.")) {
        throw new Error("Missing approved hero headline (Break your stock app before the market does.)");
      }
      if (!html.includes("RUN A TEST") || !html.includes("OPEN REPLAY LAB")) {
        throw new Error("Missing new-surface hero CTAs");
      }
      if (html.includes("Start a Preflight")) {
        throw new Error("Legacy hero CTA must not remain on the homepage");
      }
      if (!html.includes("stock-cards-container") || !html.includes("feed-controls-bar")) {
        throw new Error("Missing stock feed container or controls bar");
      }
      if (!html.includes("TESSERA_TRANSFER_FEE_ACCOUNTING") || !html.includes("dbc-config-input")) {
        throw new Error("Missing product surface markers in interface");
      }
      if (!html.includes("PREVIEW ONLY · NO FUNDS MOVED")) {
        throw new Error("Missing non-custodial safety banner");
      }
      if (!html.includes("Deterministic scenario endpoints.")) {
        throw new Error("Missing secondary API showcase section");
      }
    });

    // 2. Static CSS & JS Bundles
    await test("Static assets (GET /styles.css and GET /app.js) served with correct MIME types", async () => {
      const cssRes = await fetch(`${BASE_URL}/styles.css`);
      if (cssRes.status !== 200 || !cssRes.headers.get("content-type")?.includes("text/css")) {
        throw new Error("styles.css failed to serve");
      }

      const jsRes = await fetch(`${BASE_URL}/app.js`);
      if (jsRes.status !== 200 || !jsRes.headers.get("content-type")?.includes("text/javascript")) {
        throw new Error("app.js failed to serve");
      }
    });

    // 3. Stock Catalog API
    await test("Catalog API (GET /api/v1/stocks) returns exactly 12 verified tokenized stocks with metadata", async () => {
      const sRes = await fetch(`${BASE_URL}/api/v1/stocks`);
      if (sRes.status !== 200) throw new Error(`Stocks status ${sRes.status}`);
      const sData = await sRes.json();
      if (sData.supported_stock_assets.length !== 12) {
        throw new Error(`Expected 12 stocks, received ${sData.supported_stock_assets.length}`);
      }
      const symbols = sData.supported_stock_assets.map(s => s.symbol);
      for (const expected of ["AAPLx", "NVDAx", "SPYx", "TSLAx", "MSFTx", "AMZNx", "GOOGLx", "METAx", "COINx", "AMDx", "MSTRx", "QQQx"]) {
        if (!symbols.includes(expected)) throw new Error(`Missing expected stock in catalog: ${expected}`);
      }
    });

    // 4. Frontend Trade Flow 1: AAPLx with USDC (Quote Check Mode)
    await test("Frontend trade flow: AAPLx + USDC Quote Check delivers real economics", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "AAPLx",
          amount: 500
        })
      });

      const data = await res.json();
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (data.preflight_level !== "QUOTE_CHECK") throw new Error("Expected QUOTE_CHECK level");
      if (data.trade.input_usd_value !== 500) throw new Error("Spend mismatch");
      const math = expectedQuoteMath(500);
      if (data.economics.expected_stock_shares !== math.shares) throw new Error(`Shares mismatch: ${data.economics.expected_stock_shares} vs ${math.shares}`);
      if (data.economics.expected_stock_exposure_usd !== math.exposure) throw new Error("Exposure mismatch");
      if (!data.benchmark.market_context) throw new Error("Market context missing");
      if (!data.alternative_routes || !data.alternative_routes.status) throw new Error("Alternative routes missing");
      assertTaxonomy(data);
    });

    // 5. Frontend Trade Flow 2: NVDAx with SOL
    await test("Frontend trade flow: NVDAx + SOL Quote Check delivers spot-adjusted economics", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "SOL",
          stock: "NVDAx",
          amount: 2.0
        })
      });

      const data = await res.json();
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (data.trade.input_asset !== "SOL") throw new Error("Input asset mismatch");
      if (data.trade.input_usd_value !== 203) throw new Error(`SOL spot math mismatch: ${data.trade.input_usd_value}`);
      const mathSol = expectedQuoteMath(203);
      if (data.economics.expected_stock_shares !== mathSol.shares) throw new Error("Expected shares mismatch");
      assertTaxonomy(data);
    });

    // 6. Frontend Trade Flow 3: MSFTx with USDC (Newly Expanded Megacap)
    await test("Frontend trade flow: MSFTx + USDC delivers real economics and multiplier", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "MSFTx",
          amount: 300
        })
      });

      const data = await res.json();
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (data.trade.stock_symbol !== "MSFTx") throw new Error("Expected MSFTx");
      if (data.economics.expected_stock_exposure_usd <= 0) throw new Error("Expected exposure missing");
      assertTaxonomy(data);
    });

    // 7. Frontend Trade Flow 4: QQQx with USDC (Index ETF)
    await test("Frontend trade flow: QQQx + USDC delivers real economics and multiplier", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "QQQx",
          amount: 250
        })
      });

      const data = await res.json();
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (data.trade.stock_symbol !== "QQQx") throw new Error("Expected QQQx");
      if (data.economics.expected_stock_exposure_usd <= 0) throw new Error("Expected exposure missing");
      assertTaxonomy(data);
    });

    // 5b. Response projection preserves benchmark provenance + split timestamps
    await test("Benchmark projection carries upstream source and fetched/source times", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputAsset: "USDC", stock: "AAPLx", amount: 100 })
      });
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      const data = await res.json();
      if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
      if (!data.benchmark.upstream_source) throw new Error("upstream_source must be projected");
      if (!data.benchmark.fetched_at) throw new Error("fetched_at must be projected");
      if (!("reference_date" in data.benchmark) || !("source_timestamp" in data.benchmark)) {
        throw new Error("reference_date/source_timestamp must be projected");
      }
    });

    // 5c. Indicative xStocks response projects provenance with null source time
    await test("Indicative bare-number response projects provenance, never timestamps", async () => {
      globalThis.__E2E_XSTOCKS_BARE = true;
      clearMarketReferenceCache();
      try {
        const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputAsset: "USDC", stock: "AAPLx", amount: 100 })
        });
        if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
        const data = await res.json();
        if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
        if (data.benchmark.freshness_status !== "INDICATIVE_UNVERIFIED") {
          throw new Error(`Expected INDICATIVE_UNVERIFIED, got ${data.benchmark.freshness_status}`);
        }
        if (data.benchmark.timestamp !== null || data.benchmark.source_timestamp !== null || data.benchmark.reference_date !== null) {
          throw new Error("Indicative projection must carry null source times");
        }
        if (!data.benchmark.fetched_at) throw new Error("Indicative projection must carry fetched_at");
        if (!String(data.benchmark.upstream_source).includes("Blue Ocean")) {
          throw new Error(`Indicative provenance missing: ${data.benchmark.upstream_source}`);
        }
        if (!data.reason_codes.includes("INDICATIVE_REFERENCE_UNVERIFIED")) {
          throw new Error(`Expected INDICATIVE_REFERENCE_UNVERIFIED, got ${data.reason_codes.join(",")}`);
        }
      } finally {
        globalThis.__E2E_XSTOCKS_BARE = false;
        clearMarketReferenceCache();
      }
    });
    // 5d. Alpaca session quote drives buy-side ask economics (session-aware branch)
    // 017B: the ask is an execution reference, never an exposure valuation.
    // Spread fixtures: eff ABOVE ask, WITHIN spread, BELOW bid.
    await test("Alpaca quote selects ask reference with exact derived math", async () => {
      const nowIso = new Date().toISOString();
      const cases = [
        { out: "150000000", position: "ABOVE_REFERENCE_ASK" },
        { out: "151250000", position: "WITHIN_REFERENCE_SPREAD" },
        { out: "151500000", position: "BELOW_REFERENCE_BID" }
      ];
      // Fixture credentials (dummy values): prove the adapter reads env only,
      // while all network responses remain stubbed fixtures.
      process.env.ALPACA_API_KEY_ID = "e2e-fixture-key-id";
      process.env.ALPACA_API_SECRET_KEY = "e2e-fixture-secret";
      globalThis.__E2E_ALPACA = {
        ok: true,
        quote: {
          t: nowIso, bp: 330.50, bs: 100, bx: "V", ap: 330.70, as: 200, ax: "V", c: [], z: "Z"
        }
      };
      globalThis.__E2E_XSTOCKS_BARE = true;
      try {
        for (const [idx, c] of cases.entries()) {
          globalThis.__E2E_JUPITER_OUT = c.out;
          clearMarketReferenceCache();
          const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputAsset: "USDC", stock: "AAPLx", amount: 500 })
          });
          if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
          const data = await res.json();
          if (data.request_status !== "SUCCESS") throw new Error("Expected request_status SUCCESS");
          const session = calculateMarketSession(new Date());
          if (session === "CLOSED") {
            // No Alpaca fetch when closed: indicative fallback, honestly uncertified.
            if (data.benchmark.freshness_status !== "INDICATIVE_UNVERIFIED") {
              throw new Error("Closed session must not certify Alpaca");
            }
            return;
          }
          if (data.benchmark.source !== "Alpaca Market Data") throw new Error(`Alpaca must win, got: ${data.benchmark.source}`);
          // Session-agnostic feed contract: OVERNIGHT resolves the overnight
          // derived feed; all other eligible sessions resolve IEX. The engine
          // selects by session (benchmark.js); the test must not hardcode one.
          const expectOvernight = session === "OVERNIGHT";
          const expectUpstream = expectOvernight
            ? "Alpaca Market Data (overnight derived feed)"
            : "Alpaca Market Data (IEX)";
          const expectFeed = expectOvernight ? "overnight" : "iex";
          if (data.benchmark.upstream_source !== expectUpstream) {
            throw new Error(`Upstream provenance missing: ${data.benchmark.upstream_source} (session ${session})`);
          }
          if (data.benchmark.feed !== expectFeed) throw new Error(`Feed must be ${expectFeed}, got: ${data.benchmark.feed} (session ${session})`);
          if (data.benchmark.reference_price_type !== "ASK") throw new Error("Buy-side reference must be ASK");
          if (data.benchmark.ask_price !== 330.70 || data.benchmark.bid_price !== 330.50) {
            throw new Error("Bid/ask must echo fixture");
          }
          if (data.benchmark.midpoint !== 330.60) throw new Error(`Midpoint must derive: ${data.benchmark.midpoint}`);
          if (data.benchmark.price !== 330.70) throw new Error("Reference price must be the ask");
          // 017B: shares x ask must NOT be presented as exposure value.
          if (data.economics.expected_stock_exposure_usd !== null) {
            throw new Error(`Exposure must be null for quote references, got ${data.economics.expected_stock_exposure_usd}`);
          }
          if (data.economics.difference_usd !== null || data.economics.difference_pct !== null) {
            throw new Error("Legacy value-difference must be null for quote references");
          }
          const shares = parseFloat((parseInt(c.out, 10) / Math.pow(10, 8)).toFixed(6));
          if (data.economics.expected_stock_shares !== shares) {
            throw new Error("Shares must stay exact");
          }
          const vsAsk = parseFloat(((500 / shares) - 330.70).toFixed(2));
          if (data.economics.difference_vs_ask_usd_per_share !== vsAsk) {
            throw new Error(`vs-ask math mismatch: ${data.economics.difference_vs_ask_usd_per_share} vs ${vsAsk}`);
          }
          if (data.economics.spread_position !== c.position) {
            throw new Error(`Case ${idx}: expected ${c.position}, got ${data.economics.spread_position}`);
          }
          const effExpected = parseFloat((500 / shares).toFixed(2));
          if (data.economics.effective_price_per_share !== effExpected) throw new Error("Effective price mismatch");
          if (data.verification_status !== "VERIFIED" || data.verdict !== "MEASURED") {
            throw new Error("Fresh session-aligned Alpaca must verify and measure");
          }
        }
      } finally {
        globalThis.__E2E_ALPACA = null;
        globalThis.__E2E_XSTOCKS_BARE = false;
        globalThis.__E2E_JUPITER_OUT = null;
        delete process.env.ALPACA_API_KEY_ID;
        delete process.env.ALPACA_API_SECRET_KEY;
        clearMarketReferenceCache();
      }
    });
    await test("Frontend trade flow: Wallet Exact Simulation mode simulates on Solana RPC with err: null", async () => {
      const testWallet = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "AAPLx",
          amount: 100,
          wallet: testWallet
        })
      });

      const data = await res.json();
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      if (data.preflight_level !== "EXACT_SIMULATION") throw new Error("Expected EXACT_SIMULATION level");
      if (data.simulation.status !== "PASS") throw new Error(`Simulation must pass on fixture, got ${data.simulation.status}`);
      if (data.simulation.err !== null) throw new Error("Simulation pass must have err: null");
      if (data.simulation.units_consumed !== 42000) throw new Error("Simulation units must echo fixture");
    });

    // 6. Failure State: Invalid Amount
    await test("Failure state: Non-positive or out-of-bounds amount returns INVALID_AMOUNT", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "AAPLx",
          amount: -100
        })
      });

      if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
      const data = await res.json();
      if (!data.reason_codes.includes("INVALID_AMOUNT")) {
        throw new Error(`Expected INVALID_AMOUNT reason code, got ${data.reason_codes.join(", ")}`);
      }
    });

    // 7. Failure State: Malformed Public Key
    await test("Failure state: Malformed wallet address returns INVALID_PUBLIC_KEY without simulation", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: "USDC",
          stock: "AAPLx",
          amount: 100,
          wallet: "0xNotASolanaKey12345"
        })
      });

      if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
      const data = await res.json();
      if (!data.reason_codes.includes("INVALID_PUBLIC_KEY")) {
        throw new Error(`Expected INVALID_PUBLIC_KEY reason code, got ${data.reason_codes.join(", ")}`);
      }
    });

    // 8. No Execution / Send / Sign Path Verification
    await test("Zero-custody verification: No /execute, sendTransaction, or signing endpoints exist", async () => {
      const execRes = await fetch(`${BASE_URL}/api/v1/execute`, { method: "POST" });
      if (execRes.status !== 404) throw new Error("Found unauthorized /execute route");

      const sendRes = await fetch(`${BASE_URL}/sendTransaction`, { method: "POST" });
      if (sendRes.status !== 404) throw new Error("Found unauthorized /sendTransaction route");
    });

    await test("DBC whale endpoint validates input without touching the network", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/dbc/whale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configAddress: "NOTANADDRESS", tradeSizeQuoteUnits: "1000", maxPriceImpactPct: 8 })
      });
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      const data = await res.json();
      if (data.request_status !== "SUCCESS") throw new Error("Envelope must succeed");
      if (data.scenarioId !== "DBC_OPENING_WHALE") throw new Error("Scenario identity missing");
      if (data.status !== "UNABLE_TO_VERIFY") throw new Error("Bad address must be UNABLE, never PASS/FAIL");
      if (data.reasonCode !== "DBC_BAD_ADDRESS") throw new Error(`Wrong reason code: ${data.reasonCode}`);
    });

    await test("DBC sweep endpoint validates input without touching the network", async () => {
      const res = await fetch(`${BASE_URL}/api/v1/dbc/sweep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configAddress: "NOTANADDRESS", maxPriceImpactPct: 8 })
      });
      if (res.status !== 200) throw new Error(`HTTP status ${res.status}`);
      const data = await res.json();
      if (data.request_status !== "SUCCESS") throw new Error("Envelope must succeed");
      if (data.scenarioId !== "DBC_LAUNCH_SWEEP") throw new Error("Sweep identity missing");
      if (data.status !== "UNABLE_TO_VERIFY") throw new Error("Bad address must be UNABLE, never PASS/FAIL");
      if (data.reasonCode !== "DBC_BAD_ADDRESS") throw new Error(`Wrong reason code: ${data.reasonCode}`);
      if (!Array.isArray(data.points) || data.points.length !== 0) throw new Error("UNABLE sweep must carry empty points");
    });

  } finally {
    restoreFetch();
    await new Promise(resolve => server.close(resolve));
  }

  console.log("\n==================================================");
  console.log(`E2E TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runE2ETests().catch(err => {
  console.error("E2E Test Runner Crashed:", err);
  process.exitCode = 1;
});

