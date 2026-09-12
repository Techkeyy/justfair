// JustFair Pure Financial Economics Calculation Engine
// Shared mathematical implementation across preflight verification and live preview.

/**
 * Calculate trade economics from raw inputs and references
 * @param {Object} params
 * @param {number} params.inputAmount - Payment amount (e.g. 4 for 4 SOL, 500 for 500 USDC)
 * @param {string} params.inputAsset - "USDC" or "SOL"
 * @param {number} params.inputAssetPriceUsd - Authoritative price of input asset in USD (1.0 for USDC)
 * @param {string|number} params.rawOutAmount - Raw token output integer string from DEX route
 * @param {number} params.stockDecimals - Decimals of tokenized stock (typically 8)
 * @param {number} params.multiplier - Current effective on-chain multiplier
 * @param {number} params.underlyingBenchmarkPrice - Reference equity benchmark price in USD
 * @returns {Object} Calculated economics object
 */
export function calculateTradeEconomics({
  inputAmount,
  inputAsset = "USDC",
  inputAssetPriceUsd = 1.0,
  rawOutAmount,
  stockDecimals = 8,
  multiplier = 1.0,
  underlyingBenchmarkPrice
}) {
  const numInputAmount = Number(inputAmount) || 0;
  const numInputPrice = Number(inputAssetPriceUsd) || (inputAsset === "USDC" ? 1.0 : 0);
  const inputUsdValue = parseFloat((numInputAmount * numInputPrice).toFixed(2));

  const rawOut = BigInt(String(rawOutAmount || "0"));
  const scaleFactor = Math.pow(10, stockDecimals);
  const rawTokenUnits = Number(rawOut) / scaleFactor;

  // Expected stock exposure = rawTokenUnits * currentMultiplier
  const expectedStockShares = parseFloat((rawTokenUnits * multiplier).toFixed(6));

  let expectedStockExposureUsd = null;
  let effectivePricePerShare = null;
  let differenceUsd = null;
  let differencePct = null;

  if (underlyingBenchmarkPrice !== null && underlyingBenchmarkPrice !== undefined && Number(underlyingBenchmarkPrice) > 0) {
    const benchPrice = Number(underlyingBenchmarkPrice);
    expectedStockExposureUsd = parseFloat((expectedStockShares * benchPrice).toFixed(2));
    
    if (expectedStockShares > 0) {
      effectivePricePerShare = parseFloat((inputUsdValue / expectedStockShares).toFixed(2));
    }
    
    differenceUsd = parseFloat((expectedStockExposureUsd - inputUsdValue).toFixed(2));
    differencePct = inputUsdValue > 0 ? parseFloat(((differenceUsd / inputUsdValue) * 100).toFixed(2)) : 0.0;
  }

  return {
    input_usd_value: inputUsdValue,
    raw_token_units: rawTokenUnits,
    expected_stock_shares: expectedStockShares,
    underlying_benchmark_price: underlyingBenchmarkPrice !== undefined && underlyingBenchmarkPrice !== null ? Number(underlyingBenchmarkPrice) : null,
    expected_stock_exposure_usd: expectedStockExposureUsd,
    effective_price_per_share: effectivePricePerShare,
    difference_usd: differenceUsd,
    difference_pct: differencePct
  };
}

