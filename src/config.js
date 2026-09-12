// JustFair Core Configuration (Jupiter Swap V2 + Token-2022 Verified Registry)

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
    cryptoPriceId: "solana"
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
    assetClass: "stocks"
  },
  NVDAx: {
    symbol: "NVDAx",
    name: "NVIDIA Corporation (Tokenized)",
    canonicalSymbol: "NVDA",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "NVDA",
    assetClass: "stocks"
  },
  SPYx: {
    symbol: "SPYx",
    name: "SPDR S&P 500 ETF Trust (Tokenized)",
    canonicalSymbol: "SPY",
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "SPY",
    assetClass: "etf"
  },
  TSLAx: {
    symbol: "TSLAx",
    name: "Tesla Inc. (Tokenized)",
    canonicalSymbol: "TSLA",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "TSLA",
    assetClass: "stocks"
  }
};

export const API_ENDPOINTS = {
  // Official Jupiter Swap V2 Order API
  JUPITER_ORDER_V2: "https://api.jup.ag/swap/v2/order",
  SOLANA_RPC: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  // Official Stock Reference Sources
  NASDAQ_QUOTE_BASE: "https://api.nasdaq.com/api/quote",
  COINGECKO_SIMPLE_PRICE: "https://api.coingecko.com/api/v3/simple/price"
};

export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3001,
  HOST: "0.0.0.0"
};
