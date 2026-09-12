// Pure Verdict Determination Engine
export const THRESHOLD_CALIBRATION_STATUS = "CALIBRATION_PROVISIONAL_PENDING_LIVE_REGULAR_TAPE";

/**
 * Pure function to evaluate trade fairness verdict based on economic metrics & verification state
 */
export function determineVerdict({ verificationStatus, differencePct, priceImpactPct = 0 }) {
  if (verificationStatus !== "VERIFIED") {
    return "UNABLE_TO_VERIFY";
  }

  const numDiff = typeof differencePct === "number" ? differencePct : parseFloat(differencePct);

  // Provisional thresholds (to be finalized during Day 2/3 live regular session tape calibration)
  if (numDiff < -3.5) {
    return "BAD_FILL";
  }
  if (numDiff < -1.5) {
    return "CAUTION";
  }
  return "FAIR";
}
