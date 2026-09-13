// JustFair — Product Preflight Fact Registry
// Primary-Source Catalog for Tokenized Stocks on Solana
// Phase 12 — Full Multi-Issuer Underlying Catalog (12 Underlyings, 24 Representations)

import {
  FACT_AUTHORITY_CLASS,
  FACT_EVIDENCE_STATUS,
  VERIFICATION_STATUS,
  EXECUTION_SUPPORT,
  CAPABILITY_KEYS
} from "./schema.js";
import {
  ISSUER_PROFILES,
  ISSUER_CAPABILITIES,
  SCENARIO_FACTS,
  DIVIDEND_CLAIM_SAFETY_FACT
} from "./issuerFacts.js";

/**
 * Resolves the active multiplier according to Solana Token-2022 scaledUiAmountConfig semantics
 */
export function resolveEffectiveMultiplier(multiplierInfo, currentUnixTimestamp = Math.floor(Date.now() / 1000)) {
  if (!multiplierInfo) {
    return {
      activeMultiplier: "1.0",
      numericMultiplier: 1.0,
      isTransitionUpcoming: false,
      isTransitionActive: false,
      multiplierSource: "DEFAULT_PARITY"
    };
  }

  const { multiplier, newMultiplier, newMultiplierEffectiveTimestamp } = multiplierInfo;
  const currentNum = parseFloat(multiplier || "1.0");
  const newNum = newMultiplier ? parseFloat(newMultiplier) : currentNum;
  const effTs = parseInt(newMultiplierEffectiveTimestamp || "0", 10);

  if (effTs > 0 && currentUnixTimestamp >= effTs) {
    // Effective timestamp has passed -> newMultiplier is the active multiplier
    return {
      activeMultiplier: newMultiplier || multiplier,
      numericMultiplier: newNum,
      storedMultiplier: multiplier,
      newMultiplier,
      effectiveTimestamp: effTs,
      isTransitionUpcoming: false,
      isTransitionActive: true,
      resolutionRule: "CURRENT_TIME_GTE_EFFECTIVE_TIMESTAMP",
      multiplierSource: "SOLANA_TOKEN_2022_SCALED_UI"
    };
  } else if (effTs > 0 && currentUnixTimestamp < effTs) {
    // Transition is in the future
    return {
      activeMultiplier: multiplier,
      numericMultiplier: currentNum,
      storedMultiplier: multiplier,
      newMultiplier,
      effectiveTimestamp: effTs,
      isTransitionUpcoming: true,
      isTransitionActive: false,
      resolutionRule: "CURRENT_TIME_LT_EFFECTIVE_TIMESTAMP",
      multiplierSource: "SOLANA_TOKEN_2022_SCALED_UI"
    };
  }

  return {
    activeMultiplier: multiplier || "1.0",
    numericMultiplier: currentNum,
    storedMultiplier: multiplier,
    newMultiplier: null,
    effectiveTimestamp: null,
    isTransitionUpcoming: false,
    isTransitionActive: false,
    resolutionRule: "NO_SCHEDULED_TRANSITION",
    multiplierSource: "SOLANA_TOKEN_2022_SCALED_UI"
  };
}

/**
 * Master Registry: 12 Underlyings with 24 Representations
 */
