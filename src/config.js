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
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/apple.svg"
  },
  NVDAx: {
    symbol: "NVDAx",
    name: "NVIDIA Corporation (Tokenized)",
    canonicalSymbol: "NVDA",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "NVDA",
    assetClass: "stocks",
    category: "Crypto & AI",
    logo: "/assets/stocks/nvidia.svg"
  },
  SPYx: {
    symbol: "SPYx",
    name: "SPDR S&P 500 ETF Trust (Tokenized)",
    canonicalSymbol: "SPY",
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "SPY",
    assetClass: "etf",
    category: "Index ETFs",
    logo: "/assets/stocks/spdr.svg"
  },
  TSLAx: {
    symbol: "TSLAx",
    name: "Tesla Inc. (Tokenized)",
    canonicalSymbol: "TSLA",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "TSLA",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/tesla.svg"
  },
  MSFTx: {
    symbol: "MSFTx",
    name: "Microsoft Corporation (Tokenized)",
    canonicalSymbol: "MSFT",
    mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "MSFT",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/microsoft.svg"
  },
  AMZNx: {
    symbol: "AMZNx",
    name: "Amazon.com Inc. (Tokenized)",
    canonicalSymbol: "AMZN",
    mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "AMZN",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/amazon.svg"
  },
  GOOGLx: {
    symbol: "GOOGLx",
    name: "Alphabet Inc. (Tokenized)",
    canonicalSymbol: "GOOGL",
    mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "GOOGL",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/google.svg"
  },
  METAx: {
    symbol: "METAx",
    name: "Meta Platforms Inc. (Tokenized)",
    canonicalSymbol: "META",
    mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "META",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    logo: "/assets/stocks/meta.svg"
  },
  COINx: {
    symbol: "COINx",
    name: "Coinbase Global Inc. (Tokenized)",
    canonicalSymbol: "COIN",
    mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "COIN",
    assetClass: "stocks",
    category: "Crypto & AI",
    logo: "/assets/stocks/coinbase.svg"
  },
  AMDx: {
    symbol: "AMDx",
    name: "Advanced Micro Devices Inc. (Tokenized)",
    canonicalSymbol: "AMD",
    mint: "XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "AMD",
    assetClass: "stocks",
    category: "Crypto & AI",
    logo: "/assets/stocks/amd.svg"
  },
  MSTRx: {
    symbol: "MSTRx",
    name: "MicroStrategy Incorporated (Tokenized)",
    canonicalSymbol: "MSTR",
    mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "MSTR",
    assetClass: "stocks",
    category: "Crypto & AI",
    logo: "/assets/stocks/microstrategy.svg"
  },
  QQQx: {
    symbol: "QQQx",
    name: "Invesco QQQ Trust Series 1 (Tokenized)",
    canonicalSymbol: "QQQ",
    mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ",
    decimals: 8,
    programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    referenceSymbol: "QQQ",
    assetClass: "etf",
    category: "Index ETFs",
    logo: "/assets/stocks/qqq.svg"
  }
};

export const API_ENDPOINTS = {
  // Official Jupiter Swap V2 Order API
  JUPITER_ORDER_V2: "https://api.jup.ag/swap/v2/order",
  SOLANA_RPC: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  // Official xStocks Asset & Price-Data Endpoint
  XSTOCKS_PRICE_DATA_BASE: "https://api.xstocks.fi/api/v2/public/assets",
  // Official Stock Reference Sources
  NASDAQ_QUOTE_BASE: "https://api.nasdaq.com/api/quote",
  COINGECKO_SIMPLE_PRICE: "https://api.coingecko.com/api/v3/simple/price",
  // Official Alpaca Market Data (authenticated server-side only)
  ALPACA_DATA_BASE: "https://data.alpaca.markets"
};

export const TIMEOUTS = {
  UPSTREAM_FETCH_MS: 10000,
  SIMULATION_FETCH_MS: 10000,
  API_REQUEST_MS: 20000
};

export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3001,
  HOST: "0.0.0.0",
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 60,
  MAX_PAYLOAD_BYTES: 1048576, // 1MB
  MAX_TRADE_AMOUNT: 10000000 // 10 Million max sanity limit
};
