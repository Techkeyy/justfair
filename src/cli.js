#!/usr/bin/env node
// JustFair CLI Runner & Doctor (Jupiter Swap V2 + Token-2022 Multiplier Corrected)
import { runPreflight, fetchOnChainTokenMultiplier } from "./preflight.js";
import { SUPPORTED_PAYMENTS, SUPPORTED_STOCKS } from "./config.js";
import { runScenario } from "./scenarios/scenario.js";
import { SCENARIOS, findScenario } from "./scenarios/index.js";
import { fetchManifest } from "./scenarios/adapter.js";
import { existsSync, writeFileSync, readFileSync, statSync } from "node:fs";
import { randomUUID } from "node:crypto";
import http from "node:http";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const command = args[0] || "check";

export function openBrowser(url) {
  try {
    if (process.platform === "win32") {
      spawn("cmd.exe", ["/c", "start", "", url], { detached: true, stdio: "ignore" });
    } else if (process.platform === "darwin") {
      spawn("open", [url], { detached: true, stdio: "ignore" });
    } else {
      spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
    }
  } catch {
    // Non-fatal if headless/sandboxed
  }
}

/**
 * Starts an ephemeral local HTTP server serving Replay Lab on 127.0.0.1:0.
 * Serves the result artifact in-memory with zero remote upload / telemetry.
 */
export function startLocalReportViewer(artifact, options = {}) {
  return new Promise((resolve, reject) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const publicDir = path.resolve(__dirname, "../public");

    const mimeTypes = {
      ".html": "text/html; charset=utf-8",
      ".js": "application/javascript; charset=utf-8",
      ".mjs": "application/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".ico": "image/x-icon"
    };

    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
      const pathname = parsedUrl.pathname;

      if (req.method === "GET" && pathname === "/api/v1/local-artifact") {
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Access-Control-Allow-Origin": "*"
        });
        res.end(JSON.stringify(artifact, null, 2));
        return;
      }

      if (req.method === "GET" && pathname === "/api/v1/health") {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ status: "OK", mode: "local-viewer" }));
        return;
      }

      // Serve static files from publicDir
      let reqPath = pathname === "/" ? "/index.html" : pathname;
      const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, "");
      let filePath = path.join(publicDir, safePath);

      if (!existsSync(filePath) || (existsSync(filePath) && statSync(filePath).isDirectory())) {
        filePath = path.join(publicDir, "index.html");
      }

      if (!existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";

      try {
        const content = readFileSync(filePath);
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*"
        });
        res.end(content);
      } catch {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    });

    const port = options.port || 0;
    server.listen(port, "127.0.0.1", () => {
      const addr = server.address();
      const actualPort = typeof addr === "object" ? addr.port : port;
      const url = `http://127.0.0.1:${actualPort}`;
      resolve({ server, port: actualPort, url, close: () => new Promise(r => server.close(r)) });
    });

    server.on("error", reject);
  });
}

/**
 * Scaffolds justfair.config.js and justfair-adapter.mjs in the target directory.
 * Refuses to overwrite existing files.
 */
