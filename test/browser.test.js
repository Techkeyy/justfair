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
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    // 1. Desktop Hero Split-White Canvas & Initial View (Order 008)
    await test("1. Initial page load renders simplified Hero, new badge, no header wallet button", async () => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });

      const heroText = await page.textContent(".hero-headline");
      if (!heroText.includes("Before you buy the stock") || !heroText.includes("check the fill.")) {
        throw new Error(`Hero headline mismatch: ${heroText}`);
      }

      const subheadline = await page.textContent(".hero-subheadline");
      if (!subheadline.includes("See how much real stock exposure your money is actually buying before you make the trade.")) {
        throw new Error(`Hero subheadline mismatch: ${subheadline}`);
      }

      const badgeText = await page.textContent(".hero-badge span");
      if (!badgeText.includes("Pre-trade protection for tokenized stocks")) {
        throw new Error(`Hero badge mismatch: ${badgeText}`);
      }

      // Assert Dashboard header does NOT contain Connect Wallet button
      const walletBtnInHeader = await page.$(".site-header #wallet-toggle-btn");
      if (walletBtnInHeader !== null) {
        throw new Error("Dashboard header should not contain a prominent Connect Wallet button");
      }

      const isHeroVisible = await page.isVisible(".hero-split-white");
      if (!isHeroVisible) throw new Error("Split-white hero container is not visible");

      const isArtVisible = await page.isVisible(".hero-art-image");
      if (!isArtVisible) throw new Error("Hero artwork image is not visible");

      // Capture Screenshot 1: 01_desktop_hero_full.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "01_desktop_hero_full.png") });
    });

    // 2. Key Differentiation & Illustrative Example (Order 008)
    await test("2. Key Differentiation section & illustrative $500 example render cleanly", async () => {
      const diffTitle = await page.textContent(".diff-main-title");
      if (!diffTitle.includes("A swap can execute perfectly") || !diffTitle.includes("and still be a bad stock trade.")) {
        throw new Error(`Differentiation title mismatch: ${diffTitle}`);
      }

      // Wallet vs JustFair comparison columns
      const walletCheckTitle = await page.textContent(".wallet-check-card .comparison-title");
      const justfairCheckTitle = await page.textContent(".justfair-check-card .comparison-title");
      if (!walletCheckTitle.includes("YOUR WALLET CHECKS")) throw new Error(`Wallet title mismatch: ${walletCheckTitle}`);
      if (!justfairCheckTitle.includes("JUSTFAIR ALSO CHECKS")) throw new Error(`JustFair title mismatch: ${justfairCheckTitle}`);

      // Example Card
      const exampleBadge = await page.textContent(".example-pill");
      if (!exampleBadge.toUpperCase().includes("EXAMPLE")) throw new Error(`Example badge mismatch: ${exampleBadge}`);

      const exampleQuote = await page.textContent(".example-quote");
      if (!exampleQuote.includes("The swap can be technically healthy while the stock deal is still expensive.")) {
        throw new Error(`Example quote mismatch: ${exampleQuote}`);
      }

      // Truthfulness callout
      const truthText = await page.textContent(".truth-desc");
      if (!truthText.includes("If the underlying stock market is closed or the reference cannot be verified, JustFair says so instead of guessing.")) {
        throw new Error(`Truthfulness callout text mismatch: ${truthText}`);
      }

      // Test example CTA button opens App view
      await page.click("#example-open-app-btn");
      await page.waitForTimeout(400);
      let isAppVisible = await page.isVisible("#app-view");
      if (!isAppVisible) throw new Error("Clicking example CTA button failed to open App view");

      // Switch back to Dashboard view
      await page.click("#tab-dashboard-btn");
      await page.waitForTimeout(300);

      // Capture Screenshot 2: 02_desktop_hero_next_section.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "02_desktop_hero_next_section.png") });
    });

    // 3. Navigation from Dashboard: How It Works & API
    await test("3. Navigation from Dashboard smoothly targets sections and 5-step sequence", async () => {
      // Click 'How it Works' from Dashboard
      await page.click("#nav-how-btn");
      await page.waitForTimeout(400);
      const isHowVisible = await page.isVisible("#how-it-works");
      if (!isHowVisible) throw new Error("How It Works section not visible after clicking nav link");

      const stepCards = await page.$$(".steps-container-5 .step-card");
      if (stepCards.length !== 5) {
        throw new Error(`Expected 5 step cards in How It Works, found: ${stepCards.length}`);
      }

      // Click 'API' from Dashboard
      await page.click("#nav-api-btn");
      await page.waitForTimeout(400);
      const isApiVisible = await page.isVisible("#api-docs");
      if (!isApiVisible) throw new Error("API section not visible after clicking nav link");

      const apiTitle = await page.textContent(".api-compact-title");
      if (!apiTitle.includes("Built for users. Embeddable by wallets.")) {
        throw new Error(`API title mismatch: ${apiTitle}`);
      }

      // Return to top
      await page.click("#tab-dashboard-btn");
      await page.waitForTimeout(300);

      // Capture Screenshot 3: 03_dashboard_scroll_reveal.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "03_dashboard_scroll_reveal.png") });
    });

    // 4. Navigate to App View & Verify 12 Stock Cards & App Wallet Intact
    await test("4. Navigate to App View, verify full 12-stock catalog feed and working wallet controls", async () => {
      await page.click("#hero-open-app-btn");
      await page.waitForTimeout(500);

      const isAppVisible = await page.isVisible("#app-view");
      if (!isAppVisible) throw new Error("App view is not visible after hero button click");

      const stockCards = await page.$$(".stock-card-standalone");
      if (stockCards.length !== 12) {
        throw new Error(`Expected 12 standalone stock cards, found: ${stockCards.length}`);
      }

      // Assert App wallet controls exist inside the card
      const manualToggle = await page.isVisible("#stock-card-AAPLx .manual-key-toggle");
      if (!manualToggle) throw new Error("Manual wallet key toggle is missing in App card");

      // Capture Screenshot 4: 04_app_apple_standalone_card.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_app_apple_standalone_card.png") });
    });

    // 5. Cross-View Navigation from App View to How It Works, API, and Dashboard
    await test("5. Critical Navigation: How It Works, API, and Dashboard work seamlessly from App View", async () => {
      // Currently on App view. Click 'How it Works'
      await page.click("#nav-how-btn");
      await page.waitForTimeout(500);

      let isDashboardVisible = await page.isVisible("#dashboard-view");
      let isAppVisible = await page.isVisible("#app-view");
      if (!isDashboardVisible || isAppVisible) {
        throw new Error("Clicking 'How it Works' from App view failed to switch to Dashboard view");
      }
      const isHowVisible = await page.isVisible("#how-it-works");
      if (!isHowVisible) throw new Error("How It Works section not visible after navigating from App view");

      // Switch back to App view
      await page.click("#tab-app-btn");
      await page.waitForTimeout(400);

      // Click 'API' from App view
      await page.click("#nav-api-btn");
      await page.waitForTimeout(500);

      isDashboardVisible = await page.isVisible("#dashboard-view");
      if (!isDashboardVisible) {
        throw new Error("Clicking 'API' from App view failed to switch to Dashboard view");
      }
      const isApiVisible = await page.isVisible("#api-docs");
      if (!isApiVisible) throw new Error("API section not visible after navigating from App view");

      // Return to App view for search tests
      await page.click("#tab-app-btn");
      await page.waitForTimeout(400);
    });

    // 6. Search Filtering: AAPL, AAPLx, Apple, NVDA, and Empty State
    await test("6. Search filtering by ticker, canonical, name, and empty state handling", async () => {
      const searchInput = await page.$("#stock-search-input");

      // Search 1: "AAPL" (canonical)
      await searchInput.fill("AAPL");
      await page.waitForTimeout(200);
      let visibleCards = await page.$$(".stock-card-standalone:not(.search-hidden)");
      if (visibleCards.length !== 1 || (await visibleCards[0].getAttribute("id")) !== "stock-card-AAPLx") {
        throw new Error(`Search 'AAPL' failed: expected 1 card (AAPLx), found ${visibleCards.length}`);
      }

      // Search 2: "AAPLx" (xStock ticker)
      await searchInput.fill("AAPLx");
      await page.waitForTimeout(200);
      visibleCards = await page.$$(".stock-card-standalone:not(.search-hidden)");
      if (visibleCards.length !== 1 || (await visibleCards[0].getAttribute("id")) !== "stock-card-AAPLx") {
        throw new Error(`Search 'AAPLx' failed: expected 1 card (AAPLx), found ${visibleCards.length}`);
      }

      // Search 3: "Apple" (company name)
      await searchInput.fill("Apple");
      await page.waitForTimeout(200);
      visibleCards = await page.$$(".stock-card-standalone:not(.search-hidden)");
      if (visibleCards.length !== 1 || (await visibleCards[0].getAttribute("id")) !== "stock-card-AAPLx") {
        throw new Error(`Search 'Apple' failed: expected 1 card (AAPLx), found ${visibleCards.length}`);
      }

      // Search 4: "NVDA" (NVIDIA)
      await searchInput.fill("NVDA");
      await page.waitForTimeout(200);
      visibleCards = await page.$$(".stock-card-standalone:not(.search-hidden)");
      if (visibleCards.length !== 1 || (await visibleCards[0].getAttribute("id")) !== "stock-card-NVDAx") {
        throw new Error(`Search 'NVDA' failed: expected 1 card (NVDAx), found ${visibleCards.length}`);
      }

      // Search 5: Empty match state "XYZ999Unknown"
      await searchInput.fill("XYZ999Unknown");
      await page.waitForTimeout(200);
      visibleCards = await page.$$(".stock-card-standalone:not(.search-hidden)");
      if (visibleCards.length !== 0) {
        throw new Error(`Expected 0 visible cards for non-existent stock, found: ${visibleCards.length}`);
      }
      const isEmptyStateVisible = await page.isVisible("#stock-search-empty-state");
      if (!isEmptyStateVisible) throw new Error("Search empty state is not visible when 0 stocks match");
      const emptyText = await page.textContent("#stock-search-empty-state .empty-title");
      if (!emptyText.includes("No supported stocks match your search.")) {
        throw new Error(`Empty state text mismatch: ${emptyText}`);
      }

      // Click "Clear search" on empty state
      await page.click("#empty-clear-search-btn");
      await page.waitForTimeout(200);

      const restoredCards = await page.$$(".stock-card-standalone:not(.search-hidden)");
      if (restoredCards.length !== 12) {
        throw new Error(`Expected 12 restored cards after clearing empty search, found: ${restoredCards.length}`);
      }

      // Capture Screenshot 5: 05_app_midway_stock_scroll.png
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "05_app_midway_stock_scroll.png") });
    });

    // 7. Apple Card Expanded State & Trade Form
    await test("7. Verify Apple (AAPLx) card expanded trade interface and presets", async () => {
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

    // 8. Accordion Switching: Open NVIDIA, Collapse Apple
    await test("8. Accordion behavior: expanding NVIDIA card collapses Apple card", async () => {
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

    // 9. Execute Trade Check & Assert 3-Metric Plain-Money Hierarchy
    await test("9. Switch back to Apple, execute trade check ($500 USDC) and verify locked 3-metric hierarchy", async () => {
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

      // Metric #2: EXPECTED APPLE EXPOSURE or LAST KNOWN REFERENCE VALUE (Weekend Truthfulness)
      const exposureLabel = await page.textContent("#stock-card-AAPLx .res-exposure-label");
      const exposureVal = await page.textContent("#stock-card-AAPLx .res-exposure-val");
      if (!exposureLabel.includes("EXPECTED APPLE EXPOSURE") && !exposureLabel.includes("LAST KNOWN REFERENCE VALUE")) {
        throw new Error(`Metric 2 label mismatch: ${exposureLabel}`);
      }
      if (!exposureVal.includes("$")) throw new Error(`Metric 2 exposure value missing: ${exposureVal}`);

      // Metric #3: DIFFERENCE or REFERENCE DIFFERENCE
      const diffLabel = await page.textContent("#stock-card-AAPLx .money-stat.highlight .money-label");
      const diffVal = await page.textContent("#stock-card-AAPLx .res-diff-val");
      const diffPct = await page.textContent("#stock-card-AAPLx .res-diff-pct");
      if (!diffLabel.includes("DIFFERENCE")) throw new Error(`Metric 3 label mismatch: ${diffLabel}`);
      if (!diffVal.includes("$")) throw new Error(`Metric 3 difference value missing: ${diffVal}`);
      if (!diffPct.includes("%")) throw new Error(`Metric 3 difference percentage missing: ${diffPct}`);

      // Better Option / Route Discovery Card Verified
      const isBetterOptionVisible = await page.isVisible("#stock-card-AAPLx .better-option-card");
      if (!isBetterOptionVisible) throw new Error("Better Option / Route discovery card is not visible in result container");

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

    // 12. Jupiter Deep-Link Handoff Regression Matrix (Order 009.4)
    await test("12. Live Jupiter CTA deep-link href correctly maps buy/sell query parameters without state leakage", async () => {
      await page.goto(`${BASE_URL}/#app`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);

      // 1. Check AAPLx with USDC
      const aaplCard = await page.$("#stock-card-AAPLx");
      
      // Select USDC tab
      await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
      await page.click("#stock-card-AAPLx .submit-trade-btn");
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 15000 });

      let jupLink = await aaplCard.$eval(".jupiter-exit-link", a => a.href);
      let linkText = await aaplCard.$eval(".jupiter-exit-link", a => a.textContent.trim());
      let disclaimer = await aaplCard.$eval(".jupiter-disclaimer", s => s.textContent.trim());

      if (!jupLink.includes("buy=XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp") || !jupLink.includes("sell=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")) {
        throw new Error(`USDC -> AAPLx Jupiter link incorrect: ${jupLink}`);
      }
      if (!linkText.includes("GET A FRESH JUPITER QUOTE")) {
        throw new Error(`Jupiter CTA text mismatch: ${linkText}`);
      }
      if (!disclaimer.includes("Jupiter will generate a fresh quote when opened")) {
        throw new Error(`Jupiter disclaimer mismatch: ${disclaimer}`);
      }

      // 2. Switch to SOL on AAPLx
      await page.click("#stock-card-AAPLx .payment-tab[data-asset='SOL']");
      await page.click("#stock-card-AAPLx .submit-trade-btn");
      await page.waitForTimeout(2500);
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 15000 });

      jupLink = await aaplCard.$eval(".jupiter-exit-link", a => a.href);
      if (!jupLink.includes("buy=XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp") || !jupLink.includes("sell=So11111111111111111111111111111111111111112")) {
        throw new Error(`SOL -> AAPLx Jupiter link incorrect: ${jupLink}`);
      }

      // 3. Switch to NVDAx with SOL
      await page.click("#stock-card-NVDAx .stock-card-header");
      await page.waitForTimeout(400);
      const nvdaCard = await page.$("#stock-card-NVDAx");
      await page.click("#stock-card-NVDAx .payment-tab[data-asset='SOL']");
      await page.click("#stock-card-NVDAx .submit-trade-btn");
      await page.waitForSelector("#stock-card-NVDAx .inline-result-container:not(.hidden)", { timeout: 15000 });

      jupLink = await nvdaCard.$eval(".jupiter-exit-link", a => a.href);
      if (!jupLink.includes("buy=Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh") || !jupLink.includes("sell=So11111111111111111111111111111111111111112")) {
        throw new Error(`SOL -> NVDAx Jupiter link incorrect: ${jupLink}`);
      }

      // 4. Switch to USDC on NVDAx
      await page.click("#stock-card-NVDAx .payment-tab[data-asset='USDC']");
      await page.click("#stock-card-NVDAx .submit-trade-btn");
      await page.waitForTimeout(2500);
      await page.waitForSelector("#stock-card-NVDAx .inline-result-container:not(.hidden)", { timeout: 15000 });

      jupLink = await nvdaCard.$eval(".jupiter-exit-link", a => a.href);
      if (!jupLink.includes("buy=Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh") || !jupLink.includes("sell=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")) {
        throw new Error(`USDC -> NVDAx Jupiter link incorrect: ${jupLink}`);
      }
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
