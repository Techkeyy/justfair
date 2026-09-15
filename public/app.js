// JustFair Consumer Client Application
// Zero-Custody, Pre-Trade Economic Safety Inspector on Solana
// 12-Stock Verified Catalog & Standalone Feed System (Order 007.5)

export const STOCK_META = {
  AAPLx: {
    symbol: "AAPLx",
    name: "Apple",
    canonical: "AAPL",
    fullName: "Apple Inc.",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    logo: "/assets/stocks/apple.svg",
    category: "Mega-Cap Tech",
    desc: "Tokenized Apple equity on Solana"
  },
  NVDAx: {
    symbol: "NVDAx",
    name: "NVIDIA",
    canonical: "NVDA",
    fullName: "NVIDIA Corporation",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    logo: "/assets/stocks/nvidia.svg",
    category: "Crypto & AI",
    desc: "Tokenized NVIDIA AI computing equity on Solana"
  },
  SPYx: {
    symbol: "SPYx",
    name: "S&P 500 ETF",
    canonical: "SPY",
    fullName: "SPDR S&P 500 ETF Trust",
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    logo: "/assets/stocks/spdr.svg",
    category: "Index ETFs",
    desc: "Tokenized SPDR S&P 500 ETF Trust exposure on Solana"
  },
  TSLAx: {
    symbol: "TSLAx",
    name: "Tesla",
    canonical: "TSLA",
    fullName: "Tesla Inc.",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    logo: "/assets/stocks/tesla.svg",
    category: "Mega-Cap Tech",
    desc: "Tokenized Tesla electric vehicle equity on Solana"
  },
  MSFTx: {
    symbol: "MSFTx",
    name: "Microsoft",
    canonical: "MSFT",
    fullName: "Microsoft Corporation",
    mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
    logo: "/assets/stocks/microsoft.svg",
    category: "Mega-Cap Tech",
    desc: "Tokenized Microsoft cloud & software equity on Solana"
  },
  AMZNx: {
    symbol: "AMZNx",
    name: "Amazon",
    canonical: "AMZN",
    fullName: "Amazon.com Inc.",
    mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
    logo: "/assets/stocks/amazon.svg",
    category: "Mega-Cap Tech",
    desc: "Tokenized Amazon e-commerce & cloud equity on Solana"
  },
  GOOGLx: {
    symbol: "GOOGLx",
    name: "Alphabet (Google)",
    canonical: "GOOGL",
    fullName: "Alphabet Inc.",
    mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
    logo: "/assets/stocks/google.svg",
    category: "Mega-Cap Tech",
    desc: "Tokenized Google search & AI equity on Solana"
  },
  METAx: {
    symbol: "METAx",
    name: "Meta Platforms",
    canonical: "META",
    fullName: "Meta Platforms Inc.",
    mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
    logo: "/assets/stocks/meta.svg",
    category: "Mega-Cap Tech",
    desc: "Tokenized Meta social & AI equity on Solana"
  },
  COINx: {
    symbol: "COINx",
    name: "Coinbase",
    canonical: "COIN",
    fullName: "Coinbase Global Inc.",
    mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
    logo: "/assets/stocks/coinbase.svg",
    category: "Crypto & AI",
    desc: "Tokenized Coinbase exchange equity on Solana"
  },
  AMDx: {
    symbol: "AMDx",
    name: "AMD",
    canonical: "AMD",
    fullName: "Advanced Micro Devices Inc.",
    mint: "XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF",
    logo: "/assets/stocks/amd.svg",
    category: "Crypto & AI",
    desc: "Tokenized AMD semiconductor equity on Solana"
  },
  MSTRx: {
    symbol: "MSTRx",
    name: "MicroStrategy",
    canonical: "MSTR",
    fullName: "MicroStrategy Incorporated",
    mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ",
    logo: "/assets/stocks/microstrategy.svg",
    category: "Crypto & AI",
    desc: "Tokenized MicroStrategy Bitcoin treasury equity on Solana"
  },
  QQQx: {
    symbol: "QQQx",
    name: "Invesco QQQ (Nasdaq 100)",
    canonical: "QQQ",
    fullName: "Invesco QQQ Trust Series 1",
    mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ",
    logo: "/assets/stocks/qqq.svg",
    category: "Index ETFs",
    desc: "Tokenized Invesco QQQ Nasdaq 100 ETF exposure on Solana"
  }
};

// Canonical 12-Underlying Catalog for Product Preflight (Phase 14)
export const UNDERLYING_CATALOG = {
  AAPL: {
    canonical: "AAPL",
    name: "Apple",
    fullName: "Apple Inc.",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/apple.svg",
    representations: ["AAPLx", "AAPLon"],
    desc: "Apple Inc. common stock tokenized on Solana"
  },
  NVDA: {
    canonical: "NVDA",
    name: "NVIDIA",
    fullName: "NVIDIA Corporation",
    category: "Crypto & AI",
    logo: "/assets/stocks/nvidia.svg",
    representations: ["NVDAx", "NVDAon"],
    desc: "NVIDIA AI computing equity on Solana"
  },
  SPY: {
    canonical: "SPY",
    name: "S&P 500 ETF",
    fullName: "SPDR S&P 500 ETF Trust",
    category: "Index ETFs",
    logo: "/assets/stocks/spdr.svg",
    representations: ["SPYx", "SPYon"],
    desc: "SPDR S&P 500 ETF Trust exposure on Solana"
  },
  TSLA: {
    canonical: "TSLA",
    name: "Tesla",
    fullName: "Tesla Inc.",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/tesla.svg",
    representations: ["TSLAx", "TSLAon"],
    desc: "Tesla electric vehicle equity on Solana"
  },
  MSFT: {
    canonical: "MSFT",
    name: "Microsoft",
    fullName: "Microsoft Corporation",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/microsoft.svg",
    representations: ["MSFTx", "MSFTon"],
    desc: "Microsoft cloud & software equity on Solana"
  },
  AMZN: {
    canonical: "AMZN",
    name: "Amazon",
    fullName: "Amazon.com Inc.",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/amazon.svg",
    representations: ["AMZNx", "AMZNon"],
    desc: "Amazon e-commerce & cloud equity on Solana"
  },
  GOOGL: {
    canonical: "GOOGL",
    name: "Alphabet (Google)",
    fullName: "Alphabet Inc.",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/google.svg",
    representations: ["GOOGLx", "GOOGLon"],
    desc: "Google search & AI equity on Solana"
  },
  META: {
    canonical: "META",
    name: "Meta Platforms",
    fullName: "Meta Platforms Inc.",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/meta.svg",
    representations: ["METAx", "METAon"],
    desc: "Meta social & AI equity on Solana"
  },
  COIN: {
    canonical: "COIN",
    name: "Coinbase",
    fullName: "Coinbase Global Inc.",
    category: "Crypto & AI",
    logo: "/assets/stocks/coinbase.svg",
    representations: ["COINx", "COINon"],
    desc: "Coinbase exchange equity on Solana"
  },
  AMD: {
    canonical: "AMD",
    name: "AMD",
    fullName: "Advanced Micro Devices Inc.",
    category: "Crypto & AI",
    logo: "/assets/stocks/amd.svg",
    representations: ["AMDx", "AMDon"],
    desc: "AMD semiconductor equity on Solana"
  },
  MSTR: {
    canonical: "MSTR",
    name: "MicroStrategy",
    fullName: "MicroStrategy Incorporated",
    category: "Crypto & AI",
    logo: "/assets/stocks/microstrategy.svg",
    representations: ["MSTRx", "MSTRon"],
    desc: "MicroStrategy Bitcoin treasury equity on Solana"
  },
  QQQ: {
    canonical: "QQQ",
    name: "Invesco QQQ (Nasdaq 100)",
    fullName: "Invesco QQQ Trust Series 1",
    category: "Index ETFs",
    logo: "/assets/stocks/qqq.svg",
    representations: ["QQQx", "QQQon"],
    desc: "Invesco QQQ Nasdaq 100 ETF exposure on Solana"
  }
};

// 11 Canonical Consumer Product Expectations (Phase 13 / Phase 14)
export const EXPECTATIONS_CONFIG = {
  primary: [
    {
      capability: "SELF_CUSTODY",
      title: "Hold it in my own wallet",
      desc: "Direct self-custodial storage on Solana without relying on a custodial brokerage account."
    },
    {
      capability: "ECONOMIC_DIVIDEND_BENEFIT",
      title: "Benefit economically from dividends",
      desc: "Receive proportional economic value of company dividends via price multiplier adjustment."
    },
    {
      capability: "CASH_DIVIDEND_PAYOUT",
      title: "Cash dividends paid directly to me",
      desc: "Receive dividend distributions as cash/USDC deposits sent directly into your personal wallet."
    },
    {
      capability: "ORDINARY_VOTING_RIGHTS",
      title: "Normal shareholder voting rights",
      desc: "Direct proxy voting rights in corporate governance, board elections, and shareholder resolutions."
    },
    {
      capability: "DIRECT_SHARE_OWNERSHIP",
      title: "Direct ownership of company shares",
      desc: "Direct equity title registered on the underlying corporation's official share registry."
    }
  ],
  secondary: [
    {
      capability: "WEEKEND_TRADING",
      title: "Trade on weekends",
      desc: "Ability to swap on Solana DEX pools on weekends. Subject to liquidity, solver availability, and off-hours market spreads; distinct from wallet transferability."
    },
    {
      capability: "WALLET_TRANSFERABILITY",
      title: "Move token between my own wallets",
      desc: "Direct peer-to-peer wallet transferability across Solana without broker gatekeeping."
    },
    {
      capability: "ONCHAIN_SECONDARY_TRADING",
      title: "Trade on Solana DEXes",
      desc: "Execute secondary swaps on decentralized exchange liquidity pools on Solana."
    },
    {
      capability: "DIRECT_ISSUER_REDEMPTION",
      title: "Direct primary redemption option with issuer",
      desc: "Right to redeem tokens directly with the issuer for underlying collateral or settlement cash."
    },
    {
      capability: "IN_KIND_SHARE_REDEMPTION",
      title: "Convert token into actual company shares",
      desc: "Contractual right to redeem tokens directly with the issuer for real physical/brokerage shares."
    },
    {
      capability: "REDEMPTION_WITHOUT_KYC",
      title: "Redeem without identity verification",
      desc: "Right to redeem directly with the issuer without completing KYC/AML identity verification."
    }
  ]
};

// Global App & Product Preflight State
// Steps 1-3 are Product Preflight. Step 4 is an independent scrolling
// trade-check feed; expanding a card is the explicit trade selection.
export const appState = {
  currentStep: 1,
  selectedUnderlying: "AAPL",
  expectations: {}, // capability -> 'MUST_HAVE' | 'NICE_TO_HAVE'
  productPreflightResult: null,
  selectedRepresentation: null, // Product-side card highlight only; never preloaded into Step 4
  progress: { company: false, expectations: false }, // genuine Product Preflight progress for tracker truth
  searchQuery: "",
  categoryFilter: "ALL"
};

if (typeof window !== "undefined") {
  window.appState = appState;
}

let currentSolPrice = null; // Authoritative live price from /api/v1/prices
let solPriceTimestamp = null;
let solPriceStatus = "LOADING";
let activeWalletAddress = null;
let activeWalletConnected = false; // true only when the address came from a wallet connection
let currentSearchQuery = "";
let currentCategoryFilter = "all";
let currentTradeCategoryFilter = "all"; // Step 4 feed pills, independent of Step 1

// ==========================================
// Market Streaming & Route Scheduler (Order 009.6)
// ==========================================

export class MarketStreamManager {
  constructor() {
    this.status = "UNINITIALIZED";
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
  }

  async init() {
    try {
      const res = await fetch("/api/v1/stream/status");
      const data = await res.json();
      if (!data.streaming_infrastructure?.pyth_auth_present) {
        this.status = "BLOCKED: PYTH_API_KEY_REQUIRED";
        return;
      }
      this.connect();
    } catch (e) {
      this.status = "OFFLINE";
    }
  }

  connect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      try { this.eventSource.close(); } catch {}
      this.eventSource = null;
    }
    if (this.reconnectAttempts >= 8) {
      this.status = "DISCONNECTED";
      return;
    }

    try {
      this.eventSource = new EventSource("/api/v1/stream");

      this.eventSource.onopen = () => {
        this.status = "LIVE";
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "PRICE_UPDATE" && payload.symbol === "SOL") {
            currentSolPrice = payload.price;
            solPriceTimestamp = payload.timestamp;
            solPriceStatus = "FRESH";
            updateAllSolPriceDisplays();
          }
        } catch {}
      };

      this.eventSource.onerror = () => {
        this.status = "RECONNECTING";
        try { this.eventSource?.close(); } catch {}
        this.eventSource = null;
        const backoff = Math.min(16000, 1000 * Math.pow(2, this.reconnectAttempts)) * (0.8 + Math.random() * 0.4);
        this.reconnectAttempts++;
        this.reconnectTimer = setTimeout(() => this.connect(), backoff);
      };
    } catch {}
  }
}

export class ActiveTradeRouteScheduler {
  constructor() {
    this.activeSymbol = null;
    this.activeCard = null;
    this.timer = null;
    this.abortController = null;
    this.generationToken = 0;
    this.isPolling = false;
    this.lastQuoteData = null;
    this.lastCheckedData = null;
    this.isTabHidden = false;

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        this.isTabHidden = document.visibilityState === "hidden";
        if (this.isTabHidden) {
          this.stopTimer();
        } else if (this.activeSymbol && this.activeCard) {
          this.fetchActiveRoute();
          this.startTimer();
        }
      });
    }
  }

  start(symbol, card) {
    this.stop();
    this.activeSymbol = symbol;
    this.activeCard = card;
    this.generationToken++;
    this.lastCheckedData = null;
    
    this.fetchActiveRoute();
    this.startTimer();
  }

  stop() {
    this.stopTimer();
    if (this.abortController) {
      try { this.abortController.abort(); } catch {}
      this.abortController = null;
    }
    this.activeSymbol = null;
    this.activeCard = null;
    this.lastQuoteData = null;
  }

  stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  startTimer(ms = 3500) {
    this.stopTimer();
    if (this.isTabHidden) return;
    this.timer = setTimeout(() => {
      if (this.activeSymbol && this.activeCard) {
        this.fetchActiveRoute().then(() => {
          if (this.activeSymbol && !this.isTabHidden) {
            this.startTimer(3500);
          }
        });
      }
    }, ms);
  }

  notifyFormChanged() {
    if (!this.activeSymbol || !this.activeCard) return;
    this.stopTimer();
    this.fetchActiveRoute();
    this.startTimer(3500);
  }

  setLastCheckedSnapshot(data) {
    this.lastCheckedData = data;
    if (this.activeCard) {
      const banner = this.activeCard.querySelector(".live-movement-banner");
      if (banner) banner.classList.add("hidden");
    }
  }

  async fetchActiveRoute() {
    if (!this.activeSymbol || !this.activeCard || this.isPolling) return;
    const currentToken = ++this.generationToken;
    const card = this.activeCard;
    const symbol = this.activeSymbol;

    const form = card.querySelector(".stock-trade-form");
    if (!form) return;

    const inputAsset = (form.querySelector("input[name='inputAsset']")?.value || "").trim();
    if (!inputAsset) return;
    const amountVal = parseFloat(form.querySelector(".amount-input")?.value || "0");
    if (isNaN(amountVal) || amountVal <= 0) return;

    if (this.abortController) {
      try { this.abortController.abort(); } catch {}
    }
    this.abortController = new AbortController();
    this.isPolling = true;

    try {
      const res = await fetch("/api/v1/preflight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputAsset,
          stock: symbol,
          amount: amountVal,
          wallet: null
        }),
        signal: this.abortController.signal
      });

      if (currentToken !== this.generationToken) return;

      if (res.status === 429) {
        this.updateLivePreviewStatus(card, "RATE LIMITED", "badge-reconnecting");
        this.stopTimer();
        this.startTimer(10000);
        return;
      }

      if (!res.ok) return;

      const data = await res.json();
      if (currentToken !== this.generationToken) return;

      if (data.request_status === "SUCCESS") {
        this.lastQuoteData = data;
        this.updateLivePreview(card, data);

        // Check if live route moved compared to checked snapshot
        if (this.lastCheckedData && this.lastCheckedData.trade?.stock_symbol === symbol) {
          const checkedOut = BigInt(this.lastCheckedData.economics?.raw_out_amount || "0");
          const liveOut = BigInt(data.economics?.raw_out_amount || "0");
          if (checkedOut > 0n && liveOut > 0n) {
            const diffOut = Number(liveOut - checkedOut) / Number(checkedOut);
            const banner = card.querySelector(".live-movement-banner");
            if (banner) {
              if (Math.abs(diffOut) > 0.0005) { // 0.05% move
                const pctStr = (diffOut * 100).toFixed(2);
                const prefix = diffOut >= 0 ? "+" : "";
                const textEl = banner.querySelector(".live-movement-text");
                if (textEl) textEl.textContent = `⚡ Live route output moved (${prefix}${pctStr}%) since check`;
                banner.classList.remove("hidden");
              }
            }
          }
        }
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        this.updateLivePreviewStatus(card, "RECONNECTING", "badge-reconnecting");
      }
    } finally {
      this.isPolling = false;
    }
  }

  updateLivePreview(card, data) {
    const trade = data.trade;
    const econ = data.economics;
    const bench = data.benchmark;
    const route = data.dex_route;

    const spendVal = card.querySelector(".live-spend-val");
    const sharesVal = card.querySelector(".live-shares-val");
    const freshnessVal = card.querySelector(".live-freshness-val");
    const statusBadge = card.querySelector(".live-route-status");

    if (spendVal) {
      spendVal.textContent = `$${trade.input_usd_value.toFixed(2)} USD`;
    }
    if (sharesVal) {
      sharesVal.textContent = `~${econ.expected_stock_shares} ${trade.canonical_stock}`;
    }
    if (freshnessVal) {
      freshnessVal.textContent = `Updated <1s ago (${route?.steps?.join(" → ") || "Jupiter"})`;
    }
    if (statusBadge) {
      // Route status only: a returned route is live even when the equity
      // benchmark is stale. Session/benchmark state renders separately below.
      statusBadge.className = "live-status-badge badge-live live-route-status";
      statusBadge.textContent = "● Route Live";
    }
    const benchCtx = card.querySelector(".live-benchmark-context");
    if (benchCtx) {
      const ref = describeBenchmarkState(bench, data?.reason_codes);
      benchCtx.textContent = `Equity session: ${ref.sessionDisplay} · Fairness benchmark: ${ref.benchmarkDisplay}`;
      benchCtx.classList.remove("hidden");
    }
  }

  updateLivePreviewStatus(card, text, badgeClass) {
    const statusBadge = card.querySelector(".live-route-status");
    if (statusBadge) {
      statusBadge.className = `live-status-badge ${badgeClass} live-route-status`;
      statusBadge.textContent = text;
    }
  }
}