export async function runInitCommand(flagArgs = [], cwd = process.cwd()) {
  console.log("=== JustFair Scaffold Initializer ===\n");
  const configPath = path.join(cwd, "justfair.config.js");
  const adapterPath = path.join(cwd, "justfair-adapter.mjs");

  let createdConfig = false;
  let createdAdapter = false;

  if (existsSync(configPath)) {
    console.log("[EXISTS] justfair.config.js already exists. Skipping.");
  } else {
    const configContent = `// JustFair Configuration
export default {
  target: "http://localhost:3100",
  scenarios: [
    "STALE_CARRIED_FORWARD_EQUITY",
    "PRESTOCKS_EXPIRY_AFTER",
    "DBC_OPENING_WHALE",
    "TESSERA_TRANSFER_FEE_ACCOUNTING"
  ]
};
`;
    writeFileSync(configPath, configContent, "utf-8");
    console.log("[CREATED] justfair.config.js");
    createdConfig = true;
  }

  if (existsSync(adapterPath)) {
    console.log("[EXISTS] justfair-adapter.mjs already exists. Skipping.");
  } else {
    const adapterContent = `// JustFair Protocol Adapter Scaffold
// Minimal standalone adapter server exposing GET /justfair/v1/manifest and POST /justfair/v1/evaluate.
import http from "node:http";

const PORT = process.env.PORT || 3100;

const MANIFEST = {
  adapterVersion: "1",
  name: "Sample App Adapter",
  capabilities: [
    "underlying_price_display",
    "prestocks_lifecycle_display",
    "token2022_fee_display"
  ]
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, \`http://\${req.headers.host}\`);

  if (req.method === "GET" && url.pathname === "/justfair/v1/manifest") {
    res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
    res.end(JSON.stringify(MANIFEST, null, 2));
    return;
  }

  if (req.method === "POST" && url.pathname === "/justfair/v1/evaluate") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const { scenarioId, scenarioVersion, inputs } = payload;

        // Return OBSERVATIONS ONLY (what your UI/contract shows). Never return a verdict.
        const observations = {};

        if (scenarioId === "STALE_CARRIED_FORWARD_EQUITY") {
          observations.displayedPrice = inputs?.referencePrice ?? 329.29;
          observations.claimsLive = true; // Set to true to observe failure, false to pass
          observations.label = "Weekend Close";
        } else if (scenarioId === "PRESTOCKS_EXPIRY_AFTER") {
          observations.expired = true;
          observations.conversionRequired = true;
          observations.ordinaryValuation = 0;
        } else if (scenarioId === "TESSERA_TRANSFER_FEE_ACCOUNTING") {
          const gross = Number(inputs?.transferAmountUnits || 1000);
          observations.reportedNetRecipientAmount = gross; // Return net received amount
        }

        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(observations, null, 2));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(\`JustFair Adapter running at http://127.0.0.1:\${PORT}\`);
  console.log(\`Manifest: http://127.0.0.1:\${PORT}/justfair/v1/manifest\`);
});
`;
    writeFileSync(adapterPath, adapterContent, "utf-8");
    console.log("[CREATED] justfair-adapter.mjs");
    createdAdapter = true;
  }

  console.log("\nJustFair Scaffold Ready.");
  console.log("\nNext steps:");
  console.log("  1. Connect the adapter to your app:");
  console.log("     Open justfair-adapter.mjs and point the observations inside");
  console.log("     POST /justfair/v1/evaluate at the values your real app calculates");
  console.log("     or displays.");
  console.log("  2. Start your app normally (e.g. on port 4000).");
  console.log("  3. Start the observation adapter:");
  console.log("     node justfair-adapter.mjs");
  console.log("  4. Run the financial crash test:");
  console.log("     npx justfair@latest test --target http://localhost:3100 --open\n");
  process.exitCode = 0;
  return { createdConfig, createdAdapter, configPath, adapterPath };
}

