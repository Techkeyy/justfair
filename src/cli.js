#!/usr/bin/env node
// JustFair CLI Runner & Doctor (Jupiter Swap V2 + Token-2022 Multiplier Corrected)
import { runPreflight, fetchOnChainTokenMultiplier } from "./preflight.js";
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS } from "./config.js";

const args = process.argv.slice(2);
const command = args[0] || "check";

async function main() {
  if (command === "doctor") {
    console.log("=== JustFair System Doctor (Jupiter Swap V2 + Token-2022 Core) ===");
    console.log("Supported Payment Assets:", Object.keys(SUPPORTED_PAYMENTS).join(", "));
    console.log("Supported Stock Mints:", Object.keys(SUPPORTED_STOCKS).join(", "));
    
    console.log("\n1. Testing On-Chain Effective Multiplier for AAPLx...");
    const mult = await fetchOnChainTokenMultiplier(SUPPORTED_STOCKS.AAPLx.mint);
    console.log("  Stored Multiplier:", mult.stored_multiplier);
    console.log("  New Multiplier:", mult.new_multiplier);
    console.log("  Effective Timestamp:", mult.new_multiplier_effective_timestamp);
    console.log("  Current Effective Multiplier:", mult.current_multiplier);
    console.log("  Reasoning:", mult.current_multiplier_reason);
    console.log("  In Corporate Action Window?", mult.is_inside_corporate_action_window);

    console.log("\n2. Testing Live Preflight Engine (Jupiter Swap V2 Quote Precheck)...");
    const sample = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 100 });
    console.log("  Result Status:", sample.status);
    console.log("  Verification Status:", sample.verification_status);
    console.log("  Reason Code:", sample.reason_code);
    console.log("  Router:", sample.dex_route?.router);
    console.log("  Reference Session:", sample.benchmark?.reference_session);
    console.log("  Current Market Session:", sample.benchmark?.current_market_session);
    console.log("  Benchmark Freshness:", sample.benchmark?.freshness_status);
    
    const isOk = sample.status === "SUCCESS" && mult.current_multiplier > 0;
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
    console.log(`Verification Status: [ ${result.verification_status} ] (Reason: ${result.reason_code})`);
    console.log(`Spend: $${result.input_usd_value} ${result.input_asset}`);
    console.log(`Expected Exposure: $${result.expected_stock_exposure_usd} (${result.expected_stock_shares} ${result.stock} @ $${result.benchmark.price})`);
    console.log(`Difference: ${result.difference_usd >= 0 ? "+" : ""}$${result.difference_usd} (${result.difference_pct >= 0 ? "+" : ""}${result.difference_pct}%)`);
    console.log(`Multiplier: ${result.multiplier.current_multiplier} (${result.multiplier.current_multiplier_reason})`);
    console.log(`Market Sessions: Ref=${result.benchmark.reference_session} | Current=${result.benchmark.current_market_session}`);
    console.log(`Simulation: Mode=${result.simulation.mode} -> Status=${result.simulation.status}`);
  } else {
    console.error(`ERROR: ${result.reason}`);
  }
}

main().catch(err => {
  console.error("Fatal CLI Error:", err);
  process.exit(1);
});
