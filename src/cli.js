#!/usr/bin/env node
// JustFair CLI Runner & Doctor
import { runPreflight } from "./preflight.js";
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS } from "./config.js";

const args = process.argv.slice(2);
const command = args[0] || "check";

async function main() {
  if (command === "doctor") {
    console.log("=== JustFair System Doctor ===");
    console.log("Supported Payment Assets:", Object.keys(SUPPORTED_PAYMENTS).join(", "));
    console.log("Supported Stock Mints:", Object.keys(SUPPORTED_STOCKS).join(", "));
    console.log("Running Live Connectivity Check...");
    const sample = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 100 });
    console.log("Doctor Result:", sample.status === "SUCCESS" ? "PASS (Live Solana + Dex + Benchmark OK)" : `FAIL (${sample.reason})`);
    process.exit(sample.status === "SUCCESS" ? 0 : 1);
  }

  // Parse check arguments
  let inputSymbol = "USDC";
  let stockSymbol = "AAPLx";
  let amount = 500;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) inputSymbol = args[i + 1];
    if (args[i] === "--stock" && args[i + 1]) stockSymbol = args[i + 1];
    if (args[i] === "--amount" && args[i + 1]) amount = parseFloat(args[i + 1]);
  }

  console.log(`\n🔍 Checking Preflight Fairness: ${amount} ${inputSymbol} -> ${stockSymbol}...`);
  const result = await runPreflight({ inputSymbol, stockSymbol, amount });
  console.log("\n================ JUSTFAIR PREFLIGHT REPORT ================");
  console.log(JSON.stringify(result, null, 2));
  console.log("===========================================================\n");
  
  if (result.status === "SUCCESS") {
    console.log(`VERDICT: [ ${result.verdict} ]`);
    console.log(`Spend: $${result.input_usd_value} ${result.input_asset}`);
    console.log(`Expected Exposure: $${result.expected_stock_exposure_usd} (${result.expected_stock_shares} ${result.stock} @ $${result.benchmark.price})`);
    console.log(`Difference: ${result.difference_usd >= 0 ? "+" : ""}$${result.difference_usd} (${result.difference_pct >= 0 ? "+" : ""}${result.difference_pct}%)`);
    console.log(`Solana Simulation: ${result.simulation.status} (${result.simulation.units_consumed} compute units)`);
  } else {
    console.error(`ERROR: ${result.reason}`);
  }
}

main().catch(err => {
  console.error("Fatal CLI Error:", err);
  process.exit(1);
});
