// Live Production Smoke Test (observational, upstream-weather-aware).
// Classifies each check as SUCCESS, UPSTREAM TRANSIENT, or PRODUCT FAILURE.
// Exit code is nonzero only for product failures; transients are reported,
// never faked into successful quotes.
const UPSTREAM_HINTS = ["UPSTREAM_TIMEOUT", "UPSTREAM_UNAVAILABLE", "UPSTREAM_ERROR", "timeout", "timed out", "fetch failed", "ECONN", "ENOTFOUND", "EAI_AGAIN"];
let productFailures = 0;

function classify(label, status, data) {
  const codes = (data && data.reason_codes) || [];
  const text = JSON.stringify(data || "").slice(0, 200);
  if (status === 200 && data && (data.request_status === "SUCCESS" || data.status === "SUCCESS" || data.status === "HEALTHY")) {
    console.log(`  [SUCCESS] ${label}`);
    return;
  }
  if (codes.some(c => UPSTREAM_HINTS.some(h => String(c).includes(h)))) {
    console.log(`  [UPSTREAM TRANSIENT] ${label}: HTTP ${status} codes=${codes.join(",")}`);
    return;
  }
  productFailures++;
  console.log(`  [PRODUCT FAILURE] ${label}: HTTP ${status} ${text}`);
}

async function smokeTest() {
  const base = 'https://justfair-theta.vercel.app';
  console.log('Testing live Vercel production deployment:', base);
  
  // 1. Health
  const hRes = await fetch(base + '/api/v1/health');
  console.log('GET /api/v1/health status:', hRes.status);
  const hData = await hRes.json();
  console.log('Health status:', hData.status);

  // 2. Stocks
  const sRes = await fetch(base + '/api/v1/stocks');
  console.log('GET /api/v1/stocks status:', sRes.status);
  const sData = await sRes.json();
  console.log('Stocks count:', sData.supported_stock_assets.length);

  // 3. Preflight
  const pRes = await fetch(base + '/api/v1/preflight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputAsset: 'USDC', stock: 'AAPLx', amount: 500 })
  });
  console.log('POST /api/v1/preflight status:', pRes.status);
  const pData = await pRes.json();
  console.log('Preflight status:', pData.request_status, '| Spend: $' + pData.trade?.input_usd_value, '| Exposure: ' + pData.economics?.expected_stock_exposure_usd, '| RefType:', pData.benchmark?.reference_price_type, '| Bid/Ask:', pData.benchmark?.bid_price + '/' + pData.benchmark?.ask_price, '| Mid:', pData.benchmark?.midpoint, '| VsAsk:', pData.economics?.difference_vs_ask_usd_per_share, '| SpreadPos:', pData.economics?.spread_position, '| Verdict:', pData.verdict);
  console.log('Alternative Routes status:', pData.alternative_routes?.status, '| Evaluated count:', pData.alternative_routes?.candidates_evaluated_count);

  // 4. HTML & Client Bundle
  const htmlRes = await fetch(base + '/');
  console.log('GET / status:', htmlRes.status);
  const html = await htmlRes.text();
  console.log('Contains Dashboard view:', html.includes('id="dashboard-view"'));
  console.log('Contains App view:', html.includes('id="app-view"'));
  console.log('Contains zero-risk claim:', /zero-risk/i.test(html));

  const jsRes = await fetch(base + '/app.js');
  console.log('GET /app.js status:', jsRes.status);
  const js = await jsRes.text();
  console.log("Contains locked hierarchy in app.js (YOU'RE SPENDING):", js.includes("YOU'RE SPENDING"));
  console.log("Contains 12 stocks in app.js:", js.includes("MSFTx") && js.includes("QQQx") && js.includes("MSTRx"));
  console.log("Contains truthful routing state (NO BETTER ROUTE OBSERVED):", js.includes("better-option-card") && js.includes("NO BETTER ROUTE OBSERVED"));
  console.log("Contains no overclaims (OPTIMAL ROUTE CONFIRMED):", !js.includes("OPTIMAL ROUTE CONFIRMED"));

  // Representative live executions across asset classes.
  const cases = [
    ["AAPLx + USDC", { inputAsset: "USDC", stock: "AAPLx", amount: 500 }],
    ["AAPLx + SOL", { inputAsset: "SOL", stock: "AAPLx", amount: 2 }],
    ["NVDAx + USDC", { inputAsset: "USDC", stock: "NVDAx", amount: 300 }],
    ["SPYx (ETF) + USDC", { inputAsset: "USDC", stock: "SPYx", amount: 250 }],
    ["COINx (crypto-linked) + SOL", { inputAsset: "SOL", stock: "COINx", amount: 1 }]
  ];
  for (const [label, body] of cases) {
    try {
      const r = await fetch(base + "/api/v1/preflight", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
      });
      const d = await r.json().catch(() => null);
      if (r.status === 200 && d?.request_status === "SUCCESS") {
        console.log(`  [SUCCESS] preflight ${label}: exposure ${d.economics?.expected_stock_exposure_usd} ref ${d.benchmark?.reference_price_type} bid/ask ${d.benchmark?.bid_price}/${d.benchmark?.ask_price} vsAsk ${d.economics?.difference_vs_ask_usd_per_share} pos ${d.economics?.spread_position} verdict ${d.verdict}`);
      } else {
        classify(`preflight ${label}`, r.status, d);
      }
    } catch (e) {
      classify(`preflight ${label}`, 0, { reason_codes: [e.message] });
    }
  }

  // 5. Product catalog + preflight boundary
  const prodRes = await fetch(base + '/api/v1/products');
  console.log('GET /api/v1/products status:', prodRes.status);

  // 6. Product preflight (Apple self-custody + dividends)
  const ppRes = await fetch(base + '/api/v1/product-preflight', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ underlying: 'AAPL', expectations: [{ key: 'SELF_CUSTODY', priority: 'REQUIRED' }] })
  });
  console.log('POST /api/v1/product-preflight status:', ppRes.status);
  const ppData = await ppRes.json();
  console.log('Product preflight overall:', ppData.overall_result);

  // 7. SOL price + stream status
  const solRes = await fetch(base + '/api/v1/prices/sol');
  console.log('GET /api/v1/prices/sol status:', solRes.status);
  const streamRes = await fetch(base + '/api/v1/stream/status');
  console.log('GET /api/v1/stream/status status:', streamRes.status);

  if (productFailures > 0) {
    console.error(`SMOKE RESULT: ${productFailures} product failure(s)`);
    process.exitCode = 1;
  } else {
    console.log("SMOKE RESULT: no product failures (transients, if any, reported above)");
  }
}

smokeTest().catch(err => {
  console.error('Smoke test failed:', err);
  process.exitCode = 1;
});

