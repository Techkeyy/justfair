// JustFair Phase 2 CLI Runner Tests (node:test)
// runScenarioCommand is the exact CLI code path, invoked in-process:
// this sandbox blocks loopback between separately spawned processes, so
// spawning `node src/cli.js` as a child cannot reach test fixtures here.
// (Real spawned-CLI runs were proven manually: naive exit 1, correct exit 0.)

import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";

import { runScenarioCommand, runWhaleCommand, persistResultArtifact, DEFAULT_RESULT_FILENAME } from "../src/cli.js";
import { startFixtureTarget, startLifecycleTarget, startFeeTarget, closeFixtureTarget } from "./fixtures/adapter-targets.js";

const WHALE_CONFIG = "DLa32CJBWDp3YveqD3A8jexkUUzeTZPjEquf3Ur6BwEU";

async function runWhaleInProcess(args) {
  const lines = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => { lines.push(a.join(" ")); };
  console.error = (...a) => { lines.push(a.join(" ")); };
  const savedCode = process.exitCode;
  process.exitCode = undefined;
  try {
    await runWhaleCommand(args);
    return { code: process.exitCode ?? 0, stdout: lines.join("\n") };
  } finally {
    console.log = origLog;
    console.error = origErr;
    process.exitCode = savedCode;
  }
}
async function runCLIInProcess(args, opts = {}) {
  const lines = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => { lines.push(a.join(" ")); };
  console.error = (...a) => { lines.push(a.join(" ")); };
  const savedCode = process.exitCode;
  process.exitCode = undefined;
  try {
    // Keep test runs out of the repo checkout: artifacts land in the OS temp
    // dir unless the caller passes an explicit cwd (mirrors "repeat replaces").
    const r = await runScenarioCommand(args, { cwd: os.tmpdir(), ...opts });
    return { code: process.exitCode ?? 0, stdout: lines.join("\n"), artifact: r?.artifact ?? null };
  } finally {
    console.log = origLog;
    console.error = origErr;
    process.exitCode = savedCode;
  }
}

test("cli exits 1 with FAIL summary on the naive target", async () => {
  const h = await startFixtureTarget({ behavior: "naive" });
  try {
    const r = await runCLIInProcess(["test", "--target", h.baseUrl]);
    assert.equal(r.code, 1);
    assert.ok(r.stdout.includes("FAIL") && r.stdout.includes("STALE_CARRIED_FORWARD_EQUITY"));
    assert.ok(r.stdout.includes("0 passed"));
  } finally {
    await closeFixtureTarget(h);
  }
});

test("cli exits 0 with PASS summary on the correct target", async () => {
  const h = await startFixtureTarget({ behavior: "correct" });
  try {
    const r = await runCLIInProcess(["test", "--target", h.baseUrl]);
    assert.equal(r.code, 0);
    assert.ok(r.stdout.includes("1 passed"));
  } finally {
    await closeFixtureTarget(h);
  }
});

test("cli exits 2 on unreachable localhost (UNABLE, never PASS)", async () => {
  const r = await runCLIInProcess(["test", "--target", "http://127.0.0.1:1"]);
  assert.equal(r.code, 2);
  assert.ok(/UNABLE|unreachable|invalid/i.test(r.stdout));
});

test("cli exits 2 on non-localhost targets (no remote fetching)", async () => {
  const r = await runCLIInProcess(["test", "--target", "https://example.com"]);
  assert.equal(r.code, 2);
  assert.ok(r.stdout.includes("Refused non-local target"));
});

test("cli --scenario filters, --json emits the result artifact", async () => {
  const h = await startLifecycleTarget({ behavior: "correct" });
  try {
    const r = await runCLIInProcess(["test", "--target", h.baseUrl, "--scenario", "PRESTOCKS_EXPIRY_AFTER", "--json"]);
    assert.equal(r.code, 0);
    // --json prints the artifact to stdout; the saved-file line goes to
    // stderr (kept separate so stdout stays pipeable JSON).
    const artifact = JSON.parse(r.stdout.split("[JustFair]")[0]);
    assert.ok(typeof artifact.runId === "string" && artifact.runId.length > 0);
    assert.equal(artifact.summary.passed, 1);
    assert.equal(artifact.results.length, 1);
    assert.equal(artifact.results[0].scenarioId, "PRESTOCKS_EXPIRY_AFTER");
    assert.equal(artifact.results[0].status, "PASS");
  } finally {
    await closeFixtureTarget(h);
  }
});