async function main() {
  if (command === "init") {
    await runInitCommand(args.slice(1));
    return;
  }
  if (command === "test") {
    await runScenarioCommand(args.slice(1));
    return;
  }
  if (command === "whale") {
    await runWhaleCommand(args.slice(1));
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

  if (command === "--help" || command === "-h" || command === "help") {
    console.log(`JustFair CLI — Financial-correctness crash testing

Commands:
  init                           Scaffold justfair.config.js and justfair-adapter.mjs
  test --target <url> [--open]   Run scenario audit against local adapter
  whale --config <addr> ...      Run Meteora DBC opening liquidity stress test (add --sweep for a launch stress sweep)
  doctor                         Run diagnostic health checks
  check [--input S] [--stock S]  Run preflight quote verification

Options for 'test':
  --target <url>                 Local adapter URL (e.g. http://localhost:3100)
  --open                         Open local interactive Replay Lab viewer (127.0.0.1)
  --scenario <id>                Run a specific scenario ID only
  --out <file>                   Write result artifact to a JSON file
  --json                         Emit result artifact to stdout as JSON
  --tessera-mint <symbol|mint>   Enable live Tessera Token-2022 transfer fee audit
`);
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
 * [--open] [--scenario ID] [--json] [--out file]`.
 * Phase 2: localhost/loopback targets only. Exit 0 = all PASS,
 * 1 = any FAIL, 2 = could not verify (config/adapter/infra).
 * Exported for in-process testing (same code path as the CLI).
 */
export async function runScenarioCommand(flagArgs, options = {}) {
  let target = null;
  let scenarioId = null;
  let asJson = false;
  let outFile = null;
  let tesseraMint = null;
  let tesseraAmount = "1000";
  let openViewer = false;
  const takeValue = (idx) => {
    const next = flagArgs[idx + 1];
    if (next && !next.startsWith("--")) return { value: next, nextIndex: idx + 1 };
    return { value: null, nextIndex: idx };
  };
  for (let i = 0; i < flagArgs.length; i++) {
    if (flagArgs[i] === "--target") { const r = takeValue(i); if (r.value) target = r.value; i = r.nextIndex; }
    else if (flagArgs[i] === "--scenario") { const r = takeValue(i); if (r.value) scenarioId = r.value; i = r.nextIndex; }
    else if (flagArgs[i] === "--json") asJson = true;
    else if (flagArgs[i] === "--out") { const r = takeValue(i); if (r.value) outFile = r.value; i = r.nextIndex; }
    else if (flagArgs[i] === "--open") openViewer = true;
    else if (flagArgs[i] === "--tessera-mint") {
      const r = takeValue(i);
      tesseraMint = r.value || "T-OpenAI";
      i = r.nextIndex;
    }
    else if (flagArgs[i] === "--tessera-amount") { const r = takeValue(i); if (r.value) tesseraAmount = r.value; i = r.nextIndex; }
  }
  if (!target) {
    console.error("Usage: node src/cli.js test --target http://localhost:PORT [--open] [--scenario ID] [--json] [--out file]");
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
  const wantsTessera = tesseraMint && (!scenarioId || scenarioId === "TESSERA_TRANSFER_FEE_ACCOUNTING");
  if (scenarioId && scenarioId !== "TESSERA_TRANSFER_FEE_ACCOUNTING") {
    const found = findScenario(scenarioId);
    if (!found) {
      console.error(`Unknown scenario: ${scenarioId} (available: ${SCENARIOS.map(s => s.id).join(", ")}, TESSERA_TRANSFER_FEE_ACCOUNTING with --tessera-mint)`);
      process.exitCode = 2;
      return;
    }
    selected = [found];
  } else if (scenarioId === "TESSERA_TRANSFER_FEE_ACCOUNTING" && !tesseraMint) {
    console.error("TESSERA_TRANSFER_FEE_ACCOUNTING needs live fee state: pass --tessera-mint <symbol|mint> [--tessera-amount UNITS]");
    process.exitCode = 2;
    return;
  } else if (scenarioId === "TESSERA_TRANSFER_FEE_ACCOUNTING") {
    selected = [];
  }
  // Tessera fee scenario is built live per run (evidence carries the
  // on-chain capture time), only when explicitly requested.
  if (wantsTessera) {
    const { TESSERA_PRODUCTS, getTesseraTransferFeeState, buildTesseraScenario } = await import("./scenarios/tessera.js");
    const product = TESSERA_PRODUCTS[tesseraMint] || { symbol: tesseraMint, mint: tesseraMint };
    try {
      const feeState = await getTesseraTransferFeeState(product.mint);
      selected = [...selected, buildTesseraScenario({
        symbol: product.symbol, mint: product.mint,
        transferAmountUnits: tesseraAmount, feeState
      })];
    } catch (err) {
      console.error(`Tessera fee state unreadable: ${err.message} (${err.code || "UNKNOWN"})`);
      process.exitCode = 2;
      return;
    }
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

  let viewerResult = null;
  if (openViewer) {
    viewerResult = await startLocalReportViewer(artifact);
    if (!asJson) {
      console.log(`[JustFair] Local Replay Lab viewer started at ${viewerResult.url}/#replay`);
      console.log("[JustFair] Report served in-memory (zero cloud uploads).");
    }
    openBrowser(`${viewerResult.url}/#replay`);
    if (options.keepAlive !== false && process.env.NODE_ENV !== "test") {
      console.log("[JustFair] Press Ctrl+C to stop local viewer.\n");
      // Keep process alive unless in tests
      await new Promise(() => {});
    }
  }

  if (failed > 0) process.exitCode = 1;
  else if (unable > 0 || passed === 0) process.exitCode = 2;
  else process.exitCode = 0;

  return { artifact, viewer: viewerResult };
}