export const UNDERLYING_SECURITY_CATALOG = {
  AAPL: {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    representations: [
      {
        productId: "xstocks:aaplx:solana",
        representationTicker: "AAPLx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Apple Inc. (Tokenized)",
        metadataSymbol: "AAPLx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/AAPLx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0026642075893797",
          newMultiplier: "1.0032690125398187",
          newMultiplierEffectiveTimestamp: 1786149000
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/AAPLx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:aaplon:solana",
        representationTicker: "AAPLon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Apple (Ondo Tokenized)",
        metadataSymbol: "AAPLon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/AAPLon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.003376073740221",
          newMultiplier: "1.003376073740221",
          newMultiplierEffectiveTimestamp: 1788344044
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  NVDA: {
    symbol: "NVDA",
    companyName: "NVIDIA Corporation",
    assetClass: "stocks",
    category: "Crypto & AI",
    representations: [
      {
        productId: "xstocks:nvdax:solana",
        representationTicker: "NVDAx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "NVIDIA Corporation (Tokenized)",
        metadataSymbol: "NVDAx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/NVDAx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0009180758490996",
          newMultiplier: "1.001701196801074",
          newMultiplierEffectiveTimestamp: 1789000200
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/NVDAx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:nvdaon:solana",
        representationTicker: "NVDAon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "gEGtLTPNQ7jcg25zTetkbmF7teoDLcrfTnQfmn2ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "NVIDIA (Ondo Tokenized)",
        metadataSymbol: "NVDAon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/NVDAon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0017152487959897",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  SPY: {
    symbol: "SPY",
    companyName: "SPDR S&P 500 ETF Trust",
    assetClass: "etf",
    category: "Index ETFs",
    representations: [
      {
        productId: "xstocks:spyx:solana",
        representationTicker: "SPYx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "SPDR S&P 500 ETF Trust (Tokenized)",
        metadataSymbol: "SPYx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/SPYx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.003909240011759",
          newMultiplier: "1.005714560286254",
          newMultiplierEffectiveTimestamp: 1781755200
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/SPYx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:spyon:solana",
        representationTicker: "SPYon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "k18WJUULWheRkSpSquYGdNNmtuE2Vbw1hpuUi92ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "SPDR S&P 500 (Ondo Tokenized)",
        metadataSymbol: "SPYon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/SPYon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0077209101501272",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  TSLA: {
    symbol: "TSLA",
    companyName: "Tesla, Inc.",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    representations: [
      {
        productId: "xstocks:tslax:solana",
        representationTicker: "TSLAx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Tesla Inc. (Tokenized)",
        metadataSymbol: "TSLAx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/TSLAx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/TSLAx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:tslaon:solana",
        representationTicker: "TSLAon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "KeGv7bsfR4MheC1CkmnAVceoApjrkvBhHYjWb67ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Tesla (Ondo Tokenized)",
        metadataSymbol: "TSLAon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/TSLAon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  MSFT: {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    representations: [
      {
        productId: "xstocks:msftx:solana",
        representationTicker: "MSFTx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Microsoft Corporation (Tokenized)",
        metadataSymbol: "MSFTx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/MSFTx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0045820905025638",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/MSFTx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:msfton:solana",
        representationTicker: "MSFTon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "FRmH6iRkMr33DLG6zVLR7EM4LojBFAuq6NtFzG6ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Microsoft (Ondo Tokenized)",
        metadataSymbol: "MSFTon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/MSFTon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0057308568927839",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  AMZN: {
    symbol: "AMZN",
    companyName: "Amazon.com, Inc.",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    representations: [
      {
        productId: "xstocks:amznx:solana",
        representationTicker: "AMZNx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Amazon.com Inc. (Tokenized)",
        metadataSymbol: "AMZNx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/AMZNx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/AMZNx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:amznon:solana",
        representationTicker: "AMZNon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "14Tqdo8V1FhzKsE3W2pFsZCzYPQxxupXRcqw9jv6ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Amazon (Ondo Tokenized)",
        metadataSymbol: "AMZNon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/AMZNon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  GOOGL: {
    symbol: "GOOGL",
    companyName: "Alphabet Inc. (Google)",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    representations: [
      {
        productId: "xstocks:googlx:solana",
        representationTicker: "GOOGLx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Alphabet Inc. (Tokenized)",
        metadataSymbol: "GOOGLx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/GOOGLx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.001926722393864",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/GOOGLx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:googlon:solana",
        representationTicker: "GOOGLon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "bbahNA5vT9WJeYft8tALrH1LXWffjwqVoUbqYa1ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Alphabet (Ondo Tokenized)",
        metadataSymbol: "GOOGLon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/GOOGLon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0024603266374352",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  META: {
    symbol: "META",
    companyName: "Meta Platforms, Inc.",
    assetClass: "stocks",
    category: "Mega-Cap Tech",
    representations: [
      {
        productId: "xstocks:metax:solana",
        representationTicker: "METAx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Meta Platforms Inc. (Tokenized)",
        metadataSymbol: "METAx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/METAx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0016490257902244",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/METAx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:metaon:solana",
        representationTicker: "METAon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "fDxs5y12E7x7jBwCKBXGqt71uJmCWsAQ3Srkte6ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Meta (Ondo Tokenized)",
        metadataSymbol: "METAon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/METAon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0022791066933001",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  COIN: {
    symbol: "COIN",
    companyName: "Coinbase Global, Inc.",
    assetClass: "stocks",
    category: "Crypto & AI",
    representations: [
      {
        productId: "xstocks:coinx:solana",
        representationTicker: "COINx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Coinbase Global Inc. (Tokenized)",
        metadataSymbol: "COINx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/COINx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/COINx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:coinon:solana",
        representationTicker: "COINon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "5u6KDiNJXxX4rGMfYT4BApZQC5CuDNrG6MHkwp1ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Coinbase (Ondo Tokenized)",
        metadataSymbol: "COINon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/COINon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  AMD: {
    symbol: "AMD",
    companyName: "Advanced Micro Devices, Inc.",
    assetClass: "stocks",
    category: "Crypto & AI",
    representations: [
      {
        productId: "xstocks:amdx:solana",
        representationTicker: "AMDx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Advanced Micro Devices Inc. (Tokenized)",
        metadataSymbol: "AMDx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/AMDx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/AMDx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:amdon:solana",
        representationTicker: "AMDon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "14diAn5z8kjrKwSC8WLqvBqqe5YmihJhjxRxd8Z6ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "AMD (Ondo Tokenized)",
        metadataSymbol: "AMDon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/AMDon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  MSTR: {
    symbol: "MSTR",
    companyName: "MicroStrategy Incorporated",
    assetClass: "stocks",
    category: "Crypto & AI",
    representations: [
      {
        productId: "xstocks:mstrx:solana",
        representationTicker: "MSTRx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "MicroStrategy Incorporated (Tokenized)",
        metadataSymbol: "MSTRx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/MSTRx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/MSTRx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:mstron:solana",
        representationTicker: "MSTRon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "FSz4ouiqXpHuGPcpacZfTzbMjScoj5FfzHkiyu2ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "MicroStrategy (Ondo Tokenized)",
        metadataSymbol: "MSTRon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/MSTRon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  },

  QQQ: {
    symbol: "QQQ",
    companyName: "Invesco QQQ Trust Series 1",
    assetClass: "etf",
    category: "Index ETFs",
    representations: [
      {
        productId: "xstocks:qqqx:solana",
        representationTicker: "QQQx",
        issuerProfile: ISSUER_PROFILES.BACKED_ASSETS,
        mint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ",
        decimals: 8,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Invesco QQQ Trust Series 1 (Tokenized)",
        metadataSymbol: "QQQx",
        metadataUri: "https://xstocks-metadata.backed.fi/tokens/Solana/QQQx/metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.SUPPORTED,
        executionPreflightSupported: true,
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "permanentDelegate", "defaultAccountState", "pausableConfig"],
        observedMultiplier: {
          multiplier: "1.0019546533977475",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.SOLANA_MAINNET,
          officialMappingSource: "https://xstocks.fi/assets/QQQx",
          dateChecked: "2026-09-13"
        }
      },
      {
        productId: "ondo:qqqon:solana",
        representationTicker: "QQQon",
        issuerProfile: ISSUER_PROFILES.ONDO_GLOBAL_MARKETS,
        mint: "HrYNm6jTQ71LoFphjVKBTdAE4uja7WsmLG8VxB8ondo",
        decimals: 9,
        tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
        metadataName: "Invesco QQQ (Ondo Tokenized)",
        metadataSymbol: "QQQon",
        metadataUri: "https://app.ondo.finance/api/v2/assets/QQQon/sol_metadata.json",
        executionPreflightSupport: EXECUTION_SUPPORT.NOT_YET_SUPPORTED,
        executionPreflightSupported: false,
        executionPreflightStatus: "EXECUTION_PREFLIGHT_NOT_YET_SUPPORTED_FOR_THIS_REPRESENTATION",
        mintVerificationStatus: VERIFICATION_STATUS.VERIFIED,
        expectedExtensions: ["scaledUiAmountConfig", "metadataPointer", "pausableConfig", "defaultAccountState", "transferHook"],
        observedMultiplier: {
          multiplier: "1.0033528541550838",
          newMultiplier: null,
          newMultiplierEffectiveTimestamp: null
        },
        provenance: {
          authorityClass: FACT_AUTHORITY_CLASS.OFFICIAL_SOURCE_CODE,
          officialMappingSource: "https://github.com/ondoprotocol/gm-solana-simulator/blob/main/constants.rs",
          dateChecked: "2026-09-13"
        }
      }
    ]
  }
};

/**
 * Public Internal Registry Query Functions
 */

export function getUnderlyingSecurity(canonicalSymbol) {
  if (!canonicalSymbol) return null;
  const norm = canonicalSymbol.toUpperCase();
  return UNDERLYING_SECURITY_CATALOG[norm] || null;
}

export function getAllUnderlyings() {
  return Object.values(UNDERLYING_SECURITY_CATALOG);
}

export function getRepresentations(underlyingOrRepresentationSymbol) {
  if (!underlyingOrRepresentationSymbol) return [];
  let canonicalSymbol = underlyingOrRepresentationSymbol.toUpperCase();
  if (canonicalSymbol.endsWith("X") && canonicalSymbol.length > 2) {
    canonicalSymbol = canonicalSymbol.slice(0, -1);
  } else if (canonicalSymbol.endsWith("ON") && canonicalSymbol.length > 3) {
    canonicalSymbol = canonicalSymbol.slice(0, -2);
  }
  const underlying = getUnderlyingSecurity(canonicalSymbol);
  return underlying ? underlying.representations : [];
}

export function getProduct(productId) {
  if (!productId) return null;
  const normId = productId.toLowerCase();
  for (const underlying of Object.values(UNDERLYING_SECURITY_CATALOG)) {
    for (const rep of underlying.representations) {
      if (rep.productId.toLowerCase() === normId || rep.representationTicker.toLowerCase() === normId || rep.mint.toLowerCase() === normId) {
        return {
          ...rep,
          underlyingSymbol: underlying.symbol,
          companyName: underlying.companyName,
          assetClass: underlying.assetClass
        };
      }
    }
  }
  return null;
}

export function getAllProducts() {
  const products = [];
  for (const underlying of Object.values(UNDERLYING_SECURITY_CATALOG)) {
    for (const rep of underlying.representations) {
      products.push({
        ...rep,
        underlyingSymbol: underlying.symbol,
        companyName: underlying.companyName,
        assetClass: underlying.assetClass
      });
    }
  }
  return products;
}

/**
 * Composes Issuer-Level Facts + Asset-Level Facts for a Product
 */
export function getProductCapabilities(productId) {
  const product = getProduct(productId);
  if (!product) return null;

  const issuerId = product.issuerProfile.issuerId;
  const baseCaps = ISSUER_CAPABILITIES[issuerId] || {};
  const scenarios = SCENARIO_FACTS[issuerId] || {};

  // Clone capabilities and attach product-specific details
  const composedCapabilities = {};
  for (const [capKey, capData] of Object.entries(baseCaps)) {
    composedCapabilities[capKey] = {
      ...capData,
      productId: product.productId,
      ticker: product.representationTicker,
      mint: product.mint
    };
  }

  return {
    productId: product.productId,
    representationTicker: product.representationTicker,
    underlyingSymbol: product.underlyingSymbol,
    companyName: product.companyName,
    issuer: product.issuerProfile,
    mint: product.mint,
    decimals: product.decimals,
    tokenProgram: product.tokenProgram,
    executionPreflightSupport: product.executionPreflightSupport,
    effectiveMultiplier: resolveEffectiveMultiplier(product.observedMultiplier),
    capabilities: composedCapabilities,
    scenarios,
    safetyFact: DIVIDEND_CLAIM_SAFETY_FACT
  };
}

// Backward compatibility alias for matcher.js
export function getUnderlying(symbol) {
  return getUnderlyingSecurity(symbol);
}