export const activeRouteScheduler = new ActiveTradeRouteScheduler();
export const marketStreamManager = new MarketStreamManager();

if (typeof window !== "undefined") {
  window.activeRouteScheduler = activeRouteScheduler;
  window.marketStreamManager = marketStreamManager;
}

export async function fetchAuthoritativeSolPrice() {
  try {
    const res = await fetch("/api/v1/prices/sol");
    if (!res.ok) throw new Error("Price fetch failed");
    const data = await res.json();
    if (data.status === "SUCCESS" && typeof data.price === "number") {
      currentSolPrice = data.price;
      solPriceTimestamp = data.data?.timestamp || new Date().toISOString();
      solPriceStatus = data.data?.freshness_status || "FRESH";
      updateAllSolPriceDisplays();
    }
  } catch (err) {
    solPriceStatus = "UNAVAILABLE";
    updateAllSolPriceDisplays();
  }
}

export function updateAllSolPriceDisplays() {
  const spotSubList = document.querySelectorAll(".sol-spot-sub");
  spotSubList.forEach(el => {
    if (currentSolPrice && solPriceStatus === "FRESH") {
      el.textContent = `$${currentSolPrice.toFixed(2)}`;
    } else if (currentSolPrice) {
      el.textContent = `$${currentSolPrice.toFixed(2)} (stale)`;
    } else {
      el.textContent = "Live Price";
    }
  });

  // Update form estimates for any active SOL forms
  document.querySelectorAll(".stock-trade-form").forEach(form => {
    const asset = form.querySelector("input[name='inputAsset']")?.value;
    if (asset === "SOL") {
      const amountInput = form.querySelector(".amount-input");
      const amountUsdEquiv = form.querySelector(".amount-usd-equivalent");
      updateUsdEquiv(amountInput, amountUsdEquiv, "SOL");
    }
  });
}

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

// Search & Filter Elements
const stockSearchInput = document.getElementById("stock-search-input");
const clearSearchBtn = document.getElementById("clear-search-btn");
const categoryPills = document.querySelectorAll(".category-pill");
const stockCardsContainer = document.getElementById("stock-cards-container");

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

    if (targetSymbol) {
      expandStockCard(targetSymbol);
    }
  } else {
    appView.classList.add("hidden");
    dashboardView.classList.remove("hidden");
    tabAppBtn.classList.remove("active");
    tabDashboardBtn.classList.add("active");
    headerLaunchBtn.classList.remove("hidden");
  }
}

export function navigateToSection(target, targetStock = null) {
  if (target === "app") {
    switchView("app", targetStock);
    goToStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash !== "#app") {
      history.pushState(null, "", "#app");
    }
  } else if (target === "dashboard") {
    switchView("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.location.hash !== "#dashboard" && window.location.hash !== "") {
      history.pushState(null, "", "#dashboard");
    }
  } else if (target === "why-justfair") {
    switchView("dashboard");
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById("why-justfair");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        history.pushState(null, "", "#why-justfair");
      }, 50);
    });
  } else if (target === "differentiation") {
    switchView("dashboard");
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById("differentiation");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        history.pushState(null, "", "#differentiation");
      }, 50);
    });
  } else if (target === "how-it-works") {
    switchView("dashboard");
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById("how-it-works");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        history.pushState(null, "", "#how-it-works");
      }, 50);
    });
  } else if (target === "api" || target === "api-docs") {
    switchView("dashboard");
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById("api-docs") || document.getElementById("api-showcase");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        history.pushState(null, "", "#api-docs");
      }, 50);
    });
  }
}

// Event Listeners for Navigation
if (tabDashboardBtn) tabDashboardBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("dashboard");
});
if (tabAppBtn) tabAppBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("app");
});
if (navBrandLink) navBrandLink.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("dashboard");
});
const navWhyBtn = document.getElementById("nav-why-btn");
if (navWhyBtn) navWhyBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("why-justfair");
});
const navHowBtn = document.getElementById("nav-how-btn");
if (navHowBtn) navHowBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("how-it-works");
});
const navApiBtn = document.getElementById("nav-api-btn");
if (navApiBtn) navApiBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("api-docs");
});
const heroLearnBtn = document.getElementById("hero-learn-btn");
if (heroLearnBtn) heroLearnBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("how-it-works");
});
if (headerLaunchBtn) headerLaunchBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("app");
});
if (heroOpenAppBtn) heroOpenAppBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("app");
});
const exampleOpenAppBtn = document.getElementById("example-open-app-btn");
if (exampleOpenAppBtn) exampleOpenAppBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("app");
});
if (apiCtaOpenApp) apiCtaOpenApp.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("app");
});
if (bottomOpenAppBtn) bottomOpenAppBtn.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("app");
});
const footerAppLink = document.getElementById("footer-app-link");
if (footerAppLink) footerAppLink.addEventListener("click", (e) => {
  e.preventDefault();
  navigateToSection("app");
});

