// JustFair Consumer Client Application
// Zero-Custody, Pre-Trade Economic Safety Inspector on Solana
// White + Purple Modern Dashboard & Standalone Stock Feed System (Order 007.4)

const STOCK_META = {
  AAPLx: { name: "Apple", canonical: "AAPL", fullName: "Apple Inc.", mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp" },
  NVDAx: { name: "NVIDIA", canonical: "NVDA", fullName: "NVIDIA Corp.", mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh" },
  SPYx: { name: "S&P 500", canonical: "SPY", fullName: "SPDR S&P 500 ETF Trust", mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W" },
  TSLAx: { name: "Tesla", canonical: "TSLA", fullName: "Tesla Inc.", mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB" }
};

let currentSolPrice = 135.0; // Dynamic estimate
let activeWalletAddress = null;

// Navigation Elements
const dashboardView = document.getElementById("dashboard-view");
const appView = document.getElementById("app-view");
const tabDashboardBtn = document.getElementById("tab-dashboard-btn");
const tabAppBtn = document.getElementById("tab-app-btn");
const navBrandLink = document.getElementById("nav-brand-link");
const headerLaunchBtn = document.getElementById("header-launch-btn");
const heroOpenAppBtn = document.getElementById("hero-open-app-btn");
const apiCtaOpenApp = document.getElementById("api-cta-open-app");
const bottomOpenAppBtn = document.getElementById("bottom-open-app-btn");
const walletBtn = document.getElementById("wallet-toggle-btn");
const walletBtnLabel = document.getElementById("wallet-btn-label");
const walletDot = document.getElementById("wallet-dot");

// ==========================================
// 1. Navigation & View Switching
// ==========================================
export function switchView(viewName, targetSymbol = null) {
  if (viewName === "app") {
    dashboardView.classList.add("hidden");
    appView.classList.remove("hidden");
    tabDashboardBtn.classList.remove("active");
    tabAppBtn.classList.add("active");
    headerLaunchBtn.classList.add("hidden");
    window.location.hash = "app";

    if (targetSymbol) {
      expandStockCard(targetSymbol);
    }
  } else {
    appView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    tabAppBtn.classList.remove("active");
    tabDashboardBtn.classList.add("active");
    headerLaunchBtn.classList.remove("hidden");
    window.location.hash = "dashboard";
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Event Listeners for Navigation
if (tabDashboardBtn) tabDashboardBtn.addEventListener("click", () => switchView("dashboard"));
if (tabAppBtn) tabAppBtn.addEventListener("click", () => switchView("app"));
if (navBrandLink) navBrandLink.addEventListener("click", (e) => {
  e.preventDefault();
  switchView("dashboard");
});
if (headerLaunchBtn) headerLaunchBtn.addEventListener("click", () => switchView("app"));
if (heroOpenAppBtn) heroOpenAppBtn.addEventListener("click", () => switchView("app", "AAPLx"));
if (apiCtaOpenApp) apiCtaOpenApp.addEventListener("click", () => switchView("app"));
if (bottomOpenAppBtn) bottomOpenAppBtn.addEventListener("click", () => switchView("app"));

// Handle initial load & hash changes
window.addEventListener("DOMContentLoaded", () => {
  initStockCards();
  initApiDrawer();
  initScrollReveal();

  const hash = window.location.hash;
  if (hash === "#app") {
    switchView("app");
  } else {
    switchView("dashboard");
  }
});

window.addEventListener("hashchange", () => {
  const hash = window.location.hash;
  if (hash === "#app") {
    switchView("app");
  } else if (hash === "#dashboard" || hash === "") {
    switchView("dashboard");
  }
});

// ==========================================
// 2. Strong Reactive Scroll Reveal Motion
// ==========================================
function initScrollReveal() {
  const revealElements = document.querySelectorAll(".reveal-section, .reveal-item, .stock-card-standalone");
  if (!revealElements.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach(el => el.classList.add("is-revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: "0px 0px -50px 0px",
      threshold: 0.18
    }
  );

  revealElements.forEach(el => observer.observe(el));
}

// ==========================================
// 3. API Code Drawer Toggle
// ==========================================
function initApiDrawer() {
  const toggleApiCodeBtn = document.getElementById("toggle-api-code-btn");
  const apiCodeDrawer = document.getElementById("api-code-drawer");

  if (toggleApiCodeBtn && apiCodeDrawer) {
    toggleApiCodeBtn.addEventListener("click", () => {
      const isHidden = apiCodeDrawer.classList.contains("hidden");
      apiCodeDrawer.classList.toggle("hidden", !isHidden);
      toggleApiCodeBtn.setAttribute("aria-expanded", String(isHidden));
      const btnSpan = toggleApiCodeBtn.querySelector("span");
      if (btnSpan) {
        btnSpan.textContent = isHidden ? "Hide API details" : "View API details";
      }
    });
  }
}

// ==========================================
// 4. Standalone Stock Cards Controller
// ==========================================
function initStockCards() {
  const cards = document.querySelectorAll(".stock-card-standalone");

  cards.forEach(card => {
    const symbol = card.getAttribute("data-symbol");
    const body = card.querySelector(".stock-card-body");

    // Populate inner markup for non-Apple cards if empty
    if (symbol !== "AAPLx" && body && !body.querySelector(".stock-trade-form")) {
      body.innerHTML = renderCardBodyMarkup(symbol);
    }

    // Attach Header / Toggle Button Event
    const header = card.querySelector(".stock-card-header");
    const toggleBtn = card.querySelector(".stock-toggle-btn");

    if (header) {
      header.addEventListener("click", (e) => {
        // Prevent toggle if clicking inside a button that might bubble
        toggleStockCard(symbol);
      });
    }

    // Setup interactive handlers inside this card's body
    setupCardInteractivity(card, symbol);
  });
}

function renderCardBodyMarkup(symbol) {
  const stock = STOCK_META[symbol] || { name: symbol, canonical: symbol, mint: "" };
  return `
    <form class="stock-trade-form" data-symbol="${symbol}" novalidate>
      <div class="form-row-grid">
        <!-- Payment Choice -->
        <div class="form-col">
          <label class="form-label">Pay With</label>
          <div class="payment-tabs" role="radiogroup" aria-label="Select Payment Currency">
            <button type="button" class="payment-tab active" data-asset="USDC" role="radio" aria-checked="true">
              <div class="token-icon-wrap">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v12"></path><path d="M15 9.5a3 3 0 0 0-3-2.5c-2 0-3 1-3 2.5s1 2.5 3 2.5 3 1 3 2.5-1 2.5-3 2.5a3 3 0 0 1-3-2.5"></path></svg>
              </div>
              <div class="token-info">
                <span class="token-symbol">USDC</span>
                <span class="token-sub">1:1 USD</span>
              </div>
            </button>
            <button type="button" class="payment-tab" data-asset="SOL" role="radio" aria-checked="false">
              <div class="token-icon-wrap">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M4.93 19.07l1.41-1.41"></path><path d="M17.66 6.34l1.41-1.41"></path></svg>
              </div>
              <div class="token-info">
                <span class="token-symbol">SOL</span>
                <span class="token-sub sol-spot-sub">${currentSolPrice ? `$${currentSolPrice.toFixed(2)}` : "Live Price"}</span>
              </div>
            </button>
          </div>
          <input type="hidden" name="inputAsset" value="USDC">
        </div>

        <!-- Spend Amount -->
        <div class="form-col">
          <div class="form-label-row">
            <label class="form-label">Amount to Spend</label>
            <span class="label-sub amount-usd-equivalent">$500.00 USD</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix amount-prefix">$</span>
            <input type="number" name="amount" class="form-input amount-input" value="500" min="1" max="1000000" step="any" required>
          </div>
          <div class="amount-presets">
            <button type="button" class="preset-btn" data-val="100">$100</button>
            <button type="button" class="preset-btn active" data-val="500">$500</button>
            <button type="button" class="preset-btn" data-val="1000">$1,000</button>
            <button type="button" class="preset-btn" data-val="2500">$2,500</button>
          </div>
        </div>
      </div>

      <!-- Wallet Row -->
      <div class="wallet-section">
        <div class="wallet-info-bar">
          <div class="wallet-status-group">
            <span class="wallet-dot ${activeWalletAddress ? 'connected' : ''}"></span>
            <span class="wallet-status-label">${activeWalletAddress ? `Mode: Exact Simulation (${activeWalletAddress.slice(0, 4)}...${activeWalletAddress.slice(-4)})` : "Mode: Quote Precheck (No wallet required)"}</span>
          </div>
          <button type="button" class="btn-link manual-key-toggle" aria-expanded="false">
            Enter address manually
          </button>
        </div>
        <div class="manual-key-input-box hidden">
          <label class="form-label">Solana Public Address for Exact RPC Simulation</label>
          <input type="text" class="form-input font-mono wallet-input" placeholder="e.g. 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" value="${activeWalletAddress || ''}">
          <p class="form-hint">Only your public address is used for non-broadcast simulation. Never enter a seed phrase or private key.</p>
        </div>
      </div>

      <!-- Submit Row -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary btn-block btn-lg submit-trade-btn">
          <span class="btn-text">CHECK TRADE</span>
          <span class="btn-spinner hidden" aria-hidden="true"></span>
        </button>
      </div>
    </form>

    <!-- Inline Loading -->
    <div class="inline-loading-state hidden">
      <div class="loading-spinner"></div>
      <h4 class="loading-title">Analyzing Trade Route...</h4>
      <p class="loading-step-text">Checking live Jupiter Swap V2 route, Token-2022 multiplier, and independent equity benchmark.</p>
    </div>

    <!-- Inline Error -->
    <div class="inline-error-state hidden">
      <div class="error-icon-box">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      </div>
      <h4 class="error-title">Unable to Check Trade</h4>
      <p class="error-message">An error occurred while inspecting the trade.</p>
      <button type="button" class="btn btn-secondary btn-sm error-retry-btn">Try Again</button>
    </div>

    <!-- Inline Result Container -->
    <div class="inline-result-container hidden">
      <!-- Verdict Banner -->
      <div class="verdict-banner">
        <div class="verdict-icon-box">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"></path><path d="M4 7l8-4 8 4"></path><path d="M6 18l-3-6h6l-3 6z"></path><path d="M18 18l-3-6h6l-3 6z"></path></svg>
        </div>
        <div class="verdict-text-group">
          <h3 class="verdict-title">MEASURED</h3>
          <p class="verdict-subtitle">Economic difference measured against independent market benchmark.</p>
        </div>
      </div>

      <!-- Big 3 Numbers Card -->
      <div class="plain-money-card">
        <div class="money-stat">
          <span class="money-label">YOU'RE SPENDING</span>
          <span class="money-value res-spend-val">$500.00</span>
          <span class="money-sub res-spend-sub">500.00 USDC</span>
        </div>
        <div class="money-divider">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
        </div>
        <div class="money-stat">
          <span class="money-label res-exposure-label">EXPECTED ${stock.name.toUpperCase()} EXPOSURE</span>
          <span class="money-value res-exposure-val">$498.23</span>
          <span class="money-sub res-exposure-sub">${stock.canonical}</span>
        </div>
        <div class="money-divider">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="9" x2="19" y2="9"></line><line x1="5" y1="15" x2="19" y2="15"></line></svg>
        </div>
        <div class="money-stat highlight">
          <span class="money-label">DIFFERENCE</span>
          <span class="money-value res-diff-val">-$1.77</span>
          <span class="money-sub res-diff-pct">(-0.35%)</span>
        </div>
      </div>

      <!-- Plain English Explanation -->
      <div class="explanation-box">
        <p class="explanation-text res-explanation"></p>
      </div>

      <!-- Exact Simulation Banner -->
      <div class="simulation-banner hidden">
        <div class="sim-icon-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </div>
        <div class="sim-content">
          <strong class="sim-title">Exact Transaction Simulation: Passed</strong>
          <span class="sim-desc">Simulated via Solana RPC with err: null. Zero funds moved.</span>
        </div>
      </div>

      <!-- Safe Exit to Jupiter -->
      <div class="jupiter-exit-card">
        <a href="https://jup.ag" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm jupiter-exit-link">
          <span>Open Pair in Jupiter</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
        <span class="jupiter-disclaimer">Jupiter generates a fresh transaction upon opening. JustFair does not sign or approve trades.</span>
      </div>

      <!-- Technical Evidence Drawer -->
      <details class="evidence-accordion">
        <summary class="accordion-header">
          <span>View Technical Proof &amp; Route Evidence</span>
          <svg class="accordion-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </summary>
        <div class="accordion-body">
          <div class="evidence-grid">
            <div class="evidence-item"><span class="ev-label">Token Mint</span><span class="ev-val font-mono ev-mint">${stock.mint}</span></div>
            <div class="evidence-item"><span class="ev-label">Token Program</span><span class="ev-val font-mono ev-program">Token-2022 (Scaled UI Amount)</span></div>
            <div class="evidence-item"><span class="ev-label">Multiplier</span><span class="ev-val ev-multiplier">1.0</span></div>
            <div class="evidence-item"><span class="ev-label">DEX Router</span><span class="ev-val ev-router">Jupiter Swap V2</span></div>
            <div class="evidence-item"><span class="ev-label">Routing Steps</span><span class="ev-val ev-steps">DEX Pool</span></div>
            <div class="evidence-item"><span class="ev-label">Price Impact</span><span class="ev-val ev-impact">0.00%</span></div>
            <div class="evidence-item"><span class="ev-label">Benchmark Provider</span><span class="ev-val ev-benchmark-source">Stock Market Tape</span></div>
            <div class="evidence-item"><span class="ev-label">Market Session</span><span class="ev-val ev-session">POST_MARKET</span></div>
            <div class="evidence-item"><span class="ev-label">Preflight Level</span><span class="ev-val ev-preflight-level">QUOTE_CHECK</span></div>
            <div class="evidence-item"><span class="ev-label">Simulation</span><span class="ev-val ev-simulation">NOT RUN</span></div>
          </div>
        </div>
      </details>
    </div>
  `;
}

export function toggleStockCard(symbol) {
  const card = document.getElementById(`stock-card-${symbol}`);
  if (!card) return;

  const isExpanded = card.classList.contains("is-expanded");
  if (isExpanded) {
    collapseCard(card, symbol);
  } else {
    // Collapse any open cards first
    document.querySelectorAll(".stock-card-standalone.is-expanded").forEach(c => {
      const s = c.getAttribute("data-symbol");
      collapseCard(c, s);
    });
    expandCard(card, symbol);
  }
}

export function expandStockCard(symbol) {
  const card = document.getElementById(`stock-card-${symbol}`);
  if (!card) return;

  // Collapse others
  document.querySelectorAll(".stock-card-standalone.is-expanded").forEach(c => {
    const s = c.getAttribute("data-symbol");
    if (s !== symbol) collapseCard(c, s);
  });

  expandCard(card, symbol);
}

function expandCard(card, symbol) {
  const stock = STOCK_META[symbol] || { name: symbol };
  const body = card.querySelector(".stock-card-body");
  const header = card.querySelector(".stock-card-header");
  const toggleBtn = card.querySelector(".stock-toggle-btn");

  card.classList.add("is-expanded");
  if (body) body.classList.remove("hidden");
  if (header) header.setAttribute("aria-expanded", "true");

  if (toggleBtn) {
    toggleBtn.className = "btn btn-primary btn-sm stock-toggle-btn";
    const textEl = toggleBtn.querySelector(".toggle-btn-text");
    if (textEl) textEl.textContent = "Close Trade";
    const icon = toggleBtn.querySelector(".toggle-icon");
    if (icon) icon.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
  }

  // Smooth alignment into view if not visible
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function collapseCard(card, symbol) {
  const stock = STOCK_META[symbol] || { name: symbol };
  const body = card.querySelector(".stock-card-body");
  const header = card.querySelector(".stock-card-header");
  const toggleBtn = card.querySelector(".stock-toggle-btn");

  card.classList.remove("is-expanded");
  if (body) body.classList.add("hidden");
  if (header) header.setAttribute("aria-expanded", "false");

  if (toggleBtn) {
    toggleBtn.className = "btn btn-outline btn-sm stock-toggle-btn";
    const textEl = toggleBtn.querySelector(".toggle-btn-text");
    if (textEl) textEl.textContent = `Check ${stock.name} Trade`;
    const icon = toggleBtn.querySelector(".toggle-icon");
    if (icon) icon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
  }
}

function setupCardInteractivity(card, symbol) {
  const form = card.querySelector(".stock-trade-form");
  if (!form) return;

  const paymentTabs = card.querySelectorAll(".payment-tab");
  const inputAssetHidden = form.querySelector("input[name='inputAsset']");
  const amountInput = form.querySelector(".amount-input");
  const amountPrefix = form.querySelector(".amount-prefix");
  const amountUsdEquiv = form.querySelector(".amount-usd-equivalent");
  const presetsContainer = form.querySelector(".amount-presets");
  const manualKeyToggle = form.querySelector(".manual-key-toggle");
  const manualKeyBox = form.querySelector(".manual-key-input-box");
  const walletInput = form.querySelector(".wallet-input");
  const submitBtn = form.querySelector(".submit-trade-btn");
  const loadingState = card.querySelector(".inline-loading-state");
  const errorState = card.querySelector(".inline-error-state");
  const errorTitle = errorState?.querySelector(".error-title");
  const errorMessage = errorState?.querySelector(".error-message");
  const errorRetryBtn = errorState?.querySelector(".error-retry-btn");
  const resultContainer = card.querySelector(".inline-result-container");

  // Payment Selection
  paymentTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      paymentTabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-checked", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-checked", "true");
      const asset = tab.getAttribute("data-asset");
      if (inputAssetHidden) inputAssetHidden.value = asset;

      if (asset === "SOL") {
        if (amountPrefix) amountPrefix.textContent = "◎";
        renderPresets(presetsContainer, [1, 2, 5, 10], "SOL", amountInput, amountUsdEquiv, asset);
        if (parseFloat(amountInput.value) > 50) amountInput.value = "2";
      } else {
        if (amountPrefix) amountPrefix.textContent = "$";
        renderPresets(presetsContainer, [100, 500, 1000, 2500], "$", amountInput, amountUsdEquiv, asset);
        if (parseFloat(amountInput.value) <= 10) amountInput.value = "500";
      }
      updateUsdEquiv(amountInput, amountUsdEquiv, inputAssetHidden.value);
    });
  });

  // Amount input listener
  if (amountInput) {
    amountInput.addEventListener("input", () => {
      card.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      updateUsdEquiv(amountInput, amountUsdEquiv, inputAssetHidden?.value || "USDC");
    });
  }

  // Presets initial click bindings
  bindPresets(presetsContainer, amountInput, amountUsdEquiv, inputAssetHidden);

  // Manual key toggle
  if (manualKeyToggle && manualKeyBox) {
    manualKeyToggle.addEventListener("click", () => {
      const isHidden = manualKeyBox.classList.contains("hidden");
      manualKeyBox.classList.toggle("hidden", !isHidden);
      manualKeyToggle.setAttribute("aria-expanded", String(isHidden));
      manualKeyToggle.textContent = isHidden ? "Hide manual address" : "Enter address manually";
    });
  }

  // Wallet manual input listener
  if (walletInput) {
    walletInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (val.length >= 32) {
        setGlobalWalletState(val);
      } else if (val.length === 0) {
        setGlobalWalletState(null);
      }
    });
  }

  // Error Retry
  if (errorRetryBtn) {
    errorRetryBtn.addEventListener("click", () => {
      errorState.classList.add("hidden");
      form.scrollIntoView({ behavior: "smooth" });
    });
  }

  // Form Submit Handler
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const inputAsset = inputAssetHidden ? inputAssetHidden.value : "USDC";
    const amount = parseFloat(amountInput.value);
    const userWallet = activeWalletAddress || walletInput?.value?.trim() || null;

    if (isNaN(amount) || amount <= 0) {
      showCardError(card, "Invalid Amount", "Please enter a valid amount greater than zero.");
      return;
    }

    // Show inline loading
    showCardLoading(card);

    try {
      const res = await fetch("/api/v1/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset: inputAsset,
          stock: symbol,
          amount: amount,
          wallet: userWallet
        })
      });

      const data = await res.json();

      if (data.request_status !== "SUCCESS") {
        const code = data.reason_codes?.[0] || "ERROR";
        let msg = data.reason || "We encountered an issue checking this route.";
        if (code === "RATE_LIMITED") {
          msg = "You are sending requests too quickly. Please wait a moment and try again.";
        } else if (code === "UPSTREAM_TIMEOUT") {
          msg = "The upstream DEX routing service timed out. Please try again shortly.";
        } else if (code === "INVALID_AMOUNT") {
          msg = "The entered amount is outside acceptable safety limits.";
        } else if (code === "INVALID_PUBLIC_KEY") {
          msg = "The provided Solana wallet address is not a valid base58 address.";
        }
        showCardError(card, "Check Failed", msg);
        return;
      }

      renderCardResult(card, data, symbol);
    } catch (err) {
      showCardError(card, "Connection Error", "Unable to connect to the JustFair Preflight service. Please check your network.");
    }
  });
}

