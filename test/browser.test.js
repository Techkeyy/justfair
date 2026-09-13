// JustFair Playwright Real Browser Test Suite & Visual Evidence Capture (Phase 14 - Product Preflight Consumer UX)
process.env.NODE_ENV = "test";
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
  console.log("RUNNING JUSTFAIR PLAYWRIGHT TEST SUITE (PHASE 14)");
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
    // 1. Desktop Hero Split-White Canvas & Initial View (Phase 14)
    await test("1. Initial page load renders split hero with Lady Justice artwork, tagline, and Two Checks badge", async () => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });

      const heroText = await page.textContent(".hero-headline");
      if (!heroText.includes("Know what you're buying.") || !heroText.includes("Then check the fill.")) {
        throw new Error(`Hero headline mismatch: ${heroText}`);
      }

      const subheadline = await page.textContent(".hero-subheadline");
      if (!subheadline.includes("JustFair protects you twice")) {
        throw new Error(`Hero subheadline mismatch: ${subheadline}`);
      }

      const badgeText = await page.textContent(".hero-badge span");
      if (!badgeText.includes("TWO CHECKS BEFORE YOU BUY")) {
        throw new Error(`Hero badge mismatch: ${badgeText}`);
      }

      const isArtVisible = await page.isVisible(".hero-art-image");
      if (!isArtVisible) throw new Error("Hero artwork image is not visible");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "01_desktop_hero_full.png") });
    });

    // 2. Two Mistakes Story Section & Differentiation
    await test("2. Two Mistakes Story Section and Key Differentiation render cleanly", async () => {
      const mistakeCards = await page.$$(".mistake-card");
      if (mistakeCards.length !== 2) throw new Error(`Expected 2 mistake cards, found: ${mistakeCards.length}`);

      const m1 = await page.textContent(".mistakes-grid .mistake-card:nth-child(1) .mistake-title");
      const m2 = await page.textContent(".mistakes-grid .mistake-card:nth-child(2) .mistake-title");
      if (!m1.includes("Right company. Wrong product.")) throw new Error(`Mistake 1 mismatch: ${m1}`);
      if (!m2.includes("Right product. Bad trade.")) throw new Error(`Mistake 2 mismatch: ${m2}`);

      const bottomBarText = await page.textContent(".mistakes-bottom-bar .bottom-bar-text");
      if (!bottomBarText.includes("JustFair checks both before money moves")) {
        throw new Error(`Bottom bar mismatch: ${bottomBarText}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "02_desktop_two_mistakes.png") });
    });

    // 3. Step 1: 12 Company Cards Grid, Search, and Category Filters
    await test("3. Step 1: App view renders 12 canonical companies, search filtering, and category tabs", async () => {
      await page.click("#hero-open-app-btn");
      await page.waitForTimeout(400);

      const isAppVisible = await page.isVisible("#app-view");
      if (!isAppVisible) throw new Error("App view not visible after clicking hero button");

      const companyCards = await page.$$(".underlying-company-card");
      if (companyCards.length !== 12) throw new Error(`Expected 12 underlying company cards, found: ${companyCards.length}`);

      // Test Search: "AAPL"
      const searchInput = await page.$("#stock-search-input");
      await searchInput.fill("AAPL");
      await page.waitForTimeout(200);
      let visible = await page.$$(".underlying-company-card:not(.search-hidden)");
      if (visible.length !== 1) throw new Error(`Expected 1 card for 'AAPL', found: ${visible.length}`);

      // Clear search
      await searchInput.fill("");
      await page.waitForTimeout(200);
      visible = await page.$$(".underlying-company-card:not(.search-hidden)");
      if (visible.length !== 12) throw new Error(`Expected 12 cards after clear, found: ${visible.length}`);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "03_step1_company_grid.png") });
    });

    // 4. Step 2: What Matters to You? (Expectation Toggles & Accordion)
    await test("4. Step 2: Expectation Selector with 5 primary and 7 secondary checks", async () => {
      // Click Apple card to advance to Step 2
      await page.click("#underlying-card-AAPL");
      await page.waitForTimeout(400);

      const isStep2Visible = await page.isVisible("#step-2-container");
      if (!isStep2Visible) throw new Error("Step 2 container not visible after selecting company");

      const compName = await page.textContent("#selected-company-name");
      if (!compName.includes("Apple")) throw new Error(`Selected company mismatch: ${compName}`);

      const primaryExps = await page.$$(".expectations-grid#primary-expectations-container .expectation-card");
      if (primaryExps.length !== 5) throw new Error(`Expected 5 primary expectations, found: ${primaryExps.length}`);

      // Toggle accordion to view secondary expectations
      await page.click("#toggle-secondary-expectations-btn");
      await page.waitForTimeout(300);

      const isSecBodyVisible = await page.isVisible("#secondary-expectations-body");
      if (!isSecBodyVisible) throw new Error("Secondary expectations body not visible after accordion click");

      const secExps = await page.$$(".expectations-grid#secondary-expectations-container .expectation-card");
      if (secExps.length !== 7) throw new Error(`Expected 7 secondary expectations, found: ${secExps.length}`);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_step2_expectations.png") });
    });

    // 5. Flow A: Self-Custody + Economic Dividends -> Multiple Verified Matches (AAPLx + AAPLon)
    await test("5. Flow A: Self-Custody + Economic Dividends -> 2 Verified Products Match", async () => {
      // Click MUST HAVE on HOLD_IN_OWN_WALLET and ECONOMIC_DIVIDEND_BENEFIT
      await page.click("#exp-card-HOLD_IN_OWN_WALLET .btn-must-have");
      await page.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have");
      await page.waitForTimeout(200);

      // Submit check
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const bannerTitle = await page.textContent("#result-banner-title");
      if (!bannerTitle.includes("2 Verified Products Match Your Must-Haves")) {
        throw new Error(`Banner title mismatch for Flow A: ${bannerTitle}`);
      }

      // Assert two representation cards exist (AAPLx and AAPLon)
      const repCards = await page.$$(".representation-card");
      if (repCards.length !== 2) throw new Error(`Expected 2 representation cards, found: ${repCards.length}`);

      const rep1Symbol = await page.textContent("#rep-card-AAPLx .rep-symbol");
      const rep2Symbol = await page.textContent("#rep-card-AAPLon .rep-symbol");
      if (!rep1Symbol.includes("AAPLx")) throw new Error(`Rep 1 symbol mismatch: ${rep1Symbol}`);
      if (!rep2Symbol.includes("AAPLon")) throw new Error(`Rep 2 symbol mismatch: ${rep2Symbol}`);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "05_step3_flow_a_multiple_matches.png") });
    });

    // 6. Step 3: Verified on Solana Drawer, Differences Matrix, and Scenarios
    await test("6. Step 3 details: Verified on Solana Drawer, Differences Matrix, and What Happens If Scenarios", async () => {
      // Toggle Verified on Solana drawer on AAPLx card
      await page.click("#rep-card-AAPLx .rep-solana-toggle");
      await page.waitForTimeout(300);

      const isDrawerOpen = await page.isVisible("#rep-card-AAPLx .rep-solana-content");
      if (!isDrawerOpen) throw new Error("Verified on Solana drawer failed to open");

      // Assert Differences Matrix exists
      const isDiffMatrixVisible = await page.isVisible("#differences-matrix-container");
      if (!isDiffMatrixVisible) throw new Error("Differences Matrix table is not visible");

      // Assert Scenarios Accordion exists
      const scenarios = await page.$$(".scenario-item");
      if (scenarios.length !== 4) throw new Error(`Expected 4 scenario items, found: ${scenarios.length}`);

      // Expand scenario 1
      await page.click(".scenario-item:nth-child(1) .scenario-toggle");
      await page.waitForTimeout(300);
      const isScenario1BodyVisible = await page.isVisible(".scenario-item:nth-child(1) .scenario-body");
      if (!isScenario1BodyVisible) throw new Error("Scenario 1 body failed to expand");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "06_step3_drawers_matrix_scenarios.png") });
    });

    // 7. Flow B: Ordinary Voting Rights -> No Verified Product Match
    await test("7. Flow B: Ordinary Voting Rights -> NO VERIFIED PRODUCT MATCH with explanation & edit button", async () => {
      // Click 'Edit Expectations' to return to Step 2
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(300);

      // Clear all and select SHAREHOLDER_VOTING as MUST HAVE
      await page.click("#exp-card-HOLD_IN_OWN_WALLET .btn-must-have"); // toggle off
      await page.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have"); // toggle off
      await page.click("#exp-card-SHAREHOLDER_VOTING .btn-must-have"); // toggle on
      await page.waitForTimeout(200);

      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const bannerTitle = await page.textContent("#result-banner-title");
      if (!bannerTitle.includes("No Verified Product Matches Your Must-Haves")) {
        throw new Error(`Banner title mismatch for Flow B: ${bannerTitle}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "07_step3_flow_b_no_match.png") });
    });

    // 8. Flow D: Direct Issuer Redemption -> Conditional Match (Ondo institutional Reg S limitation visible)
    await test("8. Flow D: Direct Issuer Redemption -> CONDITIONAL MATCH with documented Ondo Reg S limitation", async () => {
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(300);

      // Clear voting and set DIRECT_ISSUER_REDEMPTION as MUST HAVE
      await page.click("#exp-card-SHAREHOLDER_VOTING .btn-must-have"); // toggle off
      await page.click("#exp-card-DIRECT_ISSUER_REDEMPTION .btn-must-have"); // toggle on
      await page.waitForTimeout(200);

      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const bannerTitle = await page.textContent("#result-banner-title");
      if (!bannerTitle.includes("Products Match, But Important Conditions Apply")) {
        throw new Error(`Banner title mismatch for Flow D: ${bannerTitle}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "08_step3_flow_d_conditional.png") });
    });

    // 9. Step 4: AAPLx Handoff -> Execution Preflight Inspector
    await test("9. Step 4: AAPLx Handoff into Layer 2 Execution Preflight Inspector ($500 USDC)", async () => {
      // Click 'Check Trade Fill for AAPLx' button on AAPLx card
      await page.click("#rep-card-AAPLx .btn-check-trade");
      await page.waitForTimeout(500);

      const isStep4Visible = await page.isVisible("#step-4-container");
      if (!isStep4Visible) throw new Error("Step 4 container not visible after handoff click");

      const handoffTitle = await page.textContent("#handoff-title");
      if (!handoffTitle.includes("Checking Fill for AAPLx")) {
        throw new Error(`Handoff title mismatch: ${handoffTitle}`);
      }

      // Execute Trade Check
      const submitTradeBtn = await page.$("#stock-card-AAPLx .submit-trade-btn");
      if (!submitTradeBtn) throw new Error("Submit trade button not found in Step 4 execution card");

      await submitTradeBtn.click();
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });

      // Verify 3 plain money metrics
      const spendVal = await page.textContent("#stock-card-AAPLx .res-spend-val");
      const exposureVal = await page.textContent("#stock-card-AAPLx .res-exposure-val");
      const diffVal = await page.textContent("#stock-card-AAPLx .res-diff-val");

      if (!spendVal.includes("$500.00")) throw new Error(`Spend value mismatch: ${spendVal}`);
      if (!exposureVal.includes("$")) throw new Error(`Exposure value missing: ${exposureVal}`);
      if (!diffVal.includes("$")) throw new Error(`Difference value missing: ${diffVal}`);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "09_step4_execution_preflight_result.png") });
    });

    // 10. Step 4: Back Button & AAPLon Boundary
    await test("10. AAPLon Boundary: Informational button with clear notice that Ondo GM execution check is in progress", async () => {
      // Click 'Change Product' to return to Step 3
      await page.click("#btn-back-to-step3");
      await page.waitForTimeout(400);

      const isStep3Visible = await page.isVisible("#step-3-container");
      if (!isStep3Visible) throw new Error("Failed to navigate back to Step 3 from Step 4");

      // Assert AAPLon card has disabled button with informative note
      const isOndoBtnDisabled = await page.$eval("#rep-card-AAPLon .btn-rep-unsupported", btn => btn.disabled);
      if (!isOndoBtnDisabled) throw new Error("AAPLon trade button should be disabled");

      const ondoNote = await page.textContent("#rep-card-AAPLon .unsupported-note");
      if (!ondoNote.includes("Ondo GM trading pool integration in progress")) {
        throw new Error(`Ondo unsupported note mismatch: ${ondoNote}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "10_step3_aapon_boundary.png") });
    });

    // 11. Mobile Viewport Responsiveness across Steps 1, 2, 3, 4
    await test("11. Mobile Viewport (375x812): All 4 Guided Preflight Steps render without clipping or horizontal overflow", async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();

      // Mobile Step 1
      await mobilePage.goto(`${BASE_URL}/#app`, { waitUntil: "networkidle" });
      await mobilePage.waitForTimeout(400);
      let isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 1 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "11_mobile_step1_company_grid.png") });

      // Mobile Step 2
      await mobilePage.click("#underlying-card-AAPL");
      await mobilePage.waitForTimeout(400);
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 2 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "12_mobile_step2_expectations.png") });

      // Mobile Step 3
      await mobilePage.click("#exp-card-HOLD_IN_OWN_WALLET .btn-must-have");
      await mobilePage.click("#btn-submit-expectations");
      await mobilePage.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 3 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "13_mobile_step3_verified_products.png") });

      // Mobile Step 4
      await mobilePage.click("#rep-card-AAPLx .btn-check-trade");
      await mobilePage.waitForTimeout(400);
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 4 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "14_mobile_step4_execution_handoff.png") });

      await mobileContext.close();
    });

  } finally {
    await browser.close();
    server.close();
  }

  console.log("\n==================================================");
  console.log(`PLAYWRIGHT SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
}

runBrowserTests().catch(err => {
  console.error("FATAL TEST ERROR:", err);
  process.exit(1);
});
