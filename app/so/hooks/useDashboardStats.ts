"use client";
import { useMemo } from "react";
import type { InventoryItem, TransactionLog, ItemRequest, DashboardStats } from "../types";

export const useDashboardStats = (
  inventoryList: InventoryItem[],
  historyList: TransactionLog[],
  requestList: ItemRequest[]
): DashboardStats => {
  return useMemo(() => {
    const lowStockCount = inventoryList.filter(item => Number(item.quantity) <= 5).length;
    const pendingReqCount = requestList.filter(req => req.status === "PENDING").length;
    const actualBorrowings = historyList.filter(log => log.nama_peminjam !== "ADMIN (SO)" && log.jumlah > 0);

    const itemFreq: Record<string, number> = {};
    actualBorrowings.forEach(log => {
      itemFreq[log.part_name] = (itemFreq[log.part_name] || 0) + log.jumlah;
    });
    const topItems = Object.entries(itemFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxItemCount = topItems.length > 0 ? topItems[0][1] : 1;

    const userFreq: Record<string, number> = {};
    actualBorrowings.forEach(log => {
      const userKey = log.nomor_pegawai ? `${log.nama_peminjam} (${log.nomor_pegawai})` : log.nama_peminjam;
      userFreq[userKey] = (userFreq[userKey] || 0) + 1;
    });
    const topUsers = Object.entries(userFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxUserCount = topUsers.length > 0 ? topUsers[0][1] : 1;

    return {
      lowStockCount,
      pendingReqCount,
      topItems,
      maxItemCount,
      topUsers,
      maxUserCount,
      totalBorrowings: actualBorrowings.length,
    };
  }, [inventoryList, historyList, requestList]);
};