function renderPresets(container, values, prefix, amountInput, amountUsdEquiv, asset) {
  if (!container) return;
  container.innerHTML = "";
  values.forEach((v, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `preset-btn ${idx === 1 ? "active" : ""}`;
    btn.setAttribute("data-val", v);
    btn.textContent = prefix === "$" ? `$${v.toLocaleString()}` : `${v} SOL`;
    btn.addEventListener("click", () => {
      container.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (amountInput) amountInput.value = v;
      updateUsdEquiv(amountInput, amountUsdEquiv, asset);
    });
    container.appendChild(btn);
  });
}

function bindPresets(container, amountInput, amountUsdEquiv, inputAssetHidden) {
  if (!container) return;
  const btns = container.querySelectorAll(".preset-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const val = btn.getAttribute("data-val");
      if (amountInput && val) amountInput.value = val;
      updateUsdEquiv(amountInput, amountUsdEquiv, inputAssetHidden?.value || "USDC");
    });
  });
}

function updateUsdEquiv(amountInput, amountUsdEquiv, asset) {
  if (!amountInput || !amountUsdEquiv) return;
  const val = parseFloat(amountInput.value);
  if (isNaN(val) || val <= 0) {
    amountUsdEquiv.textContent = "$0.00 USD";
    return;
  }
  if (asset === "USDC") {
    amountUsdEquiv.textContent = `$${val.toFixed(2)} USD`;
  } else {
    const approx = val * currentSolPrice;
    amountUsdEquiv.textContent = `≈ $${approx.toFixed(2)} USD`;
  }
}

