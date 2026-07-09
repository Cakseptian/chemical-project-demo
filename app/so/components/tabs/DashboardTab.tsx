// app/so/components/tabs/DashboardTab.tsx
"use client";

import { useState, useMemo } from "react";
import { SBA_ALPHA, SBA_WEEKS_TO_ANALYZE } from "@/lib/sbaCalculator";
import type { InventoryItem, DashboardStats, SBAAlert, TransactionLog, ActiveLoanAdmin } from "../../types";

interface DashboardTabProps {
    inventoryList: InventoryItem[];
    dashboardStats: DashboardStats;
    sbaAlerts: SBAAlert[];
    historyList: TransactionLog[];
    activeLoansAdmin: {
        loans: ActiveLoanAdmin[];
        byWorker: Record<string, { nama: string; nomor: string | null; loans: ActiveLoanAdmin[] }>;
        byItem: Record<string, ActiveLoanAdmin[]>;
        isLoading: boolean;
        staleThreshold: number;
        refresh: () => void;
    };
}

export const DashboardTab = ({ inventoryList, dashboardStats, sbaAlerts, historyList, activeLoansAdmin }: DashboardTabProps) => {
    const [sbaSearch, setSbaSearch] = useState("");
    const [sbaFilter, setSbaFilter] = useState<"all" | "critical" | "with-data">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [loansView, setLoansView] = useState<"worker" | "item">("worker");

    const ITEMS_PER_PAGE = 5;

    // Filter sbaAlerts berdasarkan search + filter toggle
    const filteredSbaAlerts = useMemo(() => {
        return sbaAlerts.filter(alert => {
            // Search filter
            const matchSearch =
                alert.part_name?.toLowerCase().includes(sbaSearch.toLowerCase()) ||
                alert.part_number?.toLowerCase().includes(sbaSearch.toLowerCase());

            if (!matchSearch) return false;

            // Category filter
            if (sbaFilter === "critical") {
                return alert.status.includes("REORDER") || alert.status.includes("REFILL");
            }
            if (sbaFilter === "with-data") {
                return alert.positivePeriods > 0;
            }

            return true; // "all"
        });
    }, [sbaAlerts, sbaSearch, sbaFilter]);

    const totalPages = Math.ceil(filteredSbaAlerts.length / ITEMS_PER_PAGE);
    const activePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

    const paginatedSbaAlerts = useMemo(() => {
        const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
        return filteredSbaAlerts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredSbaAlerts, activePage]);

    // Top 5 Recent Activities
    const recentActivities = useMemo(() => {
        return historyList.slice(0, 5);
    }, [historyList]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. STATS ROW (4 clean white cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Items */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-slate-500">Total Items</p>
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                        </svg>
                    </div>
                    <p className="text-3xl font-semibold text-slate-900 tabular-nums tracking-tight">{inventoryList.length}</p>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                            </svg>
                            12%
                        </span>
                        <span className="text-xs text-slate-500">vs last month</span>
                    </div>
                </div>

                {/* Low Stock */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-slate-500">Low Stock Items</p>
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <p className="text-3xl font-semibold text-slate-900 tabular-nums tracking-tight">{dashboardStats.lowStockCount}</p>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                            </svg>
                            {dashboardStats.lowStockCount > 0 ? "Kritis" : "Aman"}
                        </span>
                        <span className="text-xs text-slate-500">need reorder</span>
                    </div>
                </div>

                {/* Pending Requests */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-3xl font-semibold text-slate-900 tabular-nums tracking-tight">{dashboardStats.pendingReqCount}</p>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                            Awaiting review
                        </span>
                    </div>
                </div>

                {/* Total Transactions */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-slate-500">Transactions (30d)</p>
                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.5c0-.621.504-1.125 1.125-1.125h2.25C20.496 3.375 21 3.879 21 4.5v15.375c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.5z" />
                        </svg>
                    </div>
                    <p className="text-3xl font-semibold text-slate-900 tabular-nums tracking-tight">{dashboardStats.totalBorrowings}</p>
                    <div className="flex items-center gap-1 mt-2">
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                            </svg>
                            8%
                        </span>
                        <span className="text-xs text-slate-500">vs last month</span>
                    </div>
                </div>
            </div>

            {/* 2. SBA FORECAST TABLE (Centerpiece full-width card) */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">

                {/* Table Header Controls */}
                <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-base font-semibold text-slate-900 tracking-tight">SBA Smart Forecast</h2>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-semibold rounded-full border border-purple-100">
                                <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                                Syntetos-Boylan
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {SBA_WEEKS_TO_ANALYZE}-week rolling forecast with bias correction (α = {SBA_ALPHA})
                        </p>
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[240px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="Cari barang atau part number..."
                                value={sbaSearch}
                                onChange={(e) => { setSbaSearch(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
                            />
                        </div>

                        {/* Segmented Filter Toggle */}
                        <div className="flex gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
                            <button
                                type="button"
                                onClick={() => { setSbaFilter("all"); setCurrentPage(1); }}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${sbaFilter === "all"
                                    ? "bg-navy-800 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-900"
                                    }`}
                            >
                                Semua ({sbaAlerts.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSbaFilter("critical"); setCurrentPage(1); }}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${sbaFilter === "critical"
                                    ? "bg-red-600 text-white shadow-sm"
                                    : "text-slate-500 hover:text-red-600"
                                    }`}
                            >
                                Kritis
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSbaFilter("with-data"); setCurrentPage(1); }}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${sbaFilter === "with-data"
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-slate-500 hover:text-blue-600"
                                    }`}
                            >
                                Dengan Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                    Item
                                </th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                    Stock
                                </th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                    <div>Loan Fcst</div>
                                    <div className="text-[9px] font-normal normal-case tracking-normal text-slate-400 mt-0.5">per minggu</div>
                                </th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                    <div>Cons Fcst</div>
                                    <div className="text-[9px] font-normal normal-case tracking-normal text-slate-400 mt-0.5">per minggu</div>
                                </th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                    Safety
                                </th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                    ROP
                                </th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                    Params
                                </th>
                                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedSbaAlerts.map((alert) => (
                                <tr key={alert.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded flex items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-mono font-semibold text-slate-600">
                                                    {alert.part_name?.substring(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{alert.part_name}</p>

                                                    {/* COLD START INDICATOR */}
                                                    {alert.positivePeriods === 0 && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-semibold rounded">
                                                            Cold
                                                        </span>
                                                    )}

                                                    {/* LOW CONFIDENCE INDICATOR */}
                                                    {alert.positivePeriods > 0 && alert.positivePeriods < 4 && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-semibold rounded border border-amber-100">
                                                            Low Data
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                    {alert.positivePeriods}/{alert.dataPoints}w active
                                                    {alert.part_number ? ` · ${alert.part_number}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 text-sm font-semibold tabular-nums rounded border ${Number(alert.quantity) <= 5
                                            ? "bg-red-50 text-red-700 border-red-100"
                                            : "bg-slate-50 text-slate-700 border-slate-200"
                                            }`}>{alert.quantity}</span>
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm text-slate-700 font-mono tabular-nums">
                                        {alert.sbaLoan}
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm text-slate-700 font-mono tabular-nums">
                                        {alert.sbaCons}
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm text-slate-700 font-mono tabular-nums">
                                        {alert.safetyStock}
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm text-slate-700 font-mono tabular-nums">
                                        {alert.rop}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="text-xs font-mono text-slate-500">
                                            {alert.alpha} / {alert.leadTime}w
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border ${alert.status.includes("REORDER")
                                            ? "bg-red-50 text-red-700 border-red-100"
                                            : alert.status.includes("REFILL")
                                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            }`}>
                                            <span className={`w-1 h-1 rounded-full ${alert.status.includes("REORDER")
                                                ? "bg-red-500"
                                                : alert.status.includes("REFILL")
                                                    ? "bg-amber-500"
                                                    : "bg-emerald-500"
                                                }`}></span>
                                            {alert.status.replace("_", " ")}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredSbaAlerts.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center">
                                        <div className="text-4xl mb-4 opacity-20">🔍</div>
                                        <p className="text-slate-500 font-bold">
                                            Tidak ada item yang cocok dengan filter.
                                        </p>
                                        {(sbaSearch || sbaFilter !== "all") && (
                                            <button
                                                type="button"
                                                onClick={() => { setSbaSearch(""); setSbaFilter("all"); setCurrentPage(1); }}
                                                className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                                            >
                                                Reset Filter
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white animate-in fade-in duration-300">
                        <p className="text-xs text-slate-500 font-medium">
                            Menampilkan <span className="font-semibold text-slate-900">{Math.min(filteredSbaAlerts.length, (activePage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(filteredSbaAlerts.length, activePage * ITEMS_PER_PAGE)}</span> dari <span className="font-semibold text-slate-900">{filteredSbaAlerts.length}</span> barang
                        </p>

                        <div className="flex items-center gap-1.5">
                            {/* Prev Button */}
                            <button
                                type="button"
                                disabled={activePage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                                title="Halaman Sebelumnya"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>

                            {/* Page Numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all ${activePage === pageNum
                                        ? "bg-navy-800 text-white shadow-sm"
                                        : "border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            {/* Next Button */}
                            <button
                                type="button"
                                disabled={activePage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                                title="Halaman Berikutnya"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Table Footer / Legend Info */}
                <div className="px-6 py-4 border-t border-slate-200 flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        <span>Loan = dipinjam & dikembalikan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        <span>Cons = habis dipakai (consumed)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span>Safety = buffer stok pengaman</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        <span>ROP = Reorder Point</span>
                    </div>
                </div>
            </div>

            {/* 3. ACTIVE LOANS BOARD */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Active Loans</h2>
                            {activeLoansAdmin.loans.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-full border border-amber-100">
                                    <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
                                    {activeLoansAdmin.loans.length} outstanding
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">Items currently in the field — not yet returned</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View toggle */}
                        <div className="flex gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setLoansView("worker")}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${loansView === "worker" ? "bg-[#001e2b] text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                            >
                                By Worker
                            </button>
                            <button
                                type="button"
                                onClick={() => setLoansView("item")}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${loansView === "item" ? "bg-[#001e2b] text-white shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                            >
                                By Item
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={activeLoansAdmin.refresh}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                            title="Refresh"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {activeLoansAdmin.isLoading ? (
                        <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                            <div className="animate-spin w-4 h-4 border-2 border-slate-200 border-t-slate-400 rounded-full" />
                            <span className="text-xs font-semibold">Memuat active loans...</span>
                        </div>
                    ) : activeLoansAdmin.loans.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <p className="text-slate-500 font-semibold text-sm">Tidak ada pinjaman aktif.</p>
                            <p className="text-xs text-slate-400 mt-1">Semua barang sudah kembali.</p>
                        </div>
                    ) : loansView === "worker" ? (
                        Object.entries(activeLoansAdmin.byWorker).map(([key, group]) => (
                            <div key={key} className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-[#001e2b] rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-[9px] font-bold text-[#00ed64]">{group.nama.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900">{group.nama}</span>
                                    {group.nomor && <span className="text-xs font-mono text-slate-400">({group.nomor})</span>}
                                    <span className="ml-auto text-[10px] font-semibold text-slate-400 tabular-nums">{group.loans.length} item</span>
                                </div>
                                <div className="space-y-1 pl-8">
                                    {group.loans.map((loan) => (
                                        <div key={loan.transaction_id} className="flex items-center gap-2 text-xs text-slate-600">
                                            <span className="flex-1 truncate font-medium">{loan.part_name}</span>
                                            {loan.unit_id && (
                                                <span className="font-mono text-slate-400 shrink-0">#{loan.unit_id.slice(0, 4).toUpperCase()}</span>
                                            )}
                                            <span className={`shrink-0 font-semibold tabular-nums ${loan.days_out >= activeLoansAdmin.staleThreshold ? "text-amber-600" : "text-slate-400"}`}>
                                                {loan.days_out}d ago {loan.days_out >= activeLoansAdmin.staleThreshold ? "⚠️" : ""}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        Object.entries(activeLoansAdmin.byItem).map(([partName, loans]) => (
                            <div key={partName} className="px-6 py-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-6 h-6 bg-slate-100 border border-slate-200 rounded flex items-center justify-center flex-shrink-0">
                                        <span className="text-[9px] font-mono font-semibold text-slate-600">{partName.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900 flex-1 truncate">{partName}</span>
                                    <span className="text-[10px] font-semibold text-slate-400 tabular-nums shrink-0">{loans.length} in field</span>
                                </div>
                                <div className="space-y-1 pl-8">
                                    {loans.map((loan) => (
                                        <div key={loan.transaction_id} className="flex items-center gap-2 text-xs text-slate-600">
                                            <span className="flex-1 truncate">{loan.nama_peminjam}{loan.nomor_pegawai ? ` (${loan.nomor_pegawai})` : ""}</span>
                                            {loan.unit_id && (
                                                <span className="font-mono text-slate-400 shrink-0">#{loan.unit_id.slice(0, 4).toUpperCase()}</span>
                                            )}
                                            <span className={`shrink-0 font-semibold tabular-nums ${loan.days_out >= activeLoansAdmin.staleThreshold ? "text-amber-600" : "text-slate-400"}`}>
                                                {loan.days_out}d ago {loan.days_out >= activeLoansAdmin.staleThreshold ? "⚠️" : ""}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 4. BOTTOM GRID: Most Borrowed + Recent Activity (Two equal side cards) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Most Borrowed Items (3 Columns span) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-200">
                        <h2 className="text-base font-semibold text-slate-900 tracking-tight">Most Borrowed Items</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Top 5 items in the last 30 days</p>
                    </div>
                    <div className="p-6 space-y-5">
                        {dashboardStats.topItems.map(([name, count], index) => {
                            const percentage = dashboardStats.maxItemCount > 0 ? (count / dashboardStats.maxItemCount) * 100 : 0;
                            return (
                                <div key={name} className="group space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center text-[10px] font-mono text-slate-600 font-semibold flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <span className="truncate text-slate-700 font-bold group-hover:text-slate-900 transition-colors">
                                                {name}
                                            </span>
                                        </div>
                                        <span className="font-mono tabular-nums text-slate-600 font-black">{count} units</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-900 rounded-full transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {dashboardStats.topItems.length === 0 && (
                            <p className="text-center py-10 text-slate-400 font-bold text-sm">Belum ada data pengambilan.</p>
                        )}
                    </div>
                </div>

                {/* Recent Activity (2 Columns span) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                        <div>
                            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Recent Activity</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Last 5 transactions</p>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
                        {recentActivities.map((tx) => {
                            const isLoan = tx.transaction_type === "LOAN";
                            const isReturn = tx.transaction_type === "RETURN";
                            const isConsumed = tx.transaction_type === "CONSUMED_BULK" || tx.transaction_type === "RETURN_HABIS";

                            // Visual properties based on transaction type
                            let iconBg = "bg-slate-50 border border-slate-100 text-slate-600";
                            let iconSvg = (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5" />
                                </svg>
                            );
                            let actionText = "modified";
                            let quantitySign = `${tx.jumlah > 0 ? "+" : ""}${tx.jumlah}`;

                            if (isLoan) {
                                iconBg = "bg-emerald-50 border border-emerald-100 text-emerald-600";
                                iconSvg = (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                );
                                actionText = "borrowed";
                                quantitySign = `+${tx.jumlah}`;
                            } else if (isReturn) {
                                iconBg = "bg-blue-50 border border-blue-100 text-blue-600";
                                iconSvg = (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0H11.25m-11.25 0V8.25" />
                                    </svg>
                                );
                                actionText = "returned";
                                quantitySign = `-${Math.abs(tx.jumlah)}`;
                            } else if (isConsumed) {
                                iconBg = "bg-red-50 border border-red-100 text-red-600";
                                iconSvg = (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                );
                                actionText = "marked as consumed";
                                quantitySign = `-${Math.abs(tx.jumlah)}`;
                            }

                            return (
                                <div key={tx.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}>
                                            {iconSvg}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-slate-900 leading-normal">
                                                <span className="font-medium">{tx.nama_peminjam}</span> {actionText} <span className="font-semibold">{tx.part_name}</span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-slate-500">
                                                <span className="text-xs font-mono font-medium tabular-nums">{quantitySign} units</span>
                                                <span className="text-[10px]">·</span>
                                                <span className="text-xs font-medium">
                                                    {new Date(tx.created_at).toLocaleDateString("id-ID", {
                                                        day: "numeric",
                                                        month: "short",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {recentActivities.length === 0 && (
                            <p className="text-center py-12 text-slate-400 font-bold text-sm">Belum ada riwayat aktivitas.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};