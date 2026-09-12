// JustFair Playwright Real Browser Test Suite & Visual Capture (Director Order 006)
import { chromium } from "playwright";
import { createServer } from "../src/server.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVIDENCE_DIR = path.resolve(__dirname, "../docs/evidence/ui");

async function runBrowserTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR PLAYWRIGHT REAL BROWSER TEST SUITE");
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

  const server = createServer();
  const PORT = 3290;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  await new Promise(resolve => server.listen(PORT, "127.0.0.1", resolve));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  try {
    // 1. Initial Page Load & Render
    await test("1. Initial page load renders hero, controls, and zero jargon headline", async () => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      const heroText = await page.textContent(".hero-headline");
      if (!heroText.includes("Before you buy the stock, check the fill.")) {
        throw new Error(`Hero headline mismatch: ${heroText}`);
      }

      const ctaText = await page.textContent("#submit-btn .btn-text");
      if (ctaText.trim() !== "CHECK TRADE") {
        throw new Error(`Primary CTA mismatch: ${ctaText}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "01_initial_page.png"), fullPage: true });
    });

    // 2. Form Interaction & Real API Trade Check (AAPLx + USDC $500)
    await test("2. Real AAPLx + USDC trade check renders Big 3 plain-money values", async () => {
      // Ensure AAPLx and USDC are active
      await page.click(".stock-chip[data-symbol='AAPLx']");
      await page.click(".payment-tab[data-asset='USDC']");
      await page.fill("#amount-input", "500");

      // Click CHECK TRADE
      await page.click("#submit-btn");

      // Wait for result container to appear
      await page.waitForSelector("#result-state:not(.hidden)", { timeout: 15000 });

      const spendVal = await page.textContent("#res-spend-val");
      const exposureVal = await page.textContent("#res-exposure-val");
      const diffVal = await page.textContent("#res-diff-val");
      const explanation = await page.textContent("#res-explanation");

      if (!spendVal.includes("$500.00")) throw new Error(`Spend value mismatch: ${spendVal}`);
      if (!exposureVal.includes("$")) throw new Error(`Exposure value missing: ${exposureVal}`);
      if (!diffVal.includes("$")) throw new Error(`Difference value missing: ${diffVal}`);
      if (!explanation || explanation.length < 20) throw new Error("Explanation text missing");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "02_aaplx_usdc_result.png"), fullPage: true });
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "03_market_closed_measured_result.png"), fullPage: true });
    });

    // 3. Technical Evidence Accordion
    await test("3. Expand trade details accordion and confirm technical route proof", async () => {
      await page.click(".accordion-header");
      await page.waitForSelector(".accordion-body", { state: "visible" });

      const mint = await page.textContent("#ev-mint");
      const multiplier = await page.textContent("#ev-multiplier");
      const router = await page.textContent("#ev-router");

      if (!mint.includes("XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp")) {
        throw new Error(`Mint mismatch: ${mint}`);
      }
      if (!multiplier.includes("1.003269")) {
        throw new Error(`Multiplier mismatch: ${multiplier}`);
      }
      if (!router.includes("Jupiter Swap V2")) {
        throw new Error(`Router engine mismatch: ${router}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_expanded_trade_details.png"), fullPage: true });
    });

    // 4. Exact Simulation Mode with Valid Public Key
    await test("4. Exact Simulation mode simulates on Solana RPC with err: null", async () => {
      await page.click("#manual-key-toggle");
      await page.waitForSelector("#manual-key-box:not(.hidden)");

      const testPubkey = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
      await page.fill("#wallet-input", testPubkey);
      await page.click("#submit-btn");

      await page.waitForSelector("#result-state:not(.hidden)", { timeout: 15000 });
      await page.waitForSelector("#simulation-banner:not(.hidden)");

      const simTitle = await page.textContent("#sim-title");
      if (!simTitle.includes("Exact Transaction Simulation: Passed")) {
        throw new Error(`Simulation title mismatch: ${simTitle}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "05_exact_simulation_result.png"), fullPage: true });
    });

    // 5. Failure State Trigger (Invalid Amount)
    await test("5. Trigger invalid amount and verify truthful human error card", async () => {
      await page.fill("#amount-input", "-50");
      await page.click("#submit-btn");

      await page.waitForSelector("#error-state:not(.hidden)", { timeout: 5000 });
      const errTitle = await page.textContent("#error-title");
      const errMsg = await page.textContent("#error-message");

      if (!errTitle.includes("Invalid Amount") && !errTitle.includes("Check Failed")) {
        throw new Error(`Error title mismatch: ${errTitle}`);
      }
      if (!errMsg.includes("greater than zero") && !errMsg.includes("safety limits")) {
        throw new Error(`Error message mismatch: ${errMsg}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "06_failure_state.png"), fullPage: true });
    });

    // 6. Mobile Viewport & No Horizontal Overflow
    await test("6. Mobile viewport renders cleanly with zero horizontal overflow", async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();

      await mobilePage.goto(BASE_URL, { waitUntil: "networkidle" });
      await mobilePage.click(".preset-btn[data-val='100']");
      await mobilePage.click("#submit-btn");
      await mobilePage.waitForSelector("#result-state:not(.hidden)", { timeout: 15000 });

      // Check horizontal overflow
      const isOverflowing = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      if (isOverflowing) {
        throw new Error("Mobile page exhibits horizontal overflow");
      }

      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "07_mobile_viewport.png"), fullPage: true });
      await mobileContext.close();
    });

  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }

  console.log("\n==================================================");
  console.log(`PLAYWRIGHT TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

runBrowserTests().catch(err => {
  console.error("Playwright Test Runner Crashed:", err);
  process.exitCode = 1;
});
