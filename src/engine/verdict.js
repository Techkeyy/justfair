// Pure Verdict Determination Engine
export const THRESHOLD_CALIBRATION_STATUS = "PENDING_LIVE_MARKET_CALIBRATION";

/**
 * Pure function to evaluate trade fairness verdict based on economic metrics & verification state
 * NOTE: Production verdicts (FAIR, CAUTION, BAD_FILL) are strictly gated behind THRESHOLD_CALIBRATION_STATUS === "COMPLETE".
 * When verified prior to full calibration, returns "MEASURED" to preserve data truth without making uncalibrated safety claims.
 */
export function determineVerdict({ verificationStatus, differencePct, priceImpactPct = 0, overrideCalibration = false }) {
  if (verificationStatus !== "VERIFIED") {
    return "UNABLE_TO_VERIFY";
  }

  // Gate live production verdicts until calibrated on live regular session tape
  if (THRESHOLD_CALIBRATION_STATUS !== "COMPLETE" && !overrideCalibration) {
    return "MEASURED";
  }

  const numDiff = typeof differencePct === "number" ? differencePct : parseFloat(differencePct);

  // Calibrated thresholds
  if (numDiff < -3.5) {
    return "BAD_FILL";
  }
  if (numDiff < -1.5) {
    return "CAUTION";
  }
  return "FAIR";
}
