// Comprehensive Benchmark Freshness & Weekend Truthfulness Audit (Director Order 007.5C)
import { SUPPORTED_STOCKS, API_ENDPOINTS, TIMEOUTS } from "../src/config.js";
import { fetchMarketReference, calculateMarketSession } from "../src/engine/benchmark.js";
import { runPreflight } from "../src/preflight.js";

async function runBenchmarkAudit() {
  console.log("================================================================================");
  console.log("JUSTFAIR DIRECTOR ORDER 007.5C: BENCHMARK FRESHNESS & WEEKEND AUDIT");
  console.log("================================================================================\n");

  const now = new Date();
  const currentSession = calculateMarketSession(now);
  console.log(`CURRENT LOCAL TIME: ${now.toISOString()}`);
  console.log(`CURRENT MARKET SESSION: ${currentSession}\n`);

  const auditResults = [];

  for (const [symbol, config] of Object.entries(SUPPORTED_STOCKS)) {
    console.log(`\n================================================================`);
    console.log(`Auditing: ${config.name} (${symbol}) [Canonical: ${config.canonicalSymbol}]`);
    console.log(`================================================================`);

    const result = {
      stock: config.name,
      xStockTicker: symbol,
      canonical: config.canonicalSymbol,
      integrationSupported: true, // As proven in 007.5B
      jupiterQuoteUsdc: null,
      xstocksRaw: null,
      nasdaqRaw: null,
      selectedProvider: null,
      selectedSource: null,
      benchmarkPrice: null,
      benchmarkTimestamp: null,
      rawTimestamp: null,
      ageSeconds: null,
      ageMinutes: null,
      ageHours: null,
      marketSession: currentSession,
      isFresh: false,
      isEligible: false,
      consumerStatus: null,
      preflightVerdict: null,
      preflightReasonCodes: null
    };

    // 1. Raw xStocks fetch
    try {
      const xUrl = `${API_ENDPOINTS.XSTOCKS_PRICE_DATA_BASE}/${symbol}/price-data`;
      console.log(`  [1] Fetching xStocks: ${xUrl}`);
      const xRes = await fetch(xUrl, {
        headers: { "Accept": "application/json", "User-Agent": "JustFair/1.0" },
        signal: AbortSignal.timeout(TIMEOUTS.UPSTREAM_FETCH_MS)
      });
      if (xRes.ok) {
        const xJson = await xRes.json();
        result.xstocksRaw = xJson;
        console.log(`      xStocks Status: ${xRes.status}, data:`, JSON.stringify(xJson));
      } else {
        console.log(`      xStocks Status: ${xRes.status} (Not OK)`);
      }
    } catch (e) {
      console.log(`      xStocks Error: ${e.message}`);
    }

    // 2. Raw Nasdaq fetch
    try {
      const nUrl = `${API_ENDPOINTS.NASDAQ_QUOTE_BASE}/${config.canonicalSymbol}/info?assetclass=${config.assetClass || "stocks"}`;
      console.log(`  [2] Fetching Nasdaq: ${nUrl}`);
      const nRes = await fetch(nUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) JustFair/1.0" },
        signal: AbortSignal.timeout(TIMEOUTS.UPSTREAM_FETCH_MS)
      });
      if (nRes.ok) {
        const nJson = await nRes.json();
        const primary = nJson.data?.primaryData;
        result.nasdaqRaw = {
          lastSalePrice: primary?.lastSalePrice,
          lastTradeTimestamp: primary?.lastTradeTimestamp,
          isRealTime: primary?.isRealTime,
          marketStatus: nJson.data?.marketStatus,
          secondaryData: nJson.data?.secondaryData
        };
        console.log(`      Nasdaq Status: ${nRes.status}, primaryData:`, JSON.stringify(result.nasdaqRaw));
      } else {
        console.log(`      Nasdaq Status: ${nRes.status} (Not OK)`);
      }
    } catch (e) {
      console.log(`      Nasdaq Error: ${e.message}`);
    }

    // 3. Engine fetchMarketReference result
    try {
      const ref = await fetchMarketReference(symbol, config.assetClass || "stocks");
      result.selectedProvider = ref.provider;
      result.selectedSource = ref.source;
      result.benchmarkPrice = ref.price;
      result.benchmarkTimestamp = ref.timestamp;
      result.rawTimestamp = ref.market_context?.underlying_reference_timestamp;
      
      if (ref.age_ms !== null && ref.age_ms !== undefined) {
        result.ageSeconds = Math.round(ref.age_ms / 1000);
        result.ageMinutes = +(ref.age_ms / 60000).toFixed(1);
        result.ageHours = +(ref.age_ms / 3600000).toFixed(2);
      }

      result.isFresh = ref.freshness_status === "FRESH";
      result.isEligible = ref.market_context?.reference_eligibility === "ELIGIBLE";
      console.log(`  [3] Benchmark Engine: Price: $${ref.price}, Ts: ${ref.timestamp}, Age: ${result.ageHours}h, Eligible: ${result.isEligible}, Freshness: ${ref.freshness_status}`);
    } catch (e) {
      console.log(`  [3] Benchmark Engine Error: ${e.message}`);
    }

    // 4. Preflight execution
    try {
      const pf = await runPreflight({
        inputSymbol: "USDC",
        stockSymbol: symbol,
        amount: 500,
        userPublicKey: null
      });

      result.preflightVerdict = pf.verdict;
      result.preflightReasonCodes = pf.reason_codes;
      result.jupiterQuoteUsdc = pf.economics?.expected_stock_shares;

      if (pf.verification_status === "VERIFIED") {
        result.consumerStatus = "VERIFIED";
      } else if (pf.verdict === "UNABLE_TO_VERIFY") {
        result.consumerStatus = "CAN'T VERIFY RIGHT NOW";
      } else {
        result.consumerStatus = pf.verdict;
      }
      console.log(`  [4] Preflight Verdict: ${pf.verdict} (Verification: ${pf.verification_status}), Reason Codes: ${pf.reason_codes?.join(", ")}`);
    } catch (e) {
      console.log(`  [4] Preflight Error: ${e.message}`);
    }

    auditResults.push(result);
  }

  console.log("\n================================================================================");
  console.log("FULL AUDIT SUMMARY");
  console.log("================================================================================\n");
  console.log(JSON.stringify(auditResults, null, 2));
}

runBenchmarkAudit().catch(console.error);

