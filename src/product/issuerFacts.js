// JustFair — Issuer-Level & Product-Family Facts (FinePrint)
// Phase 12 Final Truth Correction — Backed Assets (JE) Limited & Distinct Issuer Redemption Models

import {
  FACT_AUTHORITY_CLASS,
  FACT_EVIDENCE_STATUS,
  CAPABILITY_KEYS
} from "./schema.js";

/**
 * Issuer & Product-Family Master Profiles
 */
export const ISSUER_PROFILES = {
  BACKED_ASSETS: {
    issuerId: "BACKED_ASSETS_JE",
    productFamily: "xStocks",
    issuerName: "Backed Assets (JE) Limited",
    issuerLegalRole: "Issuer / Special Purpose Vehicle (Jersey)",
    issuerJurisdiction: "Jersey (Channel Islands)",
    serviceProvider: "Backed Assets GmbH (Switzerland / Liechtenstein Tokenization Service Provider)",
    legalStructure: "Tracker Certificate / Structured Debt Security (Tokenized Tracker)",
    backingRatio: "1:1 Collateralized by Underlying Equity / ETF Shares",
    custodyModel: "Segregated Custody (Asset-by-Asset Pledge with Security Trustee)",
    documentationUrl: "https://docs.xstocks.fi/docs/product-legal-overview",
    faqUrl: "https://docs.xstocks.fi/docs/faq",
    primaryNetwork: "Solana",
    defaultTokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    defaultDecimals: 8,
    dateChecked: "2026-09-13"
  },
  ONDO_GLOBAL_MARKETS: {
    issuerId: "ONDO_GLOBAL_MARKETS",
    productFamily: "Ondo Stocks",
    issuerName: "Ondo Global Markets (BVI) Limited",
    issuerLegalRole: "Issuer / Special Purpose Vehicle (BVI)",
    issuerJurisdiction: "British Virgin Islands (Regulation S Exemption under US Securities Act of 1933)",
    legalStructure: "Tokenized Securities / Equity-Backed Structured Notes (Ondo Stocks)",
    backingRatio: "1:1 Exposure to Underlying Securities held via Regulated Custodial Broker-Dealer",
    custodyModel: "Regulated Custodial Broker-Dealer (First-Priority Perfected Security Interest)",
    documentationUrl: "https://docs.ondo.finance/ondo-stocks/overview",
    legalDisclaimersUrl: "https://docs.ondo.finance/legal/disclaimers",
    onchainProgramId: "XzTT4XB8m7sLD2xi6snefSasaswsKCxx5Tifjondogm",
    ownershipStructure: "90.01% Flux Finance Inc. (Ondo Foundation subsidiary), 9.99% Ondo Finance Inc.",
    primaryNetwork: "Solana",
    defaultTokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    defaultDecimals: 9,
    dateChecked: "2026-09-13"
  }
};

/**
 * Issuer-Family Normalized Capabilities with First-Class Provenance
 */
