// JustFair Consumer Client Application
// Zero-Custody, Pre-Trade Economic Safety Inspector on Solana

const STOCK_META = {
  AAPLx: { name: "Apple Inc.", canonical: "AAPL", mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp" },
  NVDAx: { name: "NVIDIA Corp.", canonical: "NVDA", mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh" },
  SPYx: { name: "S&P 500 ETF", canonical: "SPY", mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W" },
  TSLAx: { name: "Tesla Inc.", canonical: "TSLA", mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB" }
};

let currentSolPrice = 135.0; // Fallback estimate before live fetch
let activeWalletAddress = null;

// DOM Elements
const form = document.getElementById("preflight-form");
const stockInput = document.getElementById("stock-select");
const paymentInput = document.getElementById("payment-select");
const amountInput = document.getElementById("amount-input");
const amountPrefix = document.getElementById("amount-prefix");
const amountUsdEquiv = document.getElementById("amount-usd-equivalent");
const stockChips = document.querySelectorAll(".stock-chip");
const paymentTabs = document.querySelectorAll(".payment-tab");
const presetBtns = document.querySelectorAll(".preset-btn");
const walletBtn = document.getElementById("wallet-toggle-btn");
const walletBtnLabel = document.getElementById("wallet-btn-label");
const walletStatusText = document.getElementById("wallet-status-text");
const walletDot = document.getElementById("wallet-dot");
const manualKeyToggle = document.getElementById("manual-key-toggle");
const manualKeyBox = document.getElementById("manual-key-box");
const walletInput = document.getElementById("wallet-input");
const submitBtn = document.getElementById("submit-btn");

// States
const loadingState = document.getElementById("loading-state");
const errorState = document.getElementById("error-state");
const resultState = document.getElementById("result-state");
const errorTitle = document.getElementById("error-title");
const errorMessage = document.getElementById("error-message");
const errorRetryBtn = document.getElementById("error-retry-btn");

// Results Elements
const verdictBanner = document.getElementById("verdict-banner");
const verdictIcon = document.getElementById("verdict-icon");
const verdictTitle = document.getElementById("verdict-title");
const verdictSubtitle = document.getElementById("verdict-subtitle");
const resSpendVal = document.getElementById("res-spend-val");
const resSpendSub = document.getElementById("res-spend-sub");
const resExposureLabel = document.getElementById("res-exposure-label");
const resExposureVal = document.getElementById("res-exposure-val");
const resExposureSub = document.getElementById("res-exposure-sub");
const resDiffVal = document.getElementById("res-diff-val");
const resDiffPct = document.getElementById("res-diff-pct");
const resExplanation = document.getElementById("res-explanation");
const simBanner = document.getElementById("simulation-banner");
const simTitle = document.getElementById("sim-title");
const simDesc = document.getElementById("sim-desc");
const jupiterExitLink = document.getElementById("jupiter-exit-link");

// Evidence Elements
const evMint = document.getElementById("ev-mint");
const evProgram = document.getElementById("ev-program");
const evMultiplier = document.getElementById("ev-multiplier");
const evRouter = document.getElementById("ev-router");
const evSteps = document.getElementById("ev-steps");
const evImpact = document.getElementById("ev-impact");
const evBenchmarkSource = document.getElementById("ev-benchmark-source");
const evSession = document.getElementById("ev-session");
const evPreflightLevel = document.getElementById("ev-preflight-level");
const evSimulation = document.getElementById("ev-simulation");

// 1. Stock Selection Handler
stockChips.forEach(chip => {
  chip.addEventListener("click", () => {
    stockChips.forEach(c => {
      c.classList.remove("active");
      c.setAttribute("aria-checked", "false");
    });
    chip.classList.add("active");
    chip.setAttribute("aria-checked", "true");
    const sym = chip.getAttribute("data-symbol");
    stockInput.value = sym;
  });
});

// 2. Payment Selection Handler
paymentTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    paymentTabs.forEach(t => {
      t.classList.remove("active");
      t.setAttribute("aria-checked", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-checked", "true");
    const asset = tab.getAttribute("data-asset");
    paymentInput.value = asset;

    if (asset === "SOL") {
      amountPrefix.textContent = "◎";
      updatePresets([1, 2, 5, 10], "SOL");
      if (parseFloat(amountInput.value) > 50) amountInput.value = "2";
    } else {
      amountPrefix.textContent = "$";
      updatePresets([100, 500, 1000, 2500], "$");
      if (parseFloat(amountInput.value) <= 10) amountInput.value = "500";
    }
    updateAmountUsdEquiv();
  });
});

function updatePresets(values, prefix) {
  const container = document.getElementById("amount-presets");
  container.innerHTML = "";
  values.forEach((v, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `preset-btn ${idx === 1 ? "active" : ""}`;
    btn.setAttribute("data-val", v);
    btn.textContent = prefix === "$" ? `$${v.toLocaleString()}` : `${v} SOL`;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      amountInput.value = v;
      updateAmountUsdEquiv();
    });
    container.appendChild(btn);
  });
}

// 3. Amount Input Change Handler
amountInput.addEventListener("input", () => {
  document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
  updateAmountUsdEquiv();
});

function updateAmountUsdEquiv() {
  const asset = paymentInput.value;
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

// 4. Wallet Connection & Manual Address Management
manualKeyToggle.addEventListener("click", () => {
  const isHidden = manualKeyBox.classList.contains("hidden");
  manualKeyBox.classList.toggle("hidden", !isHidden);
  manualKeyToggle.setAttribute("aria-expanded", String(isHidden));
  manualKeyToggle.textContent = isHidden ? "Hide manual address" : "Enter address manually";
});

walletInput.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  if (val.length >= 32) {
    setWalletState(val, "Manual Address Active");
  } else if (val.length === 0) {
    setWalletState(null, "Mode: Quote Precheck (No wallet required)");
  }
});

