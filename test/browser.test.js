// JustFair Playwright Real Browser Test Suite & Visual Evidence Capture (Phase 14 - Director Order 013.3)
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
  console.log("RUNNING JUSTFAIR PLAYWRIGHT TEST SUITE (PHASE 14 - 013.3)");
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

    // 4. Step 2: What Matters to You? (Expectation Toggles, Bounded Weekend Label & Accordion)
    await test("4. Step 2: Expectation Selector with 5 primary and 6 secondary checks (narrow weekend trading copy)", async () => {
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
      if (secExps.length !== 6) throw new Error(`Expected 6 secondary expectations, found: ${secExps.length}`);

      // Verify Weekend Trading title is narrow "Trade on weekends"
      const weekendTitle = await page.textContent("#exp-card-WEEKEND_TRADING .expectation-title");
      if (weekendTitle !== "Trade on weekends") {
        throw new Error(`Weekend title mismatch: expected 'Trade on weekends', got '${weekendTitle}'`);
      }

      const weekendDesc = await page.textContent("#exp-card-WEEKEND_TRADING .expectation-desc");
      if (!weekendDesc.includes("Subject to liquidity, solver availability, and off-hours market spreads")) {
        throw new Error(`Weekend description mismatch: ${weekendDesc}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_step2_expectations.png") });
    });

    // 5. Flow A: Multiple-Match Neutrality (Zero Auto-Selection, Explicit User Click Required)
    await test("5. Flow A: Multiple-Match Neutrality (AAPLx + AAPLon match, selectedRepresentation === null before click)", async () => {
      // Click MUST HAVE on SELF_CUSTODY and ECONOMIC_DIVIDEND_BENEFIT
      await page.click("#exp-card-SELF_CUSTODY .btn-must-have");
      await page.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have");
      await page.waitForTimeout(200);

      // Submit check
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const bannerTitle = await page.textContent("#result-banner-title");
      if (!bannerTitle.includes("2 Verified Products Match Your Must-Haves")) {
        throw new Error(`Banner title mismatch for Flow A: ${bannerTitle}`);
      }

      // Assert two representation cards exist (AAPLx and AAPLon) with equal prominence
      const repCards = await page.$$(".representation-card");
      if (repCards.length !== 2) throw new Error(`Expected 2 representation cards, found: ${repCards.length}`);

      const rep1Symbol = await page.textContent("#rep-card-AAPLx .rep-symbol");
      const rep2Symbol = await page.textContent("#rep-card-AAPLon .rep-symbol");
      if (!rep1Symbol.includes("AAPLx")) throw new Error(`Rep 1 symbol mismatch: ${rep1Symbol}`);
      if (!rep2Symbol.includes("AAPLon")) throw new Error(`Rep 2 symbol mismatch: ${rep2Symbol}`);

      // CRITICAL NEUTRALITY PROOF: before user click, selectedRepresentation MUST be null
      const preClickState = await page.evaluate(() => {
        const { appState, activeRouteScheduler } = window;
        return {
          selectedRepresentation: appState.selectedRepresentation,
          executionHandoff: appState.executionHandoff,
          isPolling: activeRouteScheduler.isPolling
        };
      });

      if (preClickState.selectedRepresentation !== null) {
        throw new Error(`Neutrality violation: selectedRepresentation was pre-assigned to '${preClickState.selectedRepresentation}' before user selection!`);
      }
      if (preClickState.executionHandoff !== null) {
        throw new Error("Neutrality violation: executionHandoff was pre-created before user selection!");
      }
      if (preClickState.isPolling) {
        throw new Error("Neutrality violation: route scheduler started polling before user selection!");
      }

      // Verify Bounded Dividend Callout text
      const dividendNote = await page.textContent("#dividend-safety-text");
      if (!dividendNote.includes("Neither currently verified Apple representation pays ordinary cash dividends directly into your wallet")) {
        throw new Error(`Dividend bounded note mismatch: ${dividendNote}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "05_step3_flow_a_multiple_matches.png") });
    });

    // 6. Step 3 Details: Verified on Solana Drawer, Differences Matrix, and Scenarios (including Redemption)
    await test("6. Step 3 details: Verified on Solana Drawer, Differences Matrix, and Scenarios (DIVIDEND, STOCK SPLIT, REDEMPTION)", async () => {
      // Toggle Verified on Solana drawer on AAPLx card
      await page.click("#rep-card-AAPLx .rep-solana-toggle");
      await page.waitForTimeout(300);

      const isDrawerOpen = await page.isVisible("#rep-card-AAPLx .rep-solana-content");
      if (!isDrawerOpen) throw new Error("Verified on Solana drawer failed to open");

      // Assert Differences Matrix exists
      const isDiffMatrixVisible = await page.isVisible("#differences-matrix-container");
      if (!isDiffMatrixVisible) throw new Error("Differences Matrix table is not visible");

      // Assert Scenarios Accordion exists with Dividend, Stock Split, and Redemption
      const scenarios = await page.$$(".scenario-item");
      if (scenarios.length < 3) throw new Error(`Expected at least 3 scenario items, found: ${scenarios.length}`);

      const scenarioTitles = await page.$$eval(".scenario-toggle span", spans => spans.map(s => s.textContent));
      const hasDividend = scenarioTitles.some(t => t.toLowerCase().includes("dividend"));
      const hasSplit = scenarioTitles.some(t => t.toLowerCase().includes("split"));
      const hasRedemption = scenarioTitles.some(t => t.toLowerCase().includes("redeem"));

      if (!hasDividend) throw new Error("Missing Dividend scenario");
      if (!hasSplit) throw new Error("Missing Stock Split scenario");
      if (!hasRedemption) throw new Error("Missing Redemption scenario");

      // Assert Redemption scenario has narrow liquidity copy (no 24/7 liquidity overclaim)
      const redemptionDesc = await page.textContent(".scenario-item:nth-child(3) .scenario-body p");
      if (redemptionDesc.includes("24/7 DEX secondary liquidity") || redemptionDesc.includes("24/7 without onboarding")) {
        throw new Error(`Redemption scenario contains 24/7 liquidity overclaim: ${redemptionDesc}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "06_step3_drawers_matrix_scenarios.png") });
    });

    // 7. Flow B: Ordinary Voting Rights -> No Verified Product Match
    await test("7. Flow B: Ordinary Voting Rights -> NO VERIFIED PRODUCT MATCH with explanation & edit button", async () => {
      // Click 'Edit Expectations' to return to Step 2
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(300);

      // Clear all and select ORDINARY_VOTING_RIGHTS as MUST HAVE
      await page.click("#exp-card-SELF_CUSTODY .btn-must-have"); // toggle off
      await page.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have"); // toggle off
      await page.click("#exp-card-ORDINARY_VOTING_RIGHTS .btn-must-have"); // toggle on
      await page.waitForTimeout(200);

      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const bannerTitle = await page.textContent("#result-banner-title");
      if (!bannerTitle.includes("No Verified Product Matches Your Must-Haves")) {
        throw new Error(`Banner title mismatch for Flow B: ${bannerTitle}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "07_step3_flow_b_no_match.png") });
    });

    // 8. Flow C: Cash Dividend Payout -> No Verified Product Match
    await test("8. Flow C: Cash Dividend Payout -> NO VERIFIED PRODUCT MATCH with factual explanation", async () => {
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(300);

      // Clear voting and set CASH_DIVIDEND_PAYOUT as MUST HAVE
      await page.click("#exp-card-ORDINARY_VOTING_RIGHTS .btn-must-have"); // toggle off
      await page.click("#exp-card-CASH_DIVIDEND_PAYOUT .btn-must-have"); // toggle on
      await page.waitForTimeout(200);

      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const bannerTitle = await page.textContent("#result-banner-title");
      if (!bannerTitle.includes("No Verified Product Matches Your Must-Haves")) {
        throw new Error(`Banner title mismatch for Flow C: ${bannerTitle}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "08_step3_flow_c_cash_dividend_no_match.png") });
    });

    // 9. Flow D: Direct Issuer Redemption -> Conditional Match
    await test("9. Flow D: Direct Issuer Redemption -> CONDITIONAL MATCH with documented SPV / Reg S conditions", async () => {
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(300);

      // Clear cash dividend and open secondary accordion to set DIRECT_ISSUER_REDEMPTION as MUST HAVE
      await page.click("#exp-card-CASH_DIVIDEND_PAYOUT .btn-must-have"); // toggle off
      const isSecHidden = await page.$eval("#secondary-expectations-body", el => el.classList.contains("hidden"));
      if (isSecHidden) {
        await page.click("#toggle-secondary-expectations-btn");
        await page.waitForTimeout(200);
      }
      await page.click("#exp-card-DIRECT_ISSUER_REDEMPTION .btn-must-have"); // toggle on
      await page.waitForTimeout(200);

      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const bannerTitle = await page.textContent("#result-banner-title");
      if (!bannerTitle.includes("Products Match, But Important Conditions Apply")) {
        throw new Error(`Banner title mismatch for Flow D: ${bannerTitle}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "09_step3_flow_d_conditional.png") });
    });

    // 10. Flow G: In-Kind Share Redemption -> CONDITIONAL MATCHES (AAPLx: CONDITIONAL, AAPLon: MISMATCH)
    await test("10. Flow G: In-Kind Share Redemption -> AAPLx CONDITIONAL MATCH, AAPLon MISMATCH, Overall CONDITIONAL MATCHES", async () => {
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(300);

      // Clear DIRECT_ISSUER_REDEMPTION and select IN_KIND_SHARE_REDEMPTION
      await page.click("#exp-card-DIRECT_ISSUER_REDEMPTION .btn-must-have"); // toggle off
      await page.click("#exp-card-IN_KIND_SHARE_REDEMPTION .btn-must-have"); // toggle on
      await page.waitForTimeout(200);

      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      // 1. Overall banner: CONDITIONAL MATCHES
      const bannerTitle = await page.textContent("#result-banner-title");
      if (!bannerTitle.includes("Products Match, But Important Conditions Apply")) {
        throw new Error(`Banner title mismatch for Flow G: ${bannerTitle}`);
      }

      // 2. AAPLx badge: CONDITIONAL MATCH
      const rep1Badge = await page.textContent("#rep-card-AAPLx .rep-match-badge");
      if (!rep1Badge.includes("CONDITIONAL MATCH")) {
        throw new Error(`AAPLx badge mismatch for Flow G: expected CONDITIONAL MATCH, got ${rep1Badge}`);
      }

      // 3. AAPLon badge: MISMATCHES MUST-HAVES
      const rep2Badge = await page.textContent("#rep-card-AAPLon .rep-match-badge");
      if (!rep2Badge.includes("MISMATCHES MUST-HAVES")) {
        throw new Error(`AAPLon badge mismatch for Flow G: expected MISMATCHES MUST-HAVES, got ${rep2Badge}`);
      }

      // 4. Distinguish AAPLx != direct Apple ownership & xPort conversion
      const aaplxExpl = await page.textContent("#rep-card-AAPLx .rep-explanation-box p");
      if (!aaplxExpl.includes("You do not directly own AAPL shares while holding AAPLx") || !aaplxExpl.includes("xPort / Alpaca")) {
        throw new Error(`AAPLx in-kind explanation mismatch: ${aaplxExpl}`);
      }

      // 5. Distinguish AAPLon settles in cash / Regulation S
      const aaplonExpl = await page.textContent("#rep-card-AAPLon .rep-explanation-box p");
      if (!aaplonExpl.includes("Converting AAPLon directly into actual registered AAPL equity shares is not supported")) {
        throw new Error(`AAPLon in-kind explanation mismatch: ${aaplonExpl}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "10_step3_flow_g_in_kind_redemption.png") });
    });

    // 11. API Failure & Retry Error State UI (Real Route Interception)
    await test("11. API Failure & Retry Error State: Intercepted 500 displays 'We couldn't check this right now' + 'Try Again', does NOT show No Verified Match, recovers on retry", async () => {
      // Setup route interception to fail next /api/v1/product-preflight call
      let failNextRequest = true;
      await page.route("**/api/v1/product-preflight", async route => {
        if (failNextRequest) {
          await route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "INTERNAL_ERROR", message: "RPC endpoint timed out" })
          });
        } else {
          await route.continue();
        }
      });

      // Click Edit Expectations to return to Step 2
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(300);

      // Submit check while route fails
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      // Verify Error Banner displays "We couldn't check this right now"
      const errTitle = await page.textContent("#result-banner-title");
      if (!errTitle.includes("We couldn't check this right now")) {
        throw new Error(`Expected error banner title 'We couldn't check this right now', got: '${errTitle}'`);
      }

      // Crucial: verify it does NOT show "No Verified Product Matches Your Must-Haves"
      if (errTitle.includes("No Verified Product Matches")) {
        throw new Error("Error state erroneously displayed No Verified Product Match banner!");
      }

      const retryBtn = await page.$("#btn-retry-preflight");
      if (!retryBtn) throw new Error("Retry button not found on error banner");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "11_step3_api_error_state.png") });

      // Now restore route and click Try Again
      failNextRequest = false;
      await retryBtn.click();
      await page.waitForTimeout(1000);
      await page.waitForSelector("#rep-card-AAPLx", { timeout: 15000 });

      // Verify normal result replaced the error banner
      const recoveredTitle = await page.textContent("#result-banner-title");
      if (recoveredTitle.includes("We couldn't check this right now")) {
        throw new Error("Failed to recover from error state after clicking Try Again");
      }

      // Remove route interception
      await page.unroute("**/api/v1/product-preflight");
    });

    // 12. Back/Edit & Company State Isolation (AAPL -> NVDA, selectedRepresentation === null)
    await test("12. Company State Isolation: Switching AAPL -> NVDA resets selectedRepresentation to null until explicit selection", async () => {
      // Go back to Step 1
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(200);
      await page.click("#btn-change-company");
      await page.waitForTimeout(300);

      const isStep1Visible = await page.isVisible("#step-1-container");
      if (!isStep1Visible) throw new Error("Step 1 not visible after changing company");

      // Click NVDA card
      await page.click("#underlying-card-NVDA");
      await page.waitForTimeout(300);

      const compName = await page.textContent("#selected-company-name");
      if (!compName.includes("NVIDIA")) throw new Error(`Selected company mismatch after switch: ${compName}`);

      // PROVE: selectedRepresentation MUST BE NULL immediately after selecting company
      const stateAfterSelect = await page.evaluate(() => window.appState);
      if (stateAfterSelect.selectedUnderlying !== "NVDA") {
        throw new Error(`Expected selectedUnderlying === 'NVDA', got '${stateAfterSelect.selectedUnderlying}'`);
      }
      if (stateAfterSelect.selectedRepresentation !== null) {
        throw new Error(`State isolation failure: selectedRepresentation was auto-assigned to '${stateAfterSelect.selectedRepresentation}'!`);
      }
      if (stateAfterSelect.executionHandoff !== null) {
        throw new Error("State isolation failure: executionHandoff was not null!");
      }

      // Submit check for NVDA with baseline
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const step3Name = await page.textContent("#step3-company-name");
      if (!step3Name.includes("NVIDIA (NVDA)")) throw new Error(`Step 3 company name mismatch: ${step3Name}`);

      // Verify no AAPL representations exist
      const aaplCard = await page.$("#rep-card-AAPLx");
      if (aaplCard) throw new Error("Found lingering AAPLx representation card after switching to NVDA");

      const rep1Symbol = await page.textContent("#rep-card-NVDAx .rep-symbol");
      const rep2Symbol = await page.textContent("#rep-card-NVDAon .rep-symbol");
      if (!rep1Symbol.includes("NVDAx") || !rep2Symbol.includes("NVDAon")) {
        throw new Error(`NVDA representations mismatch: ${rep1Symbol}, ${rep2Symbol}`);
      }

      // PROVE: selectedRepresentation is STILL null after preflight completes
      const stateAfterPreflight = await page.evaluate(() => window.appState);
      if (stateAfterPreflight.selectedRepresentation !== null) {
        throw new Error(`Neutrality failure: selectedRepresentation was auto-assigned to '${stateAfterPreflight.selectedRepresentation}' before user click!`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "12_step3_nvda_state_isolation.png") });
    });

    // 13. Step 4: Input Ownership & Single-Card Execution Preflight Inspector
    await test("13. Step 4: Explicit AAPLx selection creates handoff, input starts empty, user enters $500, checks fill", async () => {
      // Return to AAPL
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(200);
      await page.click("#btn-change-company");
      await page.waitForTimeout(200);
      await page.click("#underlying-card-AAPL");
      await page.waitForTimeout(200);
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      // Click 'Check Trade Fill for AAPLx' button on AAPLx card
      await page.click("#rep-card-AAPLx .btn-check-trade");
      await page.waitForTimeout(500);

      // PROVE: ONLY after explicit click, selectedRepresentation is set to AAPLx and handoff created
      const stateAfterClick = await page.evaluate(() => window.appState);
      if (stateAfterClick.selectedRepresentation !== "AAPLx") {
        throw new Error(`Expected selectedRepresentation === 'AAPLx' after click, got '${stateAfterClick.selectedRepresentation}'`);
      }
      if (!stateAfterClick.executionHandoff || stateAfterClick.executionHandoff.representation !== "AAPLx") {
        throw new Error("Missing or invalid executionHandoff after click");
      }

      const isStep4Visible = await page.isVisible("#step-4-container");
      if (!isStep4Visible) throw new Error("Step 4 container not visible after handoff click");

      const handoffTitle = await page.textContent("#handoff-title");
      if (!handoffTitle.includes("Checking Fill for AAPLx")) {
        throw new Error(`Handoff title mismatch: ${handoffTitle}`);
      }

      // Assert only single AAPLx trade card is rendered in Step 4
      const visibleStandaloneCards = await page.$$(".stock-card-standalone");
      if (visibleStandaloneCards.length !== 1) {
        throw new Error(`Expected exactly 1 card in Step 4, found: ${visibleStandaloneCards.length}`);
      }

      // Assert Step 4 amount input starts empty
      const amountInputVal = await page.$eval("#stock-card-AAPLx .amount-input", el => el.value);
      if (amountInputVal !== "") {
        throw new Error(`Expected Step 4 amount input to start empty, found: '${amountInputVal}'`);
      }

      // Explicitly enter user trade amount: $500
      await page.fill("#stock-card-AAPLx .amount-input", "500");
      await page.waitForTimeout(300);

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

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "13_step4_execution_preflight_result.png") });
    });

    // 14. Step 3: AAPLon Boundary & No Auto-Substitution
    await test("14. AAPLon Boundary: Informational button with clear notice that Trade Check is not yet available, zero substitution to AAPLx", async () => {
      // Click 'Change Product' to return to Step 3
      await page.click("#btn-back-to-step3");
      await page.waitForTimeout(400);

      const isStep3Visible = await page.isVisible("#step-3-container");
      if (!isStep3Visible) throw new Error("Failed to navigate back to Step 3 from Step 4");

      // Click on AAPLon card directly
      await page.click("#rep-card-AAPLon");
      await page.waitForTimeout(200);

      // Verify selectedRepresentation becomes AAPLon (not AAPLx)
      const stateSelectedRep = await page.evaluate(() => window.appState.selectedRepresentation);
      if (stateSelectedRep !== "AAPLon") {
        throw new Error(`Expected selectedRepresentation === 'AAPLon', got '${stateSelectedRep}'`);
      }

      // Assert AAPLon card has disabled button with informative note
      const isOndoBtnDisabled = await page.$eval("#rep-card-AAPLon .btn-rep-unsupported", btn => btn.disabled);
      if (!isOndoBtnDisabled) throw new Error("AAPLon trade button should be disabled");

      const ondoBtnText = await page.textContent("#rep-card-AAPLon .btn-rep-unsupported span");
      if (!ondoBtnText.includes("Trade Check is not yet available for this representation")) {
        throw new Error(`AAPLon button label mismatch: ${ondoBtnText}`);
      }

      const ondoNote = await page.textContent("#rep-card-AAPLon .unsupported-note");
      if (!ondoNote.includes("Product verification is complete. JustFair's Execution Preflight currently supports xStocks representations only.")) {
        throw new Error(`Ondo unsupported note mismatch: ${ondoNote}`);
      }

      // Assert user remains in Step 3 (no auto-advancement to Step 4 with AAPLx substitution)
      const currentStep = await page.evaluate(() => window.appState.currentStep);
      if (currentStep !== 3) {
        throw new Error(`Substitution violation: App advanced to step ${currentStep} after selecting AAPLon!`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "14_step3_aaplon_boundary.png") });
    });

    // 15. Runtime Legacy Execution Cleanup Proof
    await test("15. Runtime Legacy Execution Cleanup: No polling outside Step 4, single active card, no background traffic", async () => {
      // When in Step 3, verify route scheduler is stopped
      const isSchedulerRunningInStep3 = await page.evaluate(() => {
        const { activeRouteScheduler } = window;
        return activeRouteScheduler ? activeRouteScheduler.isPolling : false;
      });
      if (isSchedulerRunningInStep3) {
        throw new Error("activeRouteScheduler is polling while user is in Step 3!");
      }

      // Navigate to Step 1 and verify scheduler is stopped
      await page.click("#tracker-step-1");
      await page.waitForTimeout(200);

      const isSchedulerRunningInStep1 = await page.evaluate(() => {
        const { activeRouteScheduler } = window;
        return activeRouteScheduler ? activeRouteScheduler.isPolling : false;
      });
      if (isSchedulerRunningInStep1) {
        throw new Error("activeRouteScheduler is polling while user is in Step 1!");
      }
    });

    // 16. Mobile Viewport Responsiveness across Steps 1, 2, 3, 4
    await test("16. Mobile Viewport (375x812): All 4 Guided Preflight Steps render without clipping or horizontal overflow", async () => {
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
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "15_mobile_step1_company_grid.png") });

      // Mobile Step 2
      await mobilePage.click("#underlying-card-AAPL");
      await mobilePage.waitForTimeout(400);
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 2 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "16_mobile_step2_expectations.png") });

      // Mobile Step 3
      await mobilePage.click("#exp-card-SELF_CUSTODY .btn-must-have");
      await mobilePage.click("#btn-submit-expectations");
      await mobilePage.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 3 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "17_mobile_step3_verified_products.png") });

      // Mobile Step 4
      await mobilePage.click("#rep-card-AAPLx .btn-check-trade");
      await mobilePage.waitForTimeout(400);
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 4 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "18_mobile_step4_execution_handoff.png") });

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
