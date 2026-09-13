// JustFair — Product Preflight Fact Registry
// Primary-Source Catalog for Tokenized Stocks on Solana
// Phase 11 Correction — Multi-Issuer Architecture (Underlying -> Representations)

import { FACT_AUTHORITY, FACT_EVIDENCE_STATUS, EXPECTATION_KEYS } from "./schema.js";
import { SUPPORTED_STOCKS } from "../config.js";

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
    legalStructure: "Tokenized Securities / Equity-Backed Tokens (Ondo Stocks)",
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
  dividendHandling: {
    mechanism: "TOKEN_2022_MULTIPLIER_ACCRETION",
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
    summary: "Net dividends (after withholding tax) are reinvested into underlying collateral, increasing the Token-2022 multiplier. No cash or USDC is airdropped.",
    scamWarning: "Unsolicited tokens or links sent to your wallet claiming to be cash dividends or requiring a claim signature are malicious phishing scams. xStocks automatically compound value on-chain without any user action.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "Backed Assets Corporate Actions Terms & Solana ScaledUiAmount Extension Specification",
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
    summary: "Freely transferable 24/7 on Solana DEXs and wallets, subject to issuer freeze and pause authority.",
    authority: FACT_AUTHORITY.SOLANA_ONCHAIN_RPC,
    dateChecked: "2026-09-13"
  },
  stockSplits: {
    summary: "Corporate stock splits are mirrored by updating the token multiplier or on-chain supply configuration so your equity exposure remains unbroken.",
    authority: FACT_AUTHORITY.ISSUER_LEGAL_DOCS,
    citation: "Backed Assets Terms & Conditions Section 6: Adjustments and Corporate Actions",
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
  dividendHandling: {
    mechanism: "STABLECOIN_PAYOUT_OR_MULTIPLIER",
    evidenceStatus: FACT_EVIDENCE_STATUS.VERIFIED_TRUE,
    summary: "When an underlying security issues a cash dividend, the net payout is distributed in USDon stablecoin or adjusted via on-chain multiplier.",
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
    summary: "24/7 on-chain transferability on Solana, subject to issuer freeze authority and regulatory compliance controls.",
    authority: FACT_AUTHORITY.SOLANA_ONCHAIN_RPC,
    citation: "https://docs.ondo.finance/ondo-stocks/transferability",
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
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/AAPLx/metadata.json"
      },
      {
        representationTicker: "AAPLon",
        issuer: ISSUER_FACTS.ONDO_FINANCE,
        mint: "UNRESOLVED_PRIMARY_ACCESS",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        holderRights: COMMON_ONDO_HOLDER_RIGHTS,
        mintVerificationStatus: "UNRESOLVED_PRIMARY_ACCESS",
        mintResolutionReason: "Ondo official API (GET /v1/assets/AAPLon/addresses) requires authenticated x-api-key; on-chain factory deployment pending public metadata mapping.",
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        metadataUri: "https://docs.ondo.finance/api-reference/assets/get-contract-addresses-for-an-asset"
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
  statusReason: "Ondo Finance (Ondo Stocks) officially launched on Solana in January 2026 with 565 factory slots and active Token-2022 mints under program XzTT4XB8m7sLD2xi6snefSasaswsKCxx5Tifjondogm.",
  supportedIssuers: [
    "Backed Assets GmbH (xStocks)",
    "Ondo Global Markets (BVI) Limited (Ondo Stocks)"
  ],
  previousRecord: {
    finding: "Single verified issuer (Backed Assets)",
    status: "SUPERSEDED_INCORRECT",
    correctionDate: "2026-09-13",
    correctionReason: "Official Ondo primary evidence confirms Ondo Stocks is live on Solana with 200+ tokenized US equities and Token-2022 architecture."
  }
};

export function getUnderlyingSecurity(canonicalSymbol) {
  const norm = canonicalSymbol.toUpperCase();
  return UNDERLYING_SECURITY_CATALOG[norm] || null;
}

export function getAllUnderlyings() {
  return Object.values(UNDERLYING_SECURITY_CATALOG);
}
