// JustFair — Issuer-Level & Product-Family Facts (FinePrint)
// Phase 12 — Splits Issuer-Level Facts from Asset-Level Facts with First-Class Provenance

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
    issuerId: "BACKED_ASSETS",
    productFamily: "xStocks",
    issuerName: "Backed Assets GmbH",
    issuerJurisdiction: "Switzerland / Liechtenstein (EU Prospectus Regulation / Swiss DLT Framework)",
    legalStructure: "Tracker Certificate / Structured Debt Security (Tokenized Tracker)",
    backingRatio: "1:1 Collateralized by Underlying Equity / ETF Shares",
    custodyModel: "Regulated Swiss Custody (Segregated Collateral Pledge with Security Trustee)",
    documentationUrl: "https://www.backedassets.fi/legal-documentation",
    prospectusApprovedBy: "Financial Market Authority (FMA) Liechtenstein",
    primaryNetwork: "Solana",
    defaultTokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
    defaultDecimals: 8,
    dateChecked: "2026-09-13"
  },
  ONDO_GLOBAL_MARKETS: {
    issuerId: "ONDO_GLOBAL_MARKETS",
    productFamily: "Ondo Stocks",
    issuerName: "Ondo Global Markets (BVI) Limited",
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
  BACKED_ASSETS: {
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
      citation: "Backed Assets Base Prospectus Section 4: Rights Attached to Securities",
      sourceUrl: "https://www.backedassets.fi/legal-documentation",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.ORDINARY_VOTING_RIGHTS]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Corporate Voting Rights",
      summary: "No corporate voting rights. The custodian holds the underlying shares; voting rights are not passed through to token holders.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Backed Assets Base Prospectus Section 4.3: Exercise of Voting Rights",
      sourceUrl: "https://www.backedassets.fi/legal-documentation",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.ECONOMIC_DIVIDEND_BENEFIT]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Economic Dividend Benefit (Total Return)",
      summary: "Net dividends (after applicable withholding tax) are preserved and reinvested into underlying collateral, increasing share exposure per token.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Backed Assets Corporate Actions Terms",
      sourceUrl: "https://www.backedassets.fi/legal-documentation",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.CASH_DIVIDEND_PAYOUT]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Cash Dividend Paid to Holder Wallet",
      summary: "No cash, USD, or USDC dividend is deposited directly into your wallet. Dividend value compounds automatically via on-chain Token-2022 multiplier.",
      safetyWarning: "Unsolicited tokens or messages claiming to be cash dividends or requiring a claim signature are malicious phishing scams. xStocks automatically adjust value on-chain without user action.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Backed Assets Base Terms & Solana ScaledUiAmount Extension Specification",
      sourceUrl: "https://www.backedassets.fi/legal-documentation",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.WALLET_TRANSFERABILITY]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "24/7 Wallet-to-Wallet Transferability",
      summary: "Freely transferable between Solana wallets 24/7, subject to issuer freeze and pause authority.",
      reason: "Technically transferable on-chain at any time between un-frozen accounts, subject to compliance and regulatory freeze controls.",
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
      summary: "Direct primary issuance and redemption for underlying shares or cash with Backed Assets is available only to Qualified / Whitelisted Investors.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Backed Assets Base Prospectus Section 2: Issuance and Redemption",
      sourceUrl: "https://www.backedassets.fi/legal-documentation",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.REDEMPTION_WITHOUT_KYC]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Direct Primary Redemption Without KYC",
      summary: "Direct primary redemption with the issuer requires completing full KYC verification and onboarding. Retail users exit via secondary DEX liquidity without KYC.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Backed Assets Base Prospectus Section 2: Investor Eligibility",
      sourceUrl: "https://www.backedassets.fi/legal-documentation",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.WEEKEND_TRADING]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "Weekend & Off-Hours Trading",
      summary: "On-chain DEX swaps execute 24/7, but trades during US market closures face wider bid-ask spreads and liquidity volatility because the underlying stock tape is closed.",
      reason: "Secondary DEX liquidity pools operate 24/7, but traditional market makers widen spreads when reference stock exchanges are closed.",
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
    [CAPABILITY_KEYS.BANKRUPTCY_SEGREGATED_COLLATERAL]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Segregated Bankruptcy Collateral",
      summary: "Underlying shares are held in segregated custody accounts pledged to a security trustee for token holders, protecting collateral from issuer insolvency.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Backed Assets Legal Documentation: Custody & Collateral Segregation",
      sourceUrl: "https://www.backedassets.fi/legal-documentation",
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
      summary: "24/7 on-chain wallet-to-wallet transferability on Solana, subject to issuer freeze authority and regulatory pause controls.",
      reason: "Technically transferable on-chain at any time between un-frozen accounts, subject to compliance and regulatory freeze controls.",
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
      summary: "Direct primary minting and redemption for cash/USDon requires completing KYC onboarding with Ondo Global Markets (non-US persons only).",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "Ondo Global Markets Onboarding and KYC Specification",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/onboarding-and-kyc",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.REDEMPTION_WITHOUT_KYC]: {
      value: false,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
      title: "Direct Primary Redemption Without KYC",
      summary: "Direct primary redemption with the issuer strictly requires KYC identity verification. Retail traders exit via secondary trading without KYC.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_PRODUCT_DOCS,
      citation: "Ondo Global Markets Onboarding and KYC Specification",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/onboarding-and-kyc",
      dateChecked: "2026-09-13"
    },
    [CAPABILITY_KEYS.WEEKEND_TRADING]: {
      value: true,
      conditional: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
      title: "Weekend & Off-Hours Trading",
      summary: "Session-dependent: Pre-market, Core regular market, Post-market, and Off-Hours sessions. Off-Hours trading is subject to broker limits and corporate-action pauses.",
      reason: "Off-Hours trading allows after-hours execution with brokerage liquidity, but is subject to wider spreads and risk controls when underlying US exchanges are closed.",
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
    [CAPABILITY_KEYS.BANKRUPTCY_SEGREGATED_COLLATERAL]: {
      value: true,
      evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
      title: "Segregated Bankruptcy Collateral",
      summary: "Tokenholders benefit from a first-priority perfected security interest in collateral held with a regulated custodial broker-dealer.",
      authorityClass: FACT_AUTHORITY_CLASS.ISSUER_LEGAL,
      citation: "Ondo Stocks Trust and Transparency Architecture",
      sourceUrl: "https://docs.ondo.finance/ondo-stocks/trust-and-transparency",
      dateChecked: "2026-09-13"
    }
  }
};