function handleRoute() {
  const hash = window.location.hash.toLowerCase();
  if (hash === "#app") {
    switchView("app");
  } else if (hash === "#why-justfair") {
    switchView("dashboard");
    setTimeout(() => {
      const el = document.getElementById("why-justfair");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  } else if (hash === "#differentiation") {
    switchView("dashboard");
    setTimeout(() => {
      const el = document.getElementById("differentiation");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  } else if (hash === "#how-it-works") {
    switchView("dashboard");
    setTimeout(() => {
      const el = document.getElementById("how-it-works");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  } else if (hash === "#product-proof") {
    switchView("dashboard");
    setTimeout(() => {
      const el = document.getElementById("product-proof");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  } else if (hash === "#api" || hash === "#api-docs") {
    switchView("dashboard");
    setTimeout(() => {
      const el = document.getElementById("api-docs");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  } else {
    switchView("dashboard");
  }
}

// ==========================================
// 4-STEP GUIDED PRODUCT PREFLIGHT WORKFLOW (PHASE 14)
// ==========================================

export function goToStep(step) {
  if (step < 1 || step > 4) return;
  // Step 4 is a standalone tool: every entry starts fresh (no preload).
  if (step === 4) {
    openStep4();
    return;
  }
  appState.currentStep = step;

  // Stop background execution route polling when not in Step 4
  activeRouteScheduler.stop();

  // The four-step tracker is always visible; it is the shortcut.
  // Completion reflects genuine progress, never mere step number:
  // direct Step 4 access leaves Steps 1-3 neutral.
  renderTracker(step);
  for (let i = 1; i <= 4; i++) {
    const container = document.getElementById(`step-${i}-container`);
    if (container) {
      container.classList.toggle("hidden", i !== step);
    }
  }

  // Smooth scroll to top of app workspace
  const appWorkspace = document.querySelector(".app-workspace");
  if (appWorkspace) {
    appWorkspace.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Tracker truth (013.9A): a step reads completed only when its work genuinely
// happened — company explicitly chosen, expectations actually submitted,
// results actually present. Step 4 is a tool and never reads completed.
export function renderTracker(activeStep) {
  const done = {
    1: appState.progress.company === true,
    2: appState.progress.expectations === true,
    3: appState.productPreflightResult !== null,
    4: false
  };
  for (let i = 1; i <= 4; i++) {
    const item = document.getElementById(`tracker-step-${i}`);
    if (item) {
      item.classList.remove("active", "completed");
      if (i === activeStep) {
        item.classList.add("active");
      } else if (done[i]) {
        item.classList.add("completed");
      }
    }
  }
}

// Step 4 entry: always fresh. No Product Preflight state is carried in —
// the user explicitly chooses the representation to inspect inside Step 4.
export function openStep4() {
  appState.currentStep = 4;
  activeRouteScheduler.stop();
  const search = document.getElementById("trade-search-input");
  if (search) search.value = "";
  // Original scrolling feed: all exact representations, collapsed.
  // Explicit card expansion below is the user's trade selection.
  currentTradeCategoryFilter = "all";
  document.querySelectorAll(".trade-category-pill").forEach(p => {
    const isAll = (p.getAttribute("data-category") || "").toLowerCase() === "all";
    p.classList.toggle("active", isAll);
    p.setAttribute("aria-checked", String(isAll));
  });
  renderAllStockCards(null);
  applyTradeFeedSearch();
  const tracker = document.querySelector(".preflight-step-tracker");
  if (tracker) tracker.classList.remove("hidden");
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`step-${i}-container`)?.classList.toggle("hidden", i !== 4);
  }
  // Truthful tracker: only genuinely completed product steps read completed.
  renderTracker(4);
  document.querySelector(".app-workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Step 1: Render Company Grid
export function renderUnderlyingGrid() {
  const container = document.getElementById("underlying-grid-container");
  if (!container) return;
  container.innerHTML = "";

  const keys = Object.keys(UNDERLYING_CATALOG);
  keys.forEach(canonical => {
    const data = UNDERLYING_CATALOG[canonical];
    const isSelected = appState.selectedUnderlying === canonical;

    const card = document.createElement("div");
    card.className = `underlying-company-card ${isSelected ? "is-selected" : ""}`;
    card.id = `underlying-card-${canonical}`;
    card.setAttribute("data-canonical", canonical);
    card.setAttribute("data-category", data.category);
    card.setAttribute("data-keywords", `${data.name} ${canonical} ${data.fullName} ${data.representations.join(" ")}`.toLowerCase());

    card.innerHTML = `
      <div class="underlying-card-top">
        <div class="underlying-card-logo-wrap">
          <img src="${data.logo}" alt="${data.name} logo" class="underlying-card-logo" loading="lazy">
        </div>
        <div class="underlying-card-brand">
          <div class="underlying-title-row">
            <h3 class="underlying-name">${data.name}</h3>
            <span class="underlying-ticker">${data.canonical}</span>
          </div>
          <p class="underlying-fullname">${data.fullName}</p>
        </div>
      </div>
      <div class="underlying-card-footer">
        <span class="underlying-reps-pill">2 Solana Tokens (${data.representations.join(", ")})</span>
        <span class="underlying-category-pill">${data.category}</span>
      </div>
    `;

    card.addEventListener("click", () => {
      selectUnderlying(canonical);
    });

    container.appendChild(card);
  });
}

export function selectUnderlying(canonical) {
  if (!UNDERLYING_CATALOG[canonical]) return;

  // State isolation: changing company resets old product results and selection
  appState.selectedUnderlying = canonical;
  appState.productPreflightResult = null;
  appState.selectedRepresentation = null;
  appState.progress = { company: true, expectations: false };

  // Highlight selected card
  document.querySelectorAll(".underlying-company-card").forEach(c => {
    c.classList.toggle("is-selected", c.getAttribute("data-canonical") === canonical);
  });

  // Update selected company banner in Step 2 & 3
  const meta = UNDERLYING_CATALOG[canonical];
  const logo = document.getElementById("selected-company-logo");
  const name = document.getElementById("selected-company-name");
  const ticker = document.getElementById("selected-company-ticker");
  const fullname = document.getElementById("selected-company-fullname");

  if (logo) logo.src = meta.logo;
  if (name) name.textContent = meta.name;
  if (ticker) ticker.textContent = meta.canonical;
  if (fullname) fullname.textContent = meta.fullName;

  renderExpectationsGrid();
  goToStep(2);
}

// Step 2: Render Expectations Grid
export function renderExpectationsGrid() {
  const primaryContainer = document.getElementById("primary-expectations-container");
  const secondaryContainer = document.getElementById("secondary-expectations-container");

  if (primaryContainer) {
    primaryContainer.innerHTML = "";
    EXPECTATIONS_CONFIG.primary.forEach(exp => {
      primaryContainer.appendChild(createExpectationCard(exp));
    });
  }

  if (secondaryContainer) {
    secondaryContainer.innerHTML = "";
    EXPECTATIONS_CONFIG.secondary.forEach(exp => {
      secondaryContainer.appendChild(createExpectationCard(exp));
    });
  }

  updateExpectationsGuidance();
}

function createExpectationCard(exp) {
  const card = document.createElement("div");
  const currentPriority = appState.expectations[exp.capability] || null;

  card.className = `expectation-card ${currentPriority === "MUST_HAVE" ? "priority-must-have" : currentPriority === "NICE_TO_HAVE" ? "priority-nice-to-have" : ""}`;
  card.id = `exp-card-${exp.capability}`;

  const badgeMarkup = currentPriority === "MUST_HAVE"
    ? `<span class="expectation-badge badge-must-have">MUST HAVE</span>`
    : currentPriority === "NICE_TO_HAVE"
    ? `<span class="expectation-badge badge-nice-to-have">NICE TO HAVE</span>`
    : "";

  card.innerHTML = `
    <div class="expectation-header">
      <div class="expectation-title-row">
        <h4 class="expectation-title">${exp.title}</h4>
        <div class="badge-slot">${badgeMarkup}</div>
      </div>
      <p class="expectation-desc">${exp.desc}</p>
    </div>
    <div class="expectation-controls">
      <button type="button" class="btn-priority btn-must-have ${currentPriority === 'MUST_HAVE' ? 'active-must-have' : ''}" data-action="MUST_HAVE">MUST HAVE</button>
      <button type="button" class="btn-priority btn-nice-to-have ${currentPriority === 'NICE_TO_HAVE' ? 'active-nice-to-have' : ''}" data-action="NICE_TO_HAVE">NICE TO HAVE</button>
      <button type="button" class="btn-priority-clear ${!currentPriority ? 'hidden' : ''}" data-action="CLEAR" title="Clear selection">✕</button>
    </div>
  `;

  // Attach button events
  const mustBtn = card.querySelector(".btn-must-have");
  const niceBtn = card.querySelector(".btn-nice-to-have");
  const clearBtn = card.querySelector(".btn-priority-clear");

  if (mustBtn) {
    mustBtn.addEventListener("click", () => {
      if (appState.expectations[exp.capability] === "MUST_HAVE") {
        delete appState.expectations[exp.capability];
      } else {
        appState.expectations[exp.capability] = "MUST_HAVE";
      }
      renderExpectationsGrid();
    });
  }

  if (niceBtn) {
    niceBtn.addEventListener("click", () => {
      if (appState.expectations[exp.capability] === "NICE_TO_HAVE") {
        delete appState.expectations[exp.capability];
      } else {
        appState.expectations[exp.capability] = "NICE_TO_HAVE";
      }
      renderExpectationsGrid();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      delete appState.expectations[exp.capability];
      renderExpectationsGrid();
    });
  }

  return card;
}

function updateExpectationsGuidance() {
  const guidanceBox = document.getElementById("expectations-guidance-box");
  const mustHavesCount = Object.values(appState.expectations).filter(p => p === "MUST_HAVE").length;
  const niceToHavesCount = Object.values(appState.expectations).filter(p => p === "NICE_TO_HAVE").length;

  if (guidanceBox) {
    if (mustHavesCount === 0 && niceToHavesCount === 0) {
      guidanceBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span>Select what matters to you, or click <strong>CHECK PRODUCTS</strong> to see all verified representations.</span>
      `;
    } else {
      guidanceBox.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span><strong>${mustHavesCount} Must-Have${mustHavesCount === 1 ? '' : 's'}</strong> and <strong>${niceToHavesCount} Nice-to-Have${niceToHavesCount === 1 ? '' : 's'}</strong> selected.</span>
      `;
    }
  }
}

// Step 2 -> 3: Submit Product Preflight Check
let productPreflightAbortController = null;

const PRIORITY_MAP = {
  MUST_HAVE: "REQUIRED",
  NICE_TO_HAVE: "OPTIONAL"
};

export async function submitProductPreflight() {
  const submitBtn = document.getElementById("btn-submit-expectations");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>CHECKING PRODUCTS...</span>`;
  }

  if (productPreflightAbortController) {
    try { productPreflightAbortController.abort(); } catch {}
  }
  productPreflightAbortController = new AbortController();

  // Reset representation selection until the user explicitly selects
  appState.selectedRepresentation = null;
  // Genuine Step 2 completion: expectations actually submitted.
  appState.progress.expectations = true;

  let expectationsPayload = Object.entries(appState.expectations).map(([capability, priority]) => ({
    key: capability,
    priority: PRIORITY_MAP[priority] || "REQUIRED"
  }));

  // If user selected zero expectations, send baseline non-constraining check
  if (expectationsPayload.length === 0) {
    expectationsPayload = [{ key: "SELF_CUSTODY", priority: "OPTIONAL" }];
  }

  try {
    const res = await fetch("/api/v1/product-preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        underlying: appState.selectedUnderlying,
        expectations: expectationsPayload
      }),
      signal: productPreflightAbortController.signal
    });

    const data = await res.json();
    if (res.ok && (data.request_status === "COMPLETED" || data.overall_result)) {
      appState.productPreflightResult = data;
      renderProductPreflightResults(data);
      goToStep(3);
    } else {
      renderProductPreflightError(data.message || data.error || "Unable to inspect product representations at this time.");
      goToStep(3);
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      renderProductPreflightError("There was an issue verifying on-chain product representations. Please try again.");
      goToStep(3);
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <span>CHECK PRODUCTS</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14"></path>
          <path d="M12 5l7 7-7 7"></path>
        </svg>
      `;
    }
  }
}

export function renderProductPreflightError(errorMsg) {
  const banner = document.getElementById("product-result-banner");
  const bannerIconBox = document.getElementById("result-banner-icon-box");
  const bannerTitle = document.getElementById("result-banner-title");
  const bannerSubtitle = document.getElementById("result-banner-subtitle");
  const repsContainer = document.getElementById("representation-cards-container");

  if (banner) {
    banner.className = "product-result-banner status-error";
    if (bannerIconBox) {
      bannerIconBox.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }
    if (bannerTitle) bannerTitle.textContent = "We couldn't check this right now";
    if (bannerSubtitle) {
      bannerSubtitle.innerHTML = `<span>${errorMsg || "There was an issue verifying on-chain product representations. Please try again."}</span> <button type="button" class="btn btn-primary btn-sm retry-preflight-btn" id="btn-retry-preflight" style="margin-left: 12px; vertical-align: middle;">Try Again</button>`;
      const retryBtn = bannerSubtitle.querySelector("#btn-retry-preflight");
      if (retryBtn) {
        retryBtn.addEventListener("click", () => submitProductPreflight());
      }
    }
  }

  if (repsContainer) repsContainer.innerHTML = "";
}

// Step 3: Render Product Preflight Results
export function renderProductPreflightResults(data) {
  const underlying = data.underlying || appState.selectedUnderlying;
  const meta = UNDERLYING_CATALOG[underlying] || { name: underlying, canonical: underlying, logo: "/assets/stocks/apple.svg" };

  // Context bar
  const step3Logo = document.getElementById("step3-company-logo");
  const step3Name = document.getElementById("step3-company-name");
  const step3MustHaves = document.getElementById("step3-musthaves-badge");

  if (step3Logo) step3Logo.src = meta.logo;
  if (step3Name) step3Name.textContent = `${meta.name} (${meta.canonical})`;

  const mustHavesCount = Object.values(appState.expectations).filter(p => p === "MUST_HAVE").length;
  if (step3MustHaves) {
    step3MustHaves.textContent = `${mustHavesCount} Must-Have${mustHavesCount === 1 ? '' : 's'} Checked`;
  }

  // Update Bounded Dividend Fact Callout
  const dividendSafetyText = document.getElementById("dividend-safety-text");
  if (dividendSafetyText) {
    dividendSafetyText.textContent = `Neither currently verified ${meta.name} representation pays ordinary cash dividends directly into your wallet. The documented dividend mechanism for this representation does not require a separate wallet claim transaction.`;
  }

  // Result Banner
  const banner = document.getElementById("product-result-banner");
  const bannerIconBox = document.getElementById("result-banner-icon-box");
  const bannerTitle = document.getElementById("result-banner-title");
  const bannerSubtitle = document.getElementById("result-banner-subtitle");

  const products = data.products || [];
  const matchProducts = products.filter(p => p.evaluation?.status === "MATCH");
  const condProducts = products.filter(p => p.evaluation?.status === "CONDITIONAL_MATCH");
  const overallResult = data.overall_result;

  if (banner) {
    banner.className = "product-result-banner";

    if (overallResult === "MULTIPLE_VERIFIED_MATCHES" || matchProducts.length > 1) {
      banner.classList.add("status-match");
      if (bannerIconBox) bannerIconBox.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>`;
      if (bannerTitle) bannerTitle.textContent = `${matchProducts.length} Verified Products Match Your Must-Haves`;
      if (bannerSubtitle) bannerSubtitle.textContent = `Both xStocks and Ondo Stocks satisfy all your required capabilities for ${meta.name}. Review the side-by-side details below before trading.`;
    } else if (overallResult === "MATCHES_REQUIRED_EXPECTATIONS" || matchProducts.length === 1) {
      banner.classList.add("status-match");
      if (bannerIconBox) bannerIconBox.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      if (bannerTitle) bannerTitle.textContent = `1 Verified Product Matches Your Must-Haves`;
      if (bannerSubtitle) bannerSubtitle.textContent = `Representation ${matchProducts[0].symbol} satisfies all your specified requirements for ${meta.name}.`;
    } else if (overallResult === "CONDITIONAL_MATCHES" || condProducts.length > 0) {
      banner.classList.add("status-conditional");
      if (bannerIconBox) bannerIconBox.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
      if (bannerTitle) bannerTitle.textContent = `Products Match, But Important Conditions Apply`;
      if (bannerSubtitle) bannerSubtitle.textContent = `Verified representations match your requirements subject to specific institutional onboarding, KYC, or redemption minimums.`;
    } else if (overallResult === "NO_VERIFIED_PRODUCT_MATCH") {
      banner.classList.add("status-mismatch");
      if (bannerIconBox) bannerIconBox.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
      if (bannerTitle) bannerTitle.textContent = `No Verified Product Matches Your Must-Haves`;
      if (bannerSubtitle) bannerSubtitle.textContent = `No tokenized stock on Solana satisfies all your specified must-have requirements for ${meta.name}. See the conflict details below.`;
    } else {
      banner.classList.add("status-warning");
      if (bannerIconBox) bannerIconBox.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
      if (bannerTitle) bannerTitle.textContent = `Product Verification Warning`;
      if (bannerSubtitle) bannerSubtitle.textContent = `On-chain contract verification is incomplete or unavailable for this underlying.`;
    }
  }

  // Side-by-Side Representation Cards Grid (Equal Prominence)
  const repsContainer = document.getElementById("representation-cards-container");
  if (repsContainer && products.length > 0) {
    repsContainer.innerHTML = "";

    products.forEach(rep => {
      const isMatch = rep.evaluation?.status === "MATCH";
      const isConditional = rep.evaluation?.status === "CONDITIONAL_MATCH";
      const isSupported = rep.executionPreflightSupported || rep.executionPreflightSupport === "SUPPORTED";

      const badgeClass = isMatch ? "rep-badge-match" : isConditional ? "rep-badge-conditional" : "rep-badge-mismatch";
      const badgeText = isMatch ? "MATCHES MUST-HAVES" : isConditional ? "CONDITIONAL MATCH" : "MISMATCHES MUST-HAVES";

      const card = document.createElement("div");
      card.className = "representation-card";
      card.id = `rep-card-${rep.symbol}`;

      // Default capabilities breakdown for display
      const isOndo = rep.symbol.endsWith("on");
      const defaultCaps = [
        {
          label: "Self-Custody (Hold in own wallet)",
          status: "MATCH",
          note: "Direct Solana Token-2022 wallet custody"
        },
        {
          label: "Economic Dividend Benefit",
          status: "MATCH",
          note: "Value accrued via share price multiplier"
        },
        {
          label: "Shareholder Voting Rights",
          status: "MISMATCH",
          note: "No voting rights passed to token holders"
        },
        {
          label: "Weekend DEX Trading",
          status: "MATCH",
          note: "Secondary DEX liquidity pools trade on weekends"
        },
        {
          label: "Direct Issuer Redemption",
          status: "CONDITIONAL",
          note: isOndo ? "Non-US Reg S institutional KYC required" : "Retail eligible ($5,000 min, KYC required)"
        },
        {
          label: "Direct Cash Dividend Payouts",
          status: "MISMATCH",
          note: "No cash USDC distributions directly into wallets"
        }
      ];

      // Build capability items markup
      const capsMarkup = defaultCaps.map(cap => {
        const isCapMatch = cap.status === "MATCH";
        const isCapCond = cap.status === "CONDITIONAL";
        const isCapFalse = cap.status === "MISMATCH";

        const iconSvg = isCapMatch
          ? `<svg class="rep-cap-icon icon-true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
          : isCapCond
          ? `<svg class="rep-cap-icon icon-conditional" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>`
          : `<svg class="rep-cap-icon icon-false" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

        return `
          <li class="rep-cap-item">
            ${iconSvg}
            <div class="rep-cap-text-wrap">
              <span class="rep-cap-label">${cap.label}</span>
              ${cap.note ? `<span class="rep-cap-note">${cap.note}</span>` : ''}
            </div>
          </li>
        `;
      }).join("");

      // Specific expectation explanations
      let detailedExplText = "";
      if (rep.evaluation?.required && rep.evaluation.required.length > 0) {
        const expls = rep.evaluation.required.map(r => r.explanation).filter(Boolean);
        if (expls.length > 0) {
          detailedExplText = expls.join(" ");
        }
      }
      if (!detailedExplText) {
        detailedExplText = rep.evaluation?.summary || (isMatch ? 'Verified Token-2022 representation satisfies all required expectations.' : 'Check capability notes above for full details.');
      }

      card.innerHTML = `
        <div class="rep-card-header">
          <div class="rep-brand-group">
            <div>
              <h3 class="rep-symbol">${rep.symbol}</h3>
              <p class="rep-issuer">${rep.issuer}</p>
            </div>
          </div>
          <span class="rep-match-badge ${badgeClass}">${badgeText}</span>
        </div>

        <ul class="rep-capabilities-list">
          ${capsMarkup}
        </ul>

        <div class="rep-explanation-box">
          <p>${detailedExplText}</p>
        </div>

        <!-- Verified on Solana Drawer -->
        <div class="rep-solana-drawer">
          <button type="button" class="rep-solana-toggle" aria-expanded="false">
            <span>Verified on Solana Details</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <div class="rep-solana-content hidden">
            <div class="solana-fact-row">
              <span class="solana-fact-label">Mint Address:</span>
              <span class="solana-fact-val">
                ${rep.mint ? `${rep.mint.slice(0, 4)}...${rep.mint.slice(-4)}` : 'N/A'}
                <button type="button" class="mint-copy-btn" data-mint="${rep.mint || ''}" title="Copy full mint address">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </span>
            </div>
            <div class="solana-fact-row">
              <span class="solana-fact-label">Token Program:</span>
              <span class="solana-fact-val">${rep.tokenProgram || 'Token-2022'}</span>
            </div>
            <div class="solana-fact-row">
              <span class="solana-fact-label">Active Multiplier:</span>
              <span class="solana-fact-val">${rep.assetVerification?.observedMultiplier || '1.0'}</span>
            </div>
            <div class="solana-fact-row">
              <span class="solana-fact-label">Primary Source:</span>
              <span class="solana-fact-val">${isOndo ? 'ondoprotocol/gm-solana-simulator & Solana Mainnet' : 'Backed Assets Prospectus & Solana Mainnet'}</span>
            </div>
          </div>
        </div>

        <!-- Card Action -->
        <div class="rep-action-wrap">
          ${isSupported ? `
            <button type="button" class="btn btn-primary btn-md btn-rep-supported btn-check-trade" data-symbol="${rep.symbol}">
              <span>Check Trade</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
            </button>
          ` : `
            <button type="button" class="btn btn-secondary btn-md btn-rep-unsupported" disabled>
              <span>Trade Check is not yet available for this representation</span>
            </button>
            <p class="unsupported-note">Product verification is complete. JustFair's Execution Preflight currently supports xStocks representations only.</p>
          `}
        </div>
      `;

      // Attach Drawer toggle
      const drawerToggle = card.querySelector(".rep-solana-toggle");
      const drawerContent = card.querySelector(".rep-solana-content");
      if (drawerToggle && drawerContent) {
        drawerToggle.addEventListener("click", () => {
          const isHidden = drawerContent.classList.contains("hidden");
          drawerContent.classList.toggle("hidden", !isHidden);
          drawerToggle.setAttribute("aria-expanded", String(isHidden));
        });
      }

      // Attach Copy Mint button
      const copyBtn = card.querySelector(".mint-copy-btn");
      if (copyBtn) {
        copyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const mint = copyBtn.getAttribute("data-mint");
          if (mint) {
            navigator.clipboard.writeText(mint);
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            setTimeout(() => {
              copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
            }, 1500);
          }
        });
      }

      // Attach Card selection / inspection
      card.addEventListener("click", (e) => {
        if (e.target.closest(".mint-copy-btn") || e.target.closest(".rep-solana-toggle") || e.target.closest(".btn-check-trade")) return;
        appState.selectedRepresentation = rep.symbol;
        document.querySelectorAll(".representation-card").forEach(c => c.classList.remove("is-selected-rep"));
        card.classList.add("is-selected-rep");
      });

      // Attach Trade navigation button (Step 4 opens fresh; nothing carried over)
      const tradeBtn = card.querySelector(".btn-check-trade");
      if (tradeBtn) {
        tradeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          goToTradeFromProduct(rep.symbol);
        });
      }

      repsContainer.appendChild(card);
    });
  }

  // Render Differences Matrix
  renderDifferencesTable(data);

  // Render Scenarios
  renderScenariosAccordion(data);
}

export function renderDifferencesTable(data) {
  const wrap = document.getElementById("differences-table-wrap");
  if (!wrap) return;

  wrap.innerHTML = `
    <table class="diff-matrix-table">
      <thead>
        <tr>
          <th>Structural Factor</th>
          <th>xStocks (Backed Assets)</th>
          <th>Ondo Stocks (Ondo GM)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="diff-factor-cell">Legal Issuer Entity</td>
          <td>Backed Assets (JE) Limited (Jersey SPV)</td>
          <td>Ondo Global Markets (BVI) Limited (BVI SPV)</td>
        </tr>
        <tr>
          <td class="diff-factor-cell">Collateral & Backing</td>
          <td>Bankruptcy-remote Jersey SPV holding 1:1 shares with custodian</td>
          <td>Bankruptcy-remote BVI SPV holding omnibus equity exposure</td>
        </tr>
        <tr>
          <td class="diff-factor-cell">Direct Issuer Redemption</td>
          <td>Retail eligible with KYC ($5,000 minimum threshold)</td>
          <td>Non-US Reg S institutional KYC onboarding required</td>
        </tr>
        <tr>
          <td class="diff-factor-cell">Dividend Pass-Through</td>
          <td>Reinvestment into token price multiplier / DEX pool value</td>
          <td>Reinvestment into token price multiplier / pool value</td>
        </tr>
        <tr>
          <td class="diff-factor-cell">Token Freeze Authority</td>
          <td>Standard Token-2022 transfer fee / authority hooks</td>
          <td>Token-2022 transfer hook & compliance freeze authority</td>
        </tr>
        <tr>
          <td class="diff-factor-cell">JustFair Execution Preflight</td>
          <td><strong style="color: #059669;">Supported</strong> (Live DEX route analysis)</td>
          <td><strong style="color: #6B7280;">In Progress</strong> (Integration scheduled)</td>
        </tr>
      </tbody>
    </table>
  `;
}

export function renderScenariosAccordion(data) {
  const container = document.getElementById("scenarios-accordion-container");
  if (!container) return;

  const scenarios = [
    {
      title: "What happens if the company pays a dividend?",
      desc: "Tokenized stock products pass economic dividend value via token price adjustment or pool appreciation. The documented dividend mechanism does not require a separate wallet claim transaction."
    },
    {
      title: "What happens if the company splits its stock?",
      desc: "Smart contracts adjust the share multiplier or token supply on-chain according to corporate actions. JustFair tracks and verifies multiplier transitions in real time."
    },
    {
      title: "Can I redeem this token directly with the issuer for cash or shares?",
      desc: "Direct primary redemption is subject to issuer KYC and minimums ($5,000 for xStocks; Regulation S institutional onboarding for Ondo). Secondary onchain trading may be available independently of direct issuer redemption, subject to venue availability and liquidity."
    },
    {
      title: "What happens if the token issuer becomes insolvent?",
      desc: "Both xStocks (Jersey SPV) and Ondo (BVI SPV) utilize bankruptcy-remote special purpose vehicles where collateral shares are segregated from the issuer's operating balance sheet."
    }
  ];

  container.innerHTML = "";
  scenarios.forEach((sc, idx) => {
    const item = document.createElement("div");
    item.className = "scenario-item";
    item.innerHTML = `
      <button type="button" class="scenario-toggle" aria-expanded="false">
        <span>${sc.title}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
      <div class="scenario-body hidden">
        <p>${sc.desc}</p>
      </div>
    `;

    const toggle = item.querySelector(".scenario-toggle");
    const body = item.querySelector(".scenario-body");
    toggle.addEventListener("click", () => {
      const isHidden = body.classList.contains("hidden");
      body.classList.toggle("hidden", !isHidden);
      toggle.setAttribute("aria-expanded", String(isHidden));
    });

    container.appendChild(item);
  });
}

export function goToTradeFromProduct(symbol) {
  // Navigation only (013.9): Step 3 findings stay in Step 3. Step 4 always
  // starts fresh — the user explicitly selects the representation there,
  // so no selected product, badge, or handoff state is carried over.
  openStep4();
}

export function initStepNavigation() {
  // Step tracker is the shortcut. Step 3 without results routes to the
  // nearest valid Product Preflight state instead of fabricating output.
  // Step 4 is always independently accessible and starts fresh.
  for (let i = 1; i <= 4; i++) {
    const btn = document.getElementById(`tracker-step-${i}`);
    if (btn) {
      btn.addEventListener("click", () => {
        if (i === 4) {
          openStep4();
        } else if (i === 3 && !appState.productPreflightResult) {
          goToStep(2);
        } else {
          goToStep(i);
        }
      });
    }
  }

  // Step 4 trade-feed search + clear (original feed interaction)
  const tradeSearchInput = document.getElementById("trade-search-input");
  const tradeClearBtn = document.getElementById("trade-clear-search-btn");
  const tradeEmptyClearBtn = document.getElementById("trade-empty-clear-search-btn");
  if (tradeSearchInput) {
    tradeSearchInput.addEventListener("input", () => {
      applyTradeFeedSearch();
    });
  }
  function clearTradeSearch(focusInput) {
    if (tradeSearchInput) {
      tradeSearchInput.value = "";
      applyTradeFeedSearch();
      if (focusInput) tradeSearchInput.focus();
    }
  }
  if (tradeClearBtn) {
    tradeClearBtn.addEventListener("click", () => clearTradeSearch(true));
  }
  if (tradeEmptyClearBtn) {
    tradeEmptyClearBtn.addEventListener("click", () => clearTradeSearch(true));
  }
  // Step 4 category pills (original feed interaction, independent state)
  document.querySelectorAll(".trade-category-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".trade-category-pill").forEach(p => {
        p.classList.remove("active");
        p.setAttribute("aria-checked", "false");
      });
      pill.classList.add("active");
      pill.setAttribute("aria-checked", "true");
      currentTradeCategoryFilter = pill.getAttribute("data-category") || "all";
      applyTradeFeedSearch();
    });
  });

  // Step 2 buttons
  const changeCompBtn = document.getElementById("btn-change-company");
  if (changeCompBtn) {
    changeCompBtn.addEventListener("click", () => {
      appState.selectedRepresentation = null;
      appState.productPreflightResult = null;
      appState.progress = { company: false, expectations: false };
      goToStep(1);
    });
  }

  const backToStep1Btn = document.getElementById("btn-back-to-step1");
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener("click", () => {
      appState.selectedRepresentation = null;
      appState.productPreflightResult = null;
      appState.progress = { company: false, expectations: false };
      goToStep(1);
    });
  }

  const submitExpBtn = document.getElementById("btn-submit-expectations");
  if (submitExpBtn) submitExpBtn.addEventListener("click", () => submitProductPreflight());

  const toggleSecBtn = document.getElementById("toggle-secondary-expectations-btn");
  const secBody = document.getElementById("secondary-expectations-body");
  if (toggleSecBtn && secBody) {
    toggleSecBtn.addEventListener("click", () => {
      const isHidden = secBody.classList.contains("hidden");
      secBody.classList.toggle("hidden", !isHidden);
      toggleSecBtn.setAttribute("aria-expanded", String(isHidden));
    });
  }

  // Step 3 buttons
  const editExpBtn = document.getElementById("btn-edit-expectations");
  if (editExpBtn) {
    editExpBtn.addEventListener("click", () => {
      appState.selectedRepresentation = null;
      goToStep(2);
    });
  }

  const backToStep2Btn = document.getElementById("btn-back-to-step2");
  if (backToStep2Btn) {
    backToStep2Btn.addEventListener("click", () => {
      appState.selectedRepresentation = null;
      goToStep(2);
    });
  }
}

// Handle initial load & hash changes
window.addEventListener("DOMContentLoaded", () => {
  renderUnderlyingGrid();
  renderExpectationsGrid();
  // Step 4 mounts its execution card only after explicit in-step selection.
  initSearchAndFilters();
  initStepNavigation();
  initApiDrawer();
  initScrollReveal();
  handleRoute();
  fetchAuthoritativeSolPrice();
  marketStreamManager.init();
  setInterval(fetchAuthoritativeSolPrice, 60000);
});

window.addEventListener("hashchange", () => {
  handleRoute();
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
      threshold: 0.12
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
// 4. Data-Driven Stock Cards Rendering & Feed
// ==========================================
function renderAllStockCards(initiallyExpandedSymbol = null) {
  if (!stockCardsContainer) return;
  stockCardsContainer.innerHTML = "";

  // Execution-supported catalog only (013.10A): STOCK_META is the frontend
  // execution registry — every member has Execution Preflight = SUPPORTED.
  // Execution-unsupported representations (e.g. Ondo) belong to Product
  // Preflight (Steps 1-3), never to this feed. Capability filter, not a
  // recommendation; no substitution.
  const symbols = Object.keys(STOCK_META);
  const allPill = document.querySelector('.trade-category-pill[data-category="ALL"]');
  if (allPill) allPill.textContent = `All (${symbols.length})`;

  symbols.forEach(symbol => {
    renderTradeCard(symbol, symbol === initiallyExpandedSymbol);
  });
}

// Original expandable trade card (007.x interaction), wired to current
// neutral form state: collapsed, unselected asset, empty amount.
function renderTradeCard(symbol, isExpanded) {
  const meta = STOCK_META[symbol];
  const cardEl = document.createElement("div");
  // is-revealed: feed cards are created dynamically after initScrollReveal
  // ran, so the IntersectionObserver never sees them (013.6 paint fix).
  cardEl.className = `stock-card-standalone is-revealed ${isExpanded ? "is-expanded" : ""}`;
  cardEl.id = `stock-card-${symbol}`;
  cardEl.setAttribute("data-symbol", symbol);
  cardEl.setAttribute("data-category", meta.category);
  cardEl.setAttribute("data-keywords", `${meta.name} ${meta.canonical} ${meta.fullName} ${symbol} backed assets xstocks supported`.toLowerCase());

    cardEl.innerHTML = `
      <!-- Card Header / Collapsed Summary -->
      <div class="stock-card-header" role="button" tabindex="0" aria-expanded="${isExpanded}" aria-controls="stock-body-${symbol}">
        <div class="stock-card-brand">
          <div class="stock-logo-wrap">
            <img src="${meta.logo}" alt="${meta.name} logo" class="stock-logo-img" loading="lazy">
          </div>
          <div class="stock-brand-info">
            <div class="stock-title-row">
              <h3 class="stock-name">${meta.name}</h3>
              <span class="stock-ticker-badge">${meta.symbol}</span>
              <span class="stock-canonical-pill">${meta.canonical}</span>
            </div>
            <p class="stock-desc">${meta.desc}</p>
          </div>
        </div>
        <div class="stock-header-action">
          <button type="button" class="btn ${isExpanded ? 'btn-primary' : 'btn-outline'} btn-sm stock-toggle-btn">
            <span class="toggle-btn-text">${isExpanded ? 'Close Trade' : `Check ${meta.name} Trade`}</span>
            <svg class="toggle-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="${isExpanded ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- Card Body (Active Trade Interface) -->
      <div class="stock-card-body ${isExpanded ? '' : 'hidden'}" id="stock-body-${symbol}">
        ${renderCardBodyMarkup(symbol)}
      </div>
    `;

    // Attach Header Toggle Event (pointer + keyboard: headers are role=button)
    const header = cardEl.querySelector(".stock-card-header");
    header.addEventListener("click", () => {
      toggleStockCard(symbol);
    });
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleStockCard(symbol);
      }
    });

    stockCardsContainer.appendChild(cardEl);
    setupCardInteractivity(cardEl, symbol);
}


function renderCardBodyMarkup(symbol) {
  const stock = STOCK_META[symbol] || { name: symbol, canonical: symbol, mint: "", fullName: symbol };
  return `
    <form class="stock-trade-form" data-symbol="${symbol}" novalidate>
      <div class="form-row-grid">
        <!-- Payment Choice -->
        <div class="form-col">
          <label class="form-label">Pay With</label>
          <div class="payment-tabs" role="radiogroup" aria-label="Select Payment Currency">
            <button type="button" class="payment-tab" data-asset="USDC" role="radio" aria-checked="false">
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
          <input type="hidden" name="inputAsset" value="">
        </div>

        <!-- Spend Amount -->
        <div class="form-col">
          <div class="form-label-row">
            <label class="form-label">Amount to Spend</label>
            <span class="label-sub amount-usd-equivalent">$0.00 USD</span>
          </div>
          <div class="input-wrapper">
            <span class="input-prefix amount-prefix">–</span>
            <input type="number" name="amount" class="form-input amount-input" value="" placeholder="0.00" min="1" max="1000000" step="any" required>
          </div>
          <div class="amount-presets">
            <button type="button" class="preset-btn" data-val="100">$100</button>
            <button type="button" class="preset-btn" data-val="500">$500</button>
            <button type="button" class="preset-btn" data-val="1000">$1,000</button>
            <button type="button" class="preset-btn" data-val="2500">$2,500</button>
          </div>
        </div>
      </div>

      <!-- Submit Row -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary btn-block btn-lg submit-trade-btn" disabled>
          <span class="btn-text">CHECK TRADE</span>
          <span class="btn-spinner hidden" aria-hidden="true"></span>
        </button>
        <p class="form-hint submit-gating-hint">Select USDC or SOL and enter an amount to check this trade.</p>
      </div>

      <!-- Optional Exact Simulation (advanced, never required for CHECK TRADE) -->
      <div class="exact-sim-wrap">
        <button type="button" class="btn-link exact-sim-toggle" aria-expanded="false">
          <span>Want a more exact check? Run exact transaction simulation</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="exact-sim-body hidden">
          <h4 class="exact-sim-title">Exact transaction simulation</h4>
          <p class="exact-sim-desc">Use your public Solana address to simulate the transaction more precisely. Nothing is signed or sent.</p>
          <div class="exact-sim-connected ${activeWalletAddress && activeWalletConnected ? '' : 'hidden'}">
            <span class="wallet-dot connected"></span>
            <span class="exact-sim-connected-label">Wallet connected <span class="font-mono exact-sim-addr">${activeWalletAddress ? `${activeWalletAddress.slice(0, 4)}...${activeWalletAddress.slice(-4)}` : ''}</span></span>
            <button type="button" class="btn-link exact-sim-disconnect">Disconnect</button>
          </div>
          <div class="exact-sim-connect-row ${activeWalletAddress && activeWalletConnected ? 'hidden' : ''}">
            <button type="button" class="btn btn-secondary btn-sm exact-sim-connect-btn">Connect Wallet</button>
            <button type="button" class="btn-link exact-sim-manual-toggle" aria-expanded="false">Paste public address instead</button>
          </div>
          <div class="exact-sim-manual-box ${activeWalletAddress && !activeWalletConnected ? '' : 'hidden'}">
            <label class="form-label">Public Solana address</label>
            <input type="text" class="form-input font-mono exact-address-input" placeholder="e.g. 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" value="${activeWalletAddress || ''}" autocomplete="off" spellcheck="false">
            <p class="form-hint">Only your public Solana address is used. Nothing is signed or sent. Never enter a seed phrase or private key.</p>
            <p class="exact-address-error hidden">That doesn't look like a valid Solana public address.</p>
          </div>
        </div>
      </div>
    </form>

    <!-- Live Indicative Route Preview (Director Order 009.6) -->
    <div class="live-preview-box">
      <div class="live-preview-header">
        <span class="live-preview-title">
          <span class="live-pulse-dot"></span>
          Live Route Preview
        </span>
        <span class="live-status-badge badge-closed live-route-status">
          Standby
        </span>
      </div>
      <div class="live-preview-grid">
        <div class="live-preview-item">
          <span class="live-preview-label">Live Spend</span>
          <span class="live-preview-value live-spend-val">$0.00 USD</span>
        </div>
        <div class="live-preview-item">
          <span class="live-preview-label">Indicative Shares</span>
          <span class="live-preview-value live-shares-val">Enter amount to view route...</span>
        </div>
        <div class="live-preview-item">
          <span class="live-preview-label">Route Freshness</span>
          <span class="live-preview-value live-freshness-val">Standby</span>
        </div>
      </div>
      <p class="live-preview-hint">Live indicative DEX preview. Click <strong>CHECK TRADE</strong> above to freeze an immutable preflight snapshot.</p>
      <p class="live-benchmark-context hidden"></p>
    </div>

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
      <h4 class="error-title">We Couldn't Check This Trade</h4>
      <p class="error-message">An error occurred while inspecting the trade.</p>
      <button type="button" class="btn btn-secondary btn-sm error-retry-btn">Try Again</button>
    </div>

    <!-- Inline Result Container -->
    <div class="inline-result-container hidden">
      <!-- Frozen Snapshot Header (Order 009.6) -->
      <div class="snapshot-freeze-header">
        <span class="snapshot-freeze-title">CHECKED PREFLIGHT SNAPSHOT</span>
        <span class="snapshot-freeze-badge res-freeze-timestamp">CHECKED AT --:--:-- UTC</span>
      </div>

      <!-- Post-Check Live Movement Notice -->
      <div class="live-movement-banner hidden">
        <span class="live-movement-text">⚡ Live DEX route output moved since this check</span>
        <button type="button" class="btn-refresh-check">REFRESH CHECK</button>
      </div>

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
        <div class="money-divider money-spread-div" style="display:none">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="9" x2="19" y2="9"></line><line x1="5" y1="15" x2="19" y2="15"></line></svg>
        </div>
        <div class="money-stat money-spread-stat" style="display:none">
          <span class="money-label">SPREAD POSITION</span>
          <span class="money-value money-pos">—</span>
          <span class="money-sub money-pos-sub">vs reference bid/ask</span>
        </div>
      </div>

      <!-- Plain English Explanation -->
      <div class="explanation-box">
        <p class="explanation-text res-explanation"></p>
      </div>

      <!-- Better Option / Route Comparison Card -->
      <div class="better-option-container">
        <div class="better-option-card is-optimal">
          <div class="better-option-header">
            <div class="better-option-status-badge">
              <svg class="better-option-badge-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span class="better-option-badge-text">NO BETTER ROUTE OBSERVED</span>
            </div>
            <span class="better-option-summary-text">JustFair checked distinct executable route candidates and did not find one that improved on Jupiter's current route.</span>
          </div>
          <div class="better-option-detail hidden">
            <div class="better-option-grid">
              <div class="route-box canonical-box">
                <span class="route-box-title">CURRENT JUPITER ROUTE</span>
                <span class="route-box-value canonical-exposure-val">$0.00</span>
                <span class="route-box-diff canonical-diff-val">Reference difference: -$0.00</span>
                <span class="route-box-sub canonical-route-venues">Jupiter DEX Route</span>
              </div>
              <div class="route-box-arrow">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
              </div>
              <div class="route-box alternative-box">
                <span class="route-box-title">BETTER OBSERVED OPTION</span>
                <span class="route-box-value alternative-exposure-val">$0.00</span>
                <span class="route-box-diff alternative-diff-val">Reference difference: -$0.00</span>
                <span class="route-box-sub alternative-route-venues">Alternative Route</span>
              </div>
            </div>
            <div class="better-option-improvement-badge">
              <span class="improvement-label">IMPROVEMENT:</span>
              <span class="improvement-value alternative-improvement-val">+$0.00 (+0.00%)</span>
            </div>
            <p class="better-option-note">JustFair provides non-custodial pre-trade intelligence. Choose direct routing or the specific venue in your wallet if desired.</p>
          </div>
        </div>
      </div>

      <!-- Exact Simulation Banner -->
      <div class="simulation-banner hidden">
        <div class="sim-icon-box">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </div>
        <div class="sim-content">
          <strong class="sim-title">Exact simulation complete</strong>
          <span class="sim-desc">Transaction simulated successfully. Nothing was signed or sent.</span>
        </div>
      </div>

      <!-- Exact Simulation upsell (only after a walletless quote check) -->
      <div class="exact-upsell hidden">
        <span class="exact-upsell-text">Want a more exact check?</span>
        <button type="button" class="btn btn-secondary btn-sm exact-upsell-btn">Run exact simulation</button>
      </div>

      <!-- Handoff Revalidation (Director Order 015): re-check before leaving -->
      <div class="handoff-revalidate-box">
        <button type="button" class="btn btn-primary btn-md revalidate-btn">
          <span class="btn-text">REVALIDATE &amp; CONTINUE</span>
          <span class="btn-spinner hidden" aria-hidden="true"></span>
        </button>
        <p class="form-hint revalidate-hint">Refresh this exact trade before leaving JustFair.</p>

        <div class="revalidation-loading hidden">
          <div class="loading-spinner"></div>
          <p class="loading-step-text">Requesting the same trade again…</p>
        </div>

        <div class="revalidation-result hidden">
          <div class="reval-header">
            <span class="reval-title">HANDOFF REVALIDATION</span>
            <span class="reval-timestamp"></span>
          </div>
          <div class="reval-grid">
            <div class="reval-row"><span class="reval-label">Original check</span><strong class="reval-orig-shares"></strong></div>
            <div class="reval-row"><span class="reval-label">Revalidated</span><strong class="reval-new-shares"></strong></div>
            <div class="reval-row reval-change-row"><span class="reval-label">Change</span><strong class="reval-change"></strong></div>
            <div class="reval-row"><span class="reval-label">Latest exposure</span><strong class="reval-exposure"></strong></div>
            <div class="reval-row"><span class="reval-label">Route</span><strong class="reval-route"></strong></div>
            <div class="reval-row"><span class="reval-label">Fairness benchmark</span><strong class="reval-bench"></strong></div>
          </div>
          <p class="reval-warning hidden"></p>
          <a href="#" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm jupiter-continue-link">
            <span>CONTINUE TO JUPITER</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
          <p class="form-hint reval-amount-note"></p>
          <button type="button" class="btn-link reval-copy-amount-btn">Copy amount</button>
          <p class="form-hint reval-disclosure">JustFair revalidated this trade moments ago. Jupiter generates the final live quote when opened, so route and output may change again.</p>
        </div>

        <div class="revalidation-error hidden">
          <h4 class="error-title">Couldn't revalidate this trade</h4>
          <p class="error-message">The route you inspected earlier may no longer be current.</p>
          <button type="button" class="btn btn-secondary btn-sm revalidate-retry-btn">Try again</button>
          <div class="reval-fallback-row">
            <a href="#" target="_blank" rel="noopener noreferrer" class="btn-link jupiter-exit-link">Open Jupiter without revalidation</a>
          </div>
          <p class="form-hint">JustFair could not revalidate this trade. Jupiter will generate its own fresh quote.</p>
        </div>
      </div>

      <!-- Technical Evidence Drawer -->
      <details class="evidence-accordion">
        <summary class="accordion-header">
          <span>View Technical Proof &amp; Route Evidence</span>
          <svg class="accordion-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </summary>
        <div class="accordion-body">
          <div class="evidence-grid">
            <div class="evidence-item"><span class="ev-label">Payment Asset Price</span><span class="ev-val ev-input-price">1.00 USD (Fixed 1:1 Peg)</span></div>
            <div class="evidence-item"><span class="ev-label">Input Valuation</span><span class="ev-val ev-input-val">500.00 USDC = $500.00 USD</span></div>
            <div class="evidence-item"><span class="ev-label">Token Mint</span><span class="ev-val font-mono ev-mint">${stock.mint}</span></div>
            <div class="evidence-item"><span class="ev-label">Token Program</span><span class="ev-val font-mono ev-program">Token-2022 (Scaled UI Amount)</span></div>
            <div class="evidence-item"><span class="ev-label">Multiplier</span><span class="ev-val ev-multiplier">1.0</span></div>
            <div class="evidence-item"><span class="ev-label">DEX Router</span><span class="ev-val ev-router">Jupiter Swap V2</span></div>
            <div class="evidence-item"><span class="ev-label">Routing Steps</span><span class="ev-val ev-steps">DEX Pool</span></div>
            <div class="evidence-item"><span class="ev-label">Route Alternatives Checked</span><span class="ev-val ev-alt-count">1 distinct alternative inspected</span></div>
            <div class="evidence-item"><span class="ev-label">Price Impact</span><span class="ev-val ev-impact">0.00%</span></div>
            <div class="evidence-item"><span class="ev-label">Benchmark Provider</span><span class="ev-val ev-benchmark-source">Stock Market Tape</span></div>
            <div class="evidence-item"><span class="ev-label">Underlying Market Source</span><span class="ev-val ev-upstream-source">—</span></div>
            <div class="evidence-item"><span class="ev-label">Reference Bid</span><span class="ev-val ev-ref-bid">—</span></div>
            <div class="evidence-item"><span class="ev-label">Reference Ask</span><span class="ev-val ev-ref-ask">—</span></div>
            <div class="evidence-item"><span class="ev-label">Reference Midpoint</span><span class="ev-val ev-ref-mid">—</span></div>
            <div class="evidence-item"><span class="ev-label">Reference Type</span><span class="ev-val ev-ref-type">—</span></div>
            <div class="evidence-item"><span class="ev-label">Reference Time</span><span class="ev-val ev-ref-time">—</span></div>
            <div class="evidence-item"><span class="ev-label">Spread Position</span><span class="ev-val ev-spread-pos">—</span></div>
            <div class="evidence-item"><span class="ev-label">Current Market Session</span><span class="ev-val ev-session">CLOSED</span></div>
            <div class="evidence-item"><span class="ev-label">Reference Status</span><span class="ev-val ev-reference-status">Previous market reference</span></div>
            <div class="evidence-item"><span class="ev-label">Preflight Level</span><span class="ev-val ev-preflight-level">QUOTE_CHECK</span></div>
            <div class="evidence-item"><span class="ev-label">Simulation</span><span class="ev-val ev-simulation">NOT RUN</span></div>
          </div>
        </div>
      </details>
    </div>
  `;
}

function normalizeCategory(cat) {
  if (!cat || cat.toLowerCase() === "all") return "all";
  if (cat === "Mega-Cap Tech" || cat === "mega-cap") return "mega-cap";
  if (cat === "Crypto & AI" || cat === "crypto-ai") return "crypto-ai";
  if (cat === "Index ETFs" || cat === "etf") return "etf";
  return cat.toLowerCase().replace(/[^a-z0-9]/g, "-");
}

function initSearchAndFilters() {
  if (stockSearchInput) {
    stockSearchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      if (clearSearchBtn) {
        clearSearchBtn.classList.toggle("hidden", currentSearchQuery.length === 0);
      }
      applyFilters();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      clearSearch();
    });
  }

  const emptyClearBtn = document.getElementById("empty-clear-search-btn");
  if (emptyClearBtn) {
    emptyClearBtn.addEventListener("click", () => {
      clearSearch();
    });
  }

  categoryPills.forEach(pill => {
    pill.addEventListener("click", () => {
      categoryPills.forEach(p => {
        p.classList.remove("active");
        p.setAttribute("aria-checked", "false");
      });
      pill.classList.add("active");
      pill.setAttribute("aria-checked", "true");
      currentCategoryFilter = pill.getAttribute("data-category") || "all";
      applyFilters();
    });
  });
}

function clearSearch() {
  if (stockSearchInput) {
    stockSearchInput.value = "";
    currentSearchQuery = "";
    if (clearSearchBtn) clearSearchBtn.classList.add("hidden");
    applyFilters();
    stockSearchInput.focus();
  }
}

function applyFilters() {
  // Step 1 company grid only. The Step 4 trade feed has its own
  // independent search (applyTradeFeedSearch) and must never inherit
  // Step 1 filter state.
  const companyCards = document.querySelectorAll(".underlying-company-card");
  let visibleCount = 0;

  companyCards.forEach(card => {
    const rawCat = card.getAttribute("data-category") || "";
    const cardCatSlug = normalizeCategory(rawCat);
    const filterCatSlug = normalizeCategory(currentCategoryFilter);

    const matchesCategory = filterCatSlug === "all" || cardCatSlug === filterCatSlug;
    const keywords = card.getAttribute("data-keywords") || "";
    const matchesSearch = currentSearchQuery === "" || keywords.includes(currentSearchQuery);

    if (matchesCategory && matchesSearch) {
      card.classList.remove("hidden");
      card.classList.remove("search-hidden");
      visibleCount++;
    } else {
      card.classList.add("hidden");
      card.classList.add("search-hidden");
    }
  });

  const emptyState = document.getElementById("stock-search-empty-state");
  if (emptyState) {
    emptyState.classList.toggle("hidden", visibleCount > 0);
  }
}

// Step 4 trade-feed search: filters exact-representation cards by company,
// symbol, or issuer without touching Step 1 state.
export function applyTradeFeedSearch() {
  const input = document.getElementById("trade-search-input");
  const clearBtn = document.getElementById("trade-clear-search-btn");
  const feed = document.getElementById("stock-cards-container");
  const emptyState = document.getElementById("trade-search-empty-state");
  if (!input || !feed) return;
  const q = input.value.trim().toLowerCase();
  if (clearBtn) clearBtn.classList.toggle("hidden", q.length === 0);
  let visibleCount = 0;
  feed.querySelectorAll(".stock-card-standalone").forEach(card => {
    const hay = `${card.getAttribute("data-keywords") || ""}`;
    const cardCatSlug = normalizeCategory(card.getAttribute("data-category") || "");
    const filterCatSlug = normalizeCategory(currentTradeCategoryFilter);
    const matchesCategory = filterCatSlug === "all" || cardCatSlug === filterCatSlug;
    const show = matchesCategory && (q === "" || hay.includes(q));
    card.classList.toggle("hidden", !show);
    card.classList.toggle("search-hidden", !show);
    if (show) visibleCount++;
  });
  if (emptyState) emptyState.classList.toggle("hidden", visibleCount > 0);
}

// ==========================================
// 6. Accordion Card Toggling
// ==========================================
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

  // Make sure it is visible if filtered
  card.classList.remove("hidden");

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

  // Start active trade route scheduler for this expanded card
  activeRouteScheduler.start(symbol, card);

  // Smooth alignment into view if not visible
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function collapseCard(card, symbol) {
  const stock = STOCK_META[symbol] || { name: symbol };
  const body = card.querySelector(".stock-card-body");
  const header = card.querySelector(".stock-card-header");
  const toggleBtn = card.querySelector(".stock-toggle-btn");

  // Stop active route scheduler when card collapses
  activeRouteScheduler.stop();

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

// ==========================================
// 7. Card Form & Preflight Logic
// ==========================================
// CHECK TRADE gating (Director Order 013.5): enabled only with an explicit
// payment asset AND a valid positive amount. Never enabled by defaults.
// The gating helper always mirrors live form state (Director Order 013.11).
function updateSubmitState(card) {
  if (!card) return;
  const form = card.querySelector(".stock-trade-form");
  if (!form) return;
  const asset = (form.querySelector("input[name='inputAsset']")?.value || "").trim();
  const amount = parseFloat(form.querySelector(".amount-input")?.value || "");
  const hasAsset = asset !== "";
  const hasAmount = !isNaN(amount) && amount > 0;
  const submitBtn = card.querySelector(".submit-trade-btn");
  if (submitBtn && !submitBtn.dataset.checking) {
    submitBtn.disabled = !(hasAsset && hasAmount);
  }
  const hint = card.querySelector(".submit-gating-hint");
  if (hint) {
    if (hasAsset && hasAmount) {
      hint.classList.add("hidden");
    } else {
      hint.classList.remove("hidden");
      hint.textContent = !hasAsset && !hasAmount
        ? "Select USDC or SOL and enter an amount to check this trade."
        : !hasAsset
          ? "Select USDC or SOL to check this trade."
          : "Enter an amount to check this trade.";
    }
  }
}

// Market-context truth helpers (Director Order 013.11): single source of
// truth for benchmark presentation. Weekday/date always derive from the
// backend benchmark timestamp (UTC) — never invented, never hardcoded.
// Session, freshness, and eligibility are separate facts: session never
// implies freshness, and UNKNOWN is never called stale.
const REF_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const REF_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Provider calendar-date parts from an ISO timestamp prefix, with a generic
// UTC fallback for non-ISO shapes. Never invents precision beyond a date.
function referenceDateParts(ts) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ts || "");
  if (m) return { y: +m[1], mo: +m[2], d: +m[3] };
  const dt = ts ? new Date(ts) : null;
  if (dt instanceof Date && !isNaN(dt)) {
    return { y: dt.getUTCFullYear(), mo: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
  }
  return null;
}

export function describeBenchmarkState(benchmark, reasonCodes = []) {
  const mkt = benchmark?.market_context || {};
  const ts = benchmark?.timestamp || null;
  // Reference-date semantics (014 §5): upstream timestamps are date
  // granularity ("Sep 14, 2026" normalized to UTC midnight), not exact trade
  // instants. Derive weekday/date from the provider calendar date parts so a
  // UTC/ET midnight boundary can never shift the displayed reference date.
  // "Close" is never inferred: the source proves a dated last-sale reference.
  const parts = referenceDateParts(ts);
  const hasTimestamp = parts !== null;
  const weekday = hasTimestamp ? REF_WEEKDAYS[new Date(Date.UTC(parts.y, parts.mo - 1, parts.d)).getUTCDay()] : null;
  const dateLabel = hasTimestamp ? `${REF_MONTHS[parts.mo - 1]} ${parts.d}, ${parts.y}` : null;
  const freshness = benchmark?.freshness_status || null;
  const eligibility = mkt.reference_eligibility || null;
  const codes = Array.isArray(reasonCodes) ? reasonCodes : [];
  const session = mkt.session || benchmark?.current_market_session || null;

  // Indicative (016): a live xStocks number with no provable source time.
  // Displayed, never certified; never collapsed into unknown/stale/closed.
  const indicative = freshness === "INDICATIVE_UNVERIFIED" || eligibility === "INELIGIBLE_INDICATIVE";
  const unknown = !indicative
    && (!hasTimestamp || freshness === "UNKNOWN" || eligibility === "INELIGIBLE_UNKNOWN" || codes.includes("REFERENCE_UNAVAILABLE"));
  const closed = !unknown && !indicative && (freshness === "AFTER_HOURS_CLOSE" || eligibility === "INELIGIBLE_CLOSED" || codes.includes("MARKET_CLOSED_OR_AFTER_HOURS"));
  const stale = !unknown && !indicative && !closed && (freshness === "STALE" || eligibility === "INELIGIBLE_STALE" || codes.includes("STALE_REFERENCE"));

  let sessionDisplay = "Unknown";
  let sessionSentence = "The underlying equity reference is not current.";
  if (session === "REGULAR") {
    sessionDisplay = "Regular trading";
    sessionSentence = "US equities are currently in regular trading.";
  } else if (session === "PRE_MARKET") {
    sessionDisplay = "Pre-market";
    sessionSentence = "US equities are currently in pre-market trading.";
  } else if (session === "POST_MARKET") {
    sessionDisplay = "Post-market";
    sessionSentence = "US equities are currently in post-market trading.";
  } else if (session === "OVERNIGHT") {
    sessionDisplay = "Overnight";
    sessionSentence = "US equities are currently in overnight trading.";
  } else if (session === "CLOSED") {
    sessionDisplay = "Market closed";
    sessionSentence = "The traditional market is closed.";
  }

  let eligibilityDisplay = "Unavailable";
  if (eligibility === "ELIGIBLE") eligibilityDisplay = "Current";
  else if (eligibility === "INELIGIBLE_STALE") eligibilityDisplay = "Stale";
  else if (eligibility === "INELIGIBLE_CLOSED") eligibilityDisplay = "Closed-market reference";
  else if (eligibility === "INELIGIBLE_INDICATIVE") eligibilityDisplay = "Indicative (unverified)";
  else if (eligibility) eligibilityDisplay = eligibility;

  let benchmarkDisplay = "unavailable";
  const isAlpaca = benchmark?.source_type === "ALPACA_QUOTE";
  const feed = benchmark?.feed || null;
  if (eligibility === "ELIGIBLE") {
    if (isAlpaca && session === "OVERNIGHT") benchmarkDisplay = "Current overnight indicative quote";
    else if (isAlpaca && session === "PRE_MARKET") benchmarkDisplay = "Current IEX pre-market reference";
    else if (isAlpaca && session === "POST_MARKET") benchmarkDisplay = "Current IEX after-hours reference";
    else benchmarkDisplay = "Current market reference";
  }
  else if (indicative) {
    if (session === "OVERNIGHT") benchmarkDisplay = "Latest overnight indicative reference";
    else if (session === "PRE_MARKET" || session === "POST_MARKET") benchmarkDisplay = "Latest extended-hours indicative reference";
    else benchmarkDisplay = "Latest indicative reference";
  }
  else if (stale) benchmarkDisplay = hasTimestamp ? `stale (${dateLabel} reference)` : "stale";
  else if (closed) benchmarkDisplay = hasTimestamp ? `last reference (${dateLabel})` : "last reference";
  else if (!unknown && eligibility) benchmarkDisplay = eligibilityDisplay.toLowerCase();

  // Session-qualified indicative session display (016 §18).

  return {
    timestamp: hasTimestamp ? ts : null,
    hasTimestamp,
    weekday,
    dateLabel,
    freshness,
    eligibility,
    session,
    unknown,
    closed,
    stale,
    indicative,
    sessionDisplay,
    sessionSentence,
    eligibilityDisplay,
    benchmarkDisplay,
    vsRefLabel: hasTimestamp ? `vs ${weekday} reference` : indicative ? "vs latest indicative reference" : "vs last available reference",
    refDateLabel: hasTimestamp ? `${dateLabel} reference` : "last available reference"
  };
}

export function describeMarketSession(session) {
  return describeBenchmarkState({ market_context: { session } }).sessionDisplay;
}

export function describeEligibility(eligibility) {
  return describeBenchmarkState({ market_context: { reference_eligibility: eligibility } }).eligibilityDisplay;
}

export function describeReference(bench) {
  const ref = describeBenchmarkState(bench);
  return {
    timestamp: ref.timestamp,
    hasTimestamp: ref.hasTimestamp,
    weekday: ref.weekday,
    dateLabel: ref.dateLabel,
    vsRefLabel: ref.vsRefLabel,
    refDateLabel: ref.refDateLabel,
    session: ref.session,
    eligibility: ref.eligibility
  };
}

export function sessionClosureReason(session) {
  const ref = describeBenchmarkState({ market_context: { session } });
  if (session === "CLOSED") return "the traditional market is closed";
  if (session === "POST_MARKET") return "US equities are in post-market trading";
  if (session === "PRE_MARKET") return "US equities are in pre-market trading";
  if (session === "OVERNIGHT") return "US equities are in overnight trading";
  return "the underlying equity reference is not current";
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
  const manualKeyToggle = form.querySelector(".exact-sim-manual-toggle");
  const manualKeyBox = form.querySelector(".exact-sim-manual-box");
  const walletInput = form.querySelector(".exact-address-input");
  const exactSimToggle = form.querySelector(".exact-sim-toggle");
  const exactSimBody = form.querySelector(".exact-sim-body");
  const exactConnectBtn = form.querySelector(".exact-sim-connect-btn");
  const exactDisconnectBtn = form.querySelector(".exact-sim-disconnect");
  const exactAddrError = form.querySelector(".exact-address-error");
  const exactUpsellBtn = card.querySelector(".exact-upsell-btn");
  const errorState = card.querySelector(".inline-error-state");
  const errorRetryBtn = errorState?.querySelector(".error-retry-btn");
  const refreshCheckBtn = card.querySelector(".btn-refresh-check");

  let amountDebounceTimer = null;

  // Refresh check button handler
  if (refreshCheckBtn) {
    refreshCheckBtn.addEventListener("click", () => {
      form.requestSubmit?.() || form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    });
  }

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
        if (!currentSolPrice || solPriceStatus !== "FRESH") {
          fetchAuthoritativeSolPrice();
        }
      } else {
        if (amountPrefix) amountPrefix.textContent = "$";
        renderPresets(presetsContainer, [100, 500, 1000, 2500], "$", amountInput, amountUsdEquiv, asset);
        if (parseFloat(amountInput.value) <= 10) amountInput.value = "500";
      }
      updateUsdEquiv(amountInput, amountUsdEquiv, inputAssetHidden.value);
      updateSubmitState(card);
      activeRouteScheduler.notifyFormChanged();
    });
  });

  // Amount input listener with 400ms debounce
  if (amountInput) {
    amountInput.addEventListener("input", () => {
      card.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      updateUsdEquiv(amountInput, amountUsdEquiv, inputAssetHidden?.value || "");
      updateSubmitState(card);
      clearTimeout(amountDebounceTimer);
      amountDebounceTimer = setTimeout(() => {
        activeRouteScheduler.notifyFormChanged();
      }, 400);
    });
  }

  // Presets initial click bindings
  bindPresets(presetsContainer, amountInput, amountUsdEquiv, inputAssetHidden);

  // Reflect any already-connected wallet in this card's optional panel
  syncExactSimCard(card);

  // Exact Simulation disclosure (optional; never gates CHECK TRADE)
  if (exactSimToggle && exactSimBody) {
    exactSimToggle.addEventListener("click", () => {
      const isHidden = exactSimBody.classList.contains("hidden");
      exactSimBody.classList.toggle("hidden", !isHidden);
      exactSimToggle.setAttribute("aria-expanded", String(isHidden));
    });
  }

  // Result-level upsell scrolls back to the same optional panel
  if (exactUpsellBtn && exactSimBody) {
    exactUpsellBtn.addEventListener("click", () => {
      exactSimBody.classList.remove("hidden");
      exactSimToggle?.setAttribute("aria-expanded", "true");
      exactSimBody.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  // Connect Wallet (primary exact-sim path; manual entry is the fallback)
  if (exactConnectBtn) {
    exactConnectBtn.addEventListener("click", () => {
      connectWalletForCard(card, exactConnectBtn);
    });
  }

  // Disconnect clears the exact-sim address everywhere
  if (exactDisconnectBtn) {
    exactDisconnectBtn.addEventListener("click", () => {
      setGlobalWalletState(null);
      document.querySelectorAll(".exact-address-input").forEach(inp => { inp.value = ""; });
      document.querySelectorAll(".exact-address-error").forEach(el => el.classList.add("hidden"));
      document.querySelectorAll(".stock-card-standalone").forEach(syncExactSimCard);
    });
  }

  // Manual key toggle (secondary fallback)
  if (manualKeyToggle && manualKeyBox) {
    manualKeyToggle.addEventListener("click", () => {
      const isHidden = manualKeyBox.classList.contains("hidden");
      manualKeyBox.classList.toggle("hidden", !isHidden);
      manualKeyToggle.setAttribute("aria-expanded", String(isHidden));
      manualKeyToggle.textContent = isHidden ? "Hide manual entry" : "Paste public address instead";
    });
  }

  // Manual public-address input with consumer validation
  if (walletInput) {
    walletInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (val === "") {
        exactAddrError?.classList.add("hidden");
        if (activeWalletAddress && !activeWalletConnected) setGlobalWalletState(null);
        return;
      }
      if (isPlausibleSolanaAddress(val)) {
        exactAddrError?.classList.add("hidden");
        setGlobalWalletState(val, false);
      } else if (val.length >= 32) {
        exactAddrError?.classList.remove("hidden");
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

    // Stop and abort pending background route polling so explicit preflight has priority
    activeRouteScheduler.stopTimer();
    if (activeRouteScheduler.abortController) {
      try { activeRouteScheduler.abortController.abort(); } catch {}
    }

    const inputAsset = inputAssetHidden ? (inputAssetHidden.value || "").trim() : "";
    const amount = parseFloat(amountInput.value);
    // Optional exact simulation: connected wallet first, manual entry fallback.
    // Absent address => normal walletless quote check (never a gate).
    const userWallet = activeWalletAddress || walletInput?.value?.trim() || null;

    if (!inputAsset) {
      showCardError(card, "Select a Payment Asset", "Choose USDC or SOL above, then enter an amount to check this trade.");
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      showCardError(card, "Invalid Amount", "Please enter a valid amount greater than zero.");
      return;
    }

    if (userWallet && !isPlausibleSolanaAddress(userWallet)) {
      showCardError(card, "Check Your Address", "That doesn't look like a valid Solana public address.");
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
          msg = "That doesn't look like a valid Solana public address.";
        }
        showCardError(card, "We Couldn't Check This Trade", msg);
        return;
      }

      renderCardResult(card, data, symbol);
      // Hydrate the live preview from the authoritative frozen snapshot so
      // route/session/benchmark copy stays synchronized even when background
      // polls were aborted or are still in flight.
      activeRouteScheduler.updateLivePreview(card, data);
      activeRouteScheduler.setLastCheckedSnapshot(data);
    } catch (err) {
      showCardError(card, "We Couldn't Check This Trade", "Unable to connect to the JustFair Preflight service. Please check your network.");
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
      updateSubmitState(container.closest(".stock-card-standalone"));
      activeRouteScheduler.notifyFormChanged();
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
      updateUsdEquiv(amountInput, amountUsdEquiv, inputAssetHidden?.value || "");
      updateSubmitState(container.closest(".stock-card-standalone"));
      activeRouteScheduler.notifyFormChanged();
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
  } else if (asset === "SOL") {
    if (currentSolPrice) {
      const approx = val * currentSolPrice;
      amountUsdEquiv.textContent = `≈ $${approx.toFixed(2)} USD`;
    } else {
      amountUsdEquiv.textContent = "≈ -- USD";
    }
  } else {
    amountUsdEquiv.textContent = "Select USDC or SOL";
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
    submitBtn.dataset.checking = "1";
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
  delete submitBtn.dataset.checking;
  const textEl = submitBtn.querySelector(".btn-text");
  if (textEl) textEl.textContent = "CHECK TRADE";
  const spinner = submitBtn.querySelector(".btn-spinner");
  if (spinner) spinner.classList.add("hidden");
  updateSubmitState(submitBtn.closest(".stock-card-standalone"));
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

  const isClosed = mkt.session === "CLOSED" || bench.freshness_status === "AFTER_HOURS_CLOSE" || data.verification_status === "UNABLE_TO_VERIFY";

  // Bid/ask quote reference (017B): the ask is an execution reference for
  // acquiring the underlying — never an exposure valuation surrogate.
  // Money-card and copy branch to per-share acquisition comparison.
  const isQuote = typeof bench.bid_price === "number" && typeof bench.ask_price === "number"
    && bench.bid_price > 0 && bench.ask_price > 0;
  const spreadPosition = econ.spread_position || null;

  // Synchronize authoritative SOL price snapshot to form if SOL trade
  if (trade.input_asset === "SOL" && trade.input_asset_price_usd) {
    currentSolPrice = trade.input_asset_price_usd;
    solPriceTimestamp = trade.input_asset_price_timestamp;
    solPriceStatus = trade.input_asset_price_freshness || "FRESH";

    const solSub = card.querySelector(".sol-spot-sub");
    if (solSub) solSub.textContent = `$${currentSolPrice.toFixed(2)}`;
    const amountUsdEquiv = card.querySelector(".amount-usd-equivalent");
    if (amountUsdEquiv) {
      amountUsdEquiv.textContent = `≈ $${(trade.input_amount * currentSolPrice).toFixed(2)} USD`;
    }
  }

  // Stamp frozen preflight snapshot timestamp (Order 009.6)
  const freezeBadge = resultContainer.querySelector(".res-freeze-timestamp");
  if (freezeBadge) {
    const timeStr = new Date().toISOString().replace("T", " ").slice(11, 19);
    freezeBadge.textContent = `CHECKED AT ${timeStr} UTC`;
  }

  // 1. Set Spending Value (Primary Metric #1)
  const spendVal = resultContainer.querySelector(".res-spend-val");
  const spendSub = resultContainer.querySelector(".res-spend-sub");
  if (spendVal) spendVal.textContent = `$${trade.input_usd_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (spendSub) {
    spendSub.textContent = trade.input_asset === "SOL"
      ? `${trade.input_amount} SOL`
      : `${trade.input_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${trade.input_asset}`;
  }

  // 2. Set Exposure / Reference Value (Primary Metric #2 - Truthful on Weekend)
  const assetNameUpper = stockMeta.name.toUpperCase();
  const exposureLabel = resultContainer.querySelector(".res-exposure-label");
  const exposureVal = resultContainer.querySelector(".res-exposure-val");
  const exposureSub = resultContainer.querySelector(".res-exposure-sub");
  if (isQuote) {
    if (exposureLabel) exposureLabel.textContent = "DEX EFFECTIVE PRICE";
    if (exposureVal) exposureVal.textContent = `$${Number(econ.effective_price_per_share).toFixed(2)}`;
    if (exposureSub) exposureSub.textContent = `per ${trade.canonical_stock} share`;
  } else {
    if (exposureLabel) {
      exposureLabel.textContent = isClosed ? "LAST KNOWN REFERENCE VALUE" : `EXPECTED ${assetNameUpper} EXPOSURE`;
    }
    if (exposureVal) exposureVal.textContent = `$${econ.expected_stock_exposure_usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (exposureSub) exposureSub.textContent = `${econ.expected_stock_shares} ${trade.canonical_stock} @ $${Number(bench.price).toFixed(2)}`;
  }

  // 3. Set Net Difference / Reference Difference (Primary Metric #3 - Truthful on Weekend)
  const diffPrefix = econ.difference_usd >= 0 ? "+" : "-";
  const diffCard = resultContainer.querySelector(".money-stat.highlight");
  const diffLabel = diffCard?.querySelector(".money-label");
  const diffVal = resultContainer.querySelector(".res-diff-val");
  const diffPctEl = resultContainer.querySelector(".res-diff-pct");
  if (isQuote) {
    const vsAsk = Number(econ.difference_vs_ask_usd_per_share) || 0;
    const vsAskPct = Number(econ.difference_vs_ask_pct) || 0;
    const vsPrefix = vsAsk >= 0 ? "+" : "-";
    if (diffLabel) diffLabel.textContent = "DIFFERENCE VS ASK";
    if (diffVal) diffVal.textContent = `${vsPrefix}$${Math.abs(vsAsk).toFixed(2)}`;
    if (diffPctEl) diffPctEl.textContent = `(${vsPrefix}${Math.abs(vsAskPct).toFixed(2)}% vs ask)`;
    // Factual spread position stat: quote snapshots only, observational wording.
    const spreadStat = resultContainer.querySelector(".money-spread-stat");
    const spreadDiv = resultContainer.querySelector(".money-spread-div");
    const posVal = resultContainer.querySelector(".money-pos");
    const posSub = resultContainer.querySelector(".money-pos-sub");
    if (spreadStat) spreadStat.style.display = "flex";
    if (spreadDiv) spreadDiv.style.display = "";
    if (posVal) {
      posVal.textContent = !spreadPosition ? "—"
        : spreadPosition === "BELOW_REFERENCE_BID" ? "Below bid"
        : spreadPosition === "ABOVE_REFERENCE_ASK" ? "Above ask"
        : "In spread";
    }
    if (posSub) {
      const effQ = Number(econ.effective_price_per_share);
      posSub.textContent = isFinite(effQ) && effQ > 0
        ? `$${effQ.toFixed(2)}/share vs reference bid/ask`
        : "vs reference bid/ask";
    }
  } else {
    const spreadStat = resultContainer.querySelector(".money-spread-stat");
    const spreadDiv = resultContainer.querySelector(".money-spread-div");
    if (spreadStat) spreadStat.style.display = "none";
    if (spreadDiv) spreadDiv.style.display = "none";
    if (diffLabel) {
      diffLabel.textContent = isClosed ? "REFERENCE DIFFERENCE" : "DIFFERENCE";
    }
    if (diffVal) diffVal.textContent = `${diffPrefix}$${Math.abs(econ.difference_usd).toFixed(2)}`;
    if (diffPctEl) {
      const ref = describeReference(bench);
      diffPctEl.textContent = isClosed
        ? `(${diffPrefix}${Math.abs(diffPct).toFixed(2)}% ${ref.vsRefLabel})`
        : `(${econ.difference_usd >= 0 ? "+" : ""}${diffPct.toFixed(2)}%)`;
    }
  }

  // 4. Verdict Banner
  const verdictBanner = resultContainer.querySelector(".verdict-banner");
  const verdictIcon = resultContainer.querySelector(".verdict-icon-box");
  const verdictTitle = resultContainer.querySelector(".verdict-title");
  const verdictSubtitle = resultContainer.querySelector(".verdict-subtitle");

  if (verdictBanner) {
    verdictBanner.className = "verdict-banner";
    if (isClosed) {
      verdictBanner.classList.add("verdict-closed");
      if (verdictIcon) verdictIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      if (verdictTitle) verdictTitle.textContent = "TRADE CHECK COMPLETE";
      if (verdictSubtitle) {
        const refV = describeBenchmarkState(bench, data?.reason_codes);
        if (refV.unknown) {
          verdictSubtitle.textContent = `Live route found. A current fairness verdict cannot be certified because the equity benchmark's freshness could not be verified. ${refV.sessionSentence}`;
        } else if (refV.indicative) {
          const scope = refV.session === "OVERNIGHT" ? "overnight " : (refV.session === "PRE_MARKET" || refV.session === "POST_MARKET") ? "extended-hours " : "";
          verdictSubtitle.textContent = `Live route found. Showing the latest ${scope}indicative reference — source timestamp could not be verified, so a current fairness verdict cannot be certified.`;
        } else if (refV.closed) {
          const closedRef = refV.hasTimestamp ? `underlying reference ($${bench.price}) is the ${refV.dateLabel} reference (${refV.weekday})` : `underlying reference ($${bench.price}) reflects the last available market reference`;
          verdictSubtitle.textContent = `Live route found. Fairness verdict unavailable — ${closedRef}. ${refV.sessionSentence} Not a current fairness verdict.`;
        } else {
          verdictSubtitle.textContent = `Live route found. Fairness verdict unavailable — underlying reference ($${bench.price}) is stale (${sessionClosureReason(refV.session)}). Not a current fairness verdict.`;
        }
      }
    } else {
      verdictBanner.classList.add("verdict-measured");
      if (verdictIcon) verdictIcon.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18"></path><path d="M4 7l8-4 8 4"></path><path d="M6 18l-3-6h6l-3 6z"></path><path d="M18 18l-3-6h6l-3 6z"></path></svg>`;
      if (verdictTitle) verdictTitle.textContent = "MEASURED";
      if (verdictSubtitle) {
        if (isQuote) {
          const vsAskPct = Number(econ.difference_vs_ask_pct) || 0;
          verdictSubtitle.textContent = `Acquisition difference vs reference ask measured at ${vsAskPct >= 0 ? "+" : ""}${vsAskPct.toFixed(2)}%. No calibrated fair/bad-fill threshold is applied.`;
        } else {
          verdictSubtitle.textContent = `Economic difference measured at ${diffPrefix}${diffPct.toFixed(2)}%. Threshold safety calibration is pending live market tape verification.`;
        }
      }
    }
  }

  // Factual spread position for bid/ask references (017B §10).
  // Observational only: never GOOD/BAD/SAFE/UNSAFE.
  function quotePositionText() {
    if (!isQuote) return null;
    const eff = Number(econ.effective_price_per_share);
    const bid = Number(bench.bid_price);
    const ask = Number(bench.ask_price);
    if (!isFinite(eff) || !isFinite(bid) || !isFinite(ask) || bid <= 0 || ask <= 0) return null;
    if (eff < bid) return `Your DEX price is $${(bid - eff).toFixed(2)} below the current reference bid.`;
    if (eff > ask) return `Your DEX price is $${(eff - ask).toFixed(2)} above the current reference ask.`;
    return "Your DEX price falls inside the current reference spread.";
  }

  // 5. Plain English Explanation
  const resExplanation = resultContainer.querySelector(".res-explanation");
  if (resExplanation) {
    if (isQuote) {
      // Bid/ask quote reference (017B): shares + effective acquisition price
      // against the explicit reference range. Never values shares × ask.
      const refQ = describeBenchmarkState(bench, data?.reason_codes);
      let rangeKind = "reference";
      if (refQ.session === "OVERNIGHT") rangeKind = "overnight indicative reference";
      else if (refQ.session === "PRE_MARKET") rangeKind = "pre-market reference";
      else if (refQ.session === "POST_MARKET") rangeKind = "after-hours reference";
      const position = quotePositionText();
      const verdictNote = data.verification_status === "UNABLE_TO_VERIFY" || data.verdict === "UNABLE_TO_VERIFY"
        ? "Not a current fairness verdict."
        : "No calibrated fair/bad-fill threshold is being applied.";
      resExplanation.textContent = `You would receive approximately ${econ.expected_stock_shares} ${trade.canonical_stock}-equivalent shares. `
        + `DEX effective price: $${Number(econ.effective_price_per_share).toFixed(2)}/share. `
        + `Current ${rangeKind} range: $${Number(bench.bid_price).toFixed(2)}–$${Number(bench.ask_price).toFixed(2)}. `
        + `${position ? position + " " : ""}${verdictNote}`;
    } else if (isClosed) {
      const refE = describeBenchmarkState(bench, data?.reason_codes);
      if (refE.unknown) {
        resExplanation.textContent = `We found a live Solana route for ${trade.input_amount} ${trade.input_asset} giving approximately ${econ.expected_stock_shares} shares of ${stockMeta.name}. An equity reference was available, but its timestamp could not be verified, so JustFair cannot certify a current fairness verdict. ${refE.sessionSentence}`;
      } else if (refE.indicative) {
        const scope = refE.session === "OVERNIGHT" ? "overnight " : (refE.session === "PRE_MARKET" || refE.session === "POST_MARKET") ? "extended-hours " : "";
        const upstream = bench.upstream_source || bench.source || "xStocks Public Price Data";
        resExplanation.textContent = `We found a live Solana route for ${trade.input_amount} ${trade.input_asset} giving approximately ${econ.expected_stock_shares} shares of ${stockMeta.name}. The $${bench.price} reference is the latest ${scope}indicative reference (${upstream}); its source timestamp could not be verified, so JustFair cannot certify a current fairness verdict.`;
      } else {
        const refNote = refE.hasTimestamp
          ? `the ${refE.dateLabel} reference (${refE.weekday})`
          : "the last available reference (timestamp unavailable)";
        resExplanation.textContent = `We found a live Solana route for ${trade.input_amount} ${trade.input_asset} giving approximately ${econ.expected_stock_shares} shares of ${stockMeta.name}. The $${bench.price} reference is ${refNote}; ${sessionClosureReason(refE.session)}. Not a current fairness verdict.`;
      }
    } else {
      resExplanation.textContent = `This trade route would spend $${trade.input_usd_value.toFixed(2)} to acquire approximately ${econ.expected_stock_shares} shares of ${stockMeta.name} on Solana, delivering $${econ.expected_stock_exposure_usd.toFixed(2)} of underlying exposure (difference: ${diffPrefix}$${econ.difference_usd.toFixed(2)} or ${diffPrefix}${diffPct.toFixed(2)}%).`;
    }
  }

  // 6. Better Option / Route Comparison Card
  const betterOptionCard = resultContainer.querySelector(".better-option-card");
  const betterOptionBadgeText = resultContainer.querySelector(".better-option-badge-text");
  const betterOptionSummaryText = resultContainer.querySelector(".better-option-summary-text");
  const betterOptionDetail = resultContainer.querySelector(".better-option-detail");
  const canonicalExposureVal = resultContainer.querySelector(".canonical-exposure-val");
  const canonicalDiffVal = resultContainer.querySelector(".canonical-diff-val");
  const canonicalRouteVenues = resultContainer.querySelector(".canonical-route-venues");
  const alternativeExposureVal = resultContainer.querySelector(".alternative-exposure-val");
  const alternativeDiffVal = resultContainer.querySelector(".alternative-diff-val");
  const alternativeRouteVenues = resultContainer.querySelector(".alternative-route-venues");
  const alternativeImprovementVal = resultContainer.querySelector(".alternative-improvement-val");
  const altRoutes = data.alternative_routes;

  if (betterOptionCard) {
    if (altRoutes && altRoutes.status === "ALTERNATIVE_FOUND" && altRoutes.best_alternative) {
      betterOptionCard.className = "better-option-card is-alternative-found";
      if (betterOptionBadgeText) betterOptionBadgeText.textContent = "BETTER OBSERVED OPTION";
      if (betterOptionSummaryText) betterOptionSummaryText.textContent = altRoutes.summary;

      const canonicalTitle = resultContainer.querySelector(".canonical-box .route-box-title");
      const best = altRoutes.best_alternative;
      const canon = altRoutes.canonical_route || {};
      if (isQuote) {
        // Quote references: shares + effective per-share price only.
        // Never shares x ask, never dollar "value" or "exposure".
        const cShares = Number(canon.expected_stock_shares);
        const cEff = Number(canon.effective_price_per_share);
        const aShares = Number(best.expected_stock_shares);
        const aEff = Number(best.effective_price_per_share);
        const addShares = Number(best.additional_stock_shares);
        const addPct = Number(best.additional_stock_shares_pct);
        const effLower = Number(best.effective_price_difference_per_share);
        if (canonicalTitle) canonicalTitle.textContent = "CURRENT ROUTE";
        if (canonicalExposureVal) canonicalExposureVal.textContent = isFinite(cShares) ? `${cShares.toFixed(6)} ${trade.canonical_stock}` : "—";
        if (canonicalDiffVal) canonicalDiffVal.textContent = isFinite(cEff) && cEff > 0 ? `$${cEff.toFixed(2)}/share` : "—";
        if (canonicalRouteVenues) canonicalRouteVenues.textContent = `Jupiter DEX Route (${canon.venues?.join(" + ") || "Standard"})`;
        if (alternativeExposureVal) alternativeExposureVal.textContent = isFinite(aShares) ? `${aShares.toFixed(6)} ${trade.canonical_stock}` : "—";
        if (alternativeDiffVal) alternativeDiffVal.textContent = isFinite(aEff) && aEff > 0 ? `$${aEff.toFixed(2)}/share` : "—";
        if (alternativeRouteVenues) alternativeRouteVenues.textContent = `Via ${best.label}`;
        if (alternativeImprovementVal) {
          alternativeImprovementVal.textContent = (isFinite(addShares) && isFinite(addPct) && isFinite(effLower))
            ? `+${addShares.toFixed(6)} ${trade.canonical_stock} (+${addPct.toFixed(2)}%) · $${Math.abs(effLower).toFixed(2)}/share lower`
            : "—";
        }
      } else {
        const cExp = altRoutes.canonical_route?.expected_stock_exposure_usd ?? econ.expected_stock_exposure_usd;
        const cDiff = altRoutes.canonical_route?.reference_difference_usd ?? econ.difference_usd;
        const aExp = best.expected_stock_exposure_usd;
        const aDiff = best.reference_difference_usd ?? (aExp - trade.input_usd_value);
        const diffPrefixC = cDiff >= 0 ? "+" : "-";
        const diffPrefixA = aDiff >= 0 ? "+" : "-";

        if (canonicalTitle) canonicalTitle.textContent = "CURRENT JUPITER ROUTE";
        if (canonicalExposureVal) canonicalExposureVal.textContent = `$${cExp.toFixed(2)} exposure`;
        if (canonicalDiffVal) canonicalDiffVal.textContent = `Reference difference: ${diffPrefixC}$${Math.abs(cDiff).toFixed(2)}`;
        if (canonicalRouteVenues) canonicalRouteVenues.textContent = `Jupiter DEX Route (${altRoutes.canonical_route?.venues?.join(" + ") || "Standard"})`;

        if (alternativeExposureVal) alternativeExposureVal.textContent = `$${aExp.toFixed(2)} exposure`;
        if (alternativeDiffVal) alternativeDiffVal.textContent = `Reference difference: ${diffPrefixA}$${Math.abs(aDiff).toFixed(2)}`;
        if (alternativeRouteVenues) alternativeRouteVenues.textContent = `Via ${best.label}`;

        if (alternativeImprovementVal) {
          if (isClosed) {
            alternativeImprovementVal.textContent = `+${best.improvement_pct.toFixed(2)}% token output`;
          } else {
            alternativeImprovementVal.textContent = `+$${best.improvement_usd.toFixed(2)} (+${best.improvement_pct.toFixed(2)}%)`;
          }
        }
      }

      if (betterOptionDetail) betterOptionDetail.classList.remove("hidden");
    } else {
      betterOptionCard.className = "better-option-card is-optimal";
      if (betterOptionBadgeText) betterOptionBadgeText.textContent = "NO BETTER ROUTE OBSERVED";
      if (betterOptionSummaryText) {
        betterOptionSummaryText.textContent = altRoutes?.summary || "JustFair checked distinct executable route candidates and did not find one that improved on Jupiter's current route.";
      }
      if (betterOptionDetail) betterOptionDetail.classList.add("hidden");
    }
  }

  // 7. Simulation Banner (restrained; route results stand on their own)
  const simBanner = resultContainer.querySelector(".simulation-banner");
  const exactUpsell = resultContainer.querySelector(".exact-upsell");
  const isExact = data.preflight_level === "EXACT_SIMULATION";
  if (simBanner) {
    if (isExact) {
      simBanner.classList.remove("hidden");
      const simTitle = simBanner.querySelector(".sim-title");
      const simDesc = simBanner.querySelector(".sim-desc");
      if (sim.status === "PASS" && sim.err === null) {
        if (simTitle) simTitle.textContent = "EXACT SIMULATION COMPLETE";
        if (simDesc) simDesc.textContent = `Transaction simulated successfully (${sim.units_consumed?.toLocaleString() || 0} compute units). Nothing was signed or sent.`;
      } else {
        if (simTitle) simTitle.textContent = "Exact simulation couldn't complete";
        if (simDesc) simDesc.textContent = "Trade route results above remain valid — only the exact simulation step failed. Nothing was signed or sent.";
      }
    } else {
      simBanner.classList.add("hidden");
    }
  }
  if (exactUpsell) {
    exactUpsell.classList.toggle("hidden", isExact);
  }

  // 8. Handoff revalidation state (fresh per checked snapshot)
  initRevalidation(card, data);

  // 9. Technical Evidence Accordion
  const evInputPrice = resultContainer.querySelector(".ev-input-price");
  const evInputVal = resultContainer.querySelector(".ev-input-val");
  const evMint = resultContainer.querySelector(".ev-mint");
  const evProgram = resultContainer.querySelector(".ev-program");
  const evMultiplier = resultContainer.querySelector(".ev-multiplier");
  const evRouter = resultContainer.querySelector(".ev-router");
  const evSteps = resultContainer.querySelector(".ev-steps");
  const evAltCount = resultContainer.querySelector(".ev-alt-count");
  const evImpact = resultContainer.querySelector(".ev-impact");
  const evBenchmarkSource = resultContainer.querySelector(".ev-benchmark-source");
  const evUpstreamSource = resultContainer.querySelector(".ev-upstream-source");
  const evRefBid = resultContainer.querySelector(".ev-ref-bid");
  const evRefAsk = resultContainer.querySelector(".ev-ref-ask");
  const evRefMid = resultContainer.querySelector(".ev-ref-mid");
  const evRefType = resultContainer.querySelector(".ev-ref-type");
  const evRefTime = resultContainer.querySelector(".ev-ref-time");
  const evSpreadPos = resultContainer.querySelector(".ev-spread-pos");
  const evSession = resultContainer.querySelector(".ev-session");
  const evReferenceStatus = resultContainer.querySelector(".ev-reference-status");
  const evPreflightLevel = resultContainer.querySelector(".ev-preflight-level");
  const evSimulation = resultContainer.querySelector(".ev-simulation");

  if (evInputPrice) {
    evInputPrice.textContent = trade.input_asset === "SOL"
      ? `$${trade.input_asset_price_usd?.toFixed(2)} (${trade.input_asset_price_source || "Real-Time Spot"})`
      : "1.00 USD (Fixed 1:1 Peg)";
  }
  if (evInputVal) {
    evInputVal.textContent = trade.input_asset === "SOL"
      ? `${trade.input_amount} SOL × $${trade.input_asset_price_usd?.toFixed(2)} = $${trade.input_usd_value.toFixed(2)} USD`
      : `${trade.input_amount.toFixed(2)} USDC = $${trade.input_usd_value.toFixed(2)} USD`;
  }
  if (evMint) evMint.textContent = trade.token_mint;
  if (evProgram) evProgram.textContent = "Token-2022 (Scaled UI Amount Extension)";
  if (evMultiplier) evMultiplier.textContent = `${econ.multiplier.current_multiplier} (1 token = ${econ.multiplier.current_multiplier} shares)`;
  if (evRouter) evRouter.textContent = `Jupiter Swap V2 (Router: ${data.dex_route.router}, Mode: ${data.dex_route.mode})`;
  if (evSteps) evSteps.textContent = data.dex_route.steps?.join(" to ") || "Direct DEX Pool";
  if (evAltCount) {
    const count = data.alternative_routes?.candidates_evaluated_count || 0;
    const unit = count === 1 ? "distinct alternative" : "distinct alternatives";
    evAltCount.textContent = `${count} ${unit} inspected`;
  }
  if (evImpact) evImpact.textContent = `${(parseFloat(data.dex_route.price_impact_pct || 0)).toFixed(4)}%`;
  if (evBenchmarkSource) evBenchmarkSource.textContent = `${bench.provider} (${bench.source})`;
  if (evUpstreamSource) evUpstreamSource.textContent = bench.upstream_source || "—";
  const hasQuote = typeof bench.bid_price === "number" && typeof bench.ask_price === "number"
    && bench.bid_price > 0 && bench.ask_price > 0;
  if (evRefBid) evRefBid.textContent = hasQuote ? `$${bench.bid_price.toFixed(2)}` : "—";
  if (evRefAsk) evRefAsk.textContent = hasQuote ? `$${bench.ask_price.toFixed(2)}` : "—";
  if (evRefMid) evRefMid.textContent = (hasQuote && typeof bench.midpoint === "number") ? `$${bench.midpoint.toFixed(2)}` : "—";
  if (evRefType) evRefType.textContent = bench.reference_price_type || "—";
  if (evRefTime) evRefTime.textContent = bench.source_timestamp || bench.timestamp || "—";
  if (evSpreadPos) {
    evSpreadPos.textContent = !spreadPosition ? "—"
      : spreadPosition === "BELOW_REFERENCE_BID" ? "Below reference bid"
      : spreadPosition === "ABOVE_REFERENCE_ASK" ? "Above reference ask"
      : "Within reference spread";
  }
  if (evSession) {
    const sess = mkt.session || bench.current_market_session;
    evSession.textContent = sess ? `${sess} (${describeMarketSession(sess)})` : (isClosed ? "CLOSED" : "REGULAR");
  }
  if (evReferenceStatus) {
    const refEv = describeBenchmarkState(bench, data?.reason_codes);
    if (refEv.eligibility === "ELIGIBLE" && !refEv.unknown && !refEv.indicative) {
      evReferenceStatus.textContent = "Eligible Live Tape";
    } else if (refEv.unknown) {
      evReferenceStatus.textContent = "Unavailable — timestamp unavailable";
    } else if (refEv.indicative) {
      evReferenceStatus.textContent = "Indicative — source timestamp unverified";
    } else if (refEv.closed) {
      evReferenceStatus.textContent = refEv.hasTimestamp ? `Closed-market reference — ${refEv.refDateLabel}` : "Closed-market reference";
    } else {
      evReferenceStatus.textContent = refEv.hasTimestamp ? `Stale — ${refEv.refDateLabel}` : "Stale";
    }
  }
  if (evPreflightLevel) evPreflightLevel.textContent = data.preflight_level;
  if (evSimulation) evSimulation.textContent = sim.status === "PASS" ? `PASS (err: null, ${sim.units_consumed} CU)` : sim.status === "NOT_RUN" ? "Not run — standard Quote Check" : `FAIL (${sim.err})`;

  // Smooth scroll to result
  resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ==========================================
// Handoff Revalidation (Director Order 015)
// ==========================================
// Per-card state: the checked snapshot stays immutable; revalidation builds
// a second frozen snapshot only after explicit user intent. Statuses:
// IDLE | CHECKING | SUCCESS | FAILED.
const cardRevalidations = new WeakMap();

function jupiterPairUrl(inputMint, outputMint) {
  return `https://jup.ag/swap?buy=${encodeURIComponent(outputMint)}&sell=${encodeURIComponent(inputMint)}`;
}

function tradeMints(trade) {
  const inputMint = trade.input_mint || (trade.input_asset === "SOL"
    ? "So11111111111111111111111111111111111111112"
    : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  return { inputMint, outputMint: trade.token_mint };
}

// Deterministic route identity from real returned route information only:
// router + venue steps + input/output mints. Amounts excluded. Returns null
// when identity cannot be proven (never guessed).
export function frontendRouteIdentity(dexRoute, trade) {
  const router = (dexRoute?.router || "").toLowerCase().trim();
  const steps = Array.isArray(dexRoute?.steps) ? dexRoute.steps.filter(s => typeof s === "string" && s.trim().length > 0) : [];
  const { inputMint, outputMint } = tradeMints(trade || {});
  if (!router || steps.length === 0 || !inputMint || !outputMint) return null;
  return `${router}|${steps.join(">")}|${inputMint}>${outputMint}`;
}

function setRevalidateBtn(box, label, disabled) {
  const btn = box.querySelector(".revalidate-btn");
  if (!btn) return;
  const textEl = btn.querySelector(".btn-text");
  if (textEl) textEl.textContent = label;
  const spinner = btn.querySelector(".btn-spinner");
  if (spinner) spinner.classList.toggle("hidden", !disabled);
  btn.disabled = !!disabled;
}

function initRevalidation(card, data) {
  const box = card.querySelector(".handoff-revalidate-box");
  if (!box) return;
  cardRevalidations.set(card, { status: "IDLE", snapshotA: data, snapshotB: null });

  box.querySelector(".revalidation-loading")?.classList.add("hidden");
  box.querySelector(".revalidation-result")?.classList.add("hidden");
  box.querySelector(".revalidation-error")?.classList.add("hidden");
  setRevalidateBtn(box, "REVALIDATE & CONTINUE", false);

  // Pair-only Jupiter URL (amount preload is not officially supported).
  // Fallback link points at the checked snapshot's pair until revalidation.
  const { inputMint, outputMint } = tradeMints(data.trade || {});
  const pairUrl = jupiterPairUrl(inputMint, outputMint);
  const fallbackLink = box.querySelector(".revalidation-error .jupiter-exit-link");
  if (fallbackLink) fallbackLink.href = pairUrl;

  if (box.dataset.bound) return;
  box.dataset.bound = "1";
  box.querySelector(".revalidate-btn")?.addEventListener("click", () => handleRevalidate(card));
  box.querySelector(".revalidate-retry-btn")?.addEventListener("click", () => handleRevalidate(card));
  box.querySelector(".reval-copy-amount-btn")?.addEventListener("click", (e) => {
    const st = cardRevalidations.get(card);
    const t = st?.snapshotA?.trade;
    const val = t ? String(t.input_amount) : "";
    const btn = e.currentTarget;
    const done = () => {
      const orig = "Copy amount";
      btn.textContent = "Copied";
      setTimeout(() => { btn.textContent = orig; }, 1500);
    };
    if (val && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(val).then(done).catch(done);
    } else {
      done();
    }
  });
}

async function handleRevalidate(card) {
  const box = card.querySelector(".handoff-revalidate-box");
  const st = cardRevalidations.get(card);
  if (!box || !st || st.status === "CHECKING") return; // single in-flight request
  const intent = st.snapshotA?.trade;
  if (!intent) return;

  st.status = "CHECKING";
  setRevalidateBtn(box, "REVALIDATING...", true);
  box.querySelector(".revalidation-result")?.classList.add("hidden");
  box.querySelector(".revalidation-error")?.classList.add("hidden");
  box.querySelector(".revalidation-loading")?.classList.remove("hidden");

  // Same explicit intent as the checked snapshot. Walletless by default:
  // normal handoff revalidation is a Quote Check refresh. refreshBenchmark
  // forces a fresh Benchmark V3 resolution for Snapshot B (015 §30 / 017).
  activeRouteScheduler.stopTimer();
  if (activeRouteScheduler.abortController) {
    try { activeRouteScheduler.abortController.abort(); } catch {}
  }

  let fresh = null;
  try {
    const res = await fetch("/api/v1/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputAsset: intent.input_asset,
        stock: intent.stock_symbol,
        amount: intent.input_amount,
        wallet: null,
        refreshBenchmark: true
      })
    });
    fresh = await res.json();
  } catch (err) {
    fresh = null;
  }

  box.querySelector(".revalidation-loading")?.classList.add("hidden");
  if (fresh && fresh.request_status === "SUCCESS") {
    st.status = "SUCCESS";
    st.snapshotB = fresh;
    renderRevalidation(card, st.snapshotA, fresh);
    setRevalidateBtn(box, "REVALIDATE AGAIN", false);
  } else {
    st.status = "FAILED";
    box.querySelector(".revalidation-error")?.classList.remove("hidden");
    setRevalidateBtn(box, "TRY AGAIN", false);
  }
}

function renderRevalidation(card, snapA, snapB) {
  const box = card.querySelector(".handoff-revalidate-box");
  if (!box) return;
  const tradeA = snapA.trade;
  const econA = snapA.economics;
  const tradeB = snapB.trade;
  const econB = snapB.economics;
  const canonical = tradeB.canonical_stock || tradeA.canonical_stock;

  const sharesA = Number(econA.expected_stock_shares) || 0;
  const sharesB = Number(econB.expected_stock_shares) || 0;
  const dShares = sharesB - sharesA;
  const pctShares = sharesA !== 0 ? (dShares / sharesA) * 100 : null;
  // Exposure is only meaningful for single-price references; bid/ask quote
  // snapshots compare per-share acquisition instead (017B).
  const expA = econA.expected_stock_exposure_usd;
  const expB = econB.expected_stock_exposure_usd;
  const hasExposure = typeof expA === "number" && typeof expB === "number";
  const dExp = hasExposure ? expB - expA : null;

  const fmtSigned = (v, digits) => `${v >= 0 ? "+" : "-"}${Math.abs(v).toFixed(digits)}`;
  const set = (sel, text) => {
    const el = box.querySelector(sel);
    if (el) el.textContent = text;
  };
  set(".reval-orig-shares", `${sharesA} ${canonical}`);
  set(".reval-new-shares", `${sharesB} ${canonical}`);
  set(".reval-change", `${fmtSigned(dShares, 6)} ${canonical} (${pctShares === null ? "—" : fmtSigned(pctShares, 2) + "%"})`);
  set(".reval-exposure", hasExposure ? `$${expB.toFixed(2)} (${fmtSigned(dExp, 2)} vs original)` : "— (per-share comparison above)");

  const idA = frontendRouteIdentity(snapA.dex_route, tradeA);
  const idB = frontendRouteIdentity(snapB.dex_route, tradeB);
  set(".reval-route", !idA || !idB ? "Fresh route received" : idA === idB ? "Same route observed" : "Route updated");

  const refB = describeBenchmarkState(snapB.benchmark, snapB.reason_codes);
  set(".reval-bench", `Fairness benchmark: ${refB.benchmarkDisplay}`);
  const warnEl = box.querySelector(".reval-warning");
  if (warnEl) {
    if (snapB.verdict === "UNABLE_TO_VERIFY" || snapB.verification_status === "UNABLE_TO_VERIFY") {
      let reason = "the equity reference is not current";
      if (refB.unknown) reason = "the benchmark freshness could not be verified";
      else if (refB.stale) reason = "the equity reference is stale";
      else if (refB.closed) reason = "the market is closed";
      warnEl.textContent = `Route revalidated. Current fairness verdict remains unavailable because ${reason}.`;
      warnEl.classList.remove("hidden");
    } else {
      warnEl.classList.add("hidden");
    }
  }

  const timeStr = new Date().toISOString().replace("T", " ").slice(11, 19);
  set(".reval-timestamp", `REVALIDATED AT ${timeStr} UTC`);

  const mintsB = tradeMints(tradeB);
  const continueLink = box.querySelector(".jupiter-continue-link");
  if (continueLink) continueLink.href = jupiterPairUrl(mintsB.inputMint, mintsB.outputMint);
  // Amount preload is not officially supported: pair only, with an explicit note.
  const amountNote = box.querySelector(".reval-amount-note");
  if (amountNote) {
    amountNote.textContent = `Enter ${tradeB.input_amount} ${tradeB.input_asset} on Jupiter to reproduce this trade intent.`;
  }

  box.querySelector(".revalidation-result")?.classList.remove("hidden");
  box.querySelector(".revalidation-result")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ==========================================
// 8. Global Wallet State Management
// ==========================================
// Plausible Solana public-address shape (base58, 32-44 chars). The backend
// performs authoritative validation; this only gates consumer UX.
function isPlausibleSolanaAddress(val) {
  return typeof val === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(val.trim());
}

// Sync one card's Exact Simulation panel to global wallet state.
function syncExactSimCard(card) {
  if (!card) return;
  const connectedRow = card.querySelector(".exact-sim-connected");
  const connectRow = card.querySelector(".exact-sim-connect-row");
  const addrEl = card.querySelector(".exact-sim-addr");
  const input = card.querySelector(".exact-address-input");
  const manualBox = card.querySelector(".exact-sim-manual-box");
  const showConnected = !!(activeWalletAddress && activeWalletConnected);
  if (addrEl && activeWalletAddress) {
    addrEl.textContent = `${activeWalletAddress.slice(0, 4)}...${activeWalletAddress.slice(-4)}`;
  }
  if (input && activeWalletAddress && input.value !== activeWalletAddress) {
    input.value = activeWalletAddress;
  }
  if (connectedRow) connectedRow.classList.toggle("hidden", !showConnected);
  if (connectRow) connectRow.classList.toggle("hidden", showConnected);
  // A manually entered address persists with its entry box open.
  if (manualBox && activeWalletAddress && !activeWalletConnected && input && input.value) {
    manualBox.classList.remove("hidden");
  }
}

// Card-level wallet connect. Obtains ONLY the public address for optional
// exact simulation: never signs, broadcasts, or moves funds. Falls back to
// manual entry when no wallet provider is available.
async function connectWalletForCard(card, connectBtn) {
  if (activeWalletAddress && activeWalletConnected) {
    setGlobalWalletState(null);
    return;
  }
  const provider = window.solana || window.phantom?.solana || window.solflare;
  if (!provider || typeof provider.connect !== "function") {
    const body = card.querySelector(".exact-sim-body");
    const box = card.querySelector(".exact-sim-manual-box");
    if (body) body.classList.remove("hidden");
    if (box) {
      box.classList.remove("hidden");
      box.querySelector(".exact-address-input")?.focus();
    }
    return;
  }
  const originalText = connectBtn ? connectBtn.textContent : "";
  try {
    if (connectBtn) {
      connectBtn.disabled = true;
      connectBtn.textContent = "Connecting...";
    }
    const resp = await provider.connect();
    const pubkey = resp.publicKey ? resp.publicKey.toString() : (provider.publicKey ? provider.publicKey.toString() : null);
    if (pubkey) {
      setGlobalWalletState(pubkey, true);
    } else {
      throw new Error("No public key returned");
    }
  } catch (err) {
    setGlobalWalletState(null);
  } finally {
    if (connectBtn) {
      connectBtn.disabled = false;
      connectBtn.textContent = originalText;
    }
  }
}

function setGlobalWalletState(address, viaProvider = false) {
  activeWalletAddress = address || null;
  activeWalletConnected = !!address && !!viaProvider;

  document.querySelectorAll(".stock-card-standalone").forEach(syncExactSimCard);

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

// SOL spot price is served exclusively by the authoritative price endpoint
// (GET /api/v1/prices/sol via fetchAuthoritativeSolPrice). No Execution
// Preflight POST may fire before the user explicitly submits Step 4
// (Director Order 013.5: removed page-load preflight warmup).
