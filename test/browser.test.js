// JustFair Playwright Real Browser Test Suite & Visual Evidence Capture (Phase 14 - Director Order 013.4)
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
  console.log("RUNNING JUSTFAIR PLAYWRIGHT TEST SUITE (PHASE 14 - 013.4)");
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

  // Director Order 013.5A: count Execution Preflight POSTs from page load.
  const seenPreflightPosts = [];
  page.on('request', req => {
    if (req.method() === "POST" && req.url().endsWith("/api/v1/preflight")) {
      seenPreflightPosts.push({ url: req.url(), postData: req.postData() });
    }
  });

  try {
    // 1. Desktop Dashboard Hero Section (Screenshot 01)
    await test("1. Dashboard Hero: Lady Justice artwork, tagline, and Two Checks badge", async () => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });

      const heroText = await page.textContent(".hero-headline");
      if (!heroText.includes("Know what you're buying.") || !heroText.includes("Then check the fill.")) {
        throw new Error(`Hero headline mismatch: ${heroText}`);
      }

      const subheadline = await page.textContent(".hero-subheadline");
      if (!subheadline.includes("JustFair checks whether a tokenized stock actually gives you what you expect")) {
        throw new Error(`Hero subheadline mismatch: ${subheadline}`);
      }

      const badgeText = await page.textContent(".hero-badge span");
      if (!badgeText.includes("TWO CHECKS BEFORE YOU BUY")) {
        throw new Error(`Hero badge mismatch: ${badgeText}`);
      }

      const isArtVisible = await page.isVisible(".hero-art-image");
      if (!isArtVisible) throw new Error("Hero artwork image is not visible");

      // 013.5A: landing must fire ZERO Execution Preflight POSTs (wait 3s).
      await page.waitForTimeout(3000);
      const landingPreflightPosts = seenPreflightPosts.filter(r => r.url.endsWith("/api/v1/preflight"));
      if (landingPreflightPosts.length !== 0) {
        throw new Error(`Landing fired ${landingPreflightPosts.length} POST /api/v1/preflight before user intent: ${JSON.stringify(landingPreflightPosts).slice(0, 300)}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "01_desktop_hero.png") });
    });

    // 2. Two Mistakes Story Section (Screenshot 02)
    await test("2. Dashboard: Two Mistakes Story Section renders cleanly", async () => {
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

    // 3. Why JustFair 3 Pillars (Screenshot 03)
    await test("3. Dashboard: Why JustFair 3 Pillars (Product, Asset, Trade)", async () => {
      const pillars = await page.$$(".why-pillar-card");
      if (pillars.length !== 3) throw new Error(`Expected 3 pillars, found: ${pillars.length}`);

      const p1 = await page.textContent(".why-pillar-card:nth-child(1) .why-pillar-title");
      const p2 = await page.textContent(".why-pillar-card:nth-child(2) .why-pillar-title");
      const p3 = await page.textContent(".why-pillar-card:nth-child(3) .why-pillar-title");

      if (!p1.includes("VERIFY THE PRODUCT")) throw new Error(`Pillar 1 mismatch: ${p1}`);
      if (!p2.includes("VERIFY THE ASSET")) throw new Error(`Pillar 2 mismatch: ${p2}`);
      if (!p3.includes("VERIFY THE TRADE")) throw new Error(`Pillar 3 mismatch: ${p3}`);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "03_desktop_why_justfair.png") });
    });

    // 4. How It Works 4 Steps (Screenshot 04)
    await test("4. Dashboard: How It Works 4-Step sequence", async () => {
      const stepCards = await page.$$(".steps-container-5 .step-card");
      if (stepCards.length !== 4) throw new Error(`Expected 4 step cards, found: ${stepCards.length}`);

      const isTruthCalloutVisible = await page.isVisible(".truthfulness-callout");
      if (!isTruthCalloutVisible) throw new Error("Truthful Market Stance callout missing");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "04_desktop_how_it_works.png") });
    });

    // 5. What JustFair Checks (Layer 1 vs Layer 2 & $500 Example) (Screenshot 05)
    await test("5. Dashboard: What JustFair Checks two-layer comparison and illustrative example", async () => {
      const compCards = await page.$$(".comparison-card");
      if (compCards.length !== 2) throw new Error(`Expected 2 comparison cards, found: ${compCards.length}`);

      const isExVisible = await page.isVisible(".example-card");
      if (!isExVisible) throw new Error("Example card not visible");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "05_desktop_what_justfair_checks.png") });
    });

    // 6. Developer / API Section & Product Proof (Screenshot 06)
    await test("6. Dashboard: Product Proof and Developer / API area", async () => {
      const proofCards = await page.$$(".proof-metric-card");
      if (proofCards.length !== 6) throw new Error(`Expected 6 proof metric cards, found: ${proofCards.length}`);

      const isApiVisible = await page.isVisible(".api-compact-card");
      if (!isApiVisible) throw new Error("API compact card missing");

      await page.click("#toggle-api-code-btn");
      await page.waitForTimeout(200);

      const isCodeVisible = await page.isVisible("#api-code-drawer");
      if (!isCodeVisible) throw new Error("API code drawer failed to open");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "06_desktop_api_section.png") });
    });

    // 7. Final CTA and Footer (Screenshot 07)
    await test("7. Dashboard: Final CTA and Footer layout", async () => {
      const ctaTitle = await page.textContent("#final-cta .cta-headline");
      if (!ctaTitle.includes("Know what you're buying before you trade it.")) {
        throw new Error(`Final CTA headline mismatch: ${ctaTitle}`);
      }

      const isFooterVisible = await page.isVisible(".site-footer");
      if (!isFooterVisible) throw new Error("Footer not visible");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "07_desktop_final_cta.png") });
    });

    // 7b. Dual entry choice (013.8A)
    await test("7b. Entry Choice: Check a Trade vs Check the Product", async () => {
      await page.click("#hero-open-app-btn");
      await page.waitForSelector("#entry-choice-container:not(.hidden)", { timeout: 15000 });

      const tradeBtn = await page.$("#entry-quick-btn");
      const productBtn = await page.$("#entry-product-btn");
      if (!tradeBtn || !productBtn) throw new Error("Both entry options must exist");
      const tradeText = await page.textContent(".entry-card:nth-child(1)");
      const productText = await page.textContent(".entry-card:nth-child(2)");
      if (!tradeText.includes("Check a Trade")) throw new Error("Quick entry copy missing");
      if (!productText.includes("Check the Product")) throw new Error("Product entry copy missing");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "07b_entry_choice.png") });
    });

    // 8. App Step 1: Company Grid & Filters (Screenshot 08)
    await test("8. App Step 1: 12 Canonical Companies, Search, and Category Filtering", async () => {
      await page.click("#entry-product-btn");
      await page.waitForSelector("#step-1-container:not(.hidden)", { timeout: 15000 });

      const isAppVisible = await page.isVisible("#app-view");
      if (!isAppVisible) throw new Error("App view not visible after clicking start preflight");

      const companyCards = await page.$$(".underlying-company-card");
      if (companyCards.length !== 12) throw new Error(`Expected 12 company cards, found: ${companyCards.length}`);

      // Search test
      const searchInput = await page.$("#stock-search-input");
      await searchInput.fill("AAPL");
      await page.waitForTimeout(200);
      let visible = await page.$$(".underlying-company-card:not(.search-hidden)");
      if (visible.length !== 1) throw new Error(`Expected 1 card for 'AAPL', found: ${visible.length}`);

      await searchInput.fill("");
      await page.waitForTimeout(200);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "08_desktop_app_step1.png") });
    });

    // 9. App Step 2: Expectations Selector (Screenshot 09)
    await test("9. App Step 2: Expectation Selector with 5 primary and 6 secondary checks", async () => {
      await page.click("#underlying-card-AAPL");
      await page.waitForTimeout(300);

      const isStep2Visible = await page.isVisible("#step-2-container");
      if (!isStep2Visible) throw new Error("Step 2 container not visible after selecting company");

      const primaryExps = await page.$$(".expectations-grid#primary-expectations-container .expectation-card");
      if (primaryExps.length !== 5) throw new Error(`Expected 5 primary expectations, found: ${primaryExps.length}`);

      await page.click("#toggle-secondary-expectations-btn");
      await page.waitForTimeout(200);

      const secExps = await page.$$(".expectations-grid#secondary-expectations-container .expectation-card");
      if (secExps.length !== 6) throw new Error(`Expected 6 secondary expectations, found: ${secExps.length}`);

      // Verify weekend trading title
      const weekendTitle = await page.textContent("#exp-card-WEEKEND_TRADING .expectation-title");
      if (weekendTitle !== "Trade on weekends") {
        throw new Error(`Weekend title mismatch: expected 'Trade on weekends', got '${weekendTitle}'`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "09_desktop_app_step2.png") });
    });

    // 10. Flow A: Multiple-Match Neutrality (Screenshot 10)
    await test("10. Flow A: Multiple-Match Neutrality (AAPLx + AAPLon, selectedRepresentation === null)", async () => {
      await page.click("#exp-card-SELF_CUSTODY .btn-must-have");
      await page.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have");
      await page.waitForTimeout(200);

      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const bannerTitle = await page.textContent("#result-banner-title");
      if (!bannerTitle.includes("2 Verified Products Match Your Must-Haves")) {
        throw new Error(`Banner title mismatch for Flow A: ${bannerTitle}`);
      }

      const repCards = await page.$$(".representation-card");
      if (repCards.length !== 2) throw new Error(`Expected 2 representation cards, found: ${repCards.length}`);

      // Neutrality check
      const preClickState = await page.evaluate(() => {
        const { appState, activeRouteScheduler } = window;
        return {
          selectedRepresentation: appState.selectedRepresentation,
          executionHandoff: appState.executionHandoff,
          isPolling: activeRouteScheduler.isPolling
        };
      });

      if (preClickState.selectedRepresentation !== null) {
        throw new Error(`Neutrality violation: selectedRepresentation was pre-assigned to '${preClickState.selectedRepresentation}'!`);
      }
      if (preClickState.executionHandoff !== null) {
        throw new Error("Neutrality violation: executionHandoff was pre-created!");
      }
      if (preClickState.isPolling) {
        throw new Error("Neutrality violation: route scheduler started polling before user selection!");
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "10_desktop_multiple_match_result.png") });
    });

    // 11. Flow B & C: No-Match Result (Screenshot 11)
    await test("11. Flow B: Ordinary Voting Rights -> NO VERIFIED PRODUCT MATCH with explanation", async () => {
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(300);

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

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "11_desktop_no_match_result.png") });
    });

    // 12. Flow D & G: Conditional Match Result (Screenshot 12)
    await test("12. Flow G: In-Kind Share Redemption -> CONDITIONAL MATCH (AAPLx: CONDITIONAL, AAPLon: MISMATCH)", async () => {
      await page.click("#btn-edit-expectations");
      await page.waitForTimeout(300);

      await page.click("#exp-card-ORDINARY_VOTING_RIGHTS .btn-must-have"); // toggle off
      const isSecHidden = await page.$eval("#secondary-expectations-body", el => el.classList.contains("hidden"));
      if (isSecHidden) {
        await page.click("#toggle-secondary-expectations-btn");
        await page.waitForTimeout(200);
      }
      await page.click("#exp-card-IN_KIND_SHARE_REDEMPTION .btn-must-have"); // toggle on
      await page.waitForTimeout(200);

      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const rep1Badge = await page.textContent("#rep-card-AAPLx .rep-match-badge");
      if (!rep1Badge.includes("CONDITIONAL MATCH")) {
        throw new Error(`AAPLx badge mismatch: expected CONDITIONAL MATCH, got ${rep1Badge}`);
      }

      const rep2Badge = await page.textContent("#rep-card-AAPLon .rep-match-badge");
      if (!rep2Badge.includes("MISMATCHES MUST-HAVES")) {
        throw new Error(`AAPLon badge mismatch: expected MISMATCHES MUST-HAVES, got ${rep2Badge}`);
      }

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "12_desktop_conditional_result.png") });
    });

    // 13. Product -> Execution Transition (Screenshot 13)
    await test("13. Product -> Execution Handoff: Explicit AAPLx selection creates verified handoff", async () => {
      // 013.8A-B: establish a genuine full MATCH first (prior flow leaves CONDITIONAL state).
      await page.click("#btn-edit-expectations");
      await page.waitForSelector("#exp-card-SELF_CUSTODY", { timeout: 15000 });
      const secHidden13 = await page.$eval("#secondary-expectations-body", el => el.classList.contains("hidden"));
      if (secHidden13) {
        await page.click("#toggle-secondary-expectations-btn");
        await page.waitForTimeout(200);
      }
      await page.click("#exp-card-IN_KIND_SHARE_REDEMPTION .btn-must-have"); // toggle off
      await page.click("#exp-card-SELF_CUSTODY .btn-must-have"); // toggle on
      await page.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have"); // toggle on
      await page.waitForTimeout(200);
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      const banner13 = await page.textContent("#result-banner-title");
      if (!banner13.includes("2 Verified Products Match Your Must-Haves")) {
        throw new Error(`Precondition: expected full-match banner, got ${banner13}`);
      }

      await page.click("#rep-card-AAPLx .btn-check-trade");
      await page.waitForTimeout(400);

      const stateAfterClick = await page.evaluate(() => window.appState);
      if (stateAfterClick.selectedRepresentation !== "AAPLx") {
        throw new Error(`Expected selectedRepresentation === 'AAPLx', got '${stateAfterClick.selectedRepresentation}'`);
      }
      if (!stateAfterClick.executionHandoff || stateAfterClick.executionHandoff.representation !== "AAPLx") {
        throw new Error("Missing or invalid executionHandoff after click");
      }

      const isStep4Visible = await page.isVisible("#step-4-container");
      if (!isStep4Visible) throw new Error("Step 4 container not visible");

      const handoffTitle = await page.textContent("#handoff-title");
      if (handoffTitle.trim() !== "AAPLx") {
        throw new Error(`Compact strip must show only the symbol, got: ${handoffTitle}`);
      }
      if (await page.$eval("#handoff-badge", el => el.classList.contains("hidden"))) {
        throw new Error("Product path must show the verified strip");
      }
      const handoffBadge = await page.textContent("#handoff-badge");
      if (!handoffBadge.includes("Product verified")) {
        throw new Error(`Verified strip mismatch: ${handoffBadge}`);
      }
      // 013.8A-B: verified claim must rest on AAPLx's own MATCH evaluation.
      const handoffTruth = await page.evaluate(() => {
        const prod = (window.appState?.productPreflightResult?.products || []).find(p => p.symbol === "AAPLx");
        return {
          evalStatus: prod?.evaluation?.status ?? null,
          handoffStatus: window.appState?.productHandoffStatus ?? null,
          verified: window.appState?.productPreflightVerified ?? null
        };
      });
      if (handoffTruth.evalStatus !== "MATCH") throw new Error(`AAPLx evaluation must be MATCH, got ${handoffTruth.evalStatus}`);
      if (handoffTruth.handoffStatus !== "MATCH") throw new Error(`Handoff status must be MATCH, got ${handoffTruth.handoffStatus}`);
      if (handoffTruth.verified !== true) throw new Error("Full MATCH must set productPreflightVerified true");
      const giantBanner = await page.$(".handoff-tag");
      if (giantBanner) throw new Error("Large purple handoff banner must be removed");

      // Assert amount input starts empty
      const amountInputVal = await page.$eval("#stock-card-AAPLx .amount-input", el => el.value);
      if (amountInputVal !== "") {
        throw new Error(`Expected Step 4 amount input to start empty, found: '${amountInputVal}'`);
      }

      // 013.5B: no default pay asset, CHECK TRADE starts disabled
      const initialTradeState = await page.evaluate(() => {
        const card = document.getElementById("stock-card-AAPLx");
        const tabs = [...card.querySelectorAll(".payment-tab")].map(t => ({
          asset: t.getAttribute("data-asset"),
          selected: t.classList.contains("active") || t.getAttribute("aria-checked") === "true"
        }));
        return {
          tabs,
          hidden: card.querySelector("input[name='inputAsset']")?.value ?? null,
          amount: card.querySelector(".amount-input")?.value ?? null,
          btnDisabled: card.querySelector(".submit-trade-btn")?.disabled ?? null
        };
      });
      const usdcSelected = initialTradeState.tabs.find(t => t.asset === "USDC")?.selected;
      const solSelected = initialTradeState.tabs.find(t => t.asset === "SOL")?.selected;
      if (usdcSelected) throw new Error("USDC must not be preselected on Step 4 open");
      if (solSelected) throw new Error("SOL must not be preselected on Step 4 open");
      if (initialTradeState.hidden !== "") {
        throw new Error(`Expected hidden inputAsset to be empty, found: '${initialTradeState.hidden}'`);
      }
      if (initialTradeState.amount !== "") {
        throw new Error(`Expected amount to start empty, found: '${initialTradeState.amount}'`);
      }
      if (initialTradeState.btnDisabled !== true) {
        throw new Error("CHECK TRADE must start disabled until asset + amount are explicit");
      }

      // 013.6: the handed-off card must be actually painted, not just in DOM.
      // (Scroll-reveal leaves dynamically created cards at opacity 0.)
      const paintedOpacity = await page.$eval("#stock-card-AAPLx", el => window.getComputedStyle(el).opacity);
      if (paintedOpacity !== "1") {
        throw new Error(`Step 4 card is transparent (opacity ${paintedOpacity}); owner sees a blank area`);
      }

      // 013.7A: primary form shows no wallet/RPC complexity; exact sim is a quiet entry.
      const walletLeak = await page.evaluate(() => {
        const card = document.getElementById("stock-card-AAPLx");
        const formText = card.querySelector(".stock-trade-form")?.innerText || "";
        return {
          legacyWalletSection: !!card.querySelector(".wallet-section"),
          manualToggle: !!card.querySelector(".manual-key-toggle"),
          rpcLeak: /RPC|Quote Precheck|public-key|taker/i.test(formText),
          exactToggle: !!card.querySelector(".exact-sim-toggle"),
          exactBodyHidden: card.querySelector(".exact-sim-body")?.classList.contains("hidden") ?? null
        };
      });
      if (walletLeak.legacyWalletSection) throw new Error("Legacy wallet section must not render in primary Step 4");
      if (walletLeak.manualToggle) throw new Error("Manual-address toggle must not sit in primary Step 4");
      if (walletLeak.rpcLeak) throw new Error("Primary Step 4 leaks wallet/RPC terminology");
      if (!walletLeak.exactToggle) throw new Error("Quiet exact-simulation entry missing beneath CHECK TRADE");
      if (walletLeak.exactBodyHidden !== true) throw new Error("Exact-simulation panel must start collapsed");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "13_desktop_product_to_execution.png") });
    });

    // 14. Execution Result & 3-Metric Plain-Money Hierarchy (Screenshot 14)
    await test("14. Execution Result: User enters $500, verifies 3 plain-money metrics", async () => {
      // 013.5C: explicit asset first; button stays disabled until amount too.
      await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
      await page.waitForTimeout(200);

      let gatedState = await page.evaluate(() => {
        const card = document.getElementById("stock-card-AAPLx");
        return {
          hidden: card.querySelector("input[name='inputAsset']")?.value ?? null,
          btnDisabled: card.querySelector(".submit-trade-btn")?.disabled ?? null
        };
      });
      if (gatedState.hidden !== "USDC") throw new Error(`Expected inputAsset USDC after click, got '${gatedState.hidden}'`);
      if (gatedState.btnDisabled !== true) throw new Error("CHECK TRADE must stay disabled with asset but no amount");

      await page.fill("#stock-card-AAPLx .amount-input", "500");
      await page.waitForTimeout(200);

      gatedState = await page.evaluate(() => ({
        btnDisabled: document.querySelector("#stock-card-AAPLx .submit-trade-btn")?.disabled ?? null
      }));
      if (gatedState.btnDisabled !== false) throw new Error("CHECK TRADE must enable with USDC + 500");

      const postsBefore = seenPreflightPosts.length;
      const submitTradeBtn = await page.$("#stock-card-AAPLx .submit-trade-btn");
      if (!submitTradeBtn) throw new Error("Submit trade button not found");

      await submitTradeBtn.click();
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });

      // 013.5C: exact payload assertion (013.7B: walletless normal check)
      const newPosts = seenPreflightPosts.slice(postsBefore);
      if (newPosts.length < 1) throw new Error("Expected POST /api/v1/preflight after CHECK TRADE");
      const payload = JSON.parse(newPosts[newPosts.length - 1].postData);
      if (payload.inputAsset !== "USDC" || payload.stock !== "AAPLx" || payload.amount !== 500) {
        throw new Error(`USDC payload mismatch: ${JSON.stringify(payload)}`);
      }
      if (payload.wallet !== null && payload.wallet !== undefined) {
        throw new Error(`Normal quote check must be walletless, got wallet: ${payload.wallet}`);
      }

      const spendVal = await page.textContent("#stock-card-AAPLx .res-spend-val");
      const exposureVal = await page.textContent("#stock-card-AAPLx .res-exposure-val");
      const diffVal = await page.textContent("#stock-card-AAPLx .res-diff-val");

      if (!spendVal.includes("$500.00")) throw new Error(`Spend value mismatch: ${spendVal}`);
      if (!exposureVal.includes("$")) throw new Error(`Exposure value missing: ${exposureVal}`);
      if (!diffVal.includes("$")) throw new Error(`Difference value missing: ${diffVal}`);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "14_desktop_execution_result.png") });
    });

    // 14b. SOL path on fresh Step 4 state (Screenshot 14b)
    await test("14b. SOL Path: fresh Step 4, select SOL, enter 1, correct payload + result", async () => {
      await page.click("#btn-back-to-step3");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      await page.click("#rep-card-AAPLx .btn-check-trade");
      await page.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });
      await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });

      const freshDisabled = await page.$eval("#stock-card-AAPLx .submit-trade-btn", el => el.disabled);
      if (freshDisabled !== true) throw new Error("Fresh Step 4 CHECK TRADE must start disabled (SOL path)");

      await page.click("#stock-card-AAPLx .payment-tab[data-asset='SOL']");
      await page.waitForTimeout(200);
      await page.fill("#stock-card-AAPLx .amount-input", "1");
      await page.waitForTimeout(200);

      const enabled = await page.$eval("#stock-card-AAPLx .submit-trade-btn", el => !el.disabled);
      if (!enabled) throw new Error("CHECK TRADE must enable with SOL + 1");

      const postsBefore = seenPreflightPosts.length;
      await page.click("#stock-card-AAPLx .submit-trade-btn");
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });

      const newPosts = seenPreflightPosts.slice(postsBefore);
      if (newPosts.length < 1) throw new Error("Expected POST /api/v1/preflight after SOL CHECK TRADE");
      const payload = JSON.parse(newPosts[newPosts.length - 1].postData);
      if (payload.inputAsset !== "SOL" || payload.stock !== "AAPLx" || payload.amount !== 1) {
        throw new Error(`SOL payload mismatch: ${JSON.stringify(payload)}`);
      }

      const spendSub = await page.textContent("#stock-card-AAPLx .res-spend-sub");
      if (!spendSub.includes("SOL")) throw new Error(`SOL spend sub mismatch: ${spendSub}`);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "14b_desktop_execution_sol.png") });
    });

    // 14c. Market-closed hierarchy with stubbed STALE_REFERENCE (Screenshot 14c)
    await test("14c. Market-Closed: SUCCESS + STALE_REFERENCE renders completion, not failure", async () => {
      await page.click("#btn-back-to-step3");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      await page.click("#rep-card-AAPLx .btn-check-trade");
      await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });

      await page.route("**/api/v1/preflight", async route => {
        const req = route.request();
        if (req.method() !== "POST") { await route.continue(); return; }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            request_status: "SUCCESS",
            verification_status: "UNABLE_TO_VERIFY",
            verdict: "UNABLE_TO_VERIFY",
            preflight_level: "QUOTE_CHECK",
            reason_codes: ["STALE_REFERENCE"],
            reason: "Underlying reference is stale.",
            trade: {
              input_asset: "USDC", input_amount: 500, input_usd_value: 500,
              input_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              input_asset_price_usd: 1, input_asset_price_timestamp: new Date().toISOString(),
              input_asset_price_source: "1:1 Fixed USD Peg", input_asset_price_provider: "Fixed 1:1 USD Peg",
              input_asset_price_freshness: "FRESH",
              stock_symbol: "AAPLx", canonical_stock: "AAPL",
              token_mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
              token_program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            },
            benchmark: {
              symbol: "AAPLx", price: 332.27,
              source: "Nasdaq Official Public Equity Quote API (api.nasdaq.com)",
              source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
              provider: "Last known Nasdaq reference, not eligible",
              timestamp: "2026-09-11T00:00:00.000Z", freshness_status: "STALE", is_real_time: false,
              market_context: { session: "OVERNIGHT", underlying_reference_available: false, reference_eligibility: "INELIGIBLE_STALE" }
            },
            economics: {
              raw_out_amount: "151127287", expected_stock_shares: 1.514192,
              underlying_benchmark_price: 332.27, expected_stock_exposure_usd: 503.12,
              effective_price_per_share: 329.77, difference_usd: 3.12, difference_pct: 0.62,
              multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
            },
            dex_route: { router: "Jupiter Swap V2", mode: "QUOTE_CHECK", steps: ["USDC", "AAPLx"], price_impact_pct: "0.0100" },
            alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
            simulation: { status: "NOT_RUN", err: null, units_consumed: 0 }
          })
        });
      });

      await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
      await page.fill("#stock-card-AAPLx .amount-input", "500");
      await page.click("#stock-card-AAPLx .submit-trade-btn");
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });

      const resultText = await page.textContent("#stock-card-AAPLx .inline-result-container");
      const upper = (resultText || "").toUpperCase();
      for (const phrase of ["TRADE CHECK COMPLETE", "FAIRNESS VERDICT UNAVAILABLE", "NOT A CURRENT FAIRNESS VERDICT"]) {
        if (!upper.includes(phrase)) throw new Error(`Market-closed copy missing '${phrase}': ${resultText.slice(0, 400)}`);
      }
      const errVisible = await page.evaluate(() => {
        const el = document.querySelector("#stock-card-AAPLx .inline-error-state");
        return el ? !el.classList.contains("hidden") : false;
      });
      if (errVisible) throw new Error("Market-closed must not present the error state");

      await page.unroute("**/api/v1/preflight");
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "14c_desktop_market_closed.png") });
    });

    // 013.7C: Exact Simulation disclosure content (fresh Step 4)
    await test("14e. Exact Disclosure: quiet entry expands to Connect + manual fallback + safety copy", async () => {
      await page.click("#btn-back-to-step3");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      await page.click("#rep-card-AAPLx .btn-check-trade");
      await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });

      await page.click("#stock-card-AAPLx .exact-sim-toggle");
      await page.waitForSelector("#stock-card-AAPLx .exact-sim-body:not(.hidden)", { timeout: 15000 });

      const panel = await page.evaluate(() => {
        const card = document.getElementById("stock-card-AAPLx");
        return {
          connectVisible: card.querySelector(".exact-sim-connect-btn")?.offsetParent !== null,
          formIntact: !!card.querySelector(".payment-tab[data-asset='USDC']") && !!card.querySelector(".amount-input") && !!card.querySelector(".submit-trade-btn")
        };
      });
      if (!panel.connectVisible) throw new Error("Connect Wallet control must be visible in exact panel");
      if (!panel.formIntact) throw new Error("Normal trade form must remain intact");

      // Manual fallback demoted: hidden until requested.
      let manualHidden = await page.$eval("#stock-card-AAPLx .exact-sim-manual-box", el => el.classList.contains("hidden"));
      if (manualHidden !== true) throw new Error("Manual entry must start collapsed behind Connect Wallet");
      await page.click("#stock-card-AAPLx .exact-sim-manual-toggle");
      await page.waitForSelector("#stock-card-AAPLx .exact-sim-manual-box:not(.hidden)", { timeout: 15000 });

      const manualCopy = await page.evaluate(() => {
        const card = document.getElementById("stock-card-AAPLx");
        const boxText = card.querySelector(".exact-sim-manual-box")?.innerText || "";
        const bodyText = card.querySelector(".exact-sim-body")?.innerText || "";
        return {
          safetyCopy: /Nothing is signed or sent/.test(boxText),
          noSeedKey: /seed phrase/i.test(boxText),
          bodySafety: /Nothing is signed or sent/.test(bodyText)
        };
      });
      if (!manualCopy.safetyCopy) throw new Error("Safety copy (nothing signed or sent) missing");
      if (!manualCopy.noSeedKey) throw new Error("Seed-phrase warning missing from manual entry");
      if (!manualCopy.bodySafety) throw new Error("Exact panel must carry safety copy");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "14e_exact_disclosure.png") });
    });

    // 013.7E: invalid address blocks simulation with consumer copy (same fresh card)
    await test("14g. Invalid Address: no POST, clear validation, no crash", async () => {
      const postsBefore = seenPreflightPosts.length;
      // Ensure the fallback entry is open (14e leaves it open; be explicit).
      const boxOpen = await page.$eval("#stock-card-AAPLx .exact-sim-manual-box", el => !el.classList.contains("hidden"));
      if (!boxOpen) {
        await page.click("#stock-card-AAPLx .exact-sim-toggle");
        await page.click("#stock-card-AAPLx .exact-sim-manual-toggle");
        await page.waitForSelector("#stock-card-AAPLx .exact-sim-manual-box:not(.hidden)", { timeout: 15000 });
      }
      await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
      await page.fill("#stock-card-AAPLx .amount-input", "500");
      await page.fill("#stock-card-AAPLx .exact-address-input", "not-a-valid-address!!");
      await page.click("#stock-card-AAPLx .submit-trade-btn");
      await page.waitForTimeout(1500);

      // The invalid address itself must never leave the browser (background
      // live-preview polls carry wallet null, never the bad value).
      const leaked = seenPreflightPosts.slice(postsBefore).filter(p => (p.postData || "").includes("not-a-valid"));
      if (leaked.length !== 0) {
        throw new Error("Invalid address must not fire POST /api/v1/preflight");
      }
      const errVisible = await page.evaluate(() => {
        const el = document.querySelector("#stock-card-AAPLx .inline-error-state");
        return el ? !el.classList.contains("hidden") : false;
      });
      if (!errVisible) throw new Error("Invalid address must show a user-facing error");
      const errText = await page.textContent("#stock-card-AAPLx .inline-error-state");
      if (!/valid Solana public address/i.test(errText)) {
        throw new Error(`Validation copy mismatch: ${errText.slice(0, 200)}`);
      }
      const resultShown = await page.evaluate(() => {
        const el = document.querySelector("#stock-card-AAPLx .inline-result-container");
        return el ? !el.classList.contains("hidden") : false;
      });
      if (resultShown) throw new Error("Invalid address must not render a successful result");
    });

    // 013.7D: valid manual address runs exact simulation (stubbed backend)
    await test("14f. Manual Exact: valid address sent, EXACT_SIMULATION handled, nothing signed", async () => {
      const EXACT_ADDR = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
      await page.route("**/api/v1/preflight", async route => {
        const req = route.request();
        if (req.method() !== "POST") { await route.continue(); return; }
        const body = JSON.parse(req.postData() || "{}");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            request_status: "SUCCESS",
            verification_status: "UNABLE_TO_VERIFY",
            verdict: "UNABLE_TO_VERIFY",
            preflight_level: "EXACT_SIMULATION",
            reason_codes: ["STALE_REFERENCE"],
            reason: "Underlying reference is stale.",
            trade: {
              input_asset: "USDC", input_amount: 500, input_usd_value: 500,
              input_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
              input_asset_price_usd: 1, input_asset_price_timestamp: new Date().toISOString(),
              input_asset_price_source: "1:1 Fixed USD Peg", input_asset_price_provider: "Fixed 1:1 USD Peg",
              input_asset_price_freshness: "FRESH",
              stock_symbol: "AAPLx", canonical_stock: "AAPL",
              token_mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
              token_program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            },
            benchmark: {
              symbol: "AAPLx", price: 332.27,
              source: "Nasdaq Official Public Equity Quote API (api.nasdaq.com)",
              source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
              provider: "Last known Nasdaq reference, not eligible",
              timestamp: "2026-09-11T00:00:00.000Z", freshness_status: "STALE", is_real_time: false,
              market_context: { session: "OVERNIGHT", underlying_reference_available: false, reference_eligibility: "INELIGIBLE_STALE" }
            },
            economics: {
              raw_out_amount: "151127287", expected_stock_shares: 1.514192,
              underlying_benchmark_price: 332.27, expected_stock_exposure_usd: 503.12,
              effective_price_per_share: 329.77, difference_usd: 3.12, difference_pct: 0.62,
              multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
            },
            dex_route: { router: "Jupiter Swap V2", mode: "EXACT_SIMULATION", steps: ["USDC", "AAPLx"], price_impact_pct: "0.0100" },
            alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
            simulation: { status: "PASS", err: null, units_consumed: 42000 }
          })
        });
      });

      const postsBefore = seenPreflightPosts.length;
      await page.fill("#stock-card-AAPLx .exact-address-input", EXACT_ADDR);
      await page.waitForTimeout(200);
      await page.click("#stock-card-AAPLx .submit-trade-btn");
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });

      const newPosts = seenPreflightPosts.slice(postsBefore);
      if (newPosts.length < 1) throw new Error("Expected exact POST /api/v1/preflight");
      const exactPost = newPosts.find(p => {
        try { return JSON.parse(p.postData).wallet === EXACT_ADDR; } catch { return false; }
      });
      if (!exactPost) throw new Error(`Exact payload must carry the address, got: ${newPosts.map(p => p.postData).join(" | ").slice(0, 300)}`);

      const simTitle = await page.textContent("#stock-card-AAPLx .sim-title");
      if (!/EXACT SIMULATION COMPLETE/i.test(simTitle)) throw new Error(`Exact banner mismatch: ${simTitle}`);
      const evLevel = await page.textContent("#stock-card-AAPLx .ev-preflight-level");
      if (!evLevel.includes("EXACT_SIMULATION")) throw new Error(`Evidence level mismatch: ${evLevel}`);

      await page.unroute("**/api/v1/preflight");
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "14f_manual_exact_result.png") });
    });

    // 013.7F: fresh walletless session still succeeds as Quote Check
    await test("14h. Walletless Fresh Session: USDC 500 succeeds with wallet null", async () => {
      const freshContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const freshPage = await freshContext.newPage();
      const freshPosts = [];
      freshPage.on("request", req => {
        if (req.method() === "POST" && req.url().endsWith("/api/v1/preflight")) {
          freshPosts.push(req.postData());
        }
      });
      try {
        await freshPage.goto(BASE_URL, { waitUntil: "networkidle" });
        await freshPage.click("#hero-open-app-btn");
        await freshPage.waitForSelector("#entry-choice-container:not(.hidden)", { timeout: 15000 });
        await freshPage.click("#entry-product-btn");
        await freshPage.waitForSelector("#underlying-card-AAPL", { timeout: 15000 });
        await freshPage.click("#underlying-card-AAPL");
        await freshPage.waitForSelector("#exp-card-SELF_CUSTODY", { timeout: 15000 });
        await freshPage.click("#exp-card-SELF_CUSTODY .btn-must-have");
        await freshPage.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have");
        await freshPage.click("#btn-submit-expectations");
        await freshPage.waitForSelector("#rep-card-AAPLx .btn-check-trade", { timeout: 15000 });
        await freshPage.click("#rep-card-AAPLx .btn-check-trade");
        await freshPage.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
        await freshPage.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
        await freshPage.fill("#stock-card-AAPLx .amount-input", "500");
        await freshPage.click("#stock-card-AAPLx .submit-trade-btn");
        await freshPage.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
        if (freshPosts.length < 1) throw new Error("Expected walletless POST");
        const payload = JSON.parse(freshPosts[freshPosts.length - 1]);
        if (payload.wallet !== null && payload.wallet !== undefined) {
          throw new Error(`Walletless check must send null wallet, got: ${payload.wallet}`);
        }
        if (payload.inputAsset !== "USDC" || payload.amount !== 500) {
          throw new Error(`Walletless payload mismatch: ${JSON.stringify(payload)}`);
        }
      } finally {
        await freshContext.close();
      }
    });

    // 14d. Owner-shape + exact-entry regression across desktop widths (Screenshot 14d)
    await test("14d. Wide Desktops (1280/1600/1648): painted card, boxes, exact entry usable", async () => {
      for (const [w, h, full] of [[1280, 900, false], [1600, 800, false], [1648, 900, true]]) {
        const wideContext = await browser.newContext({ viewport: { width: w, height: h } });
        const widePage = await wideContext.newPage();
        try {
          await widePage.goto(BASE_URL, { waitUntil: "networkidle" });
          await widePage.click("#hero-open-app-btn");
          await widePage.waitForSelector("#entry-choice-container:not(.hidden)", { timeout: 15000 });
          await widePage.click("#entry-product-btn");
          await widePage.waitForSelector("#underlying-card-AAPL", { timeout: 15000 });
          await widePage.click("#underlying-card-AAPL");
          await widePage.waitForSelector("#exp-card-SELF_CUSTODY", { timeout: 15000 });
          await widePage.click("#exp-card-SELF_CUSTODY .btn-must-have");
          await widePage.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have");
          await widePage.click("#btn-submit-expectations");
          await widePage.waitForSelector("#rep-card-AAPLx .btn-check-trade", { timeout: 15000 });
          await widePage.click("#rep-card-AAPLx .btn-check-trade");
          await widePage.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });
          await widePage.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
          await widePage.waitForTimeout(900); // pass the 0.75s reveal transition, if any

          // DOM existence alone is not acceptance: assert painted boxes.
          const paint = await widePage.evaluate(() => {
            function box(sel, root = document) {
              const el = root.querySelector(sel);
              if (!el) return { exists: false };
              const r = el.getBoundingClientRect();
              return {
                exists: true,
                opacity: window.getComputedStyle(el).opacity,
                display: window.getComputedStyle(el).display,
                w: r.width, h: r.height
              };
            }
            const card = document.getElementById("stock-card-AAPLx");
            return {
              card: box("#stock-card-AAPLx"),
              usdc: box(".payment-tab[data-asset='USDC']", card),
              sol: box(".payment-tab[data-asset='SOL']", card),
              amount: box(".amount-input", card),
              submit: box(".submit-trade-btn", card),
              exactToggle: box(".exact-sim-toggle", card),
              submitDisabled: card.querySelector(".submit-trade-btn")?.disabled ?? null
            };
          });

          for (const key of ["card", "usdc", "sol", "amount", "submit", "exactToggle"]) {
            const b = paint[key];
            if (!b.exists) throw new Error(`[${w}x${h}] Step 4 missing element: ${key}`);
            if (!(b.w > 0 && b.h > 0)) throw new Error(`[${w}x${h}] Step 4 zero box for ${key}: ${b.w}x${b.h}`);
          }
          if (paint.card.opacity !== "1") {
            throw new Error(`[${w}x${h}] Step 4 card transparent (opacity ${paint.card.opacity}): owner blank area`);
          }
          if (paint.submitDisabled !== true) throw new Error(`[${w}x${h}] CHECK TRADE must start disabled`);

          // Exact entry must be usable at every width.
          await widePage.click("#stock-card-AAPLx .exact-sim-toggle");
          await widePage.waitForSelector("#stock-card-AAPLx .exact-sim-body:not(.hidden)", { timeout: 15000 });

          if (full) {
            // Full end-to-end only once (widest): walletless USDC check still works.
            await widePage.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
            await widePage.fill("#stock-card-AAPLx .amount-input", "500");
            await widePage.click("#stock-card-AAPLx .submit-trade-btn");
            await widePage.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
            const spendVal = await widePage.textContent("#stock-card-AAPLx .res-spend-val");
            if (!spendVal.includes("$500.00")) throw new Error(`Wide spend mismatch: ${spendVal}`);
            await widePage.screenshot({ path: path.join(EVIDENCE_DIR, "14d_wide_step4_painted.png") });
          }
        } finally {
          await wideContext.close();
        }
      }
    });

    // 21-23. Quick Trade path (013.8 B/C/G/H + F)
    await test("21. Quick Trade: AAPLx execution without questionnaire, no false verified claim", async () => {
      const quickContext = await browser.newContext({ viewport: { width: 1600, height: 800 } });
      const quickPage = await quickContext.newPage();
      const quickPosts = [];
      quickPage.on("request", req => {
        if (req.method() === "POST" && req.url().endsWith("/api/v1/preflight")) quickPosts.push(req.postData());
      });
      try {
        await quickPage.goto(BASE_URL, { waitUntil: "networkidle" });
        await quickPage.click("#hero-open-app-btn");
        await quickPage.waitForSelector("#entry-choice-container:not(.hidden)", { timeout: 15000 });
        await quickPage.click("#entry-quick-btn");
        await quickPage.waitForSelector("#quick-container:not(.hidden)", { timeout: 15000 });

        const groups = await quickPage.$$(".quick-underlying-group");
        if (groups.length !== 12) throw new Error(`Expected 12 quick groups, found: ${groups.length}`);
        const aaplxBtn = await quickPage.$("#quick-rep-AAPLx .quick-check-trade-btn");
        if (!aaplxBtn) throw new Error("AAPLx must offer Check Trade in quick path");
        const aaplonBtn = await quickPage.$("#quick-rep-AAPLon .quick-check-trade-btn");
        if (aaplonBtn) throw new Error("AAPLon must not offer Check Trade (unsupported)");

        await aaplxBtn.click();
        await quickPage.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });
        await quickPage.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
        await quickPage.waitForTimeout(900);

        const qs = await quickPage.evaluate(() => ({
          entryPath: window.appState?.entryPath,
          verified: window.appState?.productPreflightVerified,
          handoffStatus: window.appState?.productHandoffStatus ?? null,
          selRep: window.appState?.selectedRepresentation,
          step2Hidden: document.getElementById("step-2-container")?.classList.contains("hidden"),
          step3Hidden: document.getElementById("step-3-container")?.classList.contains("hidden"),
          badgeHidden: document.getElementById("handoff-badge")?.classList.contains("hidden"),
          badgeText: document.getElementById("handoff-badge")?.textContent,
          titleText: document.getElementById("handoff-title")?.textContent,
          quickLink: !document.getElementById("quick-product-link")?.classList.contains("hidden"),
          opacity: window.getComputedStyle(document.getElementById("stock-card-AAPLx")).opacity,
          hidden: document.querySelector("#stock-card-AAPLx input[name='inputAsset']")?.value,
          amount: document.querySelector("#stock-card-AAPLx .amount-input")?.value,
          disabled: document.querySelector("#stock-card-AAPLx .submit-trade-btn")?.disabled
        }));
        if (qs.entryPath !== "QUICK_TRADE") throw new Error(`entryPath must be QUICK_TRADE, got ${qs.entryPath}`);
        if (qs.verified !== false) throw new Error("Quick path must never claim product verification");
        if (qs.handoffStatus !== "NOT_CHECKED") throw new Error(`Quick handoff status must be NOT_CHECKED, got ${qs.handoffStatus}`);
        if (qs.selRep !== "AAPLx") throw new Error(`Expected AAPLx selected, got ${qs.selRep}`);
        if (!qs.step2Hidden || !qs.step3Hidden) throw new Error("Quick path must skip the questionnaire");
        if (qs.badgeHidden !== true) throw new Error(`Quick path must hide verified badge, shows: ${qs.badgeText}`);
        if (qs.titleText.trim() !== "AAPLx") throw new Error(`Strip must show only symbol, got: ${qs.titleText}`);
        if (!qs.quickLink) throw new Error("Quick path must offer the product-first link");
        if (qs.opacity !== "1") throw new Error(`Quick card transparent (opacity ${qs.opacity})`);
        if (qs.hidden !== "" || qs.amount !== "" || qs.disabled !== true) {
          throw new Error(`Quick gating violated: asset='${qs.hidden}' amount='${qs.amount}' disabled=${qs.disabled}`);
        }

        const postsBefore = quickPosts.length;
        await quickPage.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
        await quickPage.fill("#stock-card-AAPLx .amount-input", "500");
        await quickPage.click("#stock-card-AAPLx .submit-trade-btn");
        await quickPage.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
        const match = quickPosts.slice(postsBefore).map(p => { try { return JSON.parse(p); } catch { return null; } })
          .find(p => p && p.inputAsset === "USDC" && p.stock === "AAPLx" && p.amount === 500 && (p.wallet === null || p.wallet === undefined));
        if (!match) throw new Error("Quick USDC payload missing or not walletless");
        const spendVal = await quickPage.textContent("#stock-card-AAPLx .res-spend-val");
        if (!spendVal.includes("$500.00")) throw new Error(`Quick spend mismatch: ${spendVal}`);

        await quickPage.screenshot({ path: path.join(EVIDENCE_DIR, "21_quick_execution.png") });
        await quickContext.close();
      } catch (e) {
        await quickContext.close();
        throw e;
      }
    });

    await test("22. Quick AAPLon: unsupported truth, product-details path, never substituted", async () => {
      const loneContext = await browser.newContext({ viewport: { width: 1600, height: 800 } });
      const lonePage = await loneContext.newPage();
      const lonePosts = [];
      lonePage.on("request", req => {
        if (req.method() === "POST" && req.url().endsWith("/api/v1/preflight")) lonePosts.push(req.postData());
      });
      try {
        await lonePage.goto(BASE_URL, { waitUntil: "networkidle" });
        await lonePage.click("#hero-open-app-btn");
        await lonePage.waitForSelector("#entry-choice-container:not(.hidden)", { timeout: 15000 });
        await lonePage.click("#entry-quick-btn");
        await lonePage.waitForSelector("#quick-rep-AAPLon", { timeout: 15000 });

        const rowText = await lonePage.textContent("#quick-rep-AAPLon");
        if (!/not yet supported/i.test(rowText)) throw new Error(`AAPLon must state unsupported truth, got: ${rowText.slice(0, 200)}`);
        if (lonePosts.length !== 0) throw new Error("Viewing AAPLon must fire zero execution POSTs");

        await lonePage.click("#quick-rep-AAPLon .quick-product-details-btn");
        await lonePage.waitForSelector("#step-2-container:not(.hidden)", { timeout: 15000 });
        const st = await lonePage.evaluate(() => ({
          entryPath: window.appState?.entryPath,
          selUnd: window.appState?.selectedUnderlying,
          selRep: window.appState?.selectedRepresentation
        }));
        if (st.entryPath !== "PRODUCT_PREFLIGHT" || st.selUnd !== "AAPL") {
          throw new Error(`Product-details path broken: ${JSON.stringify(st)}`);
        }
        if (st.selRep !== null) throw new Error("No silent AAPLx substitution on the AAPLon path");
        await lonePage.screenshot({ path: path.join(EVIDENCE_DIR, "22_quick_aaplon_truth.png") });
      } finally {
        await loneContext.close();
      }
    });

    await test("23. Quick Exact: manual address exact simulation from quick path", async () => {
      const exactContext = await browser.newContext({ viewport: { width: 1600, height: 800 } });
      const exactPage = await exactContext.newPage();
      const exactPosts = [];
      exactPage.on("request", req => {
        if (req.method() === "POST" && req.url().endsWith("/api/v1/preflight")) exactPosts.push(req.postData());
      });
      try {
        await exactPage.goto(BASE_URL, { waitUntil: "networkidle" });
        await exactPage.click("#hero-open-app-btn");
        await exactPage.waitForSelector("#entry-choice-container:not(.hidden)", { timeout: 15000 });
        await exactPage.click("#entry-quick-btn");
        await exactPage.waitForSelector("#quick-rep-AAPLx .quick-check-trade-btn", { timeout: 15000 });
        await exactPage.click("#quick-rep-AAPLx .quick-check-trade-btn");
        await exactPage.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });

        await exactPage.route("**/api/v1/preflight", async route => {
          const req = route.request();
          if (req.method() !== "POST") { await route.continue(); return; }
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              request_status: "SUCCESS", verification_status: "UNABLE_TO_VERIFY", verdict: "UNABLE_TO_VERIFY",
              preflight_level: "EXACT_SIMULATION", reason_codes: ["STALE_REFERENCE"], reason: "Underlying reference is stale.",
              trade: {
                input_asset: "USDC", input_amount: 500, input_usd_value: 500,
                input_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                input_asset_price_usd: 1, input_asset_price_timestamp: new Date().toISOString(),
                input_asset_price_source: "1:1 Fixed USD Peg", input_asset_price_provider: "Fixed 1:1 USD Peg",
                input_asset_price_freshness: "FRESH", stock_symbol: "AAPLx", canonical_stock: "AAPL",
                token_mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
                token_program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
              },
              benchmark: {
                symbol: "AAPLx", price: 332.27, source: "Nasdaq", source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
                provider: "Last known Nasdaq reference, not eligible", timestamp: "2026-09-11T00:00:00.000Z",
                freshness_status: "STALE", is_real_time: false,
                market_context: { session: "OVERNIGHT", underlying_reference_available: false, reference_eligibility: "INELIGIBLE_STALE" }
              },
              economics: {
                raw_out_amount: "151127287", expected_stock_shares: 1.514192, underlying_benchmark_price: 332.27,
                expected_stock_exposure_usd: 503.12, effective_price_per_share: 329.77, difference_usd: 3.12, difference_pct: 0.62,
                multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
              },
              dex_route: { router: "Jupiter Swap V2", mode: "EXACT_SIMULATION", steps: ["USDC", "AAPLx"], price_impact_pct: "0.0100" },
              alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
              simulation: { status: "PASS", err: null, units_consumed: 42000 }
            })
          });
        });

        const EXACT_ADDR = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
        await exactPage.click("#stock-card-AAPLx .exact-sim-toggle");
        await exactPage.click("#stock-card-AAPLx .exact-sim-manual-toggle");
        await exactPage.fill("#stock-card-AAPLx .exact-address-input", EXACT_ADDR);
        await exactPage.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
        await exactPage.fill("#stock-card-AAPLx .amount-input", "500");
        await exactPage.click("#stock-card-AAPLx .submit-trade-btn");
        await exactPage.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });

        const hit = exactPosts.map(p => { try { return JSON.parse(p); } catch { return null; } })
          .find(p => p && p.wallet === EXACT_ADDR && p.stock === "AAPLx");
        if (!hit) throw new Error("Quick exact payload must carry the address for AAPLx");
        const simTitle = await exactPage.textContent("#stock-card-AAPLx .sim-title");
        if (!/EXACT SIMULATION COMPLETE/i.test(simTitle)) throw new Error(`Quick exact banner mismatch: ${simTitle}`);
        await exactPage.screenshot({ path: path.join(EVIDENCE_DIR, "23_quick_exact_result.png") });
      } finally {
        await exactContext.close();
      }
    });

    // 24b. Conditional handoff truth (013.8A-C): IN_KIND scenario, AAPLx CONDITIONAL
    await test("24b. Conditional Strip: AAPLx conditional wording, never verified", async () => {
      // Establish the proven CONDITIONAL scenario explicitly (self-contained).
      await page.click("#btn-back-to-step3");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      await page.click("#btn-edit-expectations");
      await page.waitForSelector("#exp-card-SELF_CUSTODY", { timeout: 15000 });
      await page.click("#exp-card-SELF_CUSTODY .btn-must-have"); // toggle off
      await page.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have"); // toggle off
      const secHidden24b = await page.$eval("#secondary-expectations-body", el => el.classList.contains("hidden"));
      if (secHidden24b) {
        await page.click("#toggle-secondary-expectations-btn");
        await page.waitForTimeout(200);
      }
      await page.click("#exp-card-IN_KIND_SHARE_REDEMPTION .btn-must-have"); // toggle on
      await page.waitForTimeout(200);
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      const badge = await page.textContent("#rep-card-AAPLx .rep-match-badge");
      if (!badge.includes("CONDITIONAL MATCH")) {
        throw new Error(`Precondition: AAPLx must read CONDITIONAL MATCH, got ${badge}`);
      }
      await page.click("#rep-card-AAPLx .btn-check-trade");
      await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });

      const truth = await page.evaluate(() => {
        const prod = (window.appState?.productPreflightResult?.products || []).find(p => p.symbol === "AAPLx");
        return {
          evalStatus: prod?.evaluation?.status ?? null,
          handoffStatus: window.appState?.productHandoffStatus ?? null,
          verified: window.appState?.productPreflightVerified ?? null,
          strip: document.querySelector(".execution-handoff-banner")?.innerText || "",
          badgeClass: document.getElementById("handoff-badge")?.className || ""
        };
      });
      if (truth.evalStatus !== "CONDITIONAL_MATCH") throw new Error(`Backend says ${truth.evalStatus}, expected CONDITIONAL_MATCH`);
      if (truth.handoffStatus !== "CONDITIONAL_MATCH") throw new Error(`Handoff must be CONDITIONAL_MATCH, got ${truth.handoffStatus}`);
      if (truth.verified !== false) throw new Error("Conditional must not verify");
      if (!/Conditional product match/.test(truth.strip)) throw new Error(`Strip must carry conditional language: ${truth.strip.slice(0, 200)}`);
      if (/Product verified/.test(truth.strip)) throw new Error("Conditional strip must not claim verified");
      if (!truth.badgeClass.includes("badge-conditional")) throw new Error("Conditional badge needs restrained treatment");
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "24b_conditional_strip.png") });
    });

    // 24c. Mismatch handoff truth (013.8A-D): voting-rights scenario, AAPLx MISMATCH
    await test("24c. Mismatch Strip: requirement failure shown honestly, never verified", async () => {
      await page.click("#btn-back-to-step3");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      await page.click("#btn-edit-expectations");
      await page.waitForSelector("#exp-card-SELF_CUSTODY", { timeout: 15000 });
      const secHidden = await page.$eval("#secondary-expectations-body", el => el.classList.contains("hidden"));
      if (secHidden) {
        await page.click("#toggle-secondary-expectations-btn");
        await page.waitForTimeout(200);
      }
      await page.click("#exp-card-IN_KIND_SHARE_REDEMPTION .btn-must-have"); // toggle off
      await page.click("#exp-card-ORDINARY_VOTING_RIGHTS .btn-must-have"); // toggle on
      await page.waitForTimeout(200);
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });

      const badge = await page.textContent("#rep-card-AAPLx .rep-match-badge");
      if (!badge.includes("MISMATCHES MUST-HAVES")) {
        throw new Error(`Precondition: AAPLx must read MISMATCH, got ${badge}`);
      }
      const cta = await page.$("#rep-card-AAPLx .btn-check-trade");
      if (!cta) throw new Error("Mismatch cards keep an explicit Trade Check action (existing behavior)");
      await cta.click();
      await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });

      const truth = await page.evaluate(() => {
        const prod = (window.appState?.productPreflightResult?.products || []).find(p => p.symbol === "AAPLx");
        return {
          evalStatus: prod?.evaluation?.status ?? null,
          handoffStatus: window.appState?.productHandoffStatus ?? null,
          verified: window.appState?.productPreflightVerified ?? null,
          strip: document.querySelector(".execution-handoff-banner")?.innerText || ""
        };
      });
      if (truth.evalStatus !== "MISMATCH") throw new Error(`Backend says ${truth.evalStatus}, expected MISMATCH`);
      if (truth.handoffStatus !== "MISMATCH") throw new Error(`Handoff must be MISMATCH, got ${truth.handoffStatus}`);
      if (truth.verified !== false) throw new Error("Mismatch must not verify");
      if (!/Doesn't match all of your requirements/.test(truth.strip)) {
        throw new Error(`Strip must state the mismatch: ${truth.strip.slice(0, 200)}`);
      }
      if (/Product verified/.test(truth.strip)) throw new Error("Mismatch strip must not claim verified");
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "24c_mismatch_strip.png") });
    });

    // 24d. Unable-to-verify handoff truth (013.8A-E): stubbed genuine backend status class
    await test("24d. Unable Strip: incomplete verification shown honestly, never verified", async () => {
      await page.route("**/api/v1/product-preflight", async route => {
        const req = route.request();
        if (req.method() !== "POST") { await route.continue(); return; }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            request_status: "COMPLETED",
            mode: "UNDERLYING_DISCOVERY",
            underlying: "AAPL",
            company_name: "Apple Inc.",
            checked_at: new Date().toISOString(),
            overall_result: "UNABLE_TO_VERIFY_PRODUCT",
            expectations: [{ key: "SELF_CUSTODY", priority: "REQUIRED" }],
            products: [
              {
                productId: "xstocks:aaplx:solana", symbol: "AAPLx", underlyingSymbol: "AAPL",
                companyName: "Apple Inc.", issuer: "Backed Assets (JE) Limited",
                mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", decimals: 8,
                tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
                executionPreflightSupport: "SUPPORTED", executionPreflightSupported: true,
                assetVerification: { status: "UNABLE_TO_VERIFY", observedMultiplier: "1.0", checkedAt: new Date().toISOString() },
                evaluation: {
                  status: "UNABLE_TO_VERIFY", reasonCodes: ["VERIFICATION_UNAVAILABLE"],
                  summary: "On-chain verification is incomplete for this representation.", required: []
                }
              },
              {
                productId: "ondo:aaplon:solana", symbol: "AAPLon", underlyingSymbol: "AAPL",
                companyName: "Apple Inc.", issuer: "Ondo Global Markets (BVI) Limited",
                mint: "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo", decimals: 8,
                tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
                executionPreflightSupport: "NOT_YET_SUPPORTED", executionPreflightSupported: false,
                assetVerification: { status: "VERIFIED", observedMultiplier: "1.0", checkedAt: new Date().toISOString() },
                evaluation: {
                  status: "MISMATCH", reasonCodes: ["REQUIRED_MISMATCH_SELF_CUSTODY"],
                  summary: "AAPLon does not satisfy the requirement.", required: []
                }
              }
            ]
          })
        });
      });
      try {
        await page.click("#btn-back-to-step3");
        await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
        await page.click("#btn-edit-expectations");
        await page.waitForSelector("#exp-card-SELF_CUSTODY", { timeout: 15000 });
        await page.click("#btn-submit-expectations");
        await page.waitForSelector("#rep-card-AAPLx", { timeout: 15000 });
        await page.click("#rep-card-AAPLx .btn-check-trade");
        await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });

        const truth = await page.evaluate(() => {
          const prod = (window.appState?.productPreflightResult?.products || []).find(p => p.symbol === "AAPLx");
          return {
            evalStatus: prod?.evaluation?.status ?? null,
            handoffStatus: window.appState?.productHandoffStatus ?? null,
            verified: window.appState?.productPreflightVerified ?? null,
            strip: document.querySelector(".execution-handoff-banner")?.innerText || ""
          };
        });
        if (truth.evalStatus !== "UNABLE_TO_VERIFY") throw new Error(`Backend says ${truth.evalStatus}`);
        if (truth.handoffStatus !== "UNABLE_TO_VERIFY") throw new Error(`Handoff must be UNABLE_TO_VERIFY, got ${truth.handoffStatus}`);
        if (truth.verified !== false) throw new Error("Incomplete verification must not verify");
        if (!/Product verification incomplete/.test(truth.strip)) {
          throw new Error(`Strip must state incompleteness: ${truth.strip.slice(0, 200)}`);
        }
        if (/Product verified ✓/.test(truth.strip)) throw new Error("Unable strip must not claim verified");
        await page.screenshot({ path: path.join(EVIDENCE_DIR, "24d_unable_strip.png") });
      } finally {
        await page.unroute("**/api/v1/product-preflight");
      }
    });

    // 15. Mobile Viewport: Dashboard Hero (Screenshot 15)
    // 16. Mobile Viewport: Dashboard Story (Screenshot 16)
    // 17. Mobile Viewport: App Step 1 (Screenshot 17)
    // 18. Mobile Viewport: App Step 2 (Screenshot 18)
    // 19. Mobile Viewport: Product Results (Screenshot 19)
    // 20. Mobile Viewport: Execution Handoff (Screenshot 20)
    await test("15-20. Mobile Viewport (375x812): Dashboard and 4 Guided Preflight Steps without horizontal overflow", async () => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true
      });
      const mobilePage = await mobileContext.newPage();

      // 15. Mobile Dashboard Hero
      await mobilePage.goto(BASE_URL, { waitUntil: "networkidle" });
      await mobilePage.waitForTimeout(400);
      let isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Dashboard Hero exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "15_mobile_hero.png") });

      // 16. Mobile Dashboard Story (Two Mistakes + Why JustFair)
      await mobilePage.evaluate(() => document.getElementById("two-mistakes-story")?.scrollIntoView());
      await mobilePage.waitForTimeout(300);
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Dashboard Story exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "16_mobile_story_section.png") });

      // 17. Mobile Entry + Step 1 (013.8L: entry and quick screens included)
      await mobilePage.click("#hero-open-app-btn");
      await mobilePage.waitForSelector("#entry-choice-container:not(.hidden)", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Entry Choice exhibits horizontal overflow");
      await mobilePage.click("#entry-quick-btn");
      await mobilePage.waitForSelector("#quick-container:not(.hidden)", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Quick Selector exhibits horizontal overflow");
      await mobilePage.click("#btn-quick-back");
      await mobilePage.waitForSelector("#entry-choice-container:not(.hidden)", { timeout: 15000 });
      await mobilePage.click("#entry-product-btn");
      await mobilePage.waitForSelector("#step-1-container:not(.hidden)", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 1 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "17_mobile_step1.png") });

      // 18. Mobile App Step 2
      await mobilePage.click("#underlying-card-AAPL");
      await mobilePage.waitForTimeout(400);
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 2 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "18_mobile_step2.png") });

      // 19. Mobile App Step 3 (Product Results)
      await mobilePage.click("#exp-card-SELF_CUSTODY .btn-must-have");
      await mobilePage.click("#btn-submit-expectations");
      await mobilePage.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 3 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "19_mobile_product_results.png") });

      // 20. Mobile App Step 4 (Execution Handoff)
      await mobilePage.click("#rep-card-AAPLx .btn-check-trade");
      await mobilePage.waitForTimeout(400);
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 4 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "20_mobile_execution_handoff.png") });

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
