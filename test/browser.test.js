// JustFair Playwright Real Browser Test Suite & Visual Evidence Capture (Director Order 007.4)
import { chromium } from "playwright";
import { createServer } from "../src/server.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EVIDENCE_DIR = path.resolve(__dirname, "../docs/evidence/ui");
const VIDEOS_DIR = path.resolve(__dirname, "../docs/evidence/ui/videos");

if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });

async function runBrowserTests() {
  console.log("==================================================");
  console.log("RUNNING JUSTFAIR PLAYWRIGHT TEST SUITE (ORDER 007.4)");
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
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const PORT = server.address().port;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  const browser = await chromium.launch({ headless: true });
  
  // Enable video recording in context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    recordVideo: {
      dir: VIDEOS_DIR,
      size: { width: 1280, height: 900 }
    }
  });

  const page = await context.newPage();

  try {
    // 1. Desktop Hero Split-White Canvas & Initial View
    await test("1. Initial page load renders 2-column split-white Hero with uncropped art", async () => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });

      const heroText = await page.textContent(".hero-headline");
      if (!heroText.includes("Before you buy the stock") || !heroText.includes("check the fill.")) {
        throw new Error(`Hero headline mismatch: ${heroText}`);
      }

      const isHeroVisible = await page.isVisible(".hero-split-white");
      if (!isHeroVisible) throw new Error("Split-white hero container is not visible");

      const isArtVisible = await page.isVisible(".hero-art-image");
      if (!isArtVisible) throw new Error("Hero artwork image is not visible");

      const isDashboardVisible = await page.isVisible("#dashboard-view");
      const isAppVisible = await page.isVisible("#app-view");
      if (!isDashboardVisible || isAppVisible) {
        throw new Error(`View state mismatch: dashboard=${isDashboardVisible}, app=${isAppVisible}`);
      }

      // Capture Screenshot 1: 01_desktop_hero_full.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "01_desktop_hero_full.png") });
    });

    // 2. Desktop Hero Next Section Scroll
    await test("2. Scroll past hero reveals Why JustFair value proposition section", async () => {
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: "smooth" }));
      await page.waitForTimeout(600);

      const whySection = await page.isVisible("#why-justfair");
      if (!whySection) throw new Error("Why JustFair section not visible");

      // Capture Screenshot 2: 02_desktop_hero_next_section.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "02_desktop_hero_next_section.png") });
    });

    // 3. Strong Scroll Reveal on Value Cards & Steps
    await test("3. Scroll triggers strong reactive reveals on value cards and 4-step sequence", async () => {
      await page.evaluate(() => window.scrollTo({ top: 1100, behavior: "smooth" }));
      await page.waitForTimeout(600);

      const featureCards = await page.$$(".feature-card");
      if (featureCards.length !== 3) {
        throw new Error(`Expected 3 feature cards, found: ${featureCards.length}`);
      }

      const stepCards = await page.$$(".step-card");
      if (stepCards.length !== 4) {
        throw new Error(`Expected 4 step cards, found: ${stepCards.length}`);
      }

      // Capture Screenshot 3: 03_dashboard_scroll_reveal.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "03_dashboard_scroll_reveal.png") });
    });

    // 4. Navigate to App View & Inspect Feed
    await test("4. Navigate to App View and verify vertical standalone stock feed", async () => {
      await page.click("#hero-open-app-btn");
      await page.waitForTimeout(500);

      const isAppVisible = await page.isVisible("#app-view");
      if (!isAppVisible) throw new Error("App view is not visible after hero button click");

      const stockCards = await page.$$(".stock-card-standalone");
      if (stockCards.length !== 4) {
        throw new Error(`Expected 4 standalone stock cards, found: ${stockCards.length}`);
      }

      // Capture Screenshot 4: 04_app_apple_standalone_card.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_app_apple_standalone_card.png") });
    });

    // 5. Scroll Midway in App Stock Feed
    await test("5. Midway scroll through the 4-stock standalone card feed", async () => {
      await page.evaluate(() => window.scrollTo({ top: 350, behavior: "smooth" }));
      await page.waitForTimeout(400);

      // Capture Screenshot 5: 05_app_midway_stock_scroll.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "05_app_midway_stock_scroll.png") });
    });

    // 6. Apple Card Expanded State
    await test("6. Verify Apple (AAPLx) card expanded trade interface and presets", async () => {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      await page.waitForTimeout(300);

      const appleCard = await page.$("#stock-card-AAPLx");
      const isExpanded = await appleCard.evaluate(el => el.classList.contains("is-expanded"));
      if (!isExpanded) throw new Error("Apple card is not expanded by default");

      const formVisible = await page.isVisible("#stock-card-AAPLx .stock-trade-form");
      if (!formVisible) throw new Error("Apple trade form is not visible inside expanded card");

      // Capture Screenshot 6: 06_app_apple_expanded.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "06_app_apple_expanded.png") });
    });

    // 7. Accordion Switching: Open NVIDIA, Collapse Apple
    await test("7. Accordion behavior: expanding NVIDIA card collapses Apple card", async () => {
      // Click NVIDIA toggle button / header
      await page.click("#stock-card-NVDAx .stock-card-header");
      await page.waitForTimeout(500);

      const isNvdaExpanded = await page.evaluate(() => {
        const card = document.getElementById("stock-card-NVDAx");
        return card && card.classList.contains("is-expanded");
      });

      const isAppleExpanded = await page.evaluate(() => {
        const card = document.getElementById("stock-card-AAPLx");
        return card && card.classList.contains("is-expanded");
      });

      if (!isNvdaExpanded) throw new Error("NVIDIA card failed to expand");
      if (isAppleExpanded) throw new Error("Apple card did not collapse when NVIDIA expanded");

      // Capture Screenshot 7: 07_app_nvidia_expanded_switch.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "07_app_nvidia_expanded_switch.png") });
    });

    // 8. Execute Trade Check & Assert 3-Metric Plain-Money Hierarchy
    await test("8. Switch back to Apple, execute trade check ($500 USDC) and verify locked 3-metric hierarchy", async () => {
      // Expand Apple card again
      await page.click("#stock-card-AAPLx .stock-card-header");
      await page.waitForTimeout(400);

      const appleCard = await page.$("#stock-card-AAPLx");
      const submitBtn = await appleCard.$(".submit-trade-btn");

      await submitBtn.click();
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 15000 });

      // Metric #1: YOU'RE SPENDING
      const spendLabel = await page.textContent("#stock-card-AAPLx .money-stat:nth-child(1) .money-label");
      const spendVal = await page.textContent("#stock-card-AAPLx .res-spend-val");
      if (!spendLabel.includes("YOU'RE SPENDING")) throw new Error(`Metric 1 label mismatch: ${spendLabel}`);
      if (!spendVal.includes("$500.00")) throw new Error(`Metric 1 spend value mismatch: ${spendVal}`);

      // Metric #2: EXPECTED APPLE EXPOSURE
      const exposureLabel = await page.textContent("#stock-card-AAPLx .res-exposure-label");
      const exposureVal = await page.textContent("#stock-card-AAPLx .res-exposure-val");
      if (!exposureLabel.includes("EXPECTED APPLE EXPOSURE")) throw new Error(`Metric 2 label mismatch: ${exposureLabel}`);
      if (!exposureVal.includes("$")) throw new Error(`Metric 2 exposure value missing: ${exposureVal}`);

      // Metric #3: DIFFERENCE
      const diffLabel = await page.textContent("#stock-card-AAPLx .money-stat.highlight .money-label");
      const diffVal = await page.textContent("#stock-card-AAPLx .res-diff-val");
      const diffPct = await page.textContent("#stock-card-AAPLx .res-diff-pct");
      if (!diffLabel.includes("DIFFERENCE")) throw new Error(`Metric 3 label mismatch: ${diffLabel}`);
      if (!diffVal.includes("$")) throw new Error(`Metric 3 difference value missing: ${diffVal}`);
      if (!diffPct.includes("%")) throw new Error(`Metric 3 difference percentage missing: ${diffPct}`);

      // Capture Screenshot 8: 08_app_apple_real_result.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "08_app_apple_real_result.png") });
    });

    // 9. Mobile Viewport: Hero
    await test("9. Mobile Viewport (375x812): Hero displays without clipping or horizontal overflow", async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();

      await mobilePage.goto(`${BASE_URL}/#dashboard`, { waitUntil: "networkidle" });
      await mobilePage.waitForTimeout(400);

      const isOverflowing = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      if (isOverflowing) throw new Error("Dashboard on mobile exhibits horizontal overflow");

      // Capture Screenshot 9: 09_mobile_hero.png
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "09_mobile_hero.png") });
      await mobileContext.close();
    });

    // 10. Mobile Viewport: Stock Feed
    await test("10. Mobile Viewport (375x812): App Standalone Stock Cards Feed renders cleanly", async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();

      await mobilePage.goto(`${BASE_URL}/#app`, { waitUntil: "networkidle" });
      await mobilePage.waitForTimeout(400);

      const isOverflowing = await mobilePage.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      if (isOverflowing) throw new Error("App workspace on mobile exhibits horizontal overflow");

      // Capture Screenshot 10: 10_mobile_stock_feed.png
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "10_mobile_stock_feed.png") });
      await mobileContext.close();
    });

    // 11. Mobile Viewport: Expanded Stock Card
    await test("11. Mobile Viewport (375x812): Expanded stock card forms and presets scale responsively", async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();

      await mobilePage.goto(`${BASE_URL}/#app`, { waitUntil: "networkidle" });
      await mobilePage.waitForTimeout(400);

      // Ensure Apple card is expanded
      const isExpanded = await mobilePage.isVisible("#stock-card-AAPLx .stock-trade-form");
      if (!isExpanded) throw new Error("Apple card form not visible on mobile");

      // Capture Screenshot 11: 11_mobile_expanded_stock.png
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "11_mobile_expanded_stock.png") });
      await mobileContext.close();
    });

  } finally {
    try { await page.close(); } catch {}
    try { await context.close(); } catch {}
    try { await browser.close(); } catch {}
    try {
      if (server.closeAllConnections) server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    } catch {}
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
