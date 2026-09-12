// Test Popular / Megacap xStocks directly
import { fetchOnChainTokenMultiplier } from "../src/engine/multiplier.js";
import { fetchMarketReference } from "../src/engine/benchmark.js";
import { fetchJupiterOrderV2 } from "../src/engine/jupiter.js";
import { SUPPORTED_PAYMENTS } from "../src/config.js";

const POPULAR_SYMBOLS = [
  "AAPLx", "NVDAx", "SPYx", "TSLAx",
  "MSFTx", "AMZNx", "GOOGLx", "METAx", "COINx", "NFLXx", "AMDx", "MSTRx", "QQQx", "PLTRx",
  "DISx", "UBERx", "AVGOx", "INTCx", "PYPLx", "CRMx", "VEx"
];

async function run() {
  console.log("Fetching details for popular symbols from xStocks API...");
  const results = [];

  for (const sym of POPULAR_SYMBOLS) {
    let detail = null;
    try {
      const res = await fetch(`https://api.xstocks.fi/api/v2/public/assets/${sym}`);
      if (res.ok) {
        detail = await res.json();
      }
    } catch (e) {
      console.log(`Failed to fetch ${sym}: ${e.message}`);
    }

    if (!detail) {
      console.log(`❌ ${sym}: Not found on xStocks API`);
      results.push({ symbol: sym, status: "NOT_FOUND_ON_XSTOCKS" });
      continue;
    }

    const solDep = detail.deployments?.find(d => d.network?.toLowerCase() === "solana");
    if (!solDep || !solDep.address) {
      console.log(`❌ ${sym} (${detail.name}): No Solana deployment found (Deployments on: ${detail.deployments?.map(d => d.network).join(", ")})`);
      results.push({ symbol: sym, name: detail.name, status: "NO_SOLANA_MINT" });
      continue;
    }

    const mint = solDep.address;
    const name = detail.name;
    const canonical = detail.underlyingSymbol || sym.replace(/x$/i, "");
    const isEtf = sym.startsWith("SPY") || sym.startsWith("QQQ");
    const stockConfig = {
      symbol: sym,
      name: name,
      canonicalSymbol: canonical,
      mint: mint,
      decimals: 8,
      referenceSymbol: canonical,
      assetClass: isEtf ? "etf" : "stocks"
    };

    console.log(`\n========================================`);
    console.log(`Evaluating ${sym} (${name}) | Mint: ${mint}`);

    // 1. Multiplier
    let multOk = false;
    let multiplier = 1.0;
    try {
      const m = await fetchOnChainTokenMultiplier(mint);
      multiplier = m.current_multiplier;
      multOk = true;
      console.log(`  ✅ Multiplier: ${multiplier}`);
    } catch (e) {
      console.log(`  ❌ Multiplier failed: ${e.message}`);
    }

    // 2. Benchmark
    let benchOk = false;
    let benchPrice = null;
    let benchProvider = null;
    try {
      const b = await fetchMarketReference(sym, stockConfig.assetClass);
      benchPrice = b.price;
      benchProvider = b.provider;
      benchOk = true;
      console.log(`  ✅ Benchmark: $${benchPrice} (${benchProvider})`);
    } catch (e) {
      console.log(`  ❌ Benchmark failed: ${e.message}`);
    }

    // 3. Jupiter USDC quote
    let jupUsdcOk = false;
    let jupRouter = null;
    let outAmount = null;
    try {
      const j = await fetchJupiterOrderV2(SUPPORTED_PAYMENTS.USDC, stockConfig, 500);
      if (j.orderData?.outAmount) {
        jupUsdcOk = true;
        jupRouter = j.orderData.router;
        outAmount = j.orderData.outAmount;
        console.log(`  ✅ Jupiter USDC Route: outAmount=${outAmount} (${jupRouter})`);
      } else {
        console.log(`  ❌ Jupiter USDC returned no outAmount`);
      }
    } catch (e) {
      console.log(`  ❌ Jupiter USDC failed: ${e.message}`);
    }

    // 4. Jupiter SOL quote
    let jupSolOk = false;
    try {
      const s = await fetchJupiterOrderV2(SUPPORTED_PAYMENTS.SOL, stockConfig, 2);
      if (s.orderData?.outAmount) {
        jupSolOk = true;
        console.log(`  ✅ Jupiter SOL Route: outAmount=${s.orderData.outAmount}`);
      }
    } catch (e) {
      console.log(`  ⚠️ Jupiter SOL failed: ${e.message}`);
    }

    results.push({
      symbol: sym,
      name,
      canonical,
      mint,
      multiplier: multOk ? `PASS (${multiplier})` : "FAIL",
      benchmark: benchOk ? `PASS ($${benchPrice})` : "FAIL",
      jupiter_usdc: jupUsdcOk ? `PASS (${jupRouter})` : "FAIL",
      jupiter_sol: jupSolOk ? "PASS" : "FAIL",
      VIABLE: multOk && benchOk && jupUsdcOk ? "✅ YES" : "❌ NO"
    });
  }

  console.log(`\n==================================================`);
  console.log(`POPULAR CANDIDATES SUMMARY`);
  console.log(`==================================================`);
  console.table(results);
}

run().catch(console.error);

