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

// Revalidation fixtures (015): deterministic QUOTE_CHECK snapshots.
// A = checked snapshot, B variants = revalidation responses.
const REVAL_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const REVAL_AAPLX_MINT = "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp";
const REVAL_TOKEN_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

function revalQuoteFixture(over = {}) {
  const trade = {
    input_asset: "USDC", input_amount: 500, input_usd_value: 500,
    input_mint: REVAL_USDC_MINT,
    input_asset_price_usd: 1, input_asset_price_timestamp: new Date().toISOString(),
    input_asset_price_source: "1:1 Fixed USD Peg", input_asset_price_provider: "Fixed 1:1 USD Peg",
    input_asset_price_freshness: "FRESH", stock_symbol: "AAPLx", canonical_stock: "AAPL",
    token_mint: REVAL_AAPLX_MINT, token_program: REVAL_TOKEN_PROGRAM,
    ...(over.trade || {})
  };
  const benchmark = {
    symbol: "AAPLx", price: 332.27, source: "Nasdaq", source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
    provider: "Last known Nasdaq reference, not eligible", timestamp: "2026-09-14T00:00:00.000Z",
    freshness_status: "STALE", is_real_time: false,
    market_context: { session: "OVERNIGHT", underlying_reference_available: false, reference_eligibility: "INELIGIBLE_STALE" },
    ...(over.benchmark || {})
  };
  if (over.benchmark?.market_context) {
    benchmark.market_context = { ...benchmark.market_context, ...over.benchmark.market_context };
  }
  return {
    request_status: "SUCCESS", verification_status: "UNABLE_TO_VERIFY", verdict: "UNABLE_TO_VERIFY",
    preflight_level: "QUOTE_CHECK", reason_codes: ["STALE_REFERENCE"],
    trade,
    benchmark,
    economics: {
      raw_out_amount: "150000000", expected_stock_shares: 1.5,
      underlying_benchmark_price: 332.27, expected_stock_exposure_usd: 498.41,
      effective_price_per_share: 333.33, difference_usd: -1.59, difference_pct: -0.32,
      multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 },
      ...(over.economics || {})
    },
    dex_route: {
      router: "Jupiter Swap V2", mode: "QUOTE_CHECK", steps: ["USDC", "AAPLx"], price_impact_pct: "0.0100",
      ...(over.dex_route || {})
    },
    alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
    simulation: { status: "NOT_RUN", err: null, units_consumed: 0 },
    ...(over.top || {})
  };
}

function revalBenchUnknown() {
  return {
    benchmark: {
      symbol: "AAPLx", price: 332.27, source: "Nasdaq", source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
      provider: "Last known Nasdaq reference, not eligible", timestamp: null, freshness_status: "UNKNOWN",
      is_real_time: false,
      market_context: { session: "POST_MARKET", underlying_reference_available: false, reference_eligibility: "INELIGIBLE_UNKNOWN" }
    },
    top: { reason_codes: ["REFERENCE_UNAVAILABLE"] }
  };
}

// Fresh Step-4 AAPLx card helper shared by revalidation tests.
async function openFreshTradeCard(pg) {
  await pg.click("#tracker-step-4");
  await pg.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });
  await pg.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
  await pg.click("#stock-card-AAPLx .stock-card-header");
  await pg.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
}

