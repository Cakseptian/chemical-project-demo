/**
 * SBA (Syntetos-Boylan Approximation) Calculator
 * 
 * Formula: Ŷ = (1 − α/2) × (ẑ / p̂)
 * Reference: Syntetos, A.A. & Boylan, J.E. (2005). 
 * "The accuracy of intermittent demand estimates". 
 * International Journal of Forecasting, 21(2), 303-314.
 */

// =============================================
// SBA Global Constants — single source of truth
// =============================================

/** Smoothing parameter α. Syntetos & Boylan (2005) recommend 0.05–0.20;
 *  0.15 is the practical midpoint for MRO/aerospace intermittent demand. */
export const SBA_ALPHA = 0.15;

/** Rolling window size in weeks used for demand history analysis. */
export const SBA_WEEKS_TO_ANALYZE = 21;

/** Multiplier for safety stock: safetyStock = forecast × SBA_SAFETY_STOCK_MULTIPLIER */
export const SBA_SAFETY_STOCK_MULTIPLIER = 1.5;

export interface SBAResult {
  forecast: number;                        // SBA forecast (dengan bias correction)
  croston: number;                         // Croston forecast (tanpa bias correction)
  z: number;                               // Smoothed demand size (ẑ)
  p: number;                               // Smoothed interval (p̂)
  alpha: number;                           // Smoothing parameter yang dipakai
  dataPoints: number;                      // Jumlah periode data
  positivePeriods: number;                 // Jumlah periode dengan demand > 0
  trailingZeroCorrectionApplied: boolean;  // indicates if non-standard correction was applied
}

/**
 * Hitung SBA Forecast dari data historis mingguan
 */
export const calculateSBA = (
  weeklyDemands: number[],
  alpha: number = SBA_ALPHA,
  applyTrailingZeroCorrection: boolean = true  // non-standard extension, not in Syntetos & Boylan (2005)
): SBAResult => {
  // Edge cases
  if (!weeklyDemands || weeklyDemands.length === 0) {
    return { forecast: 0, croston: 0, z: 0, p: 1, alpha, dataPoints: 0, positivePeriods: 0, trailingZeroCorrectionApplied: false };
  }

  // Validate alpha
  if (alpha <= 0 || alpha >= 1) {
    throw new RangeError(`[SBA] alpha must be between 0 and 1 (exclusive). Received: ${alpha}`);
  }
  if (alpha < 0.05 || alpha > 0.30) {
    console.warn(
      `[SBA] alpha=${alpha} is outside the practical range [0.05, 0.30]. ` +
      `Syntetos & Boylan (2005) recommend 0.05–0.20 for intermittent demand.`
    );
  }

  let z = 0;                          // Smoothed demand size (ẑ)
  let p = 0;                          // Smoothed interval (p̂)
  let periodsSinceLastDemand = 0;     // Counter untuk interval
  let positivePeriods = 0;
  let initialized = false;

  for (let i = 0; i < weeklyDemands.length; i++) {
    const demand = weeklyDemands[i];
    periodsSinceLastDemand++;

    if (demand > 0) {
      positivePeriods++;

      if (!initialized) {
        z = demand;
        p = periodsSinceLastDemand;
        initialized = true;
      } else {
        z = alpha * demand + (1 - alpha) * z;
        p = alpha * periodsSinceLastDemand + (1 - alpha) * p;
      }

      periodsSinceLastDemand = 0;
    }
  }

  // Trailing zeros correction: not described in the paper (paper rule: estimates unchanged when
  // no demand occurs). Enabled by default for MRO/aerospace context where a long tail of zeros
  // after the last issue is a meaningful signal. Set applyTrailingZeroCorrection = false for
  // strict paper-compliant behaviour.
  if (applyTrailingZeroCorrection && initialized && periodsSinceLastDemand > 0) {
    p = alpha * periodsSinceLastDemand + (1 - alpha) * p;
  }

  if (!initialized) {
    return {
      forecast: 0, croston: 0, z: 0, p: 0,
      alpha, dataPoints: weeklyDemands.length, positivePeriods: 0,
      trailingZeroCorrectionApplied: false
    };
  }

  if (p === 0) p = 1;

  const biasCorrection = 1 - (alpha / 2);
  const croston = z / p;
  const forecast = biasCorrection * croston;

  return {
    forecast: Number(forecast.toFixed(3)),
    croston: Number(croston.toFixed(3)),
    z: Number(z.toFixed(3)),
    p: Number(p.toFixed(3)),
    alpha,
    dataPoints: weeklyDemands.length,
    positivePeriods,
    trailingZeroCorrectionApplied: applyTrailingZeroCorrection
  };
};

export const calculateSafetyStock = (
  forecastLoan: number,
  multiplier: number = SBA_SAFETY_STOCK_MULTIPLIER
): number => {
  return Math.ceil(forecastLoan * multiplier);
};

export const calculateROP = (
  forecastCons: number,
  leadTime: number,
  safetyStock: number
): number => {
  return Number(((forecastCons * leadTime) + safetyStock).toFixed(2));
};