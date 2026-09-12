// JustFair Playwright Real Browser Test Suite & Visual Capture (Director Order 007)
import { chromium } from "playwright";
import { createServer } from "../src/server.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVIDENCE_DIR = path.resolve(__dirname, "../docs/evidence/ui");

async function runBrowserTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR PLAYWRIGHT REAL BROWSER TEST SUITE (ORDER 007)");
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
    // 1. Dashboard View Load & Structure
    await test("1. Initial page load renders Dashboard view, hero, value cards, steps, and API card", async () => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });

      const heroText = await page.textContent(".hero-headline");
      if (!heroText.includes("Before you buy the stock, check the fill.")) {
        throw new Error(`Hero headline mismatch: ${heroText}`);
      }

      // Confirm Dashboard is active and App is hidden
      const isDashboardVisible = await page.isVisible("#dashboard-view");
      const isAppVisible = await page.isVisible("#app-view");
      if (!isDashboardVisible || isAppVisible) {
        throw new Error(`View state mismatch: dashboard=${isDashboardVisible}, app=${isAppVisible}`);
      }

      // Confirm Why JustFair (3 cards) & Steps (4 cards)
      const featureCards = await page.$$(".feature-card");
      if (featureCards.length !== 3) {
        throw new Error(`Expected 3 feature cards, found: ${featureCards.length}`);
      }

      const stepCards = await page.$$(".step-card");
      if (stepCards.length !== 4) {
        throw new Error(`Expected 4 step cards, found: ${stepCards.length}`);
      }

      // Confirm Zero Emojis on Dashboard
      const dashboardText = await page.textContent("#dashboard-view");
      if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(dashboardText)) {
        throw new Error("Dashboard view contains raw emoji characters instead of clean SVGs");
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "01_dashboard_desktop.png"), fullPage: true });
    });

    // 2. Navigation to App View
    await test("2. Navigate to App view via Hero CTA button", async () => {
      await page.click("#hero-open-app-btn");
      await page.waitForTimeout(300);

      const isAppVisible = await page.isVisible("#app-view");
      const isDashboardVisible = await page.isVisible("#dashboard-view");
      if (!isAppVisible || isDashboardVisible) {
        throw new Error(`App navigation failed: app=${isAppVisible}, dashboard=${isDashboardVisible}`);
      }

      const safetyBadge = await page.textContent(".safety-badge");
      if (!safetyBadge.includes("PREVIEW ONLY · NO FUNDS MOVED")) {
        throw new Error(`Safety badge copy mismatch: ${safetyBadge}`);
      }

      // Check for zero-risk prohibition
      const pageContent = await page.content();
      if (/zero-risk|zero\s+risk|risk-free/i.test(pageContent)) {
        throw new Error("App contains prohibited 'zero risk' claim");
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "02_app_desktop.png"), fullPage: true });
    });

    // 3. Trade Check Execution & Plain-Money Metric Hierarchy
    await test("3. Execute trade check (AAPLx + USDC $500) and verify locked 3-metric hierarchy", async () => {
      await page.click(".stock-chip[data-symbol='AAPLx']");
      await page.click(".payment-tab[data-asset='USDC']");
      await page.fill("#amount-input", "500");

      await page.click("#submit-btn");
      await page.waitForSelector("#result-state:not(.hidden)", { timeout: 15000 });

      // Metric #1: YOU'RE SPENDING
      const spendLabel = await page.textContent(".money-stat:nth-child(1) .money-label");
      const spendVal = await page.textContent("#res-spend-val");
      const spendSub = await page.textContent("#res-spend-sub");
      if (!spendLabel.includes("YOU'RE SPENDING")) throw new Error(`Metric 1 label mismatch: ${spendLabel}`);
      if (!spendVal.includes("$500.00")) throw new Error(`Metric 1 spend value mismatch: ${spendVal}`);
      if (!spendSub.includes("USDC")) throw new Error(`Metric 1 subtext mismatch: ${spendSub}`);

      // Metric #2: EXPECTED APPLE EXPOSURE
      const exposureLabel = await page.textContent("#res-exposure-label");
      const exposureVal = await page.textContent("#res-exposure-val");
      const exposureSub = await page.textContent("#res-exposure-sub");
      if (!exposureLabel.includes("EXPECTED APPLE EXPOSURE")) throw new Error(`Metric 2 label mismatch: ${exposureLabel}`);
      if (!exposureVal.includes("$")) throw new Error(`Metric 2 exposure value missing: ${exposureVal}`);
      if (!exposureSub.includes("AAPL @ $")) throw new Error(`Metric 2 secondary shares mismatch: ${exposureSub}`);

      // Metric #3: DIFFERENCE
      const diffLabel = await page.textContent(".money-stat.highlight .money-label");
      const diffVal = await page.textContent("#res-diff-val");
      const diffPct = await page.textContent("#res-diff-pct");
      if (!diffLabel.includes("DIFFERENCE")) throw new Error(`Metric 3 label mismatch: ${diffLabel}`);
      if (!diffVal.includes("$")) throw new Error(`Metric 3 difference value missing: ${diffVal}`);
      if (!diffPct.includes("%")) throw new Error(`Metric 3 difference percentage missing: ${diffPct}`);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "03_app_result.png"), fullPage: true });
    });

    // 4. Market Closed / Unable to Verify Verdict State
    await test("4. Verdict Banner correctly displays CAN'T VERIFY RIGHT NOW or MEASURED with clean SVG icon", async () => {
      const verdictTitle = await page.textContent("#verdict-title");
      if (!verdictTitle.includes("CAN'T VERIFY RIGHT NOW") && !verdictTitle.includes("MEASURED")) {
        throw new Error(`Unexpected verdict title: ${verdictTitle}`);
      }

      const verdictIconHtml = await page.innerHTML("#verdict-icon");
      if (!verdictIconHtml.includes("<svg")) {
        throw new Error("Verdict icon is not an inline SVG");
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_app_unable_to_verify.png"), fullPage: true });
    });

    // 5. Exact Simulation Mode with Non-Broadcast Solana RPC
    await test("5. Exact Simulation mode simulates on Solana RPC with err: null", async () => {
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

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "05_app_simulation.png"), fullPage: true });
    });

    // 6. Mobile Viewport: Dashboard
    await test("6. Dashboard renders cleanly on mobile viewport (375x812) with zero overflow", async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();

      await mobilePage.goto(`${BASE_URL}/#dashboard`, { waitUntil: "networkidle" });
      await mobilePage.waitForTimeout(300);

      const isOverflowing = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      if (isOverflowing) {
        throw new Error("Dashboard on mobile exhibits horizontal overflow");
      }

      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "06_dashboard_mobile.png"), fullPage: true });
      await mobileContext.close();
    });

    // 7. Mobile Viewport: App
    await test("7. App workspace renders cleanly on mobile viewport (375x812) with zero overflow", async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();

      await mobilePage.goto(`${BASE_URL}/#app`, { waitUntil: "networkidle" });
      await mobilePage.click(".preset-btn[data-val='100']");
      await mobilePage.click("#submit-btn");
      await mobilePage.waitForSelector("#result-state:not(.hidden)", { timeout: 15000 });

      const isOverflowing = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      if (isOverflowing) {
        throw new Error("App workspace on mobile exhibits horizontal overflow");
      }

      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "07_app_mobile.png"), fullPage: true });
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