async function fillTradeAndCheck(pg, asset, amount) {
  await pg.click(`#stock-card-AAPLx .payment-tab[data-asset='${asset}']`);
  await pg.fill("#stock-card-AAPLx .amount-input", String(amount));
  await pg.waitForTimeout(800); // let debounce polls settle so POST accounting is exact
  await pg.click("#stock-card-AAPLx .submit-trade-btn");
  await pg.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
  await pg.waitForTimeout(600);
}

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

  // Screenshots during smooth-scroll transit can capture unpainted frames.
  // Settle the viewport before capturing scrolled mobile screenshots.
  async function settleScroll(pg) {
    await pg.waitForFunction(() => {
      return new Promise(res => {
        let last = window.scrollY;
        let stable = 0;
        const iv = setInterval(() => {
          if (window.scrollY === last) {
            stable++;
            if (stable >= 3) { clearInterval(iv); res(true); }
          } else {
            last = window.scrollY;
            stable = 0;
          }
        }, 100);
      });
    }, { timeout: 8000 });
  }

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

    // 7b. Single four-step app entry (013.9A)
    await test("7b. App Entry: no mode choice, tracker visible, Step 1 active", async () => {
      await page.click("#hero-open-app-btn");
      await page.waitForSelector("#step-1-container:not(.hidden)", { timeout: 15000 });

      if (await page.$("#entry-choice-container")) {
        throw new Error("Dual-entry screen must be removed");
      }
      const trackerVisible = await page.isVisible(".preflight-step-tracker");
      if (!trackerVisible) throw new Error("Four-step tracker must be visible on entry");
      const step1Active = await page.$eval("#tracker-step-1", el => el.classList.contains("active"));
      if (!step1Active) throw new Error("Step 1 must be active on entry");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "07b_app_entry.png") });
    });

    // 8. App Step 1: Company Grid & Filters (Screenshot 08)
    await test("8. App Step 1: 12 Canonical Companies, Search, and Category Filtering", async () => {
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
          hasHandoffField: ("executionHandoff" in appState) || ("productHandoffStatus" in appState),
          isPolling: activeRouteScheduler.isPolling
        };
      });

      if (preClickState.selectedRepresentation !== null) {
        throw new Error(`Neutrality violation: selectedRepresentation was pre-assigned to '${preClickState.selectedRepresentation}'!`);
      }
      if (preClickState.hasHandoffField) {
        throw new Error("Neutrality violation: handoff state fields must not exist pre-selection!");
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

    // 13. Product -> Trade navigation is fresh (013.9D)
    await test("13. Product CTA navigates to a fresh Step 4 with no preload or badge", async () => {
      // Establish a genuine full MATCH first.
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
      await page.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });

      // Step 4 must show the original feed with nothing expanded or preloaded.
      const fresh = await page.evaluate(() => ({
        cards: document.querySelectorAll("#stock-cards-container .stock-card-standalone").length,
        expanded: document.querySelectorAll("#stock-cards-container .stock-card-standalone.is-expanded").length,
        stripPresent: !!document.querySelector(".execution-handoff-banner"),
        verifiedLeak: /Product verified|Conditional product match|match all of your requirements|verification incomplete/i.test(document.getElementById("step-4-container")?.innerText || ""),
        trackerVisible: !document.querySelector(".preflight-step-tracker")?.classList.contains("hidden")
      }));
      if (fresh.cards !== 12) throw new Error(`Step 4 feed must list 12 execution-supported cards, found ${fresh.cards}`);
      if (fresh.expanded !== 0) throw new Error("Step 4 must start with no card expanded");
      if (fresh.stripPresent || fresh.verifiedLeak) throw new Error("No handoff strip/badge may exist in Step 4");
      if (!fresh.trackerVisible) throw new Error("Step tracker must stay visible");

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "13_desktop_product_to_execution.png") });
    });

    // 14. Direct Step 4 trade (013.9B+C): tracker shortcut, explicit selection, walletless result
    await test("14. Direct Trade: tracker Step 4, select AAPLx, USDC 500, walletless result", async () => {
      await page.click("#tracker-step-4");
      await page.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });

      // Questionnaire never ran on this path: feed present, nothing expanded.
      const preState = await page.evaluate(() => ({
        productResult: (("productPreflightResult" in window.appState) ? window.appState.productPreflightResult : "UNDEFINED"),
        expanded: document.querySelectorAll("#stock-cards-container .stock-card-standalone.is-expanded").length,
        cards: document.querySelectorAll("#stock-cards-container .stock-card-standalone").length
      }));
      if (preState.expanded !== 0) throw new Error("Direct Step 4 must start with no card expanded");
      if (preState.cards !== 12) throw new Error(`Direct Step 4 feed must list 12 execution-supported cards, found ${preState.cards}`);

      // Explicit in-feed selection: expand the exact AAPLx card.
      await page.click("#stock-card-AAPLx .stock-card-header");
      await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
      await page.waitForTimeout(900);

      const selState = await page.evaluate(() => ({
        expandedSymbol: document.querySelector("#stock-cards-container .stock-card-standalone.is-expanded")?.getAttribute("data-symbol") ?? null,
        opacity: window.getComputedStyle(document.getElementById("stock-card-AAPLx")).opacity,
        hidden: document.querySelector("#stock-card-AAPLx input[name='inputAsset']")?.value ?? null,
        amount: document.querySelector("#stock-card-AAPLx .amount-input")?.value ?? null,
        btnDisabled: document.querySelector("#stock-card-AAPLx .submit-trade-btn")?.disabled ?? null
      }));
      if (selState.expandedSymbol !== "AAPLx") throw new Error(`Expected AAPLx expanded, got ${selState.expandedSymbol}`);
      if (selState.opacity !== "1") throw new Error(`Step 4 card transparent (opacity ${selState.opacity})`);
      if (selState.hidden !== "" || selState.amount !== "" || selState.btnDisabled !== true) {
        throw new Error(`Fresh gating violated: asset='${selState.hidden}' amount='${selState.amount}' disabled=${selState.btnDisabled}`);
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

      await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
      await page.waitForTimeout(200);
      await page.fill("#stock-card-AAPLx .amount-input", "500");
      await page.waitForTimeout(200);

      const postsBefore = seenPreflightPosts.length;
      await page.click("#stock-card-AAPLx .submit-trade-btn");
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });

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
      if (!spendVal.includes("$500.00")) throw new Error(`Spend value mismatch: ${spendVal}`);

      await page.screenshot({ path: path.join(EVIDENCE_DIR, "14_desktop_execution_result.png") });
    });

    // 14b. SOL path on fresh Step 4 state (Screenshot 14b)
    await test("14b. SOL Path: fresh Step 4, select SOL, enter 1, correct payload + result", async () => {
      await page.click("#tracker-step-4");
      await page.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });
      await page.click("#stock-card-AAPLx .stock-card-header");
      await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });

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
      await page.click("#tracker-step-4");
      await page.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });
      await page.click("#stock-card-AAPLx .stock-card-header");
      await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });

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
      await page.click("#tracker-step-4");
      await page.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });
      await page.click("#stock-card-AAPLx .stock-card-header");
      await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });

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

    await test("14f2. Exact Simulation Failure: route results stand, failure explained separately", async () => {
      await page.route("**/api/v1/preflight", async route => {
        const req = route.request();
        if (req.method() !== "POST") { await route.continue(); return; }
        await route.fulfill({
          status: 200, contentType: "application/json",
          body: JSON.stringify({
            request_status: "SUCCESS", verification_status: "UNABLE_TO_VERIFY", verdict: "UNABLE_TO_VERIFY",
            preflight_level: "EXACT_SIMULATION", reason_codes: ["SIMULATION_FAILED"],
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
              raw_out_amount: "151127287", expected_stock_shares: 1.514192,
              underlying_benchmark_price: 332.27, expected_stock_exposure_usd: 503.12,
              effective_price_per_share: 329.77, difference_usd: 3.12, difference_pct: 0.62,
              multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
            },
            dex_route: { router: "Jupiter Swap V2", mode: "EXACT_SIMULATION", steps: ["USDC", "AAPLx"], price_impact_pct: "0.0100" },
            alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
            simulation: { status: "FAIL", err: "simulated transaction failed", units_consumed: 1200 }
          })
        });
      });
      try {
        await page.fill("#stock-card-AAPLx .exact-address-input", "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
        await page.click("#stock-card-AAPLx .submit-trade-btn");
        await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
        const simTitle = await page.textContent("#stock-card-AAPLx .sim-title");
        if (!/couldn.t complete/i.test(simTitle)) throw new Error(`Sim-failure banner mismatch: ${simTitle}`);
        const spendVal = await page.textContent("#stock-card-AAPLx .res-spend-val");
        if (!spendVal.includes("$500.00")) throw new Error("Route economics must still render on sim failure");
        const errBox = await page.evaluate(() => {
          const el = document.querySelector("#stock-card-AAPLx .inline-error-state");
          return el ? !el.classList.contains("hidden") : false;
        });
        if (errBox) throw new Error("Sim failure must not present the whole check as failed");
        await page.screenshot({ path: path.join(EVIDENCE_DIR, "14f2_sim_failure.png") });
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
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
        await freshPage.waitForSelector("#tracker-step-4", { timeout: 15000 });
        await freshPage.click("#tracker-step-4");
        await freshPage.click("#stock-card-AAPLx .stock-card-header");
        await freshPage.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
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
          await widePage.waitForSelector("#tracker-step-4", { timeout: 15000 });
          await widePage.click("#tracker-step-4");
          await widePage.waitForSelector("#stock-cards-container .stock-card-standalone", { timeout: 15000 });

          // Feed itself must be painted (no blank Step 4).
          const selBox = await widePage.evaluate(() => {
            const el = document.getElementById("stock-card-AAPLx");
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { w: r.width, h: r.height, opacity: window.getComputedStyle(el).opacity };
          });
          if (!selBox || !(selBox.w > 0 && selBox.h > 0)) throw new Error(`[${w}x${h}] Step 4 feed not painted`);
          if (selBox.opacity !== "1") throw new Error(`[${w}x${h}] Step 4 feed transparent`);

          await widePage.click("#stock-card-AAPLx .stock-card-header");
          await widePage.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
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

    // 25-27. Product scenarios leave Step 4 fresh (013.9E/F) + AAPLon safety (013.9G)
    await test("25. Conditional Product navigates to a fresh Step 4 with no carryover", async () => {
      // Proven CONDITIONAL scenario: IN_KIND only.
      await page.click("#tracker-step-2");
      await page.waitForSelector("#exp-card-SELF_CUSTODY", { timeout: 15000 });
      const secHidden25 = await page.$eval("#secondary-expectations-body", el => el.classList.contains("hidden"));
      if (secHidden25) {
        await page.click("#toggle-secondary-expectations-btn");
        await page.waitForTimeout(200);
      }
      await page.click("#exp-card-IN_KIND_SHARE_REDEMPTION .btn-must-have"); // toggle on
      await page.waitForTimeout(200);
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      const badge25 = await page.textContent("#rep-card-AAPLx .rep-match-badge");
      if (!badge25.includes("CONDITIONAL MATCH")) throw new Error(`Precondition failed, got ${badge25}`);

      await page.click("#rep-card-AAPLx .btn-check-trade");
      await page.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });
      const fresh25 = await page.evaluate(() => ({
        expanded: document.querySelectorAll("#stock-cards-container .stock-card-standalone.is-expanded").length,
        stripPresent: !!document.querySelector(".execution-handoff-banner"),
        condLeak: /Conditional product match|Product verified/i.test(document.getElementById("step-4-container")?.innerText || "")
      }));
      if (fresh25.expanded !== 0) throw new Error("Step 4 must start with no card expanded after conditional product");
      if (fresh25.stripPresent || fresh25.condLeak) throw new Error("No conditional/verified carryover into Step 4");

      // The user then deliberately checks AAPLx and it works.
      await page.click("#stock-card-AAPLx .stock-card-header");
      await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
      await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
      await page.fill("#stock-card-AAPLx .amount-input", "500");
      await page.click("#stock-card-AAPLx .submit-trade-btn");
      await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "25_conditional_to_fresh_step4.png") });
    });

    await test("26. Mismatch Product navigates to a fresh Step 4 with no carryover", async () => {
      await page.click("#tracker-step-2");
      await page.waitForSelector("#exp-card-SELF_CUSTODY", { timeout: 15000 });
      const secHidden26 = await page.$eval("#secondary-expectations-body", el => el.classList.contains("hidden"));
      if (secHidden26) {
        await page.click("#toggle-secondary-expectations-btn");
        await page.waitForTimeout(200);
      }
      await page.click("#exp-card-IN_KIND_SHARE_REDEMPTION .btn-must-have"); // toggle off
      await page.click("#exp-card-ORDINARY_VOTING_RIGHTS .btn-must-have"); // toggle on
      await page.waitForTimeout(200);
      await page.click("#btn-submit-expectations");
      await page.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
      const badge26 = await page.textContent("#rep-card-AAPLx .rep-match-badge");
      if (!badge26.includes("MISMATCHES MUST-HAVES")) throw new Error(`Precondition failed, got ${badge26}`);

      const cta = await page.$("#rep-card-AAPLx .btn-check-trade");
      if (!cta) throw new Error("Mismatch cards keep an explicit Trade Check action (existing behavior)");
      await cta.click();
      await page.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });
      const fresh26 = await page.evaluate(() => ({
        expanded: document.querySelectorAll("#stock-cards-container .stock-card-standalone.is-expanded").length,
        mismatchLeak: /match all of your requirements|Product verified/i.test(document.getElementById("step-4-container")?.innerText || "")
      }));
      if (fresh26.expanded !== 0) throw new Error("Step 4 must start with no card expanded after mismatch product");
      if (fresh26.mismatchLeak) throw new Error("No mismatch/verified carryover into Step 4");
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "26_mismatch_to_fresh_step4.png") });
    });

    await test("27. Step 4 has no Ondo cards: AAPLon absent, no substitution", async () => {
      const lonePosts = [];
      const onReq = req => {
        if (req.method() === "POST" && req.url().endsWith("/api/v1/preflight")) lonePosts.push(req.postData());
      };
      page.on("request", onReq);
      try {
        await page.click("#tracker-step-4");
        await page.waitForSelector("#stock-cards-container .stock-card-standalone", { timeout: 15000 });
        // AAPLon must not exist anywhere in the execution feed.
        if (await page.$("#stock-card-AAPLon")) {
          throw new Error("AAPLon must be absent from the Step-4 execution feed");
        }
        const counts = await page.evaluate(() => ({
          total: document.querySelectorAll("#stock-cards-container .stock-card-standalone").length,
          forms: document.querySelectorAll("#stock-cards-container .stock-trade-form").length,
          allPill: document.querySelector('.trade-category-pill[data-category="ALL"]')?.textContent || ""
        }));
        if (counts.total !== 12) throw new Error(`Expected 12 execution cards, found ${counts.total}`);
        if (counts.forms !== 12) throw new Error(`Expected 12 trade forms, found ${counts.forms}`);
        if (!counts.allPill.includes("12")) throw new Error(`All pill must read All (12), got: ${counts.allPill}`);
        // Searching AAPLon must yield zero results and substitute nothing.
        await page.fill("#trade-search-input", "AAPLon");
        await page.waitForTimeout(300);
        const afterSearch = await page.evaluate(() => ({
          visible: document.querySelectorAll("#stock-cards-container .stock-card-standalone:not(.hidden)").length,
          aaplxVisible: document.querySelectorAll("#stock-card-AAPLx:not(.hidden)").length,
          emptyShown: !document.getElementById("trade-search-empty-state")?.classList.contains("hidden")
        }));
        if (afterSearch.visible !== 0) throw new Error("Search AAPLon must yield zero Step-4 results");
        if (afterSearch.aaplxVisible !== 0) throw new Error("Search AAPLon must not substitute AAPLx");
        if (!afterSearch.emptyShown) throw new Error("Empty state must appear on zero matches");
        const aaplxPosts = lonePosts.filter(p => (p || "").includes("AAPLon") || (p || "").includes('"stock":"AAPLx"'));
        if (aaplxPosts.length !== 0) throw new Error("AAPLon search must cause zero execution POSTs");
        await page.click("#trade-clear-search-btn");
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, "27_step4_no_ondo_cards.png") });
      } finally {
        page.off("request", onReq);
      }
    });

    // 30. Trade feed search (013.10A §6): supported-only feed truth
    await test("30. Trade Search searches the supported feed only, no substitution", async () => {
      await page.click("#tracker-step-4");
      await page.waitForSelector("#stock-cards-container .stock-card-standalone", { timeout: 15000 });

      await page.fill("#trade-search-input", "apple");
      await page.waitForTimeout(300);
      const appleVisible = await page.evaluate(() => ({
        aaplx: document.querySelectorAll("#stock-card-AAPLx:not(.hidden)").length,
        total: document.querySelectorAll("#stock-cards-container .stock-card-standalone:not(.hidden)").length
      }));
      if (appleVisible.aaplx !== 1 || appleVisible.total !== 1) {
        throw new Error(`Search Apple must show only AAPLx, got ${JSON.stringify(appleVisible)}`);
      }

      await page.fill("#trade-search-input", "aaplx");
      await page.waitForTimeout(300);
      const symVisible = await page.evaluate(() => ({
        aaplx: document.querySelectorAll("#stock-card-AAPLx:not(.hidden)").length,
        total: document.querySelectorAll("#stock-cards-container .stock-card-standalone:not(.hidden)").length
      }));
      if (symVisible.aaplx !== 1 || symVisible.total !== 1) {
        throw new Error(`Symbol search must isolate AAPLx, got ${JSON.stringify(symVisible)}`);
      }

      await page.fill("#trade-search-input", "ondo");
      await page.waitForTimeout(300);
      const ondoVisible = await page.evaluate(() => document.querySelectorAll("#stock-cards-container .stock-card-standalone:not(.hidden)").length);
      if (ondoVisible !== 0) throw new Error(`Search Ondo must yield zero Step-4 results, got ${ondoVisible}`);
      const emptyOndo = await page.isVisible("#trade-search-empty-state");
      if (!emptyOndo) throw new Error("Empty state must appear for Ondo search");

      await page.fill("#trade-search-input", "AAPLon");
      await page.waitForTimeout(300);
      const aaplonVisible = await page.evaluate(() => ({
        total: document.querySelectorAll("#stock-cards-container .stock-card-standalone:not(.hidden)").length,
        aaplx: document.querySelectorAll("#stock-card-AAPLx:not(.hidden)").length
      }));
      if (aaplonVisible.total !== 0 || aaplonVisible.aaplx !== 0) {
        throw new Error(`Search AAPLon must yield zero results with no AAPLx substitution, got ${JSON.stringify(aaplonVisible)}`);
      }

      await page.click("#trade-clear-search-btn");
      await page.waitForTimeout(300);
      const restored = await page.evaluate(() => document.querySelectorAll("#stock-cards-container .stock-card-standalone:not(.hidden)").length);
      if (restored !== 12) throw new Error(`Clearing search must restore 12 cards, got ${restored}`);

      await page.fill("#trade-search-input", "zzz-no-match");
      await page.waitForTimeout(300);
      const emptyVisible = await page.isVisible("#trade-search-empty-state");
      if (!emptyVisible) throw new Error("Empty search state must appear on zero matches");
      await page.click("#trade-empty-clear-search-btn");
      await page.waitForTimeout(300);

      // Original category pills still work on the restored feed.
      await page.click('.trade-category-pill[data-category="Crypto & AI"]');
      await page.waitForTimeout(300);
      const catVisible = await page.evaluate(() => ({
        coinx: document.querySelectorAll("#stock-card-COINx:not(.hidden)").length,
        aaplx: document.querySelectorAll("#stock-card-AAPLx:not(.hidden)").length
      }));
      if (catVisible.coinx !== 1) throw new Error("Crypto & AI pill must show COINx");
      if (catVisible.aaplx !== 0) throw new Error("Crypto & AI pill must hide AAPLx");
      await page.click('.trade-category-pill[data-category="ALL"]');
      await page.waitForTimeout(300);

      // Keyboard operability: focused card header toggles with Enter.
      await page.focus("#stock-card-AAPLx .stock-card-header");
      await page.keyboard.press("Enter");
      await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
      await page.keyboard.press(" ");
      await page.waitForFunction(() => document.querySelector("#stock-card-AAPLx .stock-card-body")?.classList.contains("hidden"), { timeout: 15000 });
    });

    // 31-33. Market-context truth (013.11 A-D)
    await test("31. Form Helper mirrors live form state, never stale", async () => {
      await page.click("#tracker-step-4");
      await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
      await page.click("#stock-card-AAPLx .stock-card-header");
      await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
      const hint = () => page.evaluate(() => {
        const el = document.querySelector("#stock-card-AAPLx .submit-gating-hint");
        return { hidden: el?.classList.contains("hidden"), text: el?.textContent || "" };
      });

      let h = await hint();
      if (h.hidden || !h.text.includes("Select USDC or SOL and enter an amount")) {
        throw new Error(`Fresh helper must carry the full instruction, got: ${JSON.stringify(h)}`);
      }
      await page.fill("#stock-card-AAPLx .amount-input", "2");
      await page.waitForTimeout(200);
      h = await hint();
      if (h.hidden || !h.text.includes("Select USDC or SOL to check this trade")) {
        throw new Error(`Amount-only helper must request an asset, got: ${JSON.stringify(h)}`);
      }
      await page.click("#stock-card-AAPLx .payment-tab[data-asset='SOL']");
      await page.waitForTimeout(200);
      h = await hint();
      if (!h.hidden) throw new Error(`Valid SOL+2 must hide the gating helper, got: ${JSON.stringify(h)}`);
      await page.fill("#stock-card-AAPLx .amount-input", "");
      await page.waitForTimeout(200);
      h = await hint();
      if (h.hidden || !h.text.includes("Enter an amount to check this trade")) {
        throw new Error(`Asset-only helper must request an amount, got: ${JSON.stringify(h)}`);
      }
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "31_form_helper_states.png") });
    });

    await test("32. Post-Market Truth: live route separated from stale benchmark, no weekday invented", async () => {
      const MONDAY_TS = "2026-09-14T00:00:00.000Z";
      const stubBench = (over = {}) => ({
        request_status: "SUCCESS", verification_status: "UNABLE_TO_VERIFY", verdict: "UNABLE_TO_VERIFY",
        preflight_level: "QUOTE_CHECK", reason_codes: ["STALE_REFERENCE"], reason: "Underlying reference is stale.",
        trade: {
          input_asset: "SOL", input_amount: 2, input_usd_value: 206.18,
          input_mint: "So11111111111111111111111111111111111111112",
          input_asset_price_usd: 103.09, input_asset_price_timestamp: new Date().toISOString(),
          input_asset_price_source: "CoinGecko Real-Time Spot Feed", input_asset_price_provider: "CoinGecko Real-Time Spot Feed",
          input_asset_price_freshness: "FRESH", stock_symbol: "AAPLx", canonical_stock: "AAPL",
          token_mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
          token_program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
          ...over.trade
        },
        benchmark: {
          symbol: "AAPLx", price: 332.27, source: "Nasdaq Official Public Equity Quote API (api.nasdaq.com)",
          source_type: "OFFICIAL_MARKET_DATA_PROVIDER", provider: "Last known Nasdaq reference, not eligible",
          timestamp: MONDAY_TS, freshness_status: "STALE", is_real_time: false,
          market_context: { session: "POST_MARKET", underlying_reference_available: false, reference_eligibility: "INELIGIBLE_STALE" },
          ...over.benchmark
        },
        economics: {
          raw_out_amount: "61918", expected_stock_shares: 0.619188, underlying_benchmark_price: 332.27,
          expected_stock_exposure_usd: 205.74, effective_price_per_share: 332.99, difference_usd: -0.44, difference_pct: -0.21,
          multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
        },
        dex_route: { router: "Jupiter Swap V2", mode: "QUOTE_CHECK", steps: ["SOL", "AAPLx"], price_impact_pct: "0.0100" },
        alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
        simulation: { status: "NOT_RUN", err: null, units_consumed: 0 }
      });
      await page.route("**/api/v1/preflight", async route => {
        const req = route.request();
        if (req.method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stubBench()) });
      });
      try {
        await page.click("#tracker-step-4");
        await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .stock-card-header");
        await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .payment-tab[data-asset='SOL']");
        await page.fill("#stock-card-AAPLx .amount-input", "2");
        // Scheduler poll must render route-live status with separated session context.
        await page.waitForFunction(() => {
          const el = document.querySelector("#stock-card-AAPLx .live-benchmark-context");
          return el && !el.classList.contains("hidden") && el.textContent.includes("Post-market");
        }, { timeout: 15000 });
        const badge = await page.textContent("#stock-card-AAPLx .live-route-status");
        if (!badge.includes("Route Live")) throw new Error(`Route badge must read live, got: ${badge}`);
        const ctx = await page.textContent("#stock-card-AAPLx .live-benchmark-context");
        if (!/Post-market/.test(ctx) || !/stale/i.test(ctx)) throw new Error(`Preview context must separate session/benchmark: ${ctx}`);

        await page.click("#stock-card-AAPLx .submit-trade-btn");
        await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
        const cardText = await page.textContent("#stock-card-AAPLx .inline-result-container");
        if (/Market Closed/.test(cardText)) throw new Error("Live route must never be labeled Market Closed");
        if (/Friday/.test(cardText)) throw new Error(`Monday reference must not render Friday: ${cardText.slice(0, 300)}`);
        for (const phrase of ["TRADE CHECK COMPLETE", "Monday", "Sep 14, 2026", "post-market"]) {
          if (!cardText.includes(phrase)) throw new Error(`Result must contain '${phrase}': ${cardText.slice(0, 400)}`);
        }
        const diffPct = await page.textContent("#stock-card-AAPLx .res-diff-pct");
        if (!diffPct.includes("vs Monday reference")) throw new Error(`Diff must derive Monday reference: ${diffPct}`);
        const evRef = await page.textContent("#stock-card-AAPLx .ev-reference-status");
        if (!evRef.includes("Sep 14, 2026")) throw new Error(`Evidence must agree on reference date: ${evRef}`);
        const evSess = await page.textContent("#stock-card-AAPLx .ev-session");
        if (!evSess.includes("POST_MARKET")) throw new Error(`Evidence must keep raw session enum: ${evSess}`);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, "32_postmarket_truth.png") });
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("33. Reference Weekday derives from timestamp: Friday, Monday, unknown", async () => {
      const econ = {
        raw_out_amount: "61918", expected_stock_shares: 0.619188, underlying_benchmark_price: 332.27,
        expected_stock_exposure_usd: 205.74, effective_price_per_share: 332.99, difference_usd: -0.44, difference_pct: -0.21,
        multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
      };
      const queue = [
        { amount: 500, ts: "2026-09-11T00:00:00.000Z", want: "Friday", date: "Sep 11, 2026", dpct: -0.21, dusd: -0.44 },
        { amount: 501, ts: "2026-09-14T00:00:00.000Z", want: "Monday", date: "Sep 14, 2026", dpct: -0.21, dusd: -0.44 },
        { amount: 502, ts: null, want: null, date: null, dpct: -0.21, dusd: -0.44 },
        { amount: 503, ts: "2026-09-11T00:00:00.000Z", want: "Friday", date: "Sep 11, 2026", closed: true, dpct: -0.33, dusd: -0.69 }
      ];
      const byAmount = Object.fromEntries(queue.map(q => [q.amount, q]));
      const buildBody = (entry) => JSON.stringify({
        request_status: "SUCCESS", verification_status: "UNABLE_TO_VERIFY", verdict: "UNABLE_TO_VERIFY",
        preflight_level: "QUOTE_CHECK",
        reason_codes: entry.ts ? (entry.closed ? ["MARKET_CLOSED_OR_AFTER_HOURS"] : ["STALE_REFERENCE"]) : ["REFERENCE_UNAVAILABLE"],
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
          provider: "Last known Nasdaq reference, not eligible", timestamp: entry.ts, freshness_status: entry.ts ? (entry.closed ? "AFTER_HOURS_CLOSE" : "STALE") : "UNKNOWN",
          is_real_time: false,
          market_context: { session: entry.closed ? "CLOSED" : "OVERNIGHT", underlying_reference_available: false, reference_eligibility: entry.ts ? (entry.closed ? "INELIGIBLE_CLOSED" : "INELIGIBLE_STALE") : "INELIGIBLE_UNKNOWN" }
        },
        economics: { ...econ, difference_usd: entry.dusd, difference_pct: entry.dpct },
        dex_route: { router: "Jupiter Swap V2", mode: "QUOTE_CHECK", steps: ["USDC", "AAPLx"], price_impact_pct: "0.0100" },
        alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
        simulation: { status: "NOT_RUN", err: null, units_consumed: 0 }
      });
      await page.route("**/api/v1/preflight", async route => {
        const req = route.request();
        if (req.method() !== "POST") { await route.continue(); return; }
        let amount = 500;
        try { amount = JSON.parse(req.postData() || "{}").amount || 500; } catch {}
        const entry = byAmount[amount] || queue[0];
        await route.fulfill({ status: 200, contentType: "application/json", body: buildBody(entry) });
      });
      try {
        await page.click("#tracker-step-4");
        await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .stock-card-header");
        await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
        for (const { amount, want, closed } of queue) {
          await page.fill("#stock-card-AAPLx .amount-input", String(amount));
          await page.waitForTimeout(200);
          const prevDiff = await page.textContent("#stock-card-AAPLx .res-diff-pct");
          await page.click("#stock-card-AAPLx .submit-trade-btn");
          // Diff text must advance: proves this submit (not a stale render) completed.
          await page.waitForFunction(prev => {
            const el = document.querySelector("#stock-card-AAPLx .res-diff-pct");
            return el && el.textContent !== prev;
          }, prevDiff, { timeout: 35000 });
          await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
          // Locked copy rule (014 §4): close-claims only with source proof.
          const closeClaim = await page.evaluate(() => {
            const t = document.querySelector("#stock-card-AAPLx .inline-result-container")?.innerText || "";
            return /Monday close|Tuesday close|Wednesday close|Thursday close|Friday close|Saturday close|Sunday close|previous close|last market close/i.test(t) ? t.slice(0, 300) : null;
          });
          if (closeClaim) throw new Error(`Unproven close claim in result: ${closeClaim}`);
          const diff = await page.textContent("#stock-card-AAPLx .res-diff-pct");
          const expl = await page.textContent("#stock-card-AAPLx .res-explanation");
          const evRef = await page.textContent("#stock-card-AAPLx .ev-reference-status");
          if (want && !closed) {
            if (!diff.includes(`vs ${want} reference`)) throw new Error(`Diff must derive ${want}: ${diff}`);
            if (!expl.includes(want)) throw new Error(`Explanation must agree on ${want}`);
            if (!evRef.includes(want === "Friday" ? "Sep 11, 2026" : "Sep 14, 2026")) {
              throw new Error(`Evidence must agree on date: ${evRef}`);
            }
            const subW = await page.textContent("#stock-card-AAPLx .verdict-subtitle");
            if (!/stale/i.test(subW)) throw new Error(`Proven-stale subtitle may say stale: ${subW}`);
          } else if (want && closed) {
            if (!diff.includes(`vs ${want} reference`)) throw new Error(`Closed diff must derive ${want}: ${diff}`);
            const subC = await page.textContent("#stock-card-AAPLx .verdict-subtitle");
            if (!/traditional market is closed/i.test(subC)) throw new Error(`Closed subtitle must state closure: ${subC}`);
            if (!evRef.includes("Sep 11, 2026 reference")) throw new Error(`Closed evidence must agree on date: ${evRef}`);
            if (/\bstale\b/i.test(subC)) throw new Error(`Closed (non-stale) reference must not be called stale: ${subC}`);
          } else {
            if (/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/.test(diff + expl + evRef)) {
              throw new Error(`Unknown timestamp must not invent a weekday: ${diff} | ${evRef}`);
            }
            if (!/timestamp unavailable/i.test(expl + evRef)) {
              throw new Error("Unknown timestamp must say so honestly");
            }
            const sub = await page.textContent("#stock-card-AAPLx .verdict-subtitle");
            if (/stale/i.test(sub)) throw new Error(`Unknown reference must never be called stale: ${sub}`);
            if (!/freshness could not be verified/i.test(sub)) {
              throw new Error(`Unknown subtitle must state unverifiable freshness: ${sub}`);
            }
          }
          await page.waitForTimeout(400);
        }
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("34. Preview States: standby initial, confirmed live, failed neutral", async () => {
      // C. Fresh expand, no confirmed route: neutral standby, no live claim.
      await page.click("#tracker-step-4");
      await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
      await page.click("#stock-card-AAPLx .stock-card-header");
      await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
      const initialBadge = await page.textContent("#stock-card-AAPLx .live-route-status");
      if (/Route Live|Live Route Active|Market Closed/.test(initialBadge)) {
        throw new Error(`Initial preview must be neutral standby, got: ${initialBadge}`);
      }
      const ctxHidden = await page.$eval("#stock-card-AAPLx .live-benchmark-context", el => el.classList.contains("hidden"));
      if (!ctxHidden) throw new Error("Benchmark context must stay hidden before any confirmed route");

      // D. Confirmed route with UNKNOWN benchmark: Route Live + separated context.
      await page.route("**/api/v1/preflight", async route => {
        const req = route.request();
        if (req.method() !== "POST") { await route.continue(); return; }
        await route.fulfill({
          status: 200, contentType: "application/json",
          body: JSON.stringify({
            request_status: "SUCCESS", verification_status: "UNABLE_TO_VERIFY", verdict: "UNABLE_TO_VERIFY",
            preflight_level: "QUOTE_CHECK", reason_codes: ["REFERENCE_UNAVAILABLE"],
            trade: {
              input_asset: "SOL", input_amount: 2, input_usd_value: 206.18,
              input_mint: "So11111111111111111111111111111111111111112",
              input_asset_price_usd: 103.09, input_asset_price_timestamp: new Date().toISOString(),
              input_asset_price_source: "CoinGecko Real-Time Spot Feed", input_asset_price_provider: "CoinGecko Real-Time Spot Feed",
              input_asset_price_freshness: "FRESH", stock_symbol: "AAPLx", canonical_stock: "AAPL",
              token_mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
              token_program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
            },
            benchmark: {
              symbol: "AAPLx", price: 332.27, source: "Nasdaq", source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
              provider: "Last known Nasdaq reference, not eligible", timestamp: null, freshness_status: "UNKNOWN",
              is_real_time: false,
              market_context: { session: "POST_MARKET", underlying_reference_available: false, reference_eligibility: "INELIGIBLE_UNKNOWN" }
            },
            economics: {
              raw_out_amount: "61918", expected_stock_shares: 0.619188, underlying_benchmark_price: 332.27,
              expected_stock_exposure_usd: 205.74, effective_price_per_share: 332.99, difference_usd: -0.44, difference_pct: -0.21,
              multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
            },
            dex_route: { router: "Jupiter Swap V2", mode: "QUOTE_CHECK", steps: ["SOL", "AAPLx"], price_impact_pct: "0.0100" },
            alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
            simulation: { status: "NOT_RUN", err: null, units_consumed: 0 }
          })
        });
      });
      try {
        await page.click("#stock-card-AAPLx .payment-tab[data-asset='SOL']");
        await page.fill("#stock-card-AAPLx .amount-input", "2");
        await page.waitForFunction(() => {
          const el = document.querySelector("#stock-card-AAPLx .live-benchmark-context");
          return el && !el.classList.contains("hidden") && el.textContent.includes("Post-market");
        }, { timeout: 15000 });
        const liveBadge = await page.textContent("#stock-card-AAPLx .live-route-status");
        if (!liveBadge.includes("Route Live")) throw new Error(`Confirmed route must read Route Live, got: ${liveBadge}`);
        const liveCtx = await page.textContent("#stock-card-AAPLx .live-benchmark-context");
        if (!/Post-market/.test(liveCtx) || !/unavailable/i.test(liveCtx)) {
          throw new Error(`Confirmed context must separate session/benchmark: ${liveCtx}`);
        }
        if (/stale/i.test(liveCtx)) throw new Error(`Unknown benchmark must not read stale in preview: ${liveCtx}`);
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
      await page.screenshot({ path: path.join(EVIDENCE_DIR, "34_preview_states.png") });

      // E. Scheduler failure: no live-route claim may remain.
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() === "POST") await route.abort("failed");
        else await route.continue();
      });
      try {
        await page.click("#tracker-step-4"); // fresh feed, neutral badge again
        await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .stock-card-header");
        await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .payment-tab[data-asset='SOL']");
        await page.fill("#stock-card-AAPLx .amount-input", "2");
        await page.waitForTimeout(2500);
        const failBadge = await page.textContent("#stock-card-AAPLx .live-route-status");
        if (/Route Live|Live Route Active|Market Closed/.test(failBadge)) {
          throw new Error(`Failed preview must not claim a live route, got: ${failBadge}`);
        }
        // Submit under total upstream failure: truthful connection error, no crash.
        await page.click("#stock-card-AAPLx .submit-trade-btn");
        await page.waitForSelector("#stock-card-AAPLx .inline-error-state:not(.hidden)", { timeout: 35000 });
        const connErr = await page.textContent("#stock-card-AAPLx .inline-error-state");
        if (!/We Couldn.t Check This Trade/i.test(connErr)) {
          throw new Error(`Connection failure must render honestly: ${connErr.slice(0, 200)}`);
        }
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    // 35-48. Handoff revalidation (015 A-M + exact-mode wallet rule)
    await test("35. No hidden revalidation: zero POSTs until explicit click", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        const idle = seenPreflightPosts.length;
        await page.waitForTimeout(3000);
        if (seenPreflightPosts.length !== idle) throw new Error("Revalidation must never fire automatically");
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        if (seenPreflightPosts.length !== idle + 1) {
          throw new Error(`Exactly one revalidation POST expected, got ${seenPreflightPosts.length - idle}`);
        }
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("36. Revalidation preserves exact intent including wallet null", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        const before = seenPreflightPosts.length;
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const posts = seenPreflightPosts.slice(before);
        if (posts.length !== 1) throw new Error("Expected exactly one revalidation POST");
        const payload = JSON.parse(posts[0].postData);
        for (const [k, v] of [["inputAsset", "USDC"], ["stock", "AAPLx"], ["amount", 500]]) {
          if (payload[k] !== v) throw new Error(`Revalidation intent mismatch on ${k}: ${JSON.stringify(payload)}`);
        }
        if (payload.wallet !== null && payload.wallet !== undefined) {
          throw new Error(`Revalidation must be walletless, got: ${payload.wallet}`);
        }
        if (payload.refreshBenchmark !== true) {
          throw new Error("Revalidation must force a fresh Benchmark V3 resolution");
        }
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("37. Original snapshot stays immutable after revalidation", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        const spendBefore = await page.textContent("#stock-card-AAPLx .res-spend-val");
        const freezeBefore = await page.textContent("#stock-card-AAPLx .res-freeze-timestamp");
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const spendAfter = await page.textContent("#stock-card-AAPLx .res-spend-val");
        const freezeAfter = await page.textContent("#stock-card-AAPLx .res-freeze-timestamp");
        if (spendBefore !== spendAfter || freezeBefore !== freezeAfter) {
          throw new Error("Snapshot A must remain unchanged after revalidation");
        }
        await page.screenshot({ path: path.join(EVIDENCE_DIR, "35_revalidation_result.png") });
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("38. Changed output shows exact negative delta, no verdict label", async () => {
      const bFixture = revalQuoteFixture({ economics: { expected_stock_shares: 1.49, expected_stock_exposure_usd: 495.08, difference_usd: -4.92, difference_pct: -0.98 } });
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        // Re-arm: every revalidation POST from here gets snapshot B.
        await page.unroute("**/api/v1/preflight");
        await page.route("**/api/v1/preflight", async route => {
          if (route.request().method() !== "POST") { await route.continue(); return; }
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bFixture) });
        });
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const box = await page.evaluate(() => {
          const b = document.querySelector("#stock-card-AAPLx .handoff-revalidate-box");
          const t = s => b.querySelector(s)?.textContent.trim() || "";
          return { latest: t(".reval-new-shares"), change: t(".reval-change"), all: b.innerText };
        });
        if (!box.latest.startsWith("1.49")) throw new Error(`Latest must read 1.49, got: ${box.latest}`);
        if (!box.change.includes("-0.010000") || !box.change.includes("-0.67%")) {
          throw new Error(`Change must read -0.010000 (-0.67%), got: ${box.change}`);
        }
        if (/SAFE|looks good|BAD FILL/i.test(box.all)) throw new Error("No verdict labels allowed on deltas");
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("39. Improved output shows factual positive delta, never saved", async () => {
      const bFixture = revalQuoteFixture({ economics: { expected_stock_shares: 1.52, expected_stock_exposure_usd: 505.05, difference_usd: 5.05, difference_pct: 1.01 } });
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        await page.unroute("**/api/v1/preflight");
        await page.route("**/api/v1/preflight", async route => {
          if (route.request().method() !== "POST") { await route.continue(); return; }
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bFixture) });
        });
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const box = await page.evaluate(() => {
          const b = document.querySelector("#stock-card-AAPLx .handoff-revalidate-box");
          return b.innerText;
        });
        if (!box.includes("+0.020000") || !box.includes("+1.33%")) throw new Error(`Positive delta missing: ${box.slice(0, 300)}`);
        if (/saved/i.test(box)) throw new Error("Must never claim savings");
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("40. Same route fingerprint reads SAME ROUTE OBSERVED", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const routeText = await page.textContent("#stock-card-AAPLx .reval-route");
        if (!routeText.includes("Same route observed")) throw new Error(`Expected SAME ROUTE OBSERVED, got: ${routeText}`);
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("41. Changed fingerprint reads ROUTE UPDATED", async () => {
      const bFixture = revalQuoteFixture({ dex_route: { steps: ["USDC", "Raydium", "AAPLx"] } });
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        await page.unroute("**/api/v1/preflight");
        await page.route("**/api/v1/preflight", async route => {
          if (route.request().method() !== "POST") { await route.continue(); return; }
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(bFixture) });
        });
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const routeText = await page.textContent("#stock-card-AAPLx .reval-route");
        if (!routeText.includes("Route updated")) throw new Error(`Expected ROUTE UPDATED, got: ${routeText}`);
        const latest = await page.textContent("#stock-card-AAPLx .reval-new-shares");
        if (!latest.includes("1.5")) throw new Error("Updated economics must still display");
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("42. Missing route identity reads FRESH ROUTE RECEIVED, never guessed", async () => {
      let call = 0;
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        const fixture = call++ === 0
          ? revalQuoteFixture()
          : revalQuoteFixture({ dex_route: { router: "", steps: [] } });
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const routeText = await page.textContent("#stock-card-AAPLx .reval-route");
        if (!routeText.includes("Fresh route received")) throw new Error(`Expected FRESH ROUTE RECEIVED, got: ${routeText}`);
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("43. Stale benchmark revalidates with warning, verdict stays unavailable", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const bench = await page.textContent("#stock-card-AAPLx .reval-bench");
        if (!/stale/i.test(bench) || !/Sep 14, 2026/.test(bench)) {
          throw new Error(`Benchmark line must carry stale state: ${bench}`);
        }
        const warn = await page.textContent("#stock-card-AAPLx .reval-warning");
        if (!/remains unavailable/i.test(warn)) throw new Error(`Warning must persist: ${warn}`);
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("44. Unknown benchmark revalidates as unavailable, never stale", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture(revalBenchUnknown())) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const box = await page.evaluate(() => document.querySelector("#stock-card-AAPLx .handoff-revalidate-box").innerText);
        if (!/unavailable/i.test(box)) throw new Error(`Unknown benchmark must read unavailable: ${box.slice(0, 300)}`);
        if (/\bstale\b/i.test(box)) throw new Error(`Unknown benchmark must never read stale: ${box.slice(0, 300)}`);
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("45. Revalidation failure shows retry, hides continue, keeps old snapshot honest", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({
          status: 503, contentType: "application/json",
          body: JSON.stringify({ request_status: "ERROR", reason_codes: ["UPSTREAM_UNAVAILABLE"], reason: "Jupiter unavailable in fixture" })
        });
      });
      try {
        // Seed snapshot A directly with a good response first.
        await page.unroute("**/api/v1/preflight");
        await page.route("**/api/v1/preflight", async route => {
          if (route.request().method() !== "POST") { await route.continue(); return; }
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
        });
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        // Now fail every revalidation attempt.
        await page.unroute("**/api/v1/preflight");
        await page.route("**/api/v1/preflight", async route => {
          if (route.request().method() !== "POST") { await route.continue(); return; }
          await route.fulfill({
            status: 503, contentType: "application/json",
            body: JSON.stringify({ request_status: "ERROR", reason_codes: ["UPSTREAM_UNAVAILABLE"], reason: "Jupiter unavailable in fixture" })
          });
        });
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-error:not(.hidden)", { timeout: 15000 });
        const errBox = await page.evaluate(() => {
          const card = document.getElementById("stock-card-AAPLx");
          return {
            text: card.querySelector(".revalidation-error")?.innerText || "",
            continueVisible: card.querySelector(".jupiter-continue-link")?.offsetParent !== null,
            btnLabel: card.querySelector(".revalidate-btn")?.innerText.trim() || ""
          };
        });
        if (!/couldn.t revalidate/i.test(errBox.text)) throw new Error("Failure copy missing");
        if (errBox.continueVisible) throw new Error("No CONTINUE action may show on failure");
        if (!/try again/i.test(errBox.btnLabel)) throw new Error(`Retry must be primary, got: ${errBox.btnLabel}`);
        // Retry through the same failing stub keeps failing honestly (no fake success).
        await page.click("#stock-card-AAPLx .revalidate-retry-btn");
        await page.waitForTimeout(1500);
        const stillErr = await page.evaluate(() => !document.querySelector("#stock-card-AAPLx .revalidation-error")?.classList.contains("hidden"));
        if (!stillErr) throw new Error("Persistent failure must keep failing honestly");
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("46. Double click issues exactly one revalidation request", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        const before = seenPreflightPosts.length;
        await page.evaluate(() => {
          const btn = document.querySelector("#stock-card-AAPLx .revalidate-btn");
          btn.click();
          btn.click();
        });
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        if (seenPreflightPosts.length - before !== 1) {
          throw new Error(`Double click must issue one request, got ${seenPreflightPosts.length - before}`);
        }
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("47. Mobile revalidation stays readable with usable CTA", async () => {
      const mobContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
      const mobPage = await mobContext.newPage();
      try {
        await mobPage.route("**/api/v1/preflight", async route => {
          if (route.request().method() !== "POST") { await route.continue(); return; }
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
        });
        await mobPage.goto(BASE_URL, { waitUntil: "networkidle" });
        await mobPage.click("#hero-open-app-btn");
        await mobPage.click("#tracker-step-4");
        await mobPage.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
        await mobPage.click("#stock-card-AAPLx .stock-card-header");
        await mobPage.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
        await mobPage.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
        await mobPage.fill("#stock-card-AAPLx .amount-input", "500");
        await mobPage.click("#stock-card-AAPLx .submit-trade-btn");
        await mobPage.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
        await mobPage.click("#stock-card-AAPLx .revalidate-btn");
        await mobPage.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const paint = await mobPage.evaluate(() => {
          const box = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { w: r.width, h: r.height };
          };
          return {
            box: box("#stock-card-AAPLx .revalidation-result"),
            cont: box("#stock-card-AAPLx .jupiter-continue-link"),
            overflow: document.documentElement.scrollWidth > window.innerWidth
          };
        });
        if (!paint.box || !(paint.box.w > 0 && paint.box.h > 0)) throw new Error("Mobile comparison must paint");
        if (!paint.cont || !(paint.cont.w > 0 && paint.cont.h > 0)) throw new Error("Mobile CTA must be usable");
        if (paint.overflow) throw new Error("Mobile revalidation must not overflow");
        await mobPage.screenshot({ path: path.join(EVIDENCE_DIR, "35_mobile_revalidation.png") });
      } finally {
        await mobContext.close();
      }
    });

    await test("48. Exact-mode revalidation stays walletless by default", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        const body = JSON.parse(reqBodyOf(route) || "{}");
        const exact = body.wallet ? true : false;
        const fixture = exact
          ? { ...revalQuoteFixture(), preflight_level: "EXACT_SIMULATION", simulation: { status: "PASS", err: null, units_consumed: 42000 } }
          : revalQuoteFixture();
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture) });
      });
      function reqBodyOf(route) {
        try { return route.request().postData(); } catch { return null; }
      }
      try {
        await openFreshTradeCard(page);
        await page.click("#stock-card-AAPLx .exact-sim-toggle");
        await page.waitForSelector("#stock-card-AAPLx .exact-sim-body:not(.hidden)", { timeout: 15000 });
        // A previously entered address persists globally, leaving the
        // fallback box already open: only toggle when actually collapsed.
        const manualOpen = await page.$eval("#stock-card-AAPLx .exact-sim-manual-box", el => !el.classList.contains("hidden"));
        if (!manualOpen) {
          await page.click("#stock-card-AAPLx .exact-sim-manual-toggle");
          await page.waitForSelector("#stock-card-AAPLx .exact-sim-manual-box:not(.hidden)", { timeout: 15000 });
        }
        await page.fill("#stock-card-AAPLx .exact-address-input", "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM");
        await fillTradeAndCheck(page, "USDC", 500);
        const before = seenPreflightPosts.length;
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const posts = seenPreflightPosts.slice(before);
        if (posts.length !== 1) throw new Error("Expected exactly one revalidation POST");
        const payload = JSON.parse(posts[0].postData);
        if (payload.wallet !== null && payload.wallet !== undefined) {
          throw new Error(`Default revalidation must be walletless, got: ${payload.wallet}`);
        }
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    // 49-51. Benchmark V2 presentation (016)
    await test("49. Indicative reference renders honestly, never certified", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({
          status: 200, contentType: "application/json",
          body: JSON.stringify({
            request_status: "SUCCESS", verification_status: "UNABLE_TO_VERIFY", verdict: "UNABLE_TO_VERIFY",
            preflight_level: "QUOTE_CHECK", reason_codes: ["INDICATIVE_REFERENCE_UNVERIFIED"],
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
              symbol: "AAPLx", price: 330.94, source: "xStocks Public Price Data",
              source_type: "INDICATIVE_ASSET_PRICE", provider: "xStocks Public Price Data (indicative)",
              upstream_source: "On-chain providers (cached) + Nasdaq (Blue Ocean overnight/extended hours)",
              timestamp: null, source_timestamp: null, fetched_at: new Date().toISOString(), reference_date: null,
              age_ms: null, reference_session: "UNKNOWN", current_market_session: "OVERNIGHT",
              freshness_status: "INDICATIVE_UNVERIFIED", is_real_time: false,
              market_context: { session: "OVERNIGHT", underlying_reference_available: false, reference_eligibility: "INELIGIBLE_INDICATIVE" }
            },
            economics: {
              raw_out_amount: "151127287", expected_stock_shares: 1.511273,
              underlying_benchmark_price: 330.94, expected_stock_exposure_usd: 500.12,
              effective_price_per_share: 330.86, difference_usd: 0.12, difference_pct: 0.02,
              multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
            },
            dex_route: { router: "Jupiter Swap V2", mode: "QUOTE_CHECK", steps: ["USDC", "AAPLx"], price_impact_pct: "0.0100" },
            alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
            simulation: { status: "NOT_RUN", err: null, units_consumed: 0 }
          })
        });
      });
      try {
        await page.click("#tracker-step-4");
        await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .stock-card-header");
        await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
        await page.fill("#stock-card-AAPLx .amount-input", "500");
        await page.click("#stock-card-AAPLx .submit-trade-btn");
        await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
        const box = await page.evaluate(() => {
          const c = document.getElementById("stock-card-AAPLx");
          const t = s => c.querySelector(s)?.textContent || "";
          return { sub: t(".verdict-subtitle"), expl: t(".res-explanation"), diff: t(".res-diff-pct"), evRef: t(".ev-reference-status"), evUp: t(".ev-upstream-source"), all: c.querySelector(".inline-result-container").innerText };
        });
        if (!/latest overnight indicative reference/i.test(box.sub)) throw new Error(`Subtitle must state indicative: ${box.sub.slice(0, 200)}`);
        if (!/could not be verified|unverified/i.test(box.sub + box.expl)) throw new Error("Indicative must disclose unverified timestamp");
        if (!/vs latest indicative reference/i.test(box.diff)) throw new Error(`Diff must reference indicative: ${box.diff}`);
        if (!/Indicative/.test(box.evRef) || !/Blue Ocean/.test(box.evUp)) throw new Error(`Evidence must carry provenance: ${box.evRef} | ${box.evUp}`);
        if (/\bstale\b/i.test(box.all)) throw new Error("Indicative must never read stale");
        if (/FAIR|CAUTION|BAD FILL/.test(box.all)) throw new Error("Indicative must not certify fairness");
        await page.screenshot({ path: path.join(EVIDENCE_DIR, "36_indicative_reference.png") });
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("50. Eligible session labels render per session without enum text", async () => {
      for (const [session, label] of [["REGULAR", "Current market reference"], ["OVERNIGHT", "Current market reference"]]) {
        await page.route("**/api/v1/preflight", async route => {
          if (route.request().method() !== "POST") { await route.continue(); return; }
          const nowIso = new Date().toISOString();
          await route.fulfill({
            status: 200, contentType: "application/json",
            body: JSON.stringify({
              request_status: "SUCCESS", verification_status: "VERIFIED", verdict: "MEASURED",
              preflight_level: "QUOTE_CHECK", reason_codes: ["ALL_PREREQUISITES_PASSED"],
              trade: {
                input_asset: "USDC", input_amount: 500, input_usd_value: 500,
                input_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                input_asset_price_usd: 1, input_asset_price_timestamp: nowIso,
                input_asset_price_source: "1:1 Fixed USD Peg", input_asset_price_provider: "Fixed 1:1 USD Peg",
                input_asset_price_freshness: "FRESH", stock_symbol: "AAPLx", canonical_stock: "AAPL",
                token_mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
                token_program: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
              },
              benchmark: {
                symbol: "AAPLx", price: 332.27, source: "Nasdaq", source_type: "OFFICIAL_MARKET_DATA_PROVIDER",
                provider: "Nasdaq", timestamp: nowIso, freshness_status: "FRESH", is_real_time: true,
                market_context: { session, underlying_reference_available: true, reference_eligibility: "ELIGIBLE" }
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
        try {
          await page.click("#tracker-step-4");
          await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
          await page.click("#stock-card-AAPLx .stock-card-header");
          await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
          await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
          await page.fill("#stock-card-AAPLx .amount-input", "500");
          await page.click("#stock-card-AAPLx .submit-trade-btn");
          await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
          const title = await page.textContent("#stock-card-AAPLx .verdict-title");
          if (title.trim() !== "MEASURED") throw new Error(`Eligible check must read MEASURED, got: ${title}`);
          const ctx = await page.textContent("#stock-card-AAPLx .live-benchmark-context");
          if (!ctx.includes(label)) throw new Error(`Preview must read '${label}', got: ${ctx}`);
        } finally {
          await page.unroute("**/api/v1/preflight");
        }
      }
    });

    await test("51. Revalidation renders indicative Snapshot B truthfully", async () => {
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(revalQuoteFixture()) });
      });
      try {
        await openFreshTradeCard(page);
        await fillTradeAndCheck(page, "USDC", 500);
        await page.unroute("**/api/v1/preflight");
        await page.route("**/api/v1/preflight", async route => {
          if (route.request().method() !== "POST") { await route.continue(); return; }
          const base = revalQuoteFixture();
          base.benchmark = {
            symbol: "AAPLx", price: 330.94, source: "xStocks Public Price Data",
            source_type: "INDICATIVE_ASSET_PRICE", provider: "xStocks Public Price Data (indicative)",
            upstream_source: "On-chain providers (cached) + Nasdaq (Blue Ocean overnight/extended hours)",
            timestamp: null, source_timestamp: null, fetched_at: new Date().toISOString(), reference_date: null,
            age_ms: null, reference_session: "UNKNOWN", current_market_session: "OVERNIGHT",
            freshness_status: "INDICATIVE_UNVERIFIED", is_real_time: false,
            market_context: { session: "OVERNIGHT", underlying_reference_available: false, reference_eligibility: "INELIGIBLE_INDICATIVE" }
          };
          base.reason_codes = ["INDICATIVE_REFERENCE_UNVERIFIED"];
          await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(base) });
        });
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const bench = await page.textContent("#stock-card-AAPLx .reval-bench");
        if (!/indicative/i.test(bench)) throw new Error(`Revalidation must carry indicative truth: ${bench}`);
        if (/\bstale\b/i.test(bench)) throw new Error("Indicative revalidation must not read stale");
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    await test("52. Alpaca overnight eligible UI: bid/ask, reference ask, measured", async () => {
      const alpacaBody = (ts) => JSON.stringify({
        request_status: "SUCCESS", verification_status: "VERIFIED", verdict: "MEASURED",
        preflight_level: "QUOTE_CHECK", reason_codes: ["ALL_PREREQUISITES_PASSED"],
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
          symbol: "AAPLx", price: 330.28, reference_price_type: "ASK",
          bid_price: 330.10, ask_price: 330.28, midpoint: 330.19, currency: "USD", feed: "overnight",
          source: "Alpaca Market Data", source_type: "ALPACA_QUOTE", provider: "Alpaca Overnight",
          upstream_source: "Alpaca Market Data (overnight derived feed)",
          timestamp: ts, source_timestamp: ts, fetched_at: new Date().toISOString(), reference_date: ts.slice(0, 10),
          age_ms: 12000, reference_session: "OVERNIGHT", current_market_session: "OVERNIGHT",
          freshness_status: "FRESH", is_real_time: true,
          market_context: { session: "OVERNIGHT", underlying_reference_available: true, reference_eligibility: "ELIGIBLE" }
        },
        economics: {
          raw_out_amount: "151419200", expected_stock_shares: 1.514192,
          underlying_benchmark_price: 330.28, expected_stock_exposure_usd: null,
          effective_price_per_share: 330.21, difference_usd: null, difference_pct: null,
          dex_effective_price_per_share: 330.21,
          difference_vs_ask_usd_per_share: -0.07, difference_vs_ask_pct: -0.02,
          spread_position: "WITHIN_REFERENCE_SPREAD",
          multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
        },
        dex_route: { router: "Jupiter Swap V2", mode: "QUOTE_CHECK", steps: ["USDC", "AAPLx"], price_impact_pct: "0.0100" },
        alternative_routes: { status: "NONE", summary: "No better route observed.", candidates_evaluated_count: 1 },
        simulation: { status: "NOT_RUN", err: null, units_consumed: 0 }
      });
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: alpacaBody(new Date().toISOString()) });
      });
      try {
        await page.click("#tracker-step-4");
        await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .stock-card-header");
        await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
        await page.fill("#stock-card-AAPLx .amount-input", "500");
        await page.click("#stock-card-AAPLx .submit-trade-btn");
        await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
        const box = await page.evaluate(() => {
          const c = document.getElementById("stock-card-AAPLx");
          const t = s => c.querySelector(s)?.textContent || "";
          return {
            title: t(".verdict-title"), ctx: t(".live-benchmark-context"), expl: t(".res-explanation"),
            bid: t(".ev-ref-bid"), ask: t(".ev-ref-ask"), mid: t(".ev-ref-mid"),
            type: t(".ev-ref-type"), time: t(".ev-ref-time"), spread: t(".ev-spread-pos"),
            all: c.querySelector(".inline-result-container").innerText
          };
        });
        if (box.title.trim() !== "MEASURED") throw new Error(`Eligible Alpaca must read MEASURED, got: ${box.title}`);
        if (!box.ctx.includes("Current overnight indicative quote")) throw new Error(`Overnight label mismatch: ${box.ctx}`);
        // 017B: execution reference, never an exposure valuation.
        if (!box.expl.includes("DEX effective price: $330.21/share")) {
          throw new Error(`Explanation must carry effective acquisition price: ${box.expl.slice(0, 300)}`);
        }
        if (!box.expl.includes("Current overnight indicative reference range: $330.10–$330.28")) {
          throw new Error(`Explanation must carry the reference range: ${box.expl.slice(0, 300)}`);
        }
        if (!box.expl.includes("inside the current reference spread")) throw new Error("Spread position missing");
        if (/exposure|valued at/i.test(box.expl)) throw new Error(`No exposure valuation allowed: ${box.expl.slice(0, 300)}`);
        if (!box.all.includes("DIFFERENCE VS ASK")) throw new Error("Money card must compare vs ask");
        if (!box.all.includes("SPREAD POSITION")) throw new Error("Money card must show spread position");
        if (box.spread.trim() !== "Within reference spread") throw new Error(`Spread position evidence missing: ${box.spread}`);
        if (!box.all.includes("Acquisition difference vs reference ask measured")) throw new Error("Subtitle must frame vs-ask comparison");
        if (!box.bid.includes("330.10") || !box.ask.includes("330.28") || !box.mid.includes("330.19")) {
          throw new Error(`Evidence bid/ask/mid missing: ${box.bid}/${box.ask}/${box.mid}`);
        }
        if (box.type.trim() !== "ASK") throw new Error(`Reference type must be ASK, got: ${box.type}`);
        if (/\bFAIR\b|\bCAUTION\b|BAD FILL/.test(box.all)) throw new Error("No calibrated verdict words allowed");
        if (/\bstale\b/i.test(box.all)) throw new Error("Current overnight must not read stale");
        // Revalidation compat (§31): same shared renderer handles Alpaca Snapshot B.
        await page.click("#stock-card-AAPLx .revalidate-btn");
        await page.waitForSelector("#stock-card-AAPLx .revalidation-result:not(.hidden)", { timeout: 15000 });
        const bench = await page.textContent("#stock-card-AAPLx .reval-bench");
        if (!/overnight/i.test(bench)) throw new Error(`Revalidation must carry overnight truth: ${bench}`);
        await page.screenshot({ path: path.join(EVIDENCE_DIR, "37_alpaca_overnight.png") });
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    // 53. Quote-safe ALTERNATIVE_FOUND (017C): shares + $/share, no value claims
    await test("53. Quote ALTERNATIVE_FOUND renders shares comparison without exposure valuation", async () => {
      const altBody = JSON.stringify({
        request_status: "SUCCESS", verification_status: "VERIFIED", verdict: "MEASURED",
        preflight_level: "QUOTE_CHECK", reason_codes: ["ALL_PREREQUISITES_PASSED"],
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
          symbol: "AAPLx", price: 330.28, reference_price_type: "ASK",
          bid_price: 330.10, ask_price: 330.28, midpoint: 330.19, currency: "USD", feed: "overnight",
          source: "Alpaca Market Data", source_type: "ALPACA_QUOTE", provider: "Alpaca Overnight",
          upstream_source: "Alpaca Market Data (overnight derived feed)",
          timestamp: new Date().toISOString(), source_timestamp: new Date().toISOString(),
          fetched_at: new Date().toISOString(), age_ms: 12000,
          reference_session: "OVERNIGHT", current_market_session: "OVERNIGHT",
          freshness_status: "FRESH", is_real_time: true,
          market_context: { session: "OVERNIGHT", underlying_reference_available: true, reference_eligibility: "ELIGIBLE" }
        },
        economics: {
          raw_out_amount: "151419200", expected_stock_shares: 1.514192,
          underlying_benchmark_price: 330.28, expected_stock_exposure_usd: null,
          effective_price_per_share: 330.21, difference_usd: null, difference_pct: null,
          dex_effective_price_per_share: 330.21,
          difference_vs_ask_usd_per_share: -0.07, difference_vs_ask_pct: -0.02,
          spread_position: "WITHIN_REFERENCE_SPREAD",
          multiplier: { stored_multiplier: 1.0026, new_multiplier: 1.0032, current_multiplier: 1.0032 }
        },
        dex_route: { router: "Jupiter Swap V2", mode: "QUOTE_CHECK", steps: ["USDC", "AAPLx"], price_impact_pct: "0.0100" },
        alternative_routes: {
          status: "ALTERNATIVE_FOUND",
          summary: "Observed an alternative route returning 0.010000 more AAPLx (+0.66%) for the same 500 USDC via Metis Alt. Effective acquisition price is $2.17/share lower.",
          canonical_route: {
            label: "Current Jupiter Route", router: "jupiterz", mode: "ultra",
            venues: ["Raydium CLMM"], raw_out_amount: "151419200",
            expected_stock_shares: 1.514192, effective_price_per_share: 330.21,
            expected_stock_exposure_usd: null, reference_difference_usd: null,
            price_impact_pct: "0.0100", steps: ["Raydium CLMM"]
          },
          best_alternative: {
            type: "ROUTER_EXCLUSION", label: "Metis Alt",
            venues: ["Whirlpool"], raw_out_amount: "152419200",
            expected_stock_shares: 1.524192, effective_price_per_share: 328.04,
            expected_stock_exposure_usd: null, reference_difference_usd: null,
            additional_stock_shares: 0.01, additional_stock_shares_pct: 0.66,
            effective_price_difference_per_share: 2.17,
            improvement_usd: null, improvement_pct: 0.66,
            price_impact_pct: "0.005", steps: ["Whirlpool"]
          },
          improvement_usd: null, improvement_pct: 0.66,
          candidates_evaluated_count: 1, candidates: []
        },
        simulation: { status: "NOT_RUN", err: null, units_consumed: 0 }
      });
      await page.route("**/api/v1/preflight", async route => {
        if (route.request().method() !== "POST") { await route.continue(); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: altBody });
      });
      try {
        await page.click("#tracker-step-4");
        await page.waitForSelector("#stock-card-AAPLx", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .stock-card-header");
        await page.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
        await page.click("#stock-card-AAPLx .payment-tab[data-asset='USDC']");
        await page.fill("#stock-card-AAPLx .amount-input", "500");
        await page.click("#stock-card-AAPLx .submit-trade-btn");
        await page.waitForSelector("#stock-card-AAPLx .inline-result-container:not(.hidden)", { timeout: 35000 });
        await page.waitForSelector("#stock-card-AAPLx .better-option-detail:not(.hidden)", { timeout: 15000 });
        const box = await page.evaluate(() => {
          const c = document.getElementById("stock-card-AAPLx");
          return c.querySelector(".inline-result-container").innerText;
        });
        for (const n of ["CURRENT ROUTE", "BETTER OBSERVED OPTION", "1.514192 AAPL", "1.524192 AAPL", "$330.21/share", "$328.04/share", "+0.010000 AAPL (+0.66%)", "$2.17/share lower"]) {
          if (!box.includes(n)) throw new Error(`Quote comparison must show "${n}"`);
        }
        if (/exposure/i.test(box)) throw new Error("No exposure valuation allowed in quote comparison");
        if (/more value/i.test(box)) throw new Error("No dollar value claims allowed in quote comparison");
        if (/Reference difference/i.test(box)) throw new Error("No reference-difference language allowed in quote comparison");
        if (/\bFAIR\b|\bCAUTION\b|BAD FILL/.test(box)) throw new Error("No calibrated verdict words allowed");
        await page.screenshot({ path: path.join(EVIDENCE_DIR, "38_alt_route_quote.png") });
      } finally {
        await page.unroute("**/api/v1/preflight");
      }
    });

    // 28-29. Tracker truth (013.9A)
    await test("28. Tracker Truth Direct: fresh Step 4 leaves Steps 1-3 neutral", async () => {
      const truthContext = await browser.newContext({ viewport: { width: 1600, height: 800 } });
      const truthPage = await truthContext.newPage();
      try {
        await truthPage.goto(BASE_URL, { waitUntil: "networkidle" });
        await truthPage.click("#hero-open-app-btn");
        await truthPage.waitForSelector("#tracker-step-4", { timeout: 15000 });
        await truthPage.click("#tracker-step-4");
        await truthPage.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });

        const tracker = await truthPage.evaluate(() => {
          const cls = id => document.getElementById(id)?.className || "";
          return {
            s1completed: cls("tracker-step-1").includes("completed"),
            s2completed: cls("tracker-step-2").includes("completed"),
            s3completed: cls("tracker-step-3").includes("completed"),
            s4active: cls("tracker-step-4").includes("active"),
            expanded: document.querySelectorAll("#stock-cards-container .stock-card-standalone.is-expanded").length
          };
        });
        if (tracker.s1completed || tracker.s2completed || tracker.s3completed) {
          throw new Error(`Direct Step 4 must not complete Steps 1-3: ${JSON.stringify(tracker)}`);
        }
        if (!tracker.s4active) throw new Error("Step 4 must read active");
        if (tracker.expanded !== 0) throw new Error("Direct Step 4 must start with no card expanded");
        await truthPage.screenshot({ path: path.join(EVIDENCE_DIR, "28_tracker_direct_step4.png") });
      } finally {
        await truthContext.close();
      }
    });

    await test("29. Tracker Truth Product Flow: genuine progress completes, Step 4 stays fresh", async () => {
      const flowContext = await browser.newContext({ viewport: { width: 1600, height: 800 } });
      const flowPage = await flowContext.newPage();
      try {
        await flowPage.goto(BASE_URL, { waitUntil: "networkidle" });
        await flowPage.click("#hero-open-app-btn");
        await flowPage.waitForSelector("#underlying-card-AAPL", { timeout: 15000 });
        await flowPage.click("#underlying-card-AAPL");
        await flowPage.waitForSelector("#exp-card-SELF_CUSTODY", { timeout: 15000 });
        await flowPage.click("#exp-card-SELF_CUSTODY .btn-must-have");
        await flowPage.click("#exp-card-ECONOMIC_DIVIDEND_BENEFIT .btn-must-have");
        await flowPage.click("#btn-submit-expectations");
        await flowPage.waitForSelector("#rep-card-AAPLx .btn-check-trade", { timeout: 15000 });
        await flowPage.click("#rep-card-AAPLx .btn-check-trade");
        await flowPage.waitForSelector("#step-4-container:not(.hidden)", { timeout: 15000 });

        const tracker = await flowPage.evaluate(() => ({
          s1: document.getElementById("tracker-step-1")?.className || "",
          s2: document.getElementById("tracker-step-2")?.className || "",
          s3: document.getElementById("tracker-step-3")?.className || "",
          s4: document.getElementById("tracker-step-4")?.className || "",
          expanded: document.querySelectorAll("#stock-cards-container .stock-card-standalone.is-expanded").length,
          strip: !!document.querySelector(".execution-handoff-banner")
        }));
        for (const [k, v] of [["s1", tracker.s1], ["s2", tracker.s2], ["s3", tracker.s3]]) {
          if (!v.includes("completed")) throw new Error(`Genuine product ${k} must read completed: ${v}`);
        }
        if (!tracker.s4.includes("active")) throw new Error("Step 4 must read active");
        if (tracker.expanded !== 0 || tracker.strip) {
          throw new Error("Step 4 must still start fresh with no preload or strip");
        }

        // Return navigation stays accurate: Step 2 shows, Step 3 keeps results.
        await flowPage.click("#tracker-step-2");
        await flowPage.waitForSelector("#step-2-container:not(.hidden)", { timeout: 15000 });
        await flowPage.click("#tracker-step-3");
        await flowPage.waitForSelector("#step-3-container:not(.hidden)", { timeout: 15000 });
        const banner29 = await flowPage.textContent("#result-banner-title");
        if (!banner29.includes("2 Verified Products Match Your Must-Haves")) {
          throw new Error(`Step 3 must retain results, got: ${banner29}`);
        }
        await flowPage.screenshot({ path: path.join(EVIDENCE_DIR, "29_tracker_product_flow.png") });
      } finally {
        await flowContext.close();
      }
    });

    await test("29b. Tracker Truth Guard: Step 3 without results routes to Step 2", async () => {
      const guardContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const guardPage = await guardContext.newPage();
      try {
        await guardPage.goto(BASE_URL, { waitUntil: "networkidle" });
        await guardPage.click("#hero-open-app-btn");
        await guardPage.waitForSelector("#tracker-step-3", { timeout: 15000 });
        await guardPage.click("#tracker-step-3");
        await guardPage.waitForSelector("#step-2-container:not(.hidden)", { timeout: 15000 });
        const noFabrication = await guardPage.evaluate(() => window.appState?.productPreflightResult ?? null);
        if (noFabrication !== null) throw new Error("Step 3 must not fabricate results");
      } finally {
        await guardContext.close();
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
      await settleScroll(mobilePage);
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Dashboard Story exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "16_mobile_story_section.png") });

      // 17. Mobile Entry + Step 1 (013.9K: single app, tracker shortcut)
      await mobilePage.click("#hero-open-app-btn");
      await mobilePage.waitForSelector("#step-1-container:not(.hidden)", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 1 exhibits horizontal overflow");
      // Tracker Step 4 shortcut must work without completing Product Preflight.
      await mobilePage.click("#tracker-step-4");
      await mobilePage.waitForSelector("#stock-cards-container .stock-card-standalone", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 4 feed exhibits horizontal overflow");
      await mobilePage.click("#tracker-step-1");
      await mobilePage.waitForSelector("#step-1-container:not(.hidden)", { timeout: 15000 });
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
      await settleScroll(mobilePage);
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 3 exhibits horizontal overflow");
      await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, "19_mobile_product_results.png") });

      // 20. Mobile App Step 4 (original feed + trade form)
      await mobilePage.click("#rep-card-AAPLx .btn-check-trade");
      await mobilePage.waitForSelector("#stock-cards-container .stock-card-standalone", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 4 feed exhibits horizontal overflow");
      await mobilePage.click("#stock-card-AAPLx .stock-card-header");
      await mobilePage.waitForSelector("#stock-card-AAPLx .stock-card-body:not(.hidden)", { timeout: 15000 });
      isOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (isOverflow) throw new Error("Mobile Step 4 trade form exhibits horizontal overflow");
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
