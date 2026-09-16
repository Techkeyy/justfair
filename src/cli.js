#!/usr/bin/env node
// JustFair CLI Runner & Doctor (Jupiter Swap V2 + Token-2022 Multiplier Corrected)
import { runPreflight, fetchOnChainTokenMultiplier } from "./preflight.js";
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS } from "./config.js";
import { runScenario } from "./scenarios/scenario.js";
import { SCENARIOS, findScenario } from "./scenarios/index.js";
import { fetchManifest } from "./scenarios/adapter.js";
import { writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
const command = args[0] || "check";

async function main() {
  if (command === "test") {
    await runScenarioCommand(args.slice(1));
    return;
  }
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
    const isOk = sample.request_status === "SUCCESS" && mult.current_multiplier > 0;
    console.log("  Result Status:", sample.request_status);
    console.log("  Verification Status:", sample.verification_status);
    console.log("  Reason Codes:", sample.reason_codes?.join(", "));
    console.log("  Router:", sample.dex_route?.router);
    console.log("  Reference Session:", sample.benchmark?.reference_session);
    console.log("  Current Market Session:", sample.benchmark?.current_market_session);
    console.log("  Benchmark Freshness:", sample.benchmark?.freshness_status);
    
    console.log("\nOverall Doctor Result:", isOk ? "PASS ✅" : "FAIL ❌");
    process.exitCode = isOk ? 0 : 1;
    return;
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
  
  if (result.request_status === "SUCCESS") {
    console.log(`Verification Status: [ ${result.verification_status} ] (Reasons: ${result.reason_codes?.join(", ")})`);
    console.log(`Spend: $${result.trade.input_usd_value} ${result.trade.input_asset}`);
    console.log(`Expected Exposure: $${result.economics.expected_stock_exposure_usd} (${result.economics.expected_stock_shares} ${result.trade.stock_symbol} @ $${result.benchmark.price})`);
    console.log(`Difference: ${result.economics.difference_usd >= 0 ? "+" : ""}$${result.economics.difference_usd} (${result.economics.difference_pct >= 0 ? "+" : ""}${result.economics.difference_pct}%)`);
    console.log(`Multiplier: ${result.economics.multiplier.current_multiplier} (${result.economics.multiplier.current_multiplier_reason})`);
    console.log(`Market Sessions: Ref=${result.benchmark.reference_session} | Current=${result.benchmark.current_market_session}`);
    console.log(`Simulation: Mode=${result.simulation.mode} -> Status=${result.simulation.status}`);
  } else {
    console.error(`ERROR: ${result.reason}`);
  }
}

/**
 * Local scenario runner: `node src/cli.js test --target <url>
 * [--scenario ID] [--json] [--out file]`.
 * Phase 2: localhost/loopback targets only. Exit 0 = all PASS,
 * 1 = any FAIL, 2 = could not verify (config/adapter/infra).
 * Exported for in-process testing (same code path as the CLI).
 */
export async function runScenarioCommand(flagArgs) {
  let target = null;
  let scenarioId = null;
  let asJson = false;
  let outFile = null;
  for (let i = 0; i < flagArgs.length; i++) {
    if (flagArgs[i] === "--target" && flagArgs[i + 1]) target = flagArgs[++i];
    else if (flagArgs[i] === "--scenario" && flagArgs[i + 1]) scenarioId = flagArgs[++i];
    else if (flagArgs[i] === "--json") asJson = true;
    else if (flagArgs[i] === "--out" && flagArgs[i + 1]) outFile = flagArgs[++i];
  }
  if (!target) {
    console.error("Usage: node src/cli.js test --target http://localhost:PORT [--scenario ID] [--json] [--out file]");
    process.exitCode = 2;
    return;
  }
  let host;
  try {
    host = new URL(target).hostname.toLowerCase();
  } catch {
    console.error(`Invalid target URL: ${target}`);
    process.exitCode = 2;
    return;
  }
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost");
  if (!local) {
    console.error(`Refused non-local target: ${host} (Phase 2 runs against localhost adapters only)`);
    process.exitCode = 2;
    return;
  }

  const startedAt = new Date().toISOString();
  let manifest;
  try {
    manifest = await fetchManifest(target, { allowLocal: true });
  } catch (err) {
    if (!asJson) {
      console.log("\nJUSTFAIR\n\nUNABLE TO VERIFY\n" + `Adapter unreachable or invalid: ${err.message}\n`);
    } else {
      console.log(JSON.stringify({ target, error: err.message, code: err.code || "ADAPTER_UNAVAILABLE" }, null, 2));
    }
    process.exitCode = 2;
    return;
  }

  let selected = SCENARIOS;
  if (scenarioId) {
    const found = findScenario(scenarioId);
    if (!found) {
      console.error(`Unknown scenario: ${scenarioId} (available: ${SCENARIOS.map(s => s.id).join(", ")})`);
      process.exitCode = 2;
      return;
    }
    selected = [found];
  }
  const skipped = selected.filter(s => s.requiresCapabilities.some(c => !manifest.capabilities.includes(c)));
  const runnable = selected.filter(s => !skipped.includes(s));

  const results = [];
  for (const def of runnable) {
    results.push({ scenarioId: def.id, ...(await runScenario(def, target, { allowLocal: true })) });
  }
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const unable = results.filter(r => r.status === "UNABLE_TO_VERIFY").length;
  const artifact = {
    runId: randomUUID(),
    target: { url: target, name: manifest.name, adapterVersion: manifest.adapterVersion },
    startedAt,
    completedAt: new Date().toISOString(),
    summary: { passed, failed, unable, skipped: skipped.map(s => s.id) },
    results
  };

  if (outFile) writeFileSync(outFile, JSON.stringify(artifact, null, 2) + "\n");

  if (asJson) {
    console.log(JSON.stringify(artifact, null, 2));
  } else {
    console.log("\nJUSTFAIR\n");
    for (const r of results) {
      const def = runnable.find(d => d.id === r.scenarioId);
      if (r.status === "PASS") {
        console.log(`PASS  ${r.scenarioId}\n  Financial invariant passed.\n`);
      } else if (r.status === "FAIL") {
        const d = r.diagnosis || {};
        console.log(`FAIL  ${r.scenarioId}\n\nExpected\n${d.expected || def.assertions[0]?.expected || ""}\n\nObserved\n${describeObserved(r)}\n\nRoot cause\n${d.rootCause || ""}\n\nFix\n${d.guidance || ""}\n\nReplay\n${r.replay.length} events recorded.\n`);
      } else {
        console.log(`UNABLE  ${r.scenarioId}\n  ${r.reason || "could not verify"}\n`);
      }
    }
    for (const s of skipped) console.log(`SKIP  ${s.id}\n  Target lacks: ${s.requiresCapabilities.filter(c => !manifest.capabilities.includes(c)).join(", ")}\n`);
    console.log(`${passed} passed · ${failed} failed · ${unable} unable${skipped.length ? ` · ${skipped.length} skipped` : ""}\n`);
  }

  if (failed > 0) process.exitCode = 1;
  else if (unable > 0 || passed === 0) process.exitCode = 2;
  else process.exitCode = 0;
}

function describeObserved(result) {
  const d = result.diagnosis || {};
  if (d.actual && typeof d.actual === "object") {
    const parts = [];
    if (d.actual.claimsLive !== undefined) parts.push(`claimsLive: ${d.actual.claimsLive}`);
    if (d.actual.label) parts.push(`label: "${d.actual.label}"`);
    if (d.actual.expired !== undefined) parts.push(`expired: ${d.actual.expired}`);
    if (d.actual.ordinaryValuation !== undefined) parts.push(`ordinaryValuation: ${d.actual.ordinaryValuation}`);
    if (d.actual.conversionRequired !== undefined) parts.push(`conversionRequired: ${d.actual.conversionRequired}`);
    if (d.actual.deadlineUs !== undefined && d.actual.deadlineUs !== null) parts.push(`deadlineUs: ${d.actual.deadlineUs}`);
    if (d.actual.displayedPrice !== undefined) parts.push(`displayedPrice: ${d.actual.displayedPrice}`);
    if (parts.length > 0) return `Target observations — ${parts.join(", ")}.`;
  }
  return typeof d.actual === "string" ? d.actual : "See replay timeline.";
}

main().catch(err => {
  console.error("Fatal CLI Error:", err);
  process.exit(1);
});