function showCardLoading(card) {
  const loadingState = card.querySelector(".inline-loading-state");
  const errorState = card.querySelector(".inline-error-state");
  const resultContainer = card.querySelector(".inline-result-container");
  const submitBtn = card.querySelector(".submit-trade-btn");

  if (errorState) errorState.classList.add("hidden");
  if (resultContainer) resultContainer.classList.add("hidden");
  if (loadingState) loadingState.classList.remove("hidden");

  if (submitBtn) {
    submitBtn.disabled = true;
    const textEl = submitBtn.querySelector(".btn-text");
    if (textEl) textEl.textContent = "Checking...";
    const spinner = submitBtn.querySelector(".btn-spinner");
    if (spinner) spinner.classList.remove("hidden");
  }
}

function showCardError(card, title, message) {
  const loadingState = card.querySelector(".inline-loading-state");
  const errorState = card.querySelector(".inline-error-state");
  const resultContainer = card.querySelector(".inline-result-container");
  const submitBtn = card.querySelector(".submit-trade-btn");

  if (loadingState) loadingState.classList.add("hidden");
  if (resultContainer) resultContainer.classList.add("hidden");
  if (errorState) {
    errorState.classList.remove("hidden");
    const t = errorState.querySelector(".error-title");
    const m = errorState.querySelector(".error-message");
    if (t) t.textContent = title;
    if (m) m.textContent = message;
  }

  resetCardSubmitBtn(submitBtn);
}

