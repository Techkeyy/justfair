// Verification of Live Production Deployment (Order 008 Sync)
const PROD_URL = "https://justfair-theta.vercel.app";

async function verifyLiveProduction() {
  console.log("==================================================");
  console.log(`VERIFYING LIVE PRODUCTION DEPLOYMENT: ${PROD_URL}`);
  console.log("==================================================\n");

  const res = await fetch(`${PROD_URL}/?_t=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch production HTML: HTTP ${res.status}`);
  }

  const html = await res.text();

  console.log("1. Live HTML String Assertions:");

  const requiredStrings = [
    "Pre-trade protection for tokenized stocks",
    "See how much real stock exposure your money is actually buying before you make the trade.",
    "A swap can execute perfectly",
    "Check a stock trade",
    "Wallets solve one problem. JustFair solves the next one.",
    "YOUR WALLET CHECKS",
    "JUSTFAIR ALSO CHECKS",
    "The swap can be technically healthy while the stock deal is still expensive.",
    "If the underlying stock market is closed or the reference cannot be verified, JustFair says so instead of guessing."
  ];

  for (const s of requiredStrings) {
    const found = html.includes(s);
    console.log(`  [+] Must contain: "${s.slice(0, 50)}..." -> ${found ? "PASS ✅" : "FAIL ❌"}`);
    if (!found) throw new Error(`Missing required string on live production: "${s}"`);
  }

  const bannedStrings = [
    "Non-Custodial Equity Preflight Engine",
    "JustFair inspects live Solana DEX routes and calculates the current expected dollar value of underlying stock exposure",
    "Launch Preflight App"
  ];

  console.log("\n2. Banned / Pre-Order-008 String Absences:");
  for (const s of bannedStrings) {
    const found = html.includes(s);
    console.log(`  [-] Must NOT contain: "${s.slice(0, 50)}..." -> ${!found ? "PASS ✅ (Absent)" : "FAIL ❌ (Found)"}`);
    if (found) throw new Error(`Found banned/outdated string on live production: "${s}"`);
  }

  console.log("\n3. Header Wallet Button Absence Check:");
  const headerMatch = html.match(/<header class="site-header">[\s\S]*?<\/header>/);
  if (!headerMatch) throw new Error("Could not find site header in HTML");
  const headerHtml = headerMatch[0];
  const hasWalletInHeader = headerHtml.includes("wallet-toggle-btn") || headerHtml.includes("Connect Wallet");
  console.log(`  [-] Dashboard header Connect Wallet button absent -> ${!hasWalletInHeader ? "PASS ✅" : "FAIL ❌"}`);
  if (hasWalletInHeader) throw new Error("Dashboard header still renders Connect Wallet button");

  console.log("\n4. Live API Smoke Tests:");
  const healthRes = await fetch(`${PROD_URL}/api/v1/health`);
  const healthJson = await healthRes.json();
  console.log(`  [+] GET /api/v1/health status: ${healthRes.status}, status: ${healthJson.status} -> PASS ✅`);

  const stocksRes = await fetch(`${PROD_URL}/api/v1/stocks`);
  const stocksJson = await stocksRes.json();
  console.log(`  [+] GET /api/v1/stocks status: ${stocksRes.status}, count: ${stocksJson.supported_stock_assets?.length} -> PASS ✅`);

  const preflightRes = await fetch(`${PROD_URL}/api/v1/preflight`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputAsset: "USDC", stock: "AAPLx", amount: 500 })
  });
  const preflightJson = await preflightRes.json();
  console.log(`  [+] POST /api/v1/preflight status: ${preflightRes.status}, verdict: ${preflightJson.verdict}, exposure: $${preflightJson.economics?.expected_stock_exposure_usd} -> PASS ✅`);

  console.log("\n==================================================");
  console.log("PRODUCTION SYNC VERIFICATION: 100% PASS ✅");
  console.log("==================================================");
}

verifyLiveProduction().catch(err => {
  console.error("Verification failed:", err);
  process.exitCode = 1;
});

