"use client";
import { useMemo } from "react";
import { calculateSBA, calculateSafetyStock, calculateROP } from "@/lib/sbaCalculator";
import type { InventoryItem, TransactionLog, SBAAlert } from "../types";

export const useSBAAlerts = (
  inventoryList: InventoryItem[],
  historyList: TransactionLog[]
): SBAAlert[] => {
  return useMemo(() => {
    const now = new Date();
    const alerts = inventoryList.map(item => {
      const itemLogs = historyList.filter(log => log.inventory_id === item.id);
      const alpha = item.alpha ?? 0.30;
      const leadTime = item.lead_time ?? 2;

      const weeksToAnalyze = 21;
      const weeklyLoan: number[] = Array(weeksToAnalyze).fill(0);
      const weeklyCons: number[] = Array(weeksToAnalyze).fill(0);

      itemLogs.forEach(log => {
        const logDate = new Date(log.created_at);
        const diffTime = Math.abs(now.getTime() - logDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekIndex = weeksToAnalyze - 1 - Math.floor(diffDays / 7);

        if (weekIndex >= 0 && weekIndex < weeksToAnalyze) {
          const qty = Math.abs(log.jumlah);
          if (
            log.transaction_type === "CONSUMED_BULK" ||
            log.transaction_type === "RETURN_HABIS" ||
            log.transaction_type === "LOST"
          ) {
            weeklyCons[weekIndex] += Math.abs(log.jumlah);
          } else if (log.transaction_type === "LOAN") {
            weeklyLoan[weekIndex] += Math.abs(log.jumlah);
          }
        }
      });

      const sbaLoan = calculateSBA(weeklyLoan, alpha);
      const sbaCons = calculateSBA(weeklyCons, alpha);
      const safetyStock = calculateSafetyStock(sbaLoan.forecast, 1.5);
      const rop = calculateROP(sbaCons.forecast, leadTime, safetyStock);
      const currentStock = Number(item.quantity);

      let status = "AMAN";
      let color = "text-green-400 bg-green-500/10 border-green-500/20";
      let action = "Stok mencukupi";

      if (currentStock <= rop) {
        status = "REORDER";
        color = "text-red-400 bg-red-500/10 border-red-500/20";
        action = `Beli ke supplier! (ROP: ${rop})`;
      } else if (currentStock <= safetyStock) {
        status = "REFILL LOKET";
        color = "text-amber-400 bg-amber-500/10 border-amber-500/20";
        action = "Pindah barang ke Rak 1";
      }

      return {
        ...item,
        sbaLoan: sbaLoan.forecast,
        sbaCons: sbaCons.forecast,
        crostonLoan: sbaLoan.croston,
        safetyStock,
        rop,
        status,
        color,
        action,
        alpha,
        leadTime,
        dataPoints: sbaLoan.dataPoints,
        positivePeriods: sbaLoan.positivePeriods
      } as SBAAlert;
    });

    // Sort dengan 4 level priority:
    // 1. REORDER (paling urgent - harus beli sekarang)
    // 2. REFILL LOKET (urgent - pindah ke rak depan)
    // 3. AMAN dengan data forecast (punya history transaksi)
    // 4. AMAN tanpa data (cold start - belum ada history)
    return alerts.sort((a, b) => {
      const getPriority = (alert: SBAAlert): number => {
        if (alert.status.includes("REORDER")) return 0;
        if (alert.status.includes("REFILL")) return 1;

        // Cek apakah item punya data forecast yang meaningful
        const hasForecastData =
          alert.sbaLoan > 0 ||
          alert.sbaCons > 0 ||
          alert.positivePeriods > 0;

        if (hasForecastData) return 2;  // AMAN dengan data
        return 3;                        // AMAN tanpa data (cold start)
      };

      const priorityDiff = getPriority(a) - getPriority(b);

      // Kalau priority sama, sort alphabetically by part_name
      if (priorityDiff === 0) {
        return a.part_name.localeCompare(b.part_name);
      }

      return priorityDiff;
    });
  }, [inventoryList, historyList]);
};