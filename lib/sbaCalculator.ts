/**
 * SBA (Syntetos-Boylan Approximation) Calculator
 * 
 * Formula: Ŷ = (1 − α/2) × (ẑ / p̂)
 * Reference: Syntetos, A.A. & Boylan, J.E. (2005). 
 * "The accuracy of intermittent demand estimates". 
 * International Journal of Forecasting, 21(2), 303-314.
 * 
 * Align dengan: SBA_Forecast_Chemical_MRO_v2.xlsx
 */

export interface SBAResult {
  forecast: number;        // SBA forecast (dengan bias correction)
  croston: number;         // Croston forecast (tanpa bias correction)
  z: number;               // Smoothed demand size (ẑ)
  p: number;               // Smoothed interval (p̂)
  alpha: number;           // Smoothing parameter yang dipakai
  dataPoints: number;      // Jumlah periode data
  positivePeriods: number; // Jumlah periode dengan demand > 0
}

/**
 * Hitung SBA Forecast dari data historis mingguan
 */
export const calculateSBA = (
  weeklyDemands: number[],
  alpha: number = 0.30
): SBAResult => {
  // Edge cases
  if (!weeklyDemands || weeklyDemands.length === 0) {
    return { forecast: 0, croston: 0, z: 0, p: 1, alpha, dataPoints: 0, positivePeriods: 0 };
  }

  let z = 0;                          // Smoothed demand size (ẑ)
  let p = 0;                          // Smoothed interval (p̂)
  let periodsSinceLastDemand = 0;     // Counter untuk interval
  let positivePeriods = 0;
  let initialized = false;            // 🆕 Flag untuk track apakah sudah ketemu demand pertama

  // 🔧 FIX: Loop dari index 0, bukan dari firstPositiveIdx
  for (let i = 0; i < weeklyDemands.length; i++) {
    const demand = weeklyDemands[i];
    periodsSinceLastDemand++;

    if (demand > 0) {
      positivePeriods++;

      if (!initialized) {
        // 🆕 Initial values: pakai interval aktual dari awal data
        // Ini yang bikin Excel return p=15 untuk cons (15 minggu tanpa demand)
        z = demand;
        p = periodsSinceLastDemand;
        initialized = true;
      } else {
        // Exponential smoothing (setelah demand pertama)
        z = alpha * demand + (1 - alpha) * z;
        p = alpha * periodsSinceLastDemand + (1 - alpha) * p;
      }

      // Reset counter
      periodsSinceLastDemand = 0;
    }
    // Kalau demand = 0, z dan p TIDAK diupdate (sesuai paper SBA)
  }

  // Kalau belum ada demand positif sama sekali
  if (!initialized) {
    return {
      forecast: 0, croston: 0, z: 0, p: 0,
      alpha, dataPoints: weeklyDemands.length, positivePeriods: 0
    };
  }

  // Prevent division by zero
  if (p === 0) p = 1;

  // SBA formula dengan bias correction
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
    positivePeriods
  };
};

/**
 * Hitung Safety Stock (align dengan Excel: ROUNDUP(Forecast_Loan × 1.5, 0))
 */
export const calculateSafetyStock = (
  forecastLoan: number,
  multiplier: number = 1.5
): number => {
  return Math.ceil(forecastLoan * multiplier);
};

/**
 * Hitung Reorder Point
 * ROP = (Forecast_Cons × LeadTime) + SafetyStock
 */
export const calculateROP = (
  forecastCons: number,
  leadTime: number,
  safetyStock: number
): number => {
  return Number(((forecastCons * leadTime) + safetyStock).toFixed(2));
};