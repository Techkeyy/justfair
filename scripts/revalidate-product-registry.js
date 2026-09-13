// JustFair — Reproducible Product Registry Revalidation Script
// Phase 12 Evidence Integrity Recovery (Order 011.3)
// Strictly separates Expected Registry Configuration from Independently Observed On-Chain State

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { UNDERLYING_SECURITY_CATALOG, getAllProducts } from "../src/product/registry.js";
import { verifyProductOnchain } from "../src/product/verifier.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(__dirname, "../scratch/product_registry_revalidation.json");

export async function revalidateAllProducts(options = {}) {
  const rpcUrl = options.rpcUrl || process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  console.log(`[JustFair] Starting product registry revalidation against RPC: ${rpcUrl}`);

  const allProducts = getAllProducts();
  const results = [];

  let metadataObservableCount = 0;
  let metadataMatchCount = 0;
  let metadataUnavailableCount = 0;
  let metadataMismatchCount = 0;

  for (const prod of allProducts) {
    process.stdout.write(`Checking ${prod.productId} (${prod.mint})... `);
    
    let verification = null;
    try {
      verification = await verifyProductOnchain(prod.productId, { rpcUrl });
    } catch (err) {
      verification = {
        productId: prod.productId,
        verificationStatus: "UNABLE_TO_VERIFY",
        reasonCodes: ["RPC_ERROR"],
        expected: {
          metadataSymbol: prod.metadataSymbol,
          metadataName: prod.metadataName
        },
        observed: null
      };
    }

    const obs = verification.observed;
    const accountExists = Boolean(obs && obs.owner);
    const hasObservedMetadata = Boolean(obs && (obs.metadataSymbol || obs.metadataName));

    if (hasObservedMetadata) {
      metadataObservableCount++;
      const symbolMatches = obs.metadataSymbol?.toUpperCase() === prod.metadataSymbol?.toUpperCase();
      if (symbolMatches && !verification.reasonCodes?.includes("METADATA_NAME_MISMATCH")) {
        metadataMatchCount++;
      } else {
        metadataMismatchCount++;
      }
    } else {
      metadataUnavailableCount++;
    }

    const entry = {
      underlying: prod.underlyingSymbol,
      product_id: prod.productId,
      issuer: prod.issuerProfile.issuerName,
      official_symbol: prod.representationTicker,
      official_mint: prod.mint,
      official_source: prod.provenance?.officialMappingSource ?? null,
      expected_metadata_symbol: prod.metadataSymbol,
      expected_metadata_name: prod.metadataName,
      observed_account_exists: accountExists,
      observed_owner: obs?.owner ?? null,
      observed_decimals: obs?.decimals ?? null,
      observed_metadata_symbol: obs?.metadataSymbol ?? null,
      observed_metadata_name: obs?.metadataName ?? null,
      observed_metadata_uri: obs?.metadataUri ?? null,
      observed_metadata_pointer: obs?.metadataPointer ?? null,
      observed_extensions: obs?.extensions ?? [],
      observed_multiplier: obs?.effectiveMultiplier?.activeMultiplier ?? obs?.multiplierState?.multiplier ?? null,
      verification_status: verification.verificationStatus,
      reason_codes: verification.reasonCodes || [],
      checked_at: new Date().toISOString()
    };

    results.push(entry);
    console.log(`${verification.verificationStatus} (Symbol: ${obs?.metadataSymbol || "N/A"})`);
  }

  // Ensure scratch dir exists
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), "utf8");

  console.log("\n==================================================");
  console.log("REVALIDATION AUDIT SUMMARY");
  console.log("==================================================");
  console.log(`TOTAL PRODUCTS CHECKED: ${results.length} / 24`);
  console.log(`METADATA OBSERVABLE:    ${metadataObservableCount} / 24`);
  console.log(`METADATA MATCH:         ${metadataMatchCount} / 24`);
  console.log(`METADATA UNAVAILABLE:   ${metadataUnavailableCount} / 24`);
  console.log(`METADATA MISMATCH:      ${metadataMismatchCount} / 24`);
  console.log(`EVIDENCE WRITTEN TO:    ${OUTPUT_PATH}`);
  console.log("==================================================\n");

  return {
    results,
    summary: {
      total: results.length,
      metadataObservable: metadataObservableCount,
      metadataMatch: metadataMatchCount,
      metadataUnavailable: metadataUnavailableCount,
      metadataMismatch: metadataMismatchCount
    }
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  revalidateAllProducts().catch(err => {
    console.error("Revalidation failed:", err);
    process.exit(1);
  });
}
