// Comprehensive xStocks Discovery and Verification Script
import { fetchOnChainTokenMultiplier } from "../src/engine/multiplier.js";
import { fetchMarketReference } from "../src/engine/benchmark.js";
import { fetchJupiterOrderV2 } from "../src/engine/jupiter.js";
import { SUPPORTED_PAYMENTS } from "../src/config.js";

async function main() {
  console.log("==================================================");
  console.log("XSTOCKS CANDIDATE DISCOVERY & TESTING");
  console.log("==================================================\n");

  // 1. Fetch official xStocks public assets endpoint
  console.log("Fetching https://api.xstocks.fi/api/v2/public/assets ...");
  let assets = [];
  try {
    const res = await fetch("https://api.xstocks.fi/api/v2/public/assets");
    const json = await res.json();
    assets = json.nodes || json || [];
    console.log(`Found ${assets.length} items from xStocks API.`);
  } catch (e) {
    console.error("Error fetching xStocks API:", e.message);
  }

  // Also query Jupiter strict / all tokens for 'xStock' or 'x' tokens
  console.log("\nFetching Jupiter token list for xStocks...");
  let jupTokens = [];
  try {
    const jRes = await fetch("https://tokens.jup.ag/tokens?tags=xstock,token-2022");
    if (jRes.ok) {
      jupTokens = await jRes.json();
      console.log(`Found ${jupTokens.length} xstock tagged tokens on Jupiter.`);
    }
  } catch (e) {
    console.log("Jupiter token tag fetch note:", e.message);
  }

  // Let's also fetch general Jupiter verified tokens or search known xStock mints
  if (jupTokens.length === 0) {
    try {
      const allRes = await fetch("https://token.jup.ag/all");
      if (allRes.ok) {
        const all = await allRes.json();
        jupTokens = all.filter(t => t.symbol?.endsWith("x") || t.name?.toLowerCase().includes("xstock") || t.name?.toLowerCase().includes("tokenized"));
        console.log(`Found ${jupTokens.length} candidate x-tokens in Jupiter all list.`);
      }
    } catch (e) {}
  }

  console.log("\nSample assets from xStocks API:");
  for (let i = 0; i < Math.min(10, assets.length); i++) {
    const a = assets[i];
    console.log(`- ${a.symbol} | ${a.name} | underlying: ${a.underlyingSymbol || a.underlying?.symbol} | id: ${a.id}`);
  }

  // Let's check candidate detail endpoints for assets: https://api.xstocks.fi/api/v2/public/assets/{symbol}
  // Let's inspect a few popular symbols
  const candidatesToCheck = [
    "AAPLx", "NVDAx", "SPYx", "TSLAx",
    "MSFTx", "AMZNx", "GOOGLx", "METAx", "COINx", "NFLXx", "AMDx", "MSTRx", "QQQx", "PLTRx"
  ];

  console.log("\n==================================================");
  console.log("TESTING INDIVIDUAL CANDIDATES");
  console.log("==================================================");

  const results = [];

  for (const sym of candidatesToCheck) {
    console.log(`\n--- Testing ${sym} ---`);
    let mint = null;
    let name = sym;
    let canonical = sym.replace(/x$/i, "");
    let xStockDetail = null;

    // Fetch detail from xStocks API: https://api.xstocks.fi/api/v2/public/assets/{symbol}
    try {
      const dRes = await fetch(`https://api.xstocks.fi/api/v2/public/assets/${sym}`);
      if (dRes.ok) {
        xStockDetail = await dRes.json();
        name = xStockDetail.name || name;
        mint = xStockDetail.tokenAddress || xStockDetail.mintAddress || xStockDetail.contracts?.find(c => c.blockchain === "solana")?.address;
        console.log(`  xStocks detail found: name="${name}", mint="${mint}"`);
      } else {
        console.log(`  xStocks detail returned status ${dRes.status}`);
      }
    } catch (e) {
      console.log(`  xStocks detail fetch error: ${e.message}`);
    }

    // Check jup tokens if mint not found
    if (!mint) {
      const match = jupTokens.find(t => t.symbol?.toUpperCase() === sym.toUpperCase());
      if (match) {
        mint = match.address || match.mint;
        name = match.name || name;
        console.log(`  Jupiter token match: mint="${mint}", name="${name}"`);
      }
    }

    if (!mint) {
      console.log(`  ❌ NO MINT FOUND for ${sym}`);
      results.push({ symbol: sym, status: "REJECTED_NO_MINT" });
      continue;
    }

    const stockConfig = {
      symbol: sym,
      name: name,
      canonicalSymbol: canonical,
      mint: mint,
      decimals: 8,
      referenceSymbol: canonical,
      assetClass: sym.startsWith("SPY") || sym.startsWith("QQQ") ? "etf" : "stocks"
    };

    // 1. Test Multiplier / Token-2022
    let multiplierOk = false;
    let multiplierData = null;
    try {
      multiplierData = await fetchOnChainTokenMultiplier(mint);
      console.log(`  ✅ On-chain Token-2022 multiplier: ${multiplierData.current_multiplier} (decimals: ${multiplierData.decimals})`);
      multiplierOk = true;
    } catch (e) {
      console.log(`  ❌ Multiplier failed: ${e.message}`);
    }

    // 2. Test Market Benchmark Reference
    let benchOk = false;
    let benchData = null;
    try {
      benchData = await fetchMarketReference(sym, stockConfig.assetClass);
      console.log(`  ✅ Benchmark quote: $${benchData.price} from ${benchData.provider} (${benchData.current_market_session})`);
      benchOk = true;
    } catch (e) {
      console.log(`  ❌ Benchmark failed: ${e.message}`);
    }

    // 3. Test Jupiter Swap V2 Quote with USDC
    let jupUsdcOk = false;
    let jupUsdcData = null;
    try {
      const usdcOrder = await fetchJupiterOrderV2(SUPPORTED_PAYMENTS.USDC, stockConfig, 500);
      if (usdcOrder.orderData?.outAmount) {
        console.log(`  ✅ Jupiter USDC route quote: outAmount=${usdcOrder.orderData.outAmount} (${usdcOrder.orderData.router})`);
        jupUsdcOk = true;
        jupUsdcData = usdcOrder.orderData;
      } else {
        console.log(`  ❌ Jupiter USDC returned no outAmount:`, JSON.stringify(usdcOrder.orderData));
      }
    } catch (e) {
      console.log(`  ❌ Jupiter USDC order error: ${e.message}`);
    }

    // 4. Test Jupiter Swap V2 Quote with SOL
    let jupSolOk = false;
    try {
      const solOrder = await fetchJupiterOrderV2(SUPPORTED_PAYMENTS.SOL, stockConfig, 2);
      if (solOrder.orderData?.outAmount) {
        console.log(`  ✅ Jupiter SOL route quote: outAmount=${solOrder.orderData.outAmount}`);
        jupSolOk = true;
      }
    } catch (e) {
      console.log(`  ⚠️ Jupiter SOL order note: ${e.message}`);
    }

    results.push({
      symbol: sym,
      canonical,
      name,
      mint,
      multiplierOk,
      multiplierData,
      benchOk,
      benchData,
      jupUsdcOk,
      jupSolOk,
      viable: multiplierOk && benchOk && jupUsdcOk
    });
  }

  console.log("\n==================================================");
  console.log("SUMMARY OF TEST RESULTS");
  console.log("==================================================");
  console.table(results.map(r => ({
    symbol: r.symbol,
    name: r.name,
    mint: r.mint?.slice(0, 10) + "...",
    multiplier: r.multiplierOk ? "PASS" : "FAIL",
    benchmark: r.benchOk ? "PASS" : "FAIL",
    jupiter_usdc: r.jupUsdcOk ? "PASS" : "FAIL",
    jupiter_sol: r.jupSolOk ? "PASS" : "FAIL",
    VIABLE: r.viable ? "✅ YES" : "❌ NO"
  })));
}

main().catch(console.error);