export const ISSUER_CAPABILITIES = {
  BACKED_ASSETS_JE: {
    [CAPABILITY_KEYS.SELF_CUSTODY]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Self-Custodial Wallet Storage",
      summary: "Held directly in your self-custody Solana wallet as standard SPL Token-2022 tokens.",
      authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
      sourceUrl: "https://solscan.io/token/XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.DIRECT_SHARE_OWNERSHIP]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Direct Equity Ownership",
      summary: "No direct equity ownership. You hold a structured debt security tracking the underlying equity price, not registered common stock in your name.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "xStocks Product Legal Overview: Rights Attached to Securities",
      sourceUrl: "https://docs.xstocks.fi/docs/product-legal-overview",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.ORDINARY_VOTING_RIGHTS]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Corporate Voting Rights",
      summary: "No corporate voting rights. The custodian holds the underlying shares; voting rights are not passed through to token holders.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "xStocks Product Legal Overview: Corporate Actions & Governance",
      sourceUrl: "https://docs.xstocks.fi/docs/product-legal-overview",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.ECONOMIC_DIVIDEND_BENEFIT]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Economic Dividend Benefit (Total Return)",
      summary: "Net dividends (after applicable withholding tax) are preserved and reinvested into underlying collateral, increasing share exposure per token.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "xStocks Product Legal Overview: Corporate Actions",
      sourceUrl: "https://docs.xstocks.fi/docs/product-legal-overview",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.CASH_DIVIDEND_PAYOUT]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Cash Dividend Paid to Holder Wallet",
      summary: "No cash, USD, or USDC dividend is deposited directly into your wallet. Dividend value compounds automatically via on-chain Token-2022 multiplier.",
      safetyWarning: "Unsolicited tokens or messages claiming to be cash dividends or requiring a claim signature are malicious phishing scams. xStocks automatically adjust value on-chain without user action.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "xStocks Base Terms & Solana ScaledUiAmount Extension Specification",
      sourceUrl: "https://docs.xstocks.fi/docs/product-legal-overview",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.WALLET_TRANSFERABILITY]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "24/7 Wallet-to-Wallet Transferability",
      summary: "Freely transferable between Solana wallets 24/7, subject to Backed Assets (JE) Limited freeze and pause authority.",
      reason: "On-chain token transfers between un-frozen accounts are supported 24/7 by SPL Token-2022, subject to Backed Assets compliance and freeze controls.",
      authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
      sourceUrl: "https://solscan.io/token/XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.ONCHAIN_SECONDARY_TRADING]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "On-Chain Secondary DEX Trading",
      summary: "Tradable on decentralized Solana liquidity pools (Whirlpool, Raydium CLMM, Meteora) via DEX aggregators.",
      authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
      sourceUrl: "https://jup.ag",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.DIRECT_ISSUER_REDEMPTION]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "Direct Primary Issuer Redemption",
      summary: "Direct primary issuance and redemption with Backed Assets (JE) Limited is available to eligible retail and institutional investors who complete issuer KYC onboarding and wallet whitelisting (minimum $5,000 transaction size). Everyday retail users exit directly via Solana DEX liquidity without onboarding.",
      kycRequired: true,
      walletWhitelistRequired: true,
      minimumDirectRedemptionUsd: 5000,
      qualifiedInvestorOnly: false,
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "xStocks Product Legal Overview & Issuer FAQ",
      sourceUrl: "https://docs.xstocks.fi/docs/product-legal-overview",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.IN_KIND_SHARE_REDEMPTION]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "In-Kind Share Conversion (xPort)",
      summary: "Direct conversion into actual underlying shares is available through xPort via Backed Assets and Alpaca Securities for eligible users who complete both issuer and Alpaca brokerage onboarding. Holding xStocks on Solana does not constitute direct share ownership.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "xStocks xPort & Alpaca Integration Framework",
      sourceUrl: "https://docs.xstocks.fi",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.CASH_STABLECOIN_REDEMPTION]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "Direct Cash/Stablecoin Primary Redemption",
      summary: "Direct primary market redemption with Backed Assets (JE) Limited returns stablecoin proceeds (via broker selling underlying shares) for KYC-onboarded, whitelisted users ($5,000 minimum).",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "xStocks Product Legal Overview: Market Flow",
      sourceUrl: "https://docs.xstocks.fi/docs/product-legal-overview",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.REDEMPTION_WITHOUT_KYC]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Direct Primary Redemption Without KYC",
      summary: "Direct primary redemption with Backed Assets (JE) Limited strictly requires KYC/AML verification and wallet whitelisting. Retail traders exit on-chain via secondary DEX liquidity without KYC.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "xStocks Product Legal Overview: Primary vs Secondary Market",
      sourceUrl: "https://docs.xstocks.fi/docs/product-legal-overview",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.WEEKEND_TRADING]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "Weekend & Off-Hours Trading Availability",
      summary: "Secondary DEX trading operates 24/7 on Solana, but off-hours and weekend execution face wider bid-ask spreads and liquidity volatility because the underlying stock tape is closed.",
      reason: "Token is 24/7 transferable on-chain and DEX pools remain open, but real liquidity depth depends on market makers whose quotes widen when US reference stock exchanges are closed.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      sourceUrl: "https://docs.xstocks.fi",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.TOKEN_2022_MULTIPLIER_ACCRETION]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Token-2022 Scaled UI Multiplier",
      summary: "Uses SPL Token-2022 scaledUiAmountConfig extension to reflect dynamic equity exposure (dividends, splits) without mutating raw balances.",
      authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
      sourceUrl: "https://spl.solana.com/token-2022/extensions#scaled-ui-amount",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.COLLATERAL_PROTECTION_STRUCTURE]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Bankruptcy-Remote Collateral Protection Structure",
      summary: "Issued by Backed Assets (JE) Limited (a bankruptcy-remote Jersey SPV). Underlying shares are held in segregated custody pledged to a Security Trustee for tokenholders on an asset-by-asset basis.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "xStocks Product Legal Overview: Structure and Security",
      sourceUrl: "https://docs.xstocks.fi/docs/product-legal-overview",
      dateChecked: "2026-09-13"
    }
  },

  ONDO_GLOBAL_MARKETS: {
    [CAPABILITY_KEYS.SELF_CUSTODY]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Self-Custodial Wallet Storage",
      summary: "Tokens are standard SPL Token-2022 tokens held directly in self-custodial Solana wallets.",
      authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
      sourceUrl: "https://solscan.io/account/XzTT4XB8m7sLD2xi6snefSasaswsKCxx5Tifjondogm",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.DIRECT_SHARE_OWNERSHIP]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Direct Equity Ownership",
      summary: "No direct equity ownership. Assets are held in the name of / for the benefit of the Issuer via a regulated custodial broker-dealer.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Ondo Global Markets Legal and Regulatory Documentation",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/legal-and-regulatory",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.ORDINARY_VOTING_RIGHTS]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Corporate Voting Rights",
      summary: "No shareholder voting rights or shareholder proxy communications are passed through from the underlying company.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Ondo Global Markets Legal and Regulatory Documentation",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/legal-and-regulatory",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.ECONOMIC_DIVIDEND_BENEFIT]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Economic Dividend Benefit (Total Return)",
      summary: "Net dividends are automatically reinvested into the referenced stock / total return pool, reflected in displayed token balance via Scaled UI multiplier.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "Ondo Stocks Corporate Actions Specification",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/corporate-actions",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.CASH_DIVIDEND_PAYOUT]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Cash Dividend Paid to Holder Wallet",
      summary: "No cash, USD, or USDon dividend is paid directly to wallet. Dividend economics are captured exclusively through automatic reinvestment / Scaled UI multiplier accretion.",
      safetyWarning: "Unsolicited tokens or messages claiming to be cash dividends are phishing scams. Ondo Stocks reflect dividend economics via on-chain total-return multiplier adjustments.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "Ondo Stocks Corporate Actions Specification",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/corporate-actions",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.WALLET_TRANSFERABILITY]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "24/7 Wallet-to-Wallet Transferability",
      summary: "24/7 on-chain wallet-to-wallet transferability on Solana, subject to Ondo Global Markets freeze authority and regulatory pause controls.",
      reason: "On-chain token transfers between un-frozen accounts are supported 24/7 by SPL Token-2022, subject to Ondo compliance and pause authority.",
      authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
      citation: "Ondo Stocks Transferability & Compliance Framework",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/transferability",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.ONCHAIN_SECONDARY_TRADING]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "On-Chain Secondary Trading",
      summary: "Secondary trading facilitated through authorized Ondo GM solver network and integrated Solana DEX routing.",
      authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
      citation: "ondoprotocol/gm-solana-simulator constants.rs",
      sourceUrl: "https://github.com/ondoprotocol/gm-solana-simulator",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.DIRECT_ISSUER_REDEMPTION]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "Direct Primary Issuer Redemption",
      summary: "Direct primary minting and redemption requires platform KYC onboarding with Ondo Global Markets (BVI) Limited (non-US persons under Regulation S). Ondo's current documentation states direct onboarding is presently open to institutional participants only, with retail onboarding planned. Everyday retail users trade on-chain via solver networks and DEX routing without onboarding.",
      kycRequired: true,
      qualifiedInvestorOnly: false,
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "Ondo Global Markets Onboarding and KYC Specification",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/onboarding-and-kyc",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.IN_KIND_SHARE_REDEMPTION]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "In-Kind Share Conversion",
      summary: "No in-kind delivery of underlying equity shares. Direct primary redemption settles for cash value / supported settlement assets (e.g. USDon) under Regulation S, not delivery of registered common stock to a brokerage account.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "Ondo Global Markets Primary Redemption and Settlement Specification",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/onboarding-and-kyc",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.CASH_STABLECOIN_REDEMPTION]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "Direct Cash/Stablecoin Primary Redemption",
      summary: "Direct primary redemption with Ondo Global Markets (BVI) Limited settles in cash/supported settlement asset (USDon) for KYC-onboarded non-US persons under Regulation S.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "Ondo Global Markets Onboarding and KYC Specification",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/onboarding-and-kyc",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.REDEMPTION_WITHOUT_KYC]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Direct Primary Redemption Without KYC",
      summary: "Direct primary redemption with Ondo Global Markets strictly requires KYC identity verification. Retail traders exit via secondary market / DEX trading without KYC.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "Ondo Global Markets Onboarding and KYC Specification",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/onboarding-and-kyc",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.WEEKEND_TRADING]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "Weekend & Off-Hours Trading Availability",
      summary: "Session-dependent secondary execution: Pre-market, Core regular market, Post-market, and Off-Hours sessions. Off-Hours trading is subject to brokerage capacity limits, wider spreads, and corporate-action pauses.",
      reason: "Brokerage and solver liquidity allows off-hours execution, but spreads and risk limits adjust dynamically when underlying US exchanges are closed.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "Ondo Stocks Market Hours and Trading Availability",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/market-hours-and-trading-availability",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.TOKEN_2022_MULTIPLIER_ACCRETION]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Token-2022 Scaled UI Multiplier",
      summary: "Uses SPL Token-2022 scaledUiAmountConfig extension (Type 14) to maintain 1:1 economic equity exposure dynamically.",
      authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
      sourceUrl: "https://spl.solana.com/token-2022/extensions#scaled-ui-amount",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.COLLATERAL_PROTECTION_STRUCTURE]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Bankruptcy-Remote Collateral Protection Structure",
      summary: "Issued by Ondo Global Markets (BVI) Limited (a bankruptcy-remote special purpose vehicle). Tokenholders benefit from a first-priority perfected security interest in collateral held with a regulated custodial broker-dealer.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Ondo Stocks Trust and Transparency Architecture",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/trust-and-transparency",
      dateChecked: "2026-09-13"
    }
  }
};

