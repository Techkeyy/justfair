#!/usr/bin/env node
// JustFair CLI Runner & Doctor (Phase 0/1 Corrected)
import { runPreflight, fetchOnChainTokenMultiplier } from "./preflight.js";
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS } from "./config.js";

const args = process.argv.slice(2);
const command = args[0] || "check";

async function main() {
  if (command === "doctor") {
    console.log("=== JustFair System Doctor ===");
    console.log("Supported Payment Assets:", Object.keys(SUPPORTED_PAYMENTS).join(", "));
    console.log("Supported Stock Mints:", Object.keys(SUPPORTED_STOCKS).join(", "));
    
    console.log("\n1. Testing On-Chain Multiplier Retrieval for AAPLx...");
    const multiplierData = await fetchOnChainTokenMultiplier(SUPPORTED_STOCKS.AAPLx.mint);
    console.log("  Active Multiplier:", multiplierData.active_multiplier);
    console.log("  Source:", multiplierData.source);

    console.log("\n2. Testing Live Preflight Engine (Quote Precheck mode)...");
    const sample = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 100 });
    console.log("  Result Status:", sample.status);
    console.log("  Verification Status:", sample.verification_status);
    console.log("  Market Session:", sample.benchmark?.market_session);
    console.log("  Freshness:", sample.benchmark?.freshness_status);
    
    const isOk = sample.status === "SUCCESS" && multiplierData.active_multiplier > 0;
    console.log("\nOverall Doctor Result:", isOk ? "PASS ✅" : "FAIL ❌");
    process.exit(isOk ? 0 : 1);
  }

  // Parse check arguments
  let inputSymbol = "USDC";
  let stockSymbol = "AAPLx";
  let amount = 500;
  let userWallet = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) inputSymbol = args[i + 1];
    if (args[i] === "--stock" && args[i + 1]) stockSymbol = args[i + 1];
    if (args[i] === "--amount" && args[i + 1]) amount = parseFloat(args[i + 1]);
    if (args[i] === "--wallet" && args[i + 1]) userWallet = args[i + 1];
  }

  console.log(`\n🔍 Checking Preflight: ${amount} ${inputSymbol} -> ${stockSymbol} ${userWallet ? `(Wallet: ${userWallet})` : "(Quote Precheck Mode)"}...`);
  const result = await runPreflight({ inputSymbol, stockSymbol, amount, userPublicKey: userWallet });
  console.log("\n================ JUSTFAIR PREFLIGHT REPORT ================");
  console.log(JSON.stringify(result, null, 2));
  console.log("===========================================================\n");
  
  if (result.status === "SUCCESS") {
    console.log(`Status: [ ${result.verification_status} ]`);
    console.log(`Spend: $${result.input_usd_value} ${result.input_asset}`);
    console.log(`Expected Exposure: $${result.expected_stock_exposure_usd} (${result.expected_stock_shares} ${result.stock} @ $${result.benchmark.price})`);
    console.log(`Difference: ${result.difference_usd >= 0 ? "+" : ""}$${result.difference_usd} (${result.difference_pct >= 0 ? "+" : ""}${result.difference_pct}%)`);
    console.log(`Multiplier: ${result.multiplier.active} (${result.multiplier.source})`);
    console.log(`Market Session: ${result.benchmark.market_session} (${result.benchmark.freshness_status})`);
    console.log(`Simulation Mode: ${result.simulation.mode} -> ${result.simulation.status}`);
  } else {
    console.error(`ERROR: ${result.reason}`);
  }
}

main().catch(err => {
  console.error("Fatal CLI Error:", err);
  process.exit(1);
});
