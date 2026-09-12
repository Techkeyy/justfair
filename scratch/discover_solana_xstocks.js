// Discover and verify all Solana xStocks
import { fetchOnChainTokenMultiplier } from "../src/engine/multiplier.js";
import { fetchMarketReference } from "../src/engine/benchmark.js";
import { fetchJupiterOrderV2 } from "../src/engine/jupiter.js";
import { SUPPORTED_PAYMENTS } from "../src/config.js";

async function run() {
  console.log("Fetching all assets from xStocks API...");
  const res = await fetch("https://api.xstocks.fi/api/v2/public/assets");
  const json = await res.json();
  const nodes = json.nodes || json || [];
  console.log(`Discovered ${nodes.length} assets from xStocks API.\n`);

  const solanaAssets = [];

  for (const node of nodes) {
    const sym = node.symbol;
    try {
      const dRes = await fetch(`https://api.xstocks.fi/api/v2/public/assets/${sym}`);
      if (!dRes.ok) continue;
      const detail = await dRes.json();
      const solDep = detail.deployments?.find(d => d.network?.toLowerCase() === "solana");
      if (solDep && solDep.address) {
        solanaAssets.push({
          symbol: sym,
          name: detail.name || node.name,
          underlying: detail.underlyingSymbol || node.underlyingSymbol || sym.replace(/x$/i, ""),
          mint: solDep.address,
          logo: detail.logo || node.logo,
          description: detail.description
        });
        console.log(`[FOUND SOLANA ASSET] ${sym} -> ${detail.name} | Mint: ${solDep.address}`);
      }
    } catch (e) {
      console.log(`Error checking ${sym}: ${e.message}`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`TOTAL SOLANA xSTOCKS DISCOVERED: ${solanaAssets.length}`);
  console.log(`==================================================\n`);

  const testResults = [];

  for (const item of solanaAssets) {
    console.log(`\nTesting ${item.symbol} (${item.name})...`);
    const canonical = item.underlying;
    const isEtf = item.symbol.startsWith("SPY") || item.symbol.startsWith("QQQ");
    const stockConfig = {
      symbol: item.symbol,
      name: item.name,
      canonicalSymbol: canonical,
      mint: item.mint,
      decimals: 8,
      referenceSymbol: canonical,
      assetClass: isEtf ? "etf" : "stocks"
    };

    // 1. Multiplier
    let multiplierOk = false;
    let multiplier = 1.0;
    try {
      const m = await fetchOnChainTokenMultiplier(item.mint);
      multiplier = m.current_multiplier;
      multiplierOk = true;
      console.log(`  ✅ Multiplier: ${multiplier} (decimals: ${m.decimals})`);
    } catch (e) {
      console.log(`  ❌ Multiplier failed: ${e.message}`);
    }

    // 2. Benchmark Reference
    let benchmarkOk = false;
    let benchPrice = null;
    let benchProvider = null;
    try {
      const b = await fetchMarketReference(item.symbol, stockConfig.assetClass);
      benchPrice = b.price;
      benchProvider = b.provider;
      benchmarkOk = true;
      console.log(`  ✅ Benchmark: $${benchPrice} (${benchProvider})`);
    } catch (e) {
      console.log(`  ❌ Benchmark failed: ${e.message}`);
    }

    // 3. Jupiter Swap V2 USDC Quote
    let jupUsdcOk = false;
    let jupUsdcOut = null;
    let jupRouter = null;
    try {
      const jOrder = await fetchJupiterOrderV2(SUPPORTED_PAYMENTS.USDC, stockConfig, 500);
      if (jOrder.orderData?.outAmount) {
        jupUsdcOk = true;
        jupUsdcOut = jOrder.orderData.outAmount;
        jupRouter = jOrder.orderData.router;
        console.log(`  ✅ Jupiter USDC: outAmount=${jupUsdcOut} (${jupRouter})`);
      } else {
        console.log(`  ❌ Jupiter USDC returned no route`);
      }
    } catch (e) {
      console.log(`  ❌ Jupiter USDC failed: ${e.message}`);
    }

    // 4. Jupiter Swap V2 SOL Quote
    let jupSolOk = false;
    try {
      const sOrder = await fetchJupiterOrderV2(SUPPORTED_PAYMENTS.SOL, stockConfig, 2);
      if (sOrder.orderData?.outAmount) {
        jupSolOk = true;
        console.log(`  ✅ Jupiter SOL: outAmount=${sOrder.orderData.outAmount}`);
      }
    } catch (e) {
      console.log(`  ⚠️ Jupiter SOL failed: ${e.message}`);
    }

    testResults.push({
      symbol: item.symbol,
      name: item.name,
      canonical: item.underlying,
      mint: item.mint,
      multiplierOk,
      multiplier,
      benchmarkOk,
      benchPrice,
      benchProvider,
      jupUsdcOk,
      jupSolOk,
      jupRouter,
      viable: multiplierOk && benchmarkOk && jupUsdcOk
    });
  }

  console.log(`\n==================================================`);
  console.log(`VIABILITY REPORT`);
  console.log(`==================================================`);
  console.table(testResults.map(t => ({
    symbol: t.symbol,
    canonical: t.canonical,
    multiplier: t.multiplierOk ? `PASS (${t.multiplier})` : "FAIL",
    benchmark: t.benchmarkOk ? `PASS ($${t.benchPrice})` : "FAIL",
    jupiter_usdc: t.jupUsdcOk ? `PASS (${t.jupRouter})` : "FAIL",
    jupiter_sol: t.jupSolOk ? "PASS" : "FAIL",
    VIABLE: t.viable ? "✅ YES" : "❌ NO"
  })));
}

run().catch(console.error);