/**
 * Backward compatibility alias for ISSUER_CAPABILITIES
 */
ISSUER_CAPABILITIES.BACKED_ASSETS = ISSUER_CAPABILITIES.BACKED_ASSETS_JE;

/**
 * Structured Scenario Facts ("What Happens If")
 */
export const SCENARIO_FACTS = {
  BACKED_ASSETS_JE: {
    DIVIDEND: {
      scenarioId: "DIVIDEND",
      title: "What happens when the underlying stock pays a dividend?",
      plainLanguageExplanation: "When the underlying company pays a cash dividend, the net dividend amount (after applicable withholding taxes) is used to buy additional underlying shares. Instead of depositing cash in your wallet, the on-chain Token-2022 multiplier increases so each token represents slightly more underlying share exposure.",
      mechanism: "Token-2022 scaledUiAmountConfig multiplier accretion (Total Return)",
      userActionRequired: "None. Balance display updates automatically on Solana.",
      commonMisconception: "Expecting cash or USDC to arrive directly in your wallet on dividend payment date.",
      productSpecificCaveat: "Gross dividends are subject to foreign withholding taxes before reinvestment.",
      primarySource: "https://docs.xstocks.fi/docs/product-legal-overview"
    },
    STOCK_SPLIT: {
      scenarioId: "STOCK_SPLIT",
      title: "What happens if the underlying company conducts a stock split?",
      plainLanguageExplanation: "If the company conducts a stock split (e.g., 2-for-1 or 4-for-1), the on-chain multiplier or token parameters are updated to maintain exact economic parity. The value of your total position remains unchanged immediately after the split.",
      mechanism: "Token-2022 multiplier adjustment with ±15 minute corporate action safety window",
      userActionRequired: "None. Adjusts automatically on-chain.",
      commonMisconception: "Thinking your holding lost value if unit price changes after a split.",
      productSpecificCaveat: "Trading is temporarily paused for approximately 15 minutes during the multiplier transition window.",
      primarySource: "https://docs.xstocks.fi"
    },
    REDEMPTION: {
      scenarioId: "REDEMPTION",
      title: "How do you redeem or exit your tokenized stock position?",
      plainLanguageExplanation: "Everyday retail users exit by swapping their tokens back to USDC or SOL on Solana decentralized exchanges (Jupiter, Raydium, Meteora). Direct primary redemption with Backed Assets (JE) Limited is available to eligible retail and institutional investors who complete issuer KYC onboarding and meet the $5,000 minimum transaction threshold.",
      mechanism: "Secondary DEX liquidity pools (Retail) / Primary Issuer Settlement (Onboarded KYC Participants)",
      userActionRequired: "Swap on Solana DEX or apply for direct issuer KYC onboarding.",
      commonMisconception: "Believing you can walk into a brokerage and deposit the token into a traditional NYSE account directly.",
      productSpecificCaveat: "Direct issuer redemption is subject to the $5,000 minimum transaction size and processing fees.",
      primarySource: "https://docs.xstocks.fi/docs/product-legal-overview"
    }
  },

  ONDO_GLOBAL_MARKETS: {
    DIVIDEND: {
      scenarioId: "DIVIDEND",
      title: "What happens when the underlying stock pays a dividend?",
      plainLanguageExplanation: "Net dividend proceeds are automatically reinvested into the underlying asset pool. Token-2022 scaledUiAmountConfig multiplier increases, reflecting total-return compounding in your wallet balance.",
      mechanism: "Token-2022 scaledUiAmountConfig multiplier accretion (Total Return)",
      userActionRequired: "None. Multiplier updates automatically on-chain.",
      commonMisconception: "Expecting periodic cash payouts in USDon or USDC.",
      productSpecificCaveat: "USDon is used exclusively for primary mint/redemption quote settlement, not cash dividend distribution.",
      primarySource: "https://docs.ondo.finance/ondo-stocks/corporate-actions"
    },
    STOCK_SPLIT: {
      scenarioId: "STOCK_SPLIT",
      title: "What happens if the underlying company conducts a stock split?",
      plainLanguageExplanation: "In the event of a stock split or reverse split, the effective share multiplier is proportionally adjusted to reflect the new share count. Position value is preserved.",
      mechanism: "Token-2022 multiplier adjustment and temporary market pause during corporate action",
      userActionRequired: "None.",
      commonMisconception: "Believing tokens must be burned or re-issued manually.",
      productSpecificCaveat: "Orders may be rejected during corporate action maintenance windows.",
      primarySource: "https://docs.ondo.finance/ondo-stocks/corporate-actions"
    },
    REDEMPTION: {
      scenarioId: "REDEMPTION",
      title: "How do you redeem or exit your tokenized stock position?",
      plainLanguageExplanation: "Non-US onboarded users can redeem directly with Ondo Global Markets for USDon/cash during market operating hours. On-chain retail users trade via solver network and DEX liquidity on Solana.",
      mechanism: "Solver-facilitated DEX trading / Primary Ondo GM Portal Redemption",
      userActionRequired: "Trade on DEX or KYC onboard on Ondo platform.",
      commonMisconception: "Believing US residents can redeem directly with the issuer.",
      productSpecificCaveat: "Primary redemptions are subject to broker-dealer settlement hours and Regulation S eligibility.",
      primarySource: "https://docs.ondo.finance/ondo-stocks/onboarding-and-kyc"
    }
  }
};

SCENARIO_FACTS.BACKED_ASSETS = SCENARIO_FACTS.BACKED_ASSETS_JE;

/**
 * Reusable Safety Fact: Dividend Claim Transactions
 */
export const DIVIDEND_CLAIM_SAFETY_FACT = {
  factKey: "DOCUMENTED_DIVIDEND_CLAIM_TX_REQUIRED",
  status: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
  userFacingStatement: "This product's documented dividend mechanism does not require you to sign a separate dividend-claim transaction.",
  explanation: "Both Backed Assets (JE) Limited (xStocks) and Ondo Global Markets compound net dividends directly into token exposure on-chain via SPL Token-2022 Scaled UI multipliers. Any third-party website, airdrop, or token requesting a wallet signature to 'claim dividends' is a malicious phishing attempt.",
  authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
  dateChecked: "2026-09-13"
};
