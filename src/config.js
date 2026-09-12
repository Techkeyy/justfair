// JustFair Supported Assets & Endpoints Configuration

export const SUPPORTED_PAYMENTS = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    isStable: true,
    fixedUsdPrice: 1.0
  },
  SOL: {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    isStable: false,
    referenceSymbol: "SOL-USD"
  }
};

export const SUPPORTED_STOCKS = {
  AAPLx: {
    symbol: "AAPLx",
    name: "Apple Inc. (Tokenized)",
    canonicalSymbol: "AAPL",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "AAPL",
    pythQuery: "Equity.US.AAPL/USD"
  },
  NVDAx: {
    symbol: "NVDAx",
    name: "NVIDIA Corporation (Tokenized)",
    canonicalSymbol: "NVDA",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "NVDA",
    pythQuery: "Equity.US.NVDA/USD"
  },
  SPYx: {
    symbol: "SPYx",
    name: "SPDR S&P 500 ETF Trust (Tokenized)",
    canonicalSymbol: "SPY",
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "SPY",
    pythQuery: "Equity.US.SPY/USD"
  },
  TSLAx: {
    symbol: "TSLAx",
    name: "Tesla Inc. (Tokenized)",
    canonicalSymbol: "TSLA",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "TSLA",
    pythQuery: "Equity.US.TSLA/USD"
  }
};

export const API_ENDPOINTS = {
  // Official Jupiter Swap v1/v2 endpoints on api.jup.ag
  JUPITER_QUOTE: "https://api.jup.ag/swap/v1/quote",
  JUPITER_SWAP: "https://api.jup.ag/swap/v1/swap",
  SOLANA_RPC: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  MARKET_DATA_CHART: "https://query1.finance.yahoo.com/v8/finance/chart",
  PYTH_FEEDS: "https://hermes.pyth.network/v2/price_feeds"
};