test("cli multiple-scenario summary counts passes and skips honestly", async () => {
  const h = await startLifecycleTarget({ behavior: "correct" });
  try {
    const r = await runCLIInProcess(["test", "--target", h.baseUrl]);
    assert.equal(r.code, 0);
    assert.ok(r.stdout.includes("3 passed"));
    assert.ok(r.stdout.includes("1 skipped"));
  } finally {
    await closeFixtureTarget(h);
  }
});

test("cli whale exits 0 on within-policy opening (live config)", async () => {
  const r = await runWhaleInProcess(["whale", "--config", WHALE_CONFIG, "--size", "1000000000", "--max-impact", "8"]);
  assert.equal(r.code, 0);
  assert.ok(r.stdout.includes("PASS") && r.stdout.includes("DBC_OPENING_WHALE"));
});

test("cli whale exits 1 on capacity-exceeding opening (live config)", async () => {
  const r = await runWhaleInProcess(["whale", "--config", WHALE_CONFIG, "--size", "206185567000", "--max-impact", "8"]);
  assert.equal(r.code, 1);
  assert.ok(r.stdout.includes("FAIL"));
});

test("cli whale exits 2 on bad address without network use", async () => {
  const r = await runWhaleInProcess(["whale", "--config", "NOTANADDRESS", "--size", "1000", "--max-impact", "8"]);
  assert.equal(r.code, 2);
  assert.ok(/UNABLE/i.test(r.stdout));
});

test("cli whale --sweep exits 1 with first-failure findings on live config", async () => {
  const r = await runWhaleInProcess(["whale", "--config", WHALE_CONFIG, "--max-impact", "8", "--sweep"]);
  assert.equal(r.code, 1);
  assert.ok(r.stdout.includes("DBC_LAUNCH_SWEEP"));
  assert.ok(r.stdout.includes("5480000000"));
  assert.ok(!/This launch is (safe|unsafe)/i.test(r.stdout));
});

test("cli whale --sweep exits 2 on bad address without network use", async () => {
  const r = await runWhaleInProcess(["whale", "--config", "NOTANADDRESS", "--max-impact", "8", "--sweep"]);
  assert.equal(r.code, 2);
  assert.ok(/UNABLE/i.test(r.stdout));
});

test("cli tessera naive FAILs with fee-adjusted expected amount (live fee state)", async () => {
  const h = await startFeeTarget({ behavior: "naive" });
  try {
    const r = await runCLIInProcess(["test", "--target", h.baseUrl, "--tessera-mint", "T-OpenAI", "--tessera-amount", "1000", "--scenario", "TESSERA_TRANSFER_FEE_ACCOUNTING"]);
    assert.equal(r.code, 1);
    assert.ok(r.stdout.includes("TESSERA_TRANSFER_FEE_ACCOUNTING"));
    assert.ok(r.stdout.includes("998"));
  } finally {
    await closeFixtureTarget(h);
  }
});

test("cli tessera correct PASSES (live fee state)", async () => {
  const h = await startFeeTarget({ behavior: "correct" });
  try {
    const r = await runCLIInProcess(["test", "--target", h.baseUrl, "--tessera-mint", "T-OpenAI", "--tessera-amount", "1000", "--scenario", "TESSERA_TRANSFER_FEE_ACCOUNTING"]);
    assert.equal(r.code, 0);
    assert.ok(r.stdout.includes("1 passed"));
  } finally {
    await closeFixtureTarget(h);
  }
});

