/**
 * SBA (Syntetos-Boylan Approximation) Calculator
 * 
 * Formula: Ŷ = (1 − α/2) × (ẑ / p̂)
 * Reference: Syntetos, A.A. & Boylan, J.E. (2005). 
 * "The accuracy of intermittent demand estimates". 
 * International Journal of Forecasting, 21(2), 303-314.
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

  // Koreksi trailing zeros: kalau ada periode kosong setelah demand terakhir,
  // update p̂ sekali lagi pakai periodsSinceLastDemand sebagai interval observasi
  // terbaru — konsisten dengan cara p diupdate di dalam loop saat ada demand positif.
  if (initialized && periodsSinceLastDemand > 0) {
    p = alpha * periodsSinceLastDemand + (1 - alpha) * p;
  }

  if (!initialized) {
    return {
      forecast: 0, croston: 0, z: 0, p: 0,
      alpha, dataPoints: weeklyDemands.length, positivePeriods: 0
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
    positivePeriods
  };
};

export const calculateSafetyStock = (
  forecastLoan: number,
  multiplier: number = 1.5
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