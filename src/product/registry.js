// JustFair — Product Preflight Fact Registry
// Primary-Source Catalog for Tokenized Stocks on Solana
// Phase 11 Final Truth Correction — AAPLon Exact Mint & Semantic Dividend/Trading Models

import { FACT_AUTHORITY, FACT_EVIDENCE_STATUS, EXPECTATION_KEYS } from "./schema.js";

export const ISSUER_FACTS = {
  BACKED_ASSETS: {
    issuerId: "BACKED_ASSETS",
    issuerName: "Backed Assets GmbH",
    issuerJurisdiction: "Switzerland / Liechtenstein (EU Prospectus Regulation Framework)",
    legalStructure: "Tracker Certificate / Structured Debt Security (Tokenized Tracker)",
    backingRatio: "1:1 Collateralized by Underlying Equity / ETF Shares",
    custodyModel: "Regulated Swiss Custody (Segregated Collateral Pledge)",
    documentationUrl: "https://www.backedassets.fi/legal-documentation",
    prospectusApprovedBy: "Financial Market Authority (FMA) Liechtenstein",
    termsUrl: "https://xstocks-metadata.backed.fi/tokens/Solana/AAPLx/metadata.json"
  },
  ONDO_FINANCE: {
    issuerId: "ONDO_GLOBAL_MARKETS",
    issuerName: "Ondo Global Markets (BVI) Limited",
    issuerJurisdiction: "British Virgin Islands (Regulation S Exemption under US Securities Act of 1933)",
    legalStructure: "Tokenized Securities / Equity-Backed Structured Notes (Ondo Stocks)",
    backingRatio: "1:1 Exposure to Underlying Securities held via Regulated Custodial Broker-Dealer",
    custodyModel: "Regulated Custodial Broker-Dealer (First-Priority Perfected Security Interest)",
    documentationUrl: "https://docs.ondo.finance/ondo-stocks/overview",
    legalDisclaimersUrl: "https://docs.ondo.finance/legal/disclaimers",
    onchainProgramId: "XzTT4XB8m7sLD2xi6snefSasaswsKCxx5Tifjondogm",
    ownershipStructure: "90.01% Flux Finance Inc. (Ondo Foundation subsidiary), 9.99% Ondo Finance Inc."
  }
};

export const COMMON_XSTOCKS_HOLDER_RIGHTS = {
  directShareholderOwnership: {
    value: false,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
    summary: "No direct equity ownership. You hold a structured debt security tracking the underlying equity price, not registered common stock.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "Backed Assets Base Prospectus Section 4: Rights Attached to Securities",
    dateChecked: "2026-09-13"
  },
  votingRights: {
    value: false,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
    summary: "No corporate voting rights. The custodian holds the shares; voting rights are not passed through to token holders.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "Backed Assets Base Prospectus Section 4.3: Exercise of Voting Rights",
    dateChecked: "2026-09-13"
  },
  economicDividendBenefit: {
    value: true,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
    summary: "Net dividends (after applicable withholding tax) are preserved and reinvested into underlying collateral.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "Backed Assets Corporate Actions Terms",
    dateChecked: "2026-09-13"
  },
  cashDividendPaidToHolder: {
    value: false,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
    summary: "No cash or USDC dividend is deposited into your wallet. Dividend value compounds automatically via on-chain token multiplier.",
    scamWarning: "Unsolicited tokens or messages sent to your wallet claiming to be cash dividends or requiring a claim signature are malicious phishing scams. xStocks automatically adjust value on-chain without user action.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "Backed Assets Base Terms & Solana ScaledUiAmount Extension Specification",
    dateChecked: "2026-09-13"
  },
  selfCustody: {
    value: true,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
    summary: "Held directly in your self-custody Solana wallet.",
    authority: FACT_AUTHORITY.SOLANA_ONCHAIN_RPC,
    dateChecked: "2026-09-13"
  },
  walletTransferability: {
    value: true,
    conditional: true,
    evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
    summary: "Freely transferable between Solana wallets 24/7, subject to issuer freeze and pause authority.",
    authority: FACT_AUTHORITY.SOLANA_ONCHAIN_RPC,
    dateChecked: "2026-09-13"
  },
  tradingAvailability: {
    issuerPlatform: "DEX liquidity pool dependent; underlying market sessions dictate pricing efficiency.",
    offHoursNotes: "During market closures/weekends, secondary DEX trading remains active on-chain, but wider bid-ask spreads and liquidity premiums may occur due to traditional tape closure.",
    authority: FACT_AUTHORITY.REGULATORY_FRAMEWORK,
    dateChecked: "2026-09-13"
  },
  primaryRedemption: {
    permissionless: false,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
    summary: "Direct primary redemption for underlying shares or fiat with the issuer is restricted to KYC-verified Qualified / Whitelisted Investors. Everyday retail traders exit via Solana DEX liquidity.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "Backed Assets Base Prospectus Section 2: Issuance and Redemption",
    dateChecked: "2026-09-13"
  },
  bankruptcyCustody: {
    summary: "Underlying shares are held in segregated custody accounts pledged to a security trustee for token holders, protecting collateral from issuer insolvency.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "Backed Assets Legal Documentation: Custody & Collateral Segregation",
    dateChecked: "2026-09-13"
  }
};

export const COMMON_ONDO_HOLDER_RIGHTS = {
  directShareholderOwnership: {
    value: false,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
    summary: "No direct equity ownership. Assets are held in the name of/for the benefit of the Issuer via a regulated custodial broker-dealer.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "https://docs.ondo.finance/ondo-stocks/legal-and-regulatory",
    dateChecked: "2026-09-13"
  },
  votingRights: {
    value: false,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
    summary: "No shareholder voting rights or shareholder communications passed through from the underlying company.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "https://docs.ondo.finance/ondo-stocks/legal-and-regulatory",
    dateChecked: "2026-09-13"
  },
  economicDividendBenefit: {
    value: true,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
    summary: "Net dividends are automatically reinvested into the referenced stock / total return pool, reflected in displayed token balance via Scaled UI multiplier.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "https://docs.ondo.finance/ondo-stocks/corporate-actions",
    dateChecked: "2026-09-13"
  },
  cashDividendPaidToHolder: {
    value: false,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
    summary: "No cash dividend is paid directly to wallet. Dividend economics are captured through automatic reinvestment / Scaled UI multiplier accretion.",
    scamWarning: "Unsolicited tokens or messages sent to your wallet claiming to be cash dividends are malicious phishing scams. Ondo Stocks reflect dividend economics via on-chain total-return adjustments.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "https://docs.ondo.finance/ondo-stocks/corporate-actions",
    dateChecked: "2026-09-13"
  },
  selfCustody: {
    value: true,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
    summary: "Tokens are standard SPL Token-2022 tokens held directly in self-custodial Solana wallets.",
    authority: FACT_AUTHORITY.SOLANA_ONCHAIN_RPC,
    dateChecked: "2026-09-13"
  },
  walletTransferability: {
    value: true,
    conditional: true,
    evidenceStatus: FACT_EVIDENCE_STATUS.CONDITIONAL,
    summary: "24/7 on-chain wallet-to-wallet transferability on Solana, subject to issuer freeze authority and regulatory pause controls.",
    authority: FACT_AUTHORITY.SOLANA_ONCHAIN_RPC,
    citation: "https://docs.ondo.finance/ondo-stocks/transferability",
    dateChecked: "2026-09-13"
  },
  tradingAvailability: {
    issuerPlatform: "Session-dependent: Pre-market, Core regular market, Post-market, and Overnight/Off-Hours sessions with dynamic capacity limits and corporate-action pauses.",
    offHoursNotes: "Off-Hours trading allows after-hours execution with brokerage liquidity, but is subject to wider spreads and risk controls when underlying US exchanges are closed.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "https://docs.ondo.finance/ondo-stocks/market-hours-and-trading-availability",
    dateChecked: "2026-09-13"
  },
  primaryRedemption: {
    permissionless: false,
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_FALSE,
    summary: "Direct primary minting and redemption for cash/USDon requires completing KYC onboarding with Ondo Global Markets (non-US persons only).",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "https://docs.ondo.finance/ondo-stocks/onboarding-and-kyc",
    dateChecked: "2026-09-13"
  },
  bankruptcyCustody: {
    summary: "Tokenholders benefit from a first-priority perfected security interest in collateral held with a regulated custodial broker-dealer.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "https://docs.ondo.finance/ondo-stocks/trust-and-transparency",
    dateChecked: "2026-09-13"
  }
};