/**
 * Structured Scenario Facts ("What Happens If")
 */
export const SCENARIO_FACTS = {
  BACKED_ASSETS: {
    DIVIDEND: {
      scenarioId: "DIVIDEND",
      title: "What happens when the underlying stock pays a dividend?",
      plainLanguageExplanation: "When the underlying company pays a cash dividend, the net dividend amount (after applicable withholding taxes) is used to buy additional underlying shares. Instead of depositing cash in your wallet, the on-chain Token-2022 multiplier increases so each token represents slightly more underlying share exposure.",
      mechanism: "Token-2022 scaledUiAmountConfig multiplier accretion (Total Return)",
      userActionRequired: "None. Balance display updates automatically on Solana.",
      commonMisconception: "Expecting cash or USDC to arrive directly in your wallet on dividend payment date.",
      productSpecificCaveat: "Gross dividends are subject to standard Swiss/foreign withholding taxes before reinvestment.",
      primarySource: "https://www.backedassets.fi/legal-documentation"
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
      plainLanguageExplanation: "Everyday retail users exit by swapping their tokens back to USDC or SOL on Solana decentralized exchanges (Jupiter, Raydium, Meteora). Direct primary redemption for physical stock or fiat with Backed Assets is reserved for onboarded KYC-verified Qualified Investors.",
      mechanism: "Secondary DEX liquidity pools (Retail) / Primary Issuer Settlement (Qualified Investors)",
      userActionRequired: "Swap on Solana DEX or apply for institutional KYC onboarding.",
      commonMisconception: "Believing you can walk into a brokerage and deposit the token into a traditional NYSE account directly.",
      productSpecificCaveat: "Direct issuer redemption is subject to minimum volume thresholds and redemption fees.",
      primarySource: "https://www.backedassets.fi/legal-documentation"
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

/**
 * Reusable Safety Fact: Dividend Claim Transactions
 */
export const DIVIDEND_CLAIM_SAFETY_FACT = {
  factKey: "DOCUMENTED_DIVIDEND_CLAIM_TX_REQUIRED",
  status: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
  userFacingStatement: "This product's documented dividend mechanism does not require you to sign a separate dividend-claim transaction.",
  explanation: "Both Backed Assets (xStocks) and Ondo Stocks compound net dividends directly into token exposure on-chain via SPL Token-2022 Scaled UI multipliers. Any third-party website, airdrop, or token requesting a wallet signature to 'claim dividends' is a malicious phishing attempt.",
  authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
  dateChecked: "2026-09-13"
};
