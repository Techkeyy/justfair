// Live Production Smoke Test
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
  console.log('Preflight status:', pData.request_status, '| Spend: $' + pData.trade?.input_usd_value, '| Exposure: $' + pData.economics?.expected_stock_exposure_usd, '| Verdict:', pData.verdict);

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
}

smokeTest().catch(err => {
  console.error('Smoke test failed:', err);
  process.exitCode = 1;
});

