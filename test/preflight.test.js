// JustFair Automated Test Suite
import { runPreflight } from "../src/preflight.js";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR AUTOMATED PREFLIGHT TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`TEST: ${name} ... `);
      await fn();
      console.log("PASS ✅");
      passed++;
    } catch (err) {
      console.log(`FAIL ❌\n  Error: ${err.message}`);
      failed++;
    }
  }

  // 1. USDC -> AAPLx Happy Path
  await test("USDC -> AAPLx real preflight calculation", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: 500 });
    if (res.status !== "SUCCESS") throw new Error(`Expected SUCCESS but got ${res.status}: ${res.reason}`);
    if (typeof res.input_usd_value !== "number" || res.input_usd_value !== 500) throw new Error("Input USD value calculation mismatch");
    if (typeof res.expected_stock_exposure_usd !== "number" || res.expected_stock_exposure_usd <= 0) throw new Error("Invalid stock exposure");
    if (!["FAIR", "CAUTION", "BAD_FILL"].includes(res.verdict)) throw new Error(`Invalid verdict: ${res.verdict}`);
    if (!res.benchmark.price || res.benchmark.price <= 0) throw new Error("Benchmark price missing");
  });

  // 2. SOL -> AAPLx Happy Path
  await test("SOL -> AAPLx real preflight calculation", async () => {
    const res = await runPreflight({ inputSymbol: "SOL", stockSymbol: "AAPLx", amount: 2 });
    if (res.status !== "SUCCESS") throw new Error(`Expected SUCCESS but got ${res.status}: ${res.reason}`);
    if (res.input_usd_value <= 0) throw new Error("SOL USD calculation failed");
    if (res.expected_stock_shares <= 0) throw new Error("Expected stock shares must be > 0");
  });

  // 3. USDC -> NVDAx
  await test("USDC -> NVDAx real preflight calculation", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "NVDAx", amount: 250 });
    if (res.status !== "SUCCESS") throw new Error(`Expected SUCCESS but got ${res.status}: ${res.reason}`);
    if (res.stock !== "NVDA") throw new Error(`Stock mismatch: expected NVDA, got ${res.stock}`);
  });

  // 4. USDC -> SPYx
  await test("USDC -> SPYx real preflight calculation", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "SPYx", amount: 750 });
    if (res.status !== "SUCCESS") throw new Error(`Expected SUCCESS but got ${res.status}: ${res.reason}`);
    if (res.stock !== "SPY") throw new Error(`Stock mismatch: expected SPY, got ${res.stock}`);
  });

  // 5. Unsupported stock failure test
  await test("Rejection of unsupported stock asset", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "FAKE_STOCK_TOKEN", amount: 100 });
    if (res.status !== "ERROR" || res.verdict !== "UNABLE_TO_VERIFY") {
      throw new Error(`Expected UNABLE_TO_VERIFY but got ${res.verdict}`);
    }
  });

  // 6. Unsupported payment failure test
  await test("Rejection of unsupported payment asset", async () => {
    const res = await runPreflight({ inputSymbol: "DOGE", stockSymbol: "AAPLx", amount: 100 });
    if (res.status !== "ERROR" || res.verdict !== "UNABLE_TO_VERIFY") {
      throw new Error(`Expected UNABLE_TO_VERIFY but got ${res.verdict}`);
    }
  });

  // 7. Invalid amount failure test
  await test("Rejection of zero or negative amount", async () => {
    const res = await runPreflight({ inputSymbol: "USDC", stockSymbol: "AAPLx", amount: -50 });
    if (res.status !== "ERROR" || res.verdict !== "UNABLE_TO_VERIFY") {
      throw new Error(`Expected UNABLE_TO_VERIFY but got ${res.verdict}`);
    }
  });

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
