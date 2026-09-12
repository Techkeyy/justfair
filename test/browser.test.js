// JustFair Playwright Real Browser Test Suite & Visual Capture (Director Order 007.2)
import { chromium } from "playwright";
import { createServer } from "../src/server.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVIDENCE_DIR = path.resolve(__dirname, "../docs/evidence/ui");

async function runBrowserTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR PLAYWRIGHT REAL BROWSER TEST SUITE (ORDER 007.2)");
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
    // 1. Dashboard View Load, Full-Bleed Hero & Initial Screenshot
    await test("1. Initial page load renders full-bleed Hero with contrast overlay and headline", async () => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });

      const heroText = await page.textContent(".hero-headline");
      if (!heroText.includes("Before you buy the stock") || !heroText.includes("check the fill.")) {
        throw new Error(`Hero headline mismatch: ${heroText}`);
      }

      // Check hero container element
      const isHeroVisible = await page.isVisible(".full-bleed-hero");
      if (!isHeroVisible) throw new Error("Full-bleed hero container is not visible");

      // Confirm Dashboard is active and App is hidden
      const isDashboardVisible = await page.isVisible("#dashboard-view");
      const isAppVisible = await page.isVisible("#app-view");
      if (!isDashboardVisible || isAppVisible) {
        throw new Error(`View state mismatch: dashboard=${isDashboardVisible}, app=${isAppVisible}`);
      }

      // Capture 01_dashboard_hero_desktop.png (viewport only)
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "01_dashboard_hero_desktop.png") });
    });

    // 2. Dashboard Scroll Reveal & Midway Capture
    await test("2. Dashboard scroll triggers reactive reveals for value cards and steps", async () => {
      // Scroll to mid-page (Why JustFair section)
      await page.evaluate(() => window.scrollTo({ top: 600, behavior: "smooth" }));
      await page.waitForTimeout(600);

      const featureCards = await page.$$(".feature-card");
      if (featureCards.length !== 3) {
        throw new Error(`Expected 3 feature cards, found: ${featureCards.length}`);
      }

      // Capture 02_dashboard_midway_scroll.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "02_dashboard_midway_scroll.png") });

      // Scroll to bottom (API CTA section)
      await page.evaluate(() => window.scrollTo({ top: 1400, behavior: "smooth" }));
      await page.waitForTimeout(600);

      const isApiCardVisible = await page.isVisible(".api-compact-card");
      if (!isApiCardVisible) throw new Error("API card is not visible on scroll");

      // Capture 03_dashboard_lower_reveal.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "03_dashboard_lower_reveal.png") });
    });

    // 3. Navigation to App View & Vertical Stock Selector Verification
    await test("3. Navigate to App view and verify 2-column workspace with vertical stock rows and brand logos", async () => {
      await page.click("#header-launch-btn");
      await page.waitForTimeout(400);

      const isAppVisible = await page.isVisible("#app-view");
      const isDashboardVisible = await page.isVisible("#dashboard-view");
      if (!isAppVisible || isDashboardVisible) {
        throw new Error(`App navigation failed: app=${isAppVisible}, dashboard=${isDashboardVisible}`);
      }

      // Check vertical stock row cards (4 stocks)
      const stockCards = await page.$$(".stock-row-card");
      if (stockCards.length !== 4) {
        throw new Error(`Expected 4 stock cards, found: ${stockCards.length}`);
      }

      // Check brand logos existence
      const logos = await page.$$(".stock-logo-img");
      if (logos.length !== 4) {
        throw new Error(`Expected 4 brand logo images, found: ${logos.length}`);
      }

      // Capture 04_app_vertical_stock_list_desktop.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_app_vertical_stock_list_desktop.png") });
    });

    // 4. Stock Selection Interactive State
    await test("4. Interactive stock switching highlights vertical card with purple theme", async () => {
      // Click NVDAx card
      await page.click(".stock-row-card[data-symbol='NVDAx']");
      await page.waitForTimeout(200);

      const isNvdaActive = await page.evaluate(() => {
        const card = document.querySelector(".stock-row-card[data-symbol='NVDAx']");
        return card && card.classList.contains("active") && card.getAttribute("aria-checked") === "true";
      });

      if (!isNvdaActive) throw new Error("NVDAx card did not acquire active state");

      // Capture 05_app_stock_selected_state.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "05_app_stock_selected_state.png") });
    });

    // 5. Trade Check Execution & Plain-Money Metric Hierarchy
    await test("5. Execute trade check (NVDAx + USDC $500) and verify locked 3-metric hierarchy", async () => {
      await page.click(".payment-tab[data-asset='USDC']");
      await page.fill("#amount-input", "500");

      await page.click("#submit-btn");
      await page.waitForSelector("#result-state:not(.hidden)", { timeout: 15000 });

      // Metric #1: YOU'RE SPENDING
      const spendLabel = await page.textContent(".money-stat:nth-child(1) .money-label");
      const spendVal = await page.textContent("#res-spend-val");
      if (!spendLabel.includes("YOU'RE SPENDING")) throw new Error(`Metric 1 label mismatch: ${spendLabel}`);
      if (!spendVal.includes("$500.00")) throw new Error(`Metric 1 spend value mismatch: ${spendVal}`);

      // Metric #2: EXPECTED NVIDIA EXPOSURE
      const exposureLabel = await page.textContent("#res-exposure-label");
      const exposureVal = await page.textContent("#res-exposure-val");
      if (!exposureLabel.includes("EXPECTED NVIDIA EXPOSURE")) throw new Error(`Metric 2 label mismatch: ${exposureLabel}`);
      if (!exposureVal.includes("$")) throw new Error(`Metric 2 exposure value missing: ${exposureVal}`);

      // Metric #3: DIFFERENCE
      const diffLabel = await page.textContent(".money-stat.highlight .money-label");
      const diffVal = await page.textContent("#res-diff-val");
      const diffPct = await page.textContent("#res-diff-pct");
      if (!diffLabel.includes("DIFFERENCE")) throw new Error(`Metric 3 label mismatch: ${diffLabel}`);
      if (!diffVal.includes("$")) throw new Error(`Metric 3 difference value missing: ${diffVal}`);
      if (!diffPct.includes("%")) throw new Error(`Metric 3 difference percentage missing: ${diffPct}`);

      // Capture 06_app_result.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "06_app_result.png") });
    });

    // 6. Mobile Viewport: Dashboard Hero
    await test("6. Dashboard full-bleed hero renders cleanly on mobile viewport (375x812)", async () => {
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

      // Capture 07_dashboard_hero_mobile.png
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "07_dashboard_hero_mobile.png") });
      await mobileContext.close();
    });

    // 7. Mobile Viewport: App Vertical Stock List & Form
    await test("7. App vertical stock list renders cleanly on mobile viewport (375x812) with zero overflow", async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();

      await mobilePage.goto(`${BASE_URL}/#app`, { waitUntil: "networkidle" });
      await mobilePage.waitForTimeout(300);

      const isOverflowing = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      if (isOverflowing) {
        throw new Error("App workspace on mobile exhibits horizontal overflow");
      }

      // Capture 08_app_vertical_stocks_mobile.png
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "08_app_vertical_stocks_mobile.png") });
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