// Underlying Security Catalog mapping to Multiple Representations
export const UNDERLYING_SECURITY_CATALOG = {
  AAPL: {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    assetClass: "stocks",
    representations: [
      {
        representationTicker: "AAPLx",
        issuer: ISSUER_FACTS.BACKED_ASSETS,
        mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        holderRights: COMMON_XSTOCKS_HOLDER_RIGHTS,
        mintVerificationStatus: "VERIFIED_ONCHAIN",
        executionPreflightSupported: true,
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/AAPLx/metadata.json",
        onchainState: {
          currentMultiplier: "1.0032690125398187",
          pendingMultiplier: "1.0032690125398187",
          effectiveTimestamp: 1786149000,
          freezeAuthority: "JDq14BWvqCRFNu1krb12bcRpbGtJZ1FLEakMw6FdxJNs",
          mintAuthority: "7pt9tkctJPK7PPNQJ77GKg8ZffSF6QxoMiCFYHxrtaCj"
        }
      },
      {
        representationTicker: "AAPLon",
        issuer: ISSUER_FACTS.ONDO_FINANCE,
        mint: "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        holderRights: COMMON_ONDO_HOLDER_RIGHTS,
        mintVerificationStatus: "VERIFIED_ONCHAIN",
        officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
        dateChecked: "2026-09-13",
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        metadataUri: "https://app.ondo.finance/api/v2/assets/AAPLon/sol_metadata.json",
        onchainState: {
          currentMultiplier: "1.003376073740221",
          pendingMultiplier: "1.003376073740221",
          effectiveTimestamp: 1788344044,
          freezeAuthority: "51QVCuHfL1FeNjd8BDeffCKhCcAYoULnVB3yjNhShiuK",
          mintAuthority: "9foMHsSDq7nMg4WPusSz9eY7tyxyukqborA8GyU5cUxD"
        }
      }
    ]
  },
  NVDA: {
    symbol: "NVDA",
    companyName: "NVIDIA Corporation",
    assetClass: "stocks",
    representations: [
      {
        representationTicker: "NVDAx",
        issuer: ISSUER_FACTS.BACKED_ASSETS,
        mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        holderRights: COMMON_XSTOCKS_HOLDER_RIGHTS,
        mintVerificationStatus: "VERIFIED_ONCHAIN",
        executionPreflightSupported: true,
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/NVDAx/metadata.json"
      },
      {
        representationTicker: "NVDAon",
        issuer: ISSUER_FACTS.ONDO_FINANCE,
        mint: "gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        holderRights: COMMON_ONDO_HOLDER_RIGHTS,
        mintVerificationStatus: "VERIFIED_ONCHAIN",
        officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
        dateChecked: "2026-09-13",
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        metadataUri: "https://app.ondo.finance/api/v2/assets/NVDAon/sol_metadata.json"
      }
    ]
  }
};

// Second-Issuer Kill Gate Status
export const SECOND_ISSUER_STATUS = {
  gate: "PASS",
  statusReason: "Ondo Finance (Ondo Stocks) officially launched on Solana with 565 factory slots, 38+ live Token-2022 mints under program XzTT4XB8m7sLD2xi6snefSasaswsKCxx5Tifjondogm, and exact AAPLon mint 123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo verified on Mainnet.",
  supportedIssuers: [
    "Backed Assets GmbH (xStocks)",
    "Ondo Global Markets (BVI) Limited (Ondo Stocks)"
  ],
  supersededFindings: [
    {
      id: "AAPLON_MINT_STATUS",
      prior: "AAPLon exact mint unresolved due to primary access",
      status: "SUPERSEDED",
      correction: "Resolved to 123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo via official ondoprotocol/gm-solana-simulator and verified on Solana Mainnet RPC."
    },
    {
      id: "DIVIDEND_PAYOUT_MECHANISM",
      prior: "AAPLon cash dividend in USDon supported",
      status: "SUPERSEDED",
      correction: "Ondo official Corporate Actions documentation confirms automatic dividend reinvestment / total-return multiplier accretion; no cash dividends are deposited into user wallets."
    },
    {
      id: "TRADING_AVAILABILITY_SEMANTICS",
      prior: "Secondary trading summarized as unconditional 24/7",
      status: "SUPERSEDED",
      correction: "Separated 24/7 wallet transferability from session-dependent issuer/broker trading availability and off-hours market spreads."
    }
  ]
};

export function getUnderlyingSecurity(canonicalSymbol) {
  const norm = canonicalSymbol.toUpperCase();
  return UNDERLYING_SECURITY_CATALOG[norm] || null;
}

export function getAllUnderlyings() {
  return Object.values(UNDERLYING_SECURITY_CATALOG);
}