walletBtn.addEventListener("click", async () => {
  if (activeWalletAddress) {
    // Disconnect
    setWalletState(null, "Mode: Quote Precheck (No wallet required)");
    walletInput.value = "";
    return;
  }

  // Check for window.solana (Phantom / Standard Wallet)
  if (window.solana && typeof window.solana.connect === "function") {
    try {
      walletBtnLabel.textContent = "Connecting...";
      const resp = await window.solana.connect();
      const pubkey = resp.publicKey ? resp.publicKey.toString() : window.solana.publicKey.toString();
      setWalletState(pubkey, `Connected: ${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`);
      walletInput.value = pubkey;
    } catch (err) {
      walletBtnLabel.textContent = "Connect Wallet";
      alert("Wallet connection was cancelled or rejected.");
    }
  } else {
    // Reveal manual address box
    manualKeyBox.classList.remove("hidden");
    manualKeyToggle.textContent = "Hide manual address";
    walletInput.focus();
  }
});

function setWalletState(address, label) {
  activeWalletAddress = address;
  if (address) {
    walletDot.classList.add("connected");
    walletStatusText.textContent = `Mode: Exact Simulation (${address.slice(0, 4)}...${address.slice(-4)})`;
    walletBtnLabel.textContent = `Disconnect (${address.slice(0, 4)}...${address.slice(-4)})`;
  } else {
    walletDot.classList.remove("connected");
    walletStatusText.textContent = "Mode: Quote Precheck (No wallet required)";
    walletBtnLabel.textContent = "Connect Wallet";
  }
}

// 5. Form Submission (Unified Preflight Call)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const stockSymbol = stockInput.value;
  const inputSymbol = paymentInput.value;
  const amount = parseFloat(amountInput.value);
  const userWallet = activeWalletAddress || walletInput.value.trim() || null;

  if (isNaN(amount) || amount <= 0) {
    showError("Invalid Amount", "Please enter a valid amount greater than zero.");
    return;
  }

  // Switch UI to Loading State
  showLoading();

  try {
    const res = await fetch("/api/v1/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputAsset: inputSymbol,
        stock: stockSymbol,
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
      showError("Check Failed", msg);
      return;
    }

    renderResult(data);
  } catch (err) {
    showError("Connection Error", "Unable to connect to the JustFair Preflight service. Please check your internet connection.");
  }
});

errorRetryBtn.addEventListener("click", () => {
  errorState.classList.add("hidden");
  form.scrollIntoView({ behavior: "smooth" });
});

function showLoading() {
  errorState.classList.add("hidden");
  resultState.classList.add("hidden");
  loadingState.classList.remove("hidden");
  submitBtn.disabled = true;
  submitBtn.querySelector(".btn-text").textContent = "Checking...";
  submitBtn.querySelector(".btn-spinner").classList.remove("hidden");
}

function showError(title, message) {
  loadingState.classList.add("hidden");
  resultState.classList.add("hidden");
  errorState.classList.remove("hidden");
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  resetSubmitBtn();
}

function resetSubmitBtn() {
  submitBtn.disabled = false;
  submitBtn.querySelector(".btn-text").textContent = "CHECK TRADE";
  submitBtn.querySelector(".btn-spinner").classList.add("hidden");
}

