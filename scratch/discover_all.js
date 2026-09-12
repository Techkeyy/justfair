// Candidate Discovery & Verification Script for Order 007.5
import { fetchOnChainTokenMultiplier } from "../src/engine/multiplier.js";
import { fetchMarketReference } from "../src/engine/benchmark.js";
import { executeJupiterSwapQuote } from "../src/engine/jupiter.js";
import { SUPPORTED_PAYMENTS } from "../src/config.js";

async function run() {
  console.log("Fetching xStocks public assets...");
  const res = await fetch("https://api.xstocks.fi/api/v2/public/assets");
  const json = await res.json();
  const nodes = json.nodes || json;
  console.log(`Discovered ${nodes.length} assets from xStocks API.\n`);

  // Let's inspect each asset
  const results = [];

  for (const node of nodes) {
    const symbol = node.symbol;
    const underlying = node.underlyingSymbol || node.underlying?.symbol || symbol.replace(/x$/i, "");
    const name = node.name || node.description;
    const mint = node.mintAddress || node.tokenAddress || node.contracts?.find(c => c.blockchain === "solana")?.address || node.contractAddress || null;
    
    // Check if we can find the Solana mint
    console.log(`Checking ${symbol} (${name}, underlying: ${underlying})...`);
    console.log(`  Raw contracts/data:`, JSON.stringify({ contracts: node.contracts, mintAddress: node.mintAddress, tokenAddress: node.tokenAddress }));

    results.push({
      symbol,
      name,
      underlying,
      node
    });
  }
}

run().catch(console.error);