test("fresh scaffold advertises transfer_fee_accounting and runs Tessera without SKIP", async () => {
  const { runInitCommand, runScenarioCommand } = await import("../src/cli.js");
  const { mkdtempSync, rmSync, readFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const { spawn } = await import("node:child_process");

  const tempDir = mkdtempSync(path.join(tmpdir(), "jf-init-tessera-"));
  const PORT = "31997";
  let child = null;
  try {
    await runInitCommand([], tempDir);
    const adapterContent = readFileSync(path.join(tempDir, "justfair-adapter.mjs"), "utf-8");
    assert.ok(adapterContent.includes('"transfer_fee_accounting"'), "generated manifest must advertise transfer_fee_accounting");
    assert.ok(adapterContent.includes('scenarioId === "TESSERA_TRANSFER_FEE_ACCOUNTING"'), "generated adapter must handle the Tessera scenario");
    assert.ok(adapterContent.includes("reportedNetRecipientAmount"), "generated adapter must return the fee observation");

    // End-to-end: serve the untouched generated scaffold and run the real
    // public flow against it. The scaffold echoes gross, so with the live
    // 20bps fee the verdict must be FAIL — crucially, never SKIP.
    child = spawn(process.execPath, ["justfair-adapter.mjs"], {
      cwd: tempDir,
      env: { ...process.env, PORT },
      stdio: "ignore"
    });
    const baseUrl = `http://127.0.0.1:${PORT}`;
    let ready = false;
    for (let i = 0; i < 50 && !ready; i++) {
      try {
        const res = await fetch(`${baseUrl}/justfair/v1/manifest`);
        ready = res.ok;
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    assert.ok(ready, "generated adapter must serve its manifest");
    const manifest = await (await fetch(`${baseUrl}/justfair/v1/manifest`)).json();
    assert.ok(manifest.capabilities.includes("transfer_fee_accounting"));

    const savedCode = process.exitCode;
    process.exitCode = undefined;
    try {
      const r = await runScenarioCommand(
        ["test", "--target", baseUrl, "--tessera-mint", "T-OpenAI", "--tessera-amount", "1000", "--scenario", "TESSERA_TRANSFER_FEE_ACCOUNTING"],
        { keepAlive: false, cwd: tempDir }
      );
      assert.ok(!r.artifact.summary.skipped.includes("TESSERA_TRANSFER_FEE_ACCOUNTING"), "fresh scaffold must not SKIP the Tessera scenario");
      assert.equal(r.artifact.results.length, 1);
      assert.equal(r.artifact.results[0].status, "FAIL");
      assert.equal(process.exitCode, 1);
    } finally {
      process.exitCode = savedCode;
    }
  } finally {
    if (child) {
      child.kill();
      await new Promise((r) => {
        child.on("exit", r);
        setTimeout(r, 5000);
      });
    }
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("fresh scaffold reports all three PreStocks variants UNABLE until wired", async () => {
  const { runInitCommand, runScenarioCommand } = await import("../src/cli.js");
  const { mkdtempSync, rmSync, readFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");
  const { spawn } = await import("node:child_process");

  const tempDir = mkdtempSync(path.join(tmpdir(), "jf-init-prestocks-"));
  const PORT = "31996";
  let child = null;
  try {
    await runInitCommand([], tempDir);
    const adapterContent = readFileSync(path.join(tempDir, "justfair-adapter.mjs"), "utf-8");
    assert.ok(adapterContent.includes('"lifecycle_position_state"'), "generated manifest must advertise lifecycle_position_state");
    for (const id of ["PRESTOCKS_EXPIRY_BEFORE", "PRESTOCKS_EXPIRY_NEAR", "PRESTOCKS_EXPIRY_AFTER"]) {
      assert.ok(adapterContent.includes(id), `generated adapter must handle ${id}`);
    }
    assert.ok(adapterContent.includes("ordinaryValuation = <false once expired"), "AFTER template must use the boolean contract");
    assert.ok(!adapterContent.includes("ordinaryValuation = 0"), "AFTER branch must not use numeric 0");

    // End-to-end: an untouched generated scaffold must NEVER produce PASS
    // (or FAIL) for app-observed scenarios. Each variant must report UNABLE
    // with exit code 2 and a wiring-specific reason.
    child = spawn(process.execPath, ["justfair-adapter.mjs"], {
      cwd: tempDir,
      env: { ...process.env, PORT },
      stdio: "ignore"
    });
    const baseUrl = `http://127.0.0.1:${PORT}`;
    let ready = false;
    for (let i = 0; i < 50 && !ready; i++) {
      try {
        const res = await fetch(`${baseUrl}/justfair/v1/manifest`);
        ready = res.ok;
      } catch {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    assert.ok(ready, "generated adapter must serve its manifest");

    const savedCode = process.exitCode;
    process.exitCode = undefined;
    try {
      for (const id of ["PRESTOCKS_EXPIRY_BEFORE", "PRESTOCKS_EXPIRY_NEAR", "PRESTOCKS_EXPIRY_AFTER"]) {
        const r = await runScenarioCommand(["test", "--target", baseUrl, "--scenario", id], { keepAlive: false, cwd: tempDir });
        assert.ok(!r.artifact.summary.skipped.includes(id), `fresh scaffold must not SKIP ${id}`);
        assert.equal(r.artifact.results.length, 1);
        assert.equal(r.artifact.results[0].status, "UNABLE_TO_VERIFY", `untouched scaffold must not decide ${id}`);
        assert.ok((r.artifact.results[0].reason || "").includes("not connected to the target app"), `${id} reason must name the unwired state`);
        assert.equal(process.exitCode, 2);
        process.exitCode = undefined;
      }
      const counts = await runScenarioCommand(["test", "--target", baseUrl, "--scenario", "PRESTOCKS_EXPIRY_AFTER"], { keepAlive: false, cwd: tempDir });
      assert.equal(counts.artifact.summary.passed, 0, "untouched scaffold must record 0 PASS");
    } finally {
      process.exitCode = savedCode;
    }
  } finally {
    if (child) {
      child.kill();
      await new Promise((r) => {
        child.on("exit", r);
        setTimeout(r, 5000);
      });
    }
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("adapter lacking lifecycle_position_state honestly SKIPs PreStocks", async () => {
  const h = await startFixtureTarget({ behavior: "naive" });
  try {
    const r = await runCLIInProcess(["test", "--target", h.baseUrl, "--scenario", "PRESTOCKS_EXPIRY_AFTER"]);
    assert.equal(r.code, 2);
    assert.ok(r.stdout.includes("SKIP") && r.stdout.includes("PRESTOCKS_EXPIRY_AFTER"));
    assert.ok(r.stdout.includes("lifecycle_position_state"));
  } finally {
    await closeFixtureTarget(h);
  }
});

test("cli init scaffolds justfair.config.js and justfair-adapter.mjs without overwriting", async () => {
  const { runInitCommand } = await import("../src/cli.js");
  const { mkdtempSync, rmSync, readFileSync, existsSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");

  const tempDir = mkdtempSync(path.join(tmpdir(), "jf-init-test-"));
  try {
    const res1 = await runInitCommand([], tempDir);
    assert.equal(res1.createdConfig, true);
    assert.equal(res1.createdAdapter, true);
    assert.ok(existsSync(path.join(tempDir, "justfair.config.js")));
    assert.ok(existsSync(path.join(tempDir, "justfair-adapter.mjs")));

    const adapterContent = readFileSync(path.join(tempDir, "justfair-adapter.mjs"), "utf-8");
    assert.ok(adapterContent.includes("/justfair/v1/manifest"));
    assert.ok(adapterContent.includes("/justfair/v1/evaluate"));

    // Second run: should detect existing files and refuse to overwrite
    const res2 = await runInitCommand([], tempDir);
    assert.equal(res2.createdConfig, false);
    assert.equal(res2.createdAdapter, false);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("cli init next-steps teach the public npx flow with connect first", async () => {
  const { runInitCommand } = await import("../src/cli.js");
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const path = await import("node:path");

  const tempDir = mkdtempSync(path.join(tmpdir(), "jf-init-steps-test-"));
  const lines = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => { lines.push(a.join(" ")); };
  console.error = (...a) => { lines.push(a.join(" ")); };
  try {
    await runInitCommand([], tempDir);
  } finally {
    console.log = origLog;
    console.error = origErr;
    rmSync(tempDir, { recursive: true, force: true });
  }
  const stdout = lines.join("\n");

  // Must NOT teach a bare global binary that does not exist for npx users.
  assert.ok(!stdout.includes("justfair test"), "init output must not contain bare 'justfair test'");
  // Must teach the real public command.
  assert.ok(
    stdout.includes("npx justfair@latest test --target http://localhost:3100 --open"),
    "init output must contain the public npx test command"
  );
  // Must tell the user to connect/edit the adapter before starting it.
  assert.ok(stdout.includes("justfair-adapter.mjs"), "init output must name justfair-adapter.mjs");
  assert.ok(stdout.includes("observations"), "init output must mention observations");
  assert.ok(/connect/i.test(stdout), "init output must tell the user to connect the adapter");
  // Must reference the real application values.
  assert.ok(/real app/i.test(stdout), "init output must mention the real app values");
  // Required order: connect -> start app -> start adapter -> test.
  const idxConnect = stdout.search(/connect/i);
  const idxStartApp = stdout.indexOf("Start your app");
  const idxStartAdapter = stdout.indexOf("Start the observation adapter");
  const idxTest = stdout.indexOf("Run the financial crash test");
  assert.ok(idxConnect !== -1 && idxStartApp !== -1 && idxStartAdapter !== -1 && idxTest !== -1, "all four next steps must be present");
  assert.ok(
    idxConnect < idxStartApp && idxStartApp < idxStartAdapter && idxStartAdapter < idxTest,
    "order must be connect -> start app -> start adapter -> test"
  );
});

test("startLocalReportViewer serves in-memory artifact and static files on 127.0.0.1", async () => {
  const { startLocalReportViewer } = await import("../src/cli.js");
  const sampleArtifact = {
    runId: "test-run-123",
    target: { url: "http://localhost:3100", name: "Test App" },
    summary: { passed: 1, failed: 0, unable: 0 },
    results: [{ scenarioId: "STALE_CARRIED_FORWARD_EQUITY", status: "PASS", assertions: [], replay: [] }]
  };

  const viewer = await startLocalReportViewer(sampleArtifact);
  try {
    assert.ok(viewer.url.startsWith("http://127.0.0.1:"));
    assert.ok(viewer.port > 0);

    // Test /api/v1/local-artifact
    const artRes = await fetch(`${viewer.url}/api/v1/local-artifact`);
    assert.equal(artRes.status, 200);
    const artData = await artRes.json();
    assert.equal(artData.runId, "test-run-123");
    assert.equal(artData.summary.passed, 1);

    // Test /api/v1/health
    const healthRes = await fetch(`${viewer.url}/api/v1/health`);
    assert.equal(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.equal(healthData.mode, "local-viewer");

    // Test static asset /index.html
    const indexRes = await fetch(`${viewer.url}/index.html`);
    assert.equal(indexRes.status, 200);
    const indexText = await indexRes.text();
    assert.ok(indexText.includes("JustFair"));
  } finally {
    await viewer.close();
  }
});

test("cli test --open starts local report viewer and exits cleanly", async () => {
  const h = await startFixtureTarget({ behavior: "correct" });
  try {
    const { runScenarioCommand } = await import("../src/cli.js");
    const { mkdtempSync, readFileSync, rmSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const dir = mkdtempSync(path.join(tmpdir(), "jf-open-test-"));
    try {
      const r = await runScenarioCommand(["--target", h.baseUrl, "--open"], { keepAlive: false, cwd: dir });
      assert.ok(r.artifact);
      assert.equal(r.artifact.summary.passed, 1);
      assert.ok(r.viewer);
      assert.ok(r.viewer.url.startsWith("http://127.0.0.1:"));
      // --open serves the same in-memory report that was persisted to disk.
      const disk = JSON.parse(readFileSync(path.join(dir, DEFAULT_RESULT_FILENAME), "utf-8"));
      assert.equal(disk.runId, r.artifact.runId, "--open must open the same report it saved");
      await r.viewer.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  } finally {
    await closeFixtureTarget(h);
  }
});

test("completed FAIL run persists justfair-result.json with the exact report", async () => {
  const h = await startFixtureTarget({ behavior: "naive" });
  const { mkdtempSync, rmSync, readFileSync, existsSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(path.join(tmpdir(), "jf-artifact-fail-"));
  try {
    const r = await runCLIInProcess(["test", "--target", h.baseUrl], { cwd: dir });
    assert.equal(r.code, 1);
    const file = path.join(dir, DEFAULT_RESULT_FILENAME);
    assert.ok(existsSync(file), "artifact file must exist");
    const disk = JSON.parse(readFileSync(file, "utf-8"));
    assert.equal(disk.runId, r.artifact.runId, "file must be the actual generated run");
    assert.deepEqual(disk.summary, r.artifact.summary);
    assert.equal(disk.results[0].status, "FAIL", "FAIL verdict must survive persistence");
    assert.ok(r.stdout.includes("Result saved to:"), "CLI must print the artifact line");
    assert.ok(r.stdout.includes(file), "CLI must print the exact path");
  } finally {
    await closeFixtureTarget(h);
    rmSync(dir, { recursive: true, force: true });
  }
});

test("completed PASS run persists justfair-result.json with PASS preserved", async () => {
  const h = await startFixtureTarget({ behavior: "correct" });
  const { mkdtempSync, rmSync, readFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(path.join(tmpdir(), "jf-artifact-pass-"));
  try {
    const r = await runCLIInProcess(["test", "--target", h.baseUrl], { cwd: dir });
    assert.equal(r.code, 0);
    const disk = JSON.parse(readFileSync(path.join(dir, DEFAULT_RESULT_FILENAME), "utf-8"));
    assert.equal(disk.results[0].status, "PASS");
    assert.equal(disk.summary.passed, 1);
  } finally {
    await closeFixtureTarget(h);
    rmSync(dir, { recursive: true, force: true });
  }
});

test("UNABLE result persists as UNABLE, never rewritten", async () => {
  const http = await import("node:http");
  const srv = http.createServer((req, res) => {
    if (req.url.endsWith("/manifest")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ adapterVersion: "1", name: "Flaky", capabilities: ["underlying_price_display"] }));
    } else {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "boom" }));
    }
  });
  await new Promise((resolve) => srv.listen(0, "127.0.0.1", resolve));
  const { mkdtempSync, rmSync, readFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(path.join(tmpdir(), "jf-artifact-unable-"));
  try {
    const r = await runCLIInProcess(["test", "--target", `http://127.0.0.1:${srv.address().port}`], { cwd: dir });
    assert.equal(r.code, 2);
    const disk = JSON.parse(readFileSync(path.join(dir, DEFAULT_RESULT_FILENAME), "utf-8"));
    assert.equal(disk.results[0].status, "UNABLE_TO_VERIFY");
    assert.equal(disk.summary.unable, 1);
  } finally {
    await new Promise((resolve) => srv.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});

test("repeat runs safely replace the latest artifact", async () => {
  const h = await startFixtureTarget({ behavior: "correct" });
  const { mkdtempSync, rmSync, readFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(path.join(tmpdir(), "jf-artifact-repeat-"));
  try {
    const first = await runCLIInProcess(["test", "--target", h.baseUrl], { cwd: dir });
    const second = await runCLIInProcess(["test", "--target", h.baseUrl], { cwd: dir });
    assert.notEqual(first.artifact.runId, second.artifact.runId);
    const disk = JSON.parse(readFileSync(path.join(dir, DEFAULT_RESULT_FILENAME), "utf-8"));
    assert.equal(disk.runId, second.artifact.runId, "file must hold the latest run");
  } finally {
    await closeFixtureTarget(h);
    rmSync(dir, { recursive: true, force: true });
  }
});

test("artifact write failure is reported honestly without changing the verdict", async () => {
  const h = await startFixtureTarget({ behavior: "naive" });
  try {
    const missingDir = path.join(os.tmpdir(), `jf-no-such-dir-${Date.now()}`);
    const r = await runCLIInProcess(["test", "--target", h.baseUrl], { cwd: missingDir });
    assert.equal(r.code, 1, "scenario FAIL verdict must stand despite write failure");
    assert.ok(r.stdout.includes("WARNING") && r.stdout.includes("could not save"), "CLI must report the write failure");
    assert.ok(!r.stdout.includes("Result saved to:"), "CLI must not falsely claim the artifact was saved");
  } finally {
    await closeFixtureTarget(h);
  }
});

test("artifact persistence performs no network upload", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync(new URL("../src/cli.js", import.meta.url), "utf-8");
  const start = src.indexOf("export function persistResultArtifact");
  assert.ok(start !== -1);
  const body = src.slice(start, src.indexOf("\n}\n", start) + 3);
  assert.ok(!/fetch\(|http\.request|XMLHttpRequest|upload/i.test(body), "persistence path must not touch the network");
});