// 6. Render Economic Result
function renderResult(data) {
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");
  resultState.classList.remove("hidden");
  resetSubmitBtn();

  const trade = data.trade;
  const econ = data.economics;
  const bench = data.benchmark;
  const mkt = bench.market_context || {};
  const sim = data.simulation;
  const diffPct = econ.difference_pct;
  const stockMeta = STOCK_META[trade.stock_symbol] || { name: trade.canonical_stock };

  // Set Spending Value
  resSpendVal.textContent = `$${trade.input_usd_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  resSpendSub.textContent = `${trade.input_amount} ${trade.input_asset}`;

  // Set Exposure Value
  resExposureLabel.textContent = `EXPECTED ${stockMeta.name.toUpperCase()} EXPOSURE`;
  resExposureVal.textContent = `$${econ.expected_stock_exposure_usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  resExposureSub.textContent = `${econ.expected_stock_shares} ${trade.canonical_stock} @ $${bench.price}`;

  // Set Net Difference
  const diffPrefix = econ.difference_usd >= 0 ? "+" : "";
  resDiffVal.textContent = `${diffPrefix}$${econ.difference_usd.toFixed(2)}`;
  resDiffPct.textContent = `${diffPrefix}${diffPct.toFixed(2)}% vs independent benchmark`;

  // Verdict Banner State
  verdictBanner.className = "verdict-banner";
  if (mkt.session === "CLOSED" || bench.freshness_status === "AFTER_HOURS_CLOSE") {
    verdictBanner.classList.add("verdict-closed");
    verdictIcon.textContent = "🌙";
    verdictTitle.textContent = "Market Closed: Route Found, Benchmark Inactive";
    verdictSubtitle.textContent = `The US equity market is currently closed. Live DEX routing delivered $${econ.expected_stock_exposure_usd} estimated exposure, but benchmark safety cannot be certified outside active trading sessions.`;
  } else if (data.verdict === "MEASURED" || data.verification_status === "VERIFIED") {
    verdictBanner.classList.add("verdict-measured");
    verdictIcon.textContent = "⚖️";
    verdictTitle.textContent = "Trade Route Evaluated";
    verdictSubtitle.textContent = `Economic difference measured at ${diffPrefix}${diffPct.toFixed(2)}%. Threshold safety calibration is currently pending live tape verification.`;
  } else {
    verdictBanner.classList.add("verdict-measured");
    verdictIcon.textContent = "ℹ️";
    verdictTitle.textContent = "Preflight Inspection Completed";
    verdictSubtitle.textContent = `Reason: ${data.reason_codes?.join(", ")}`;
  }

  // Plain English Explanation
  if (mkt.session === "CLOSED") {
    resExplanation.textContent = `We found a live Solana route for ${trade.input_amount} ${trade.input_asset} giving approximately ${econ.expected_stock_shares} shares of ${stockMeta.name}. Note that traditional stock markets are closed right now, so the underlying reference price ($${bench.price}) is from the previous market close.`;
  } else {
    resExplanation.textContent = `This trade route would spend $${trade.input_usd_value.toFixed(2)} to acquire approximately ${econ.expected_stock_shares} shares of ${stockMeta.name} on Solana, delivering $${econ.expected_stock_exposure_usd.toFixed(2)} of underlying exposure (difference: ${diffPrefix}$${econ.difference_usd.toFixed(2)} or ${diffPrefix}${diffPct.toFixed(2)}%).`;
  }

  // Exact Simulation Banner
  if (data.preflight_level === "EXACT_SIMULATION") {
    simBanner.classList.remove("hidden");
    if (sim.status === "PASS" && sim.err === null) {
      simTitle.textContent = "Exact Transaction Simulation: Passed";
      simDesc.textContent = `Simulated via Solana RPC with err: null (${sim.units_consumed?.toLocaleString() || 0} compute units). Zero funds moved.`;
    } else {
      simTitle.textContent = "Exact Simulation: Failed on Upstream Route";
      simDesc.textContent = `Transaction simulation returned an error. Route economics are displayed from quote check.`;
    }
  } else {
    simBanner.classList.add("hidden");
  }

  // Jupiter Exit Link
  const inputMint = trade.input_asset === "SOL" ? "So11111111111111111111111111111111111111112" : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  jupiterExitLink.href = `https://jup.ag/swap/${inputMint}-${trade.token_mint}`;

  // Evidence Details
  evMint.textContent = trade.token_mint;
  evProgram.textContent = "Token-2022 (Scaled UI Amount Extension)";
  evMultiplier.textContent = `${econ.multiplier.current_multiplier} (1 token = ${econ.multiplier.current_multiplier} shares)`;
  evRouter.textContent = `Jupiter Swap V2 (Router: ${data.dex_route.router}, Mode: ${data.dex_route.mode})`;
  evSteps.textContent = data.dex_route.steps?.join(" ➜ ") || "Direct DEX Pool";
  evImpact.textContent = `${(parseFloat(data.dex_route.price_impact_pct || 0)).toFixed(4)}%`;
  evBenchmarkSource.textContent = `${bench.provider} (${bench.source})`;
  evSession.textContent = `Reference: ${bench.reference_session} | Current: ${mkt.session || bench.current_market_session}`;
  evPreflightLevel.textContent = data.preflight_level;
  evSimulation.textContent = sim.status === "PASS" ? `PASS (err: null, ${sim.units_consumed} CU)` : sim.status === "NOT_RUN" ? "NOT RUN (Quote Precheck Mode)" : `FAIL (${sim.err})`;

  // Smooth scroll to result
  resultState.scrollIntoView({ behavior: "smooth" });
}

// Initial SOL Price Warmup
fetch("/api/v1/preflight", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ inputAsset: "SOL", stock: "AAPLx", amount: 1 })
}).then(r => r.json()).then(d => {
  if (d.trade?.input_usd_value) {
    currentSolPrice = d.trade.input_usd_value;
    const solSub = document.getElementById("sol-spot-sub");
    if (solSub) solSub.textContent = `$${currentSolPrice.toFixed(2)}`;
    updateAmountUsdEquiv();
  }
}).catch(() => {});