function describeObserved(result) {
  const d = result.diagnosis || {};
  if (d.actual && typeof d.actual === "object") {
    const parts = [];
    for (const [k, v] of Object.entries(d.actual)) {
      if (v === null || v === undefined) continue;
      if (["claimsLive", "label", "expired", "ordinaryValuation", "conversionRequired", "deadlineUs", "displayedPrice"].includes(k)
        || k.startsWith("reported") || k.startsWith("displayed")) {
        parts.push(`${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
      }
    }
    if (parts.length > 0) return `Target observations — ${parts.join(", ")}.`;
  }
  return typeof d.actual === "string" ? d.actual : "See replay timeline.";
}

/**
 * DBC whale check: `node src/cli.js whale --config ADDR --size UNITS
 * --max-impact PCT [--rpc URL] [--json] [--out file]`.
 * Read-only Meteora quote math over a live config. Exit 0/1/2 = PASS/FAIL/UNABLE.
 *
 * DBC launch sweep: `node src/cli.js whale --config ADDR --max-impact PCT
 * --sweep [--sizes A,B,C] [--rpc URL] [--json] [--out file]`.
 * Same read-only math across a deterministic size sequence. Overall-status
 * exits: PASS 0, UNABLE_TO_VERIFY 2, any other finding (FAIL/CAPACITY) 1.
 */
export async function runWhaleCommand(flagArgs) {
  const { runDbcWhale, runDbcSweep } = await import("./scenarios/dbc-live.js");
  let configAddress = null;
  let tradeSizeQuoteUnits = null;
  let maxPriceImpactPct = null;
  let rpcUrl = null;
  let asJson = false;
  let outFile = null;
  let sweep = false;
  let sizesArg = null;
  const takeValue = (idx) => {
    const next = flagArgs[idx + 1];
    if (next && !next.startsWith("--")) return { value: next, nextIndex: idx + 1 };
    return { value: null, nextIndex: idx };
  };
  for (let i = 0; i < flagArgs.length; i++) {
    if (flagArgs[i] === "--config") { const r = takeValue(i); if (r.value) configAddress = r.value; i = r.nextIndex; }
    else if (flagArgs[i] === "--size") { const r = takeValue(i); if (r.value) tradeSizeQuoteUnits = r.value; i = r.nextIndex; }
    else if (flagArgs[i] === "--max-impact") { const r = takeValue(i); if (r.value) maxPriceImpactPct = r.value; i = r.nextIndex; }
    else if (flagArgs[i] === "--rpc") { const r = takeValue(i); if (r.value) rpcUrl = r.value; i = r.nextIndex; }
    else if (flagArgs[i] === "--json") asJson = true;
    else if (flagArgs[i] === "--sweep") sweep = true;
    else if (flagArgs[i] === "--sizes") { const r = takeValue(i); if (r.value) sizesArg = r.value; i = r.nextIndex; }
    else if (flagArgs[i] === "--out") { const r = takeValue(i); if (r.value) outFile = r.value; i = r.nextIndex; }
  }
  if (sweep) {
    await runWhaleSweepCommand({ rpcUrl, configAddress, maxPriceImpactPct, sizesArg, asJson, outFile });
    return;
  }
  if (!configAddress || !tradeSizeQuoteUnits || maxPriceImpactPct === null) {
    console.error("Usage: node src/cli.js whale --config ADDR --size QUOTE_UNITS --max-impact PCT [--rpc URL] [--json] [--out file]");
    process.exitCode = 2;
    return;
  }
  const result = await runDbcWhale({ rpcUrl, configAddress, tradeSizeQuoteUnits, maxPriceImpactPct });
  const artifact = {
    runId: randomUUID(),
    target: { config: configAddress },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    summary: {
      passed: result.status === "PASS" ? 1 : 0,
      failed: result.status === "FAIL" ? 1 : 0,
      unable: result.status === "UNABLE_TO_VERIFY" ? 1 : 0
    },
    results: [{ scenarioId: "DBC_OPENING_WHALE", ...result }]
  };
  if (outFile) writeFileSync(outFile, JSON.stringify(artifact, null, 2) + "\n");
  if (asJson) {
    console.log(JSON.stringify(artifact, null, 2));
  } else if (result.status === "PASS") {
    const a = result.assertions[0];
    console.log(`\nJUSTFAIR\n\nPASS  DBC_OPENING_WHALE\n  Opening impact ${a.actual.observedImpactPct.toFixed(3)}% within issuer policy.\n`);
  } else if (result.status === "FAIL") {
    const d = result.diagnosis || {};
    console.log(`\nJUSTFAIR\n\nFAIL  DBC_OPENING_WHALE\n\nPolicy\nMaximum allowed price impact: ${maxPriceImpactPct}%\n\nObserved\n${typeof d.actual === "object" ? JSON.stringify(d.actual) : d.actual}\n\nExpected\n${d.expected || ""}\n\nRoot cause\n${d.rootCause || ""}\n\nFix guidance\n${d.guidance || ""}\n\nReplay\n${result.replay.length} events recorded.\n`);
  } else {
    console.log(`\nJUSTFAIR\n\nUNABLE TO VERIFY\n${result.reason || "could not verify"}\n`);
  }
  process.exitCode = result.status === "PASS" ? 0 : result.status === "FAIL" ? 1 : 2;
}

async function runWhaleSweepCommand({ rpcUrl, configAddress, maxPriceImpactPct, sizesArg, asJson, outFile }) {
  const { runDbcSweep } = await import("./scenarios/dbc-live.js");
  if (!configAddress || maxPriceImpactPct === null) {
    console.error("Usage: node src/cli.js whale --config ADDR --max-impact PCT --sweep [--sizes A,B,C] [--rpc URL] [--json] [--out file]");
    process.exitCode = 2;
    return;
  }
  const result = await runDbcSweep({
    rpcUrl,
    configAddress,
    maxPriceImpactPct,
    sizesQuoteUnits: sizesArg ? sizesArg.split(",") : null
  });
  const artifact = {
    runId: randomUUID(),
    target: { config: configAddress },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    summary: {
      passed: result.summary?.passed ?? 0,
      failed: (result.summary?.failed ?? 0) + (result.summary?.capacity ?? 0),
      unable: result.summary?.unable ?? (result.status === "UNABLE_TO_VERIFY" ? 1 : 0)
    },
    results: [{ scenarioId: "DBC_LAUNCH_SWEEP", ...result }]
  };
  if (outFile) writeFileSync(outFile, JSON.stringify(artifact, null, 2) + "\n");
  if (asJson) {
    console.log(JSON.stringify(artifact, null, 2));
  } else if (result.status === "PASS") {
    console.log(`\nJUSTFAIR\n\nPASS  DBC_LAUNCH_SWEEP\n  ${result.explanation || ""}\n`);
  } else if (result.status === "CAPACITY") {
    console.log(`\nJUSTFAIR\n\nCURVE CAPACITY  DBC_LAUNCH_SWEEP\n`);
    for (const p of result.points || []) {
      const impact = p.observedImpactPct === null || p.observedImpactPct === undefined ? "—" : `${p.observedImpactPct.toFixed(3)}%`;
      console.log(`  ${p.status.padEnd(8)} ${p.sizeQuoteUnits} quote units → ${impact}`);
    }
    console.log(`\n${result.explanation || ""}\n\nGuidance\n${result.guidance || ""}\n\nReplay\n${result.replay.length} events recorded.\n`);
  } else if (result.status === "FAIL") {
    console.log(`\nJUSTFAIR\n\nFAIL  DBC_LAUNCH_SWEEP\n`);
    for (const p of result.points || []) {
      const impact = p.observedImpactPct === null || p.observedImpactPct === undefined ? "—" : `${p.observedImpactPct.toFixed(3)}%`;
      console.log(`  ${p.status.padEnd(8)} ${p.sizeQuoteUnits} quote units → ${impact}`);
    }
    console.log(`\n${result.explanation || ""}\n\nGuidance\n${result.guidance || ""}\n\nReplay\n${result.replay.length} events recorded.\n`);
  } else {
    console.log(`\nJUSTFAIR\n\nUNABLE TO VERIFY\n${result.reason || "could not verify"}\n`);
  }
  // Overall-status-driven exits: PASS 0, UNABLE 2, any other finding (FAIL/CAPACITY) 1.
  process.exitCode = result.status === "PASS" ? 0 : result.status === "UNABLE_TO_VERIFY" ? 2 : 1;
}

// Only execute main() automatically when invoked directly as CLI
if (process.argv[1] && (process.argv[1].endsWith("cli.js") || process.argv[1].endsWith("justfair"))) {
  main().catch(err => {
    console.error("Fatal CLI Error:", err);
    process.exit(1);
  });
}