function resetCardSubmitBtn(submitBtn) {
  if (!submitBtn) return;
  submitBtn.disabled = false;
  const textEl = submitBtn.querySelector(".btn-text");
  if (textEl) textEl.textContent = "CHECK TRADE";
  const spinner = submitBtn.querySelector(".btn-spinner");
  if (spinner) spinner.classList.add("hidden");
}

function renderCardResult(card, data, symbol) {
  const loadingState = card.querySelector(".inline-loading-state");
  const errorState = card.querySelector(".inline-error-state");
  const resultContainer = card.querySelector(".inline-result-container");
  const submitBtn = card.querySelector(".submit-trade-btn");

  if (loadingState) loadingState.classList.add("hidden");
  if (errorState) errorState.classList.add("hidden");
  if (resultContainer) resultContainer.classList.remove("hidden");
  resetCardSubmitBtn(submitBtn);

  const trade = data.trade;
  const econ = data.economics;
  const bench = data.benchmark;
  const mkt = bench.market_context || {};
  const sim = data.simulation;
  const diffPct = econ.difference_pct;
  const stockMeta = STOCK_META[trade.stock_symbol] || { name: trade.canonical_stock, fullName: trade.canonical_stock };

  // 1. Set Spending Value (Primary Metric #1)
  const spendVal = resultContainer.querySelector(".res-spend-val");
  const spendSub = resultContainer.querySelector(".res-spend-sub");
  if (spendVal) spendVal.textContent = `$${trade.input_usd_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (spendSub) {
    spendSub.textContent = trade.input_asset === "SOL"
      ? `${trade.input_amount} SOL`
      : `${trade.input_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${trade.input_asset}`;
  }

  // 2. Set Exposure Value (Primary Metric #2)
  const assetNameUpper = stockMeta.name.toUpperCase();
  const exposureLabel = resultContainer.querySelector(".res-exposure-label");
  const exposureVal = resultContainer.querySelector(".res-exposure-val");
  const exposureSub = resultContainer.querySelector(".res-exposure-sub");
  if (exposureLabel) exposureLabel.textContent = `EXPECTED ${assetNameUpper} EXPOSURE`;
  if (exposureVal) exposureVal.textContent = `$${econ.expected_stock_exposure_usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (exposureSub) exposureSub.textContent = `${econ.expected_stock_shares} ${trade.canonical_stock} @ $${Number(bench.price).toFixed(2)}`;

  // 3. Set Net Difference (Primary Metric #3)
  const diffPrefix = econ.difference_usd >= 0 ? "+" : "-";
  const diffVal = resultContainer.querySelector(".res-diff-val");
  const diffPctEl = resultContainer.querySelector(".res-diff-pct");
  if (diffVal) diffVal.textContent = `${diffPrefix}$${Math.abs(econ.difference_usd).toFixed(2)}`;
  if (diffPctEl) diffPctEl.textContent = `(${econ.difference_usd >= 0 ? "+" : ""}${diffPct.toFixed(2)}%)`;

  // 4. Verdict Banner
  const verdictBanner = resultContainer.querySelector(".verdict-banner");
  const verdictIcon = resultContainer.querySelector(".verdict-icon-box");
  const verdictTitle = resultContainer.querySelector(".verdict-title");
  const verdictSubtitle = resultContainer.querySelector(".verdict-subtitle");

  if (verdictBanner) {
    verdictBanner.className = "verdict-banner";
    if (mkt.session === "CLOSED" || bench.freshness_status === "AFTER_HOURS_CLOSE") {
      verdictBanner.classList.add("verdict-closed");
      if (verdictIcon) verdictIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      if (verdictTitle) verdictTitle.textContent = "CAN'T VERIFY RIGHT NOW";
      if (verdictSubtitle) verdictSubtitle.textContent = `Traditional equity markets are closed. Live DEX routing delivered $${econ.expected_stock_exposure_usd.toFixed(2)} estimated exposure, but benchmark safety cannot be certified outside active trading hours.`;
    } else {
      verdictBanner.classList.add("verdict-measured");
      if (verdictIcon) verdictIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"></path><path d="M4 7l8-4 8 4"></path><path d="M6 18l-3-6h6l-3 6z"></path><path d="M18 18l-3-6h6l-3 6z"></path></svg>`;
      if (verdictTitle) verdictTitle.textContent = "MEASURED";
      if (verdictSubtitle) verdictSubtitle.textContent = `Economic difference measured at ${diffPrefix}${diffPct.toFixed(2)}%. Threshold safety calibration is pending live market tape verification.`;
    }
  }

  // 5. Plain English Explanation
  const resExplanation = resultContainer.querySelector(".res-explanation");
  if (resExplanation) {
    if (mkt.session === "CLOSED") {
      resExplanation.textContent = `We found a live Solana route for ${trade.input_amount} ${trade.input_asset} giving approximately ${econ.expected_stock_shares} shares of ${stockMeta.name}. Note that traditional stock markets are closed right now, so the underlying reference price ($${bench.price}) is from the previous market close.`;
    } else {
      resExplanation.textContent = `This trade route would spend $${trade.input_usd_value.toFixed(2)} to acquire approximately ${econ.expected_stock_shares} shares of ${stockMeta.name} on Solana, delivering $${econ.expected_stock_exposure_usd.toFixed(2)} of underlying exposure (difference: ${diffPrefix}$${econ.difference_usd.toFixed(2)} or ${diffPrefix}${diffPct.toFixed(2)}%).`;
    }
  }

  // 6. Simulation Banner
  const simBanner = resultContainer.querySelector(".simulation-banner");
  if (simBanner) {
    if (data.preflight_level === "EXACT_SIMULATION") {
      simBanner.classList.remove("hidden");
      const simTitle = simBanner.querySelector(".sim-title");
      const simDesc = simBanner.querySelector(".sim-desc");
      if (sim.status === "PASS" && sim.err === null) {
        if (simTitle) simTitle.textContent = "Exact Transaction Simulation: Passed";
        if (simDesc) simDesc.textContent = `Simulated via Solana RPC with err: null (${sim.units_consumed?.toLocaleString() || 0} compute units). Zero funds moved.`;
      } else {
        if (simTitle) simTitle.textContent = "Exact Simulation: Failed on Upstream Route";
        if (simDesc) simDesc.textContent = "Transaction simulation returned an error. Route economics are displayed from quote check.";
      }
    } else {
      simBanner.classList.add("hidden");
    }
  }

  // 7. Jupiter Exit Link
  const jupiterExitLink = resultContainer.querySelector(".jupiter-exit-link");
  if (jupiterExitLink) {
    const inputMint = trade.input_asset === "SOL" ? "So11111111111111111111111111111111111111112" : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    jupiterExitLink.href = `https://jup.ag/swap/${inputMint}-${trade.token_mint}`;
  }

  // 8. Technical Evidence Accordion
  const evMint = resultContainer.querySelector(".ev-mint");
  const evProgram = resultContainer.querySelector(".ev-program");
  const evMultiplier = resultContainer.querySelector(".ev-multiplier");
  const evRouter = resultContainer.querySelector(".ev-router");
  const evSteps = resultContainer.querySelector(".ev-steps");
  const evImpact = resultContainer.querySelector(".ev-impact");
  const evBenchmarkSource = resultContainer.querySelector(".ev-benchmark-source");
  const evSession = resultContainer.querySelector(".ev-session");
  const evPreflightLevel = resultContainer.querySelector(".ev-preflight-level");
  const evSimulation = resultContainer.querySelector(".ev-simulation");

  if (evMint) evMint.textContent = trade.token_mint;
  if (evProgram) evProgram.textContent = "Token-2022 (Scaled UI Amount Extension)";
  if (evMultiplier) evMultiplier.textContent = `${econ.multiplier.current_multiplier} (1 token = ${econ.multiplier.current_multiplier} shares)`;
  if (evRouter) evRouter.textContent = `Jupiter Swap V2 (Router: ${data.dex_route.router}, Mode: ${data.dex_route.mode})`;
  if (evSteps) evSteps.textContent = data.dex_route.steps?.join(" to ") || "Direct DEX Pool";
  if (evImpact) evImpact.textContent = `${(parseFloat(data.dex_route.price_impact_pct || 0)).toFixed(4)}%`;
  if (evBenchmarkSource) evBenchmarkSource.textContent = `${bench.provider} (${bench.source})`;
  if (evSession) evSession.textContent = `Reference: ${bench.reference_session} | Current: ${mkt.session || bench.current_market_session}`;
  if (evPreflightLevel) evPreflightLevel.textContent = data.preflight_level;
  if (evSimulation) evSimulation.textContent = sim.status === "PASS" ? `PASS (err: null, ${sim.units_consumed} CU)` : sim.status === "NOT_RUN" ? "NOT RUN (Quote Precheck Mode)" : `FAIL (${sim.err})`;

  // Smooth scroll to result
  resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ==========================================
// 5. Global Wallet State Management
// ==========================================
function setGlobalWalletState(address) {
  activeWalletAddress = address;

  const dots = document.querySelectorAll(".wallet-dot");
  const labels = document.querySelectorAll(".wallet-status-label");
  const inputs = document.querySelectorAll(".wallet-input");

  dots.forEach(dot => {
    if (address) dot.classList.add("connected");
    else dot.classList.remove("connected");
  });

  labels.forEach(lbl => {
    if (address) lbl.textContent = `Mode: Exact Simulation (${address.slice(0, 4)}...${address.slice(-4)})`;
    else lbl.textContent = "Mode: Quote Precheck (No wallet required)";
  });

  inputs.forEach(inp => {
    if (address && inp.value !== address) inp.value = address;
  });

  if (walletBtnLabel) {
    walletBtnLabel.textContent = address ? `Disconnect (${address.slice(0, 4)}...${address.slice(-4)})` : "Connect Wallet";
  }
}

async function handleGlobalWalletConnect() {
  if (activeWalletAddress) {
    setGlobalWalletState(null);
    return;
  }

  const provider = window.solana || window.phantom?.solana || window.solflare;
  if (provider && typeof provider.connect === "function") {
    try {
      if (walletBtnLabel) walletBtnLabel.textContent = "Connecting...";
      const resp = await provider.connect();
      const pubkey = resp.publicKey ? resp.publicKey.toString() : (provider.publicKey ? provider.publicKey.toString() : null);
      if (pubkey) {
        setGlobalWalletState(pubkey);
      } else {
        throw new Error("No public key returned");
      }
    } catch (err) {
      setGlobalWalletState(null);
      switchView("app", "AAPLx");
    }
  } else {
    switchView("app", "AAPLx");
  }
}

if (walletBtn) walletBtn.addEventListener("click", handleGlobalWalletConnect);

// Initial SOL Price Warmup
fetch("/api/v1/preflight", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ inputAsset: "SOL", stock: "AAPLx", amount: 1 })
}).then(r => r.json()).then(d => {
  if (d.trade?.input_usd_value) {
    currentSolPrice = d.trade.input_usd_value;
    document.querySelectorAll(".sol-spot-sub").forEach(el => {
      el.textContent = `$${currentSolPrice.toFixed(2)}`;
    });
  }
}).catch(() => {});
