// JustFair Phase 2 CLI Runner Tests (node:test)
// runScenarioCommand is the exact CLI code path, invoked in-process:
// this sandbox blocks loopback between separately spawned processes, so
// spawning `node src/cli.js` as a child cannot reach test fixtures here.
// (Real spawned-CLI runs were proven manually: naive exit 1, correct exit 0.)

import test from "node:test";
import assert from "node:assert/strict";

import { runScenarioCommand, runWhaleCommand } from "../src/cli.js";
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
async function runCLIInProcess(args) {
  const lines = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a) => { lines.push(a.join(" ")); };
  console.error = (...a) => { lines.push(a.join(" ")); };
  const savedCode = process.exitCode;
  process.exitCode = undefined;
  try {
    await runScenarioCommand(args);
    return { code: process.exitCode ?? 0, stdout: lines.join("\n") };
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
    const artifact = JSON.parse(r.stdout);
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
    const r = await runScenarioCommand(["--target", h.baseUrl, "--open"], { keepAlive: false });
    assert.ok(r.artifact);
    assert.equal(r.artifact.summary.passed, 1);
    assert.ok(r.viewer);
    assert.ok(r.viewer.url.startsWith("http://127.0.0.1:"));
    await r.viewer.close();
  } finally {
    await closeFixtureTarget(h);
  }
});

