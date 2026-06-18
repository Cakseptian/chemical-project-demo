// app/so/components/tabs/InventoryTab.tsx
"use client";

import { useState, useMemo } from "react";
import type { InventoryItem } from "../../types";
import { ExpirationBadge } from "../ExpirationBadge";
import { getExpirationInfo, ExpirationStatus } from "../../utils/expirationUtils";

interface InventoryTabProps {
    filteredInventory: InventoryItem[];
    isLoading: boolean;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    onAdd: () => void;
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: number, name: string) => void;
    onPrintQR: (item: InventoryItem) => void;
    onPrintAllQR: () => void;
    onPrintLocationList: () => void;
}

export const InventoryTab = ({
    filteredInventory,
    isLoading,
    searchQuery,
    setSearchQuery,
    onAdd,
    onEdit,
    onDelete,
    onPrintQR,
    onPrintAllQR,
    onPrintLocationList,
}: InventoryTabProps) => {
    const [selectedFilter, setSelectedFilter] = useState<ExpirationStatus | "all">("all");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);

    // Reset pagination on search query change
    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
    if (searchQuery !== prevSearchQuery) {
        setPrevSearchQuery(searchQuery);
        setCurrentPage(1);
    }

    const handleFilterChange = (filter: ExpirationStatus | "all") => {
        setSelectedFilter(filter);
        setCurrentPage(1);
    };

    // Calculate badge status counts for the current search results
    const counts = useMemo(() => {
        const result: Record<ExpirationStatus, number> = {
            expired: 0,
            critical: 0,
            warning: 0,
            caution: 0,
            safe: 0,
            unknown: 0,
        };
        filteredInventory.forEach(item => {
            const info = getExpirationInfo(item.expired_date_fixed);
            result[info.status]++;
        });
        return result;
    }, [filteredInventory]);

    const filterOptions: {
        status: ExpirationStatus;
        label: string;
        color: {
            bg: string;
            text: string;
            border: string;
            dot: string;
            ring: string;
        };
    }[] = [
            {
                status: "expired",
                label: "Expired",
                color: {
                    bg: "bg-red-50",
                    text: "text-red-700",
                    border: "border-red-200",
                    dot: "bg-red-500",
                    ring: "ring-red-300",
                }
            },
            {
                status: "critical",
                label: "Critical (<7d)",
                color: {
                    bg: "bg-red-50/70",
                    text: "text-red-600",
                    border: "border-red-200",
                    dot: "bg-red-500",
                    ring: "ring-red-100",
                }
            },
            {
                status: "warning",
                label: "Warning (7-30d)",
                color: {
                    bg: "bg-orange-50",
                    text: "text-orange-700",
                    border: "border-orange-200",
                    dot: "bg-orange-500",
                    ring: "ring-orange-300",
                }
            },
            {
                status: "caution",
                label: "Caution (30-90d)",
                color: {
                    bg: "bg-amber-50",
                    text: "text-amber-700",
                    border: "border-amber-200",
                    dot: "bg-amber-500",
                    ring: "ring-amber-300",
                }
            },
            {
                status: "safe",
                label: "Safe (>90d)",
                color: {
                    bg: "bg-emerald-50",
                    text: "text-emerald-700",
                    border: "border-emerald-200",
                    dot: "bg-emerald-500",
                    ring: "ring-emerald-300",
                }
            },
            {
                status: "unknown",
                label: "No Expiry",
                color: {
                    bg: "bg-slate-50",
                    text: "text-slate-505 text-slate-500", // Fix a minor copy/paste typo from earlier tool rendering
                    border: "border-slate-200",
                    dot: "bg-slate-400",
                    ring: "ring-slate-300",
                }
            },
        ];

    // Clean up text-slate-505 typo
    filterOptions[5].color.text = "text-slate-500";

    const filteredByExpiration = useMemo(() => {
        if (selectedFilter === "all") return filteredInventory;
        return filteredInventory.filter(item => {
            const info = getExpirationInfo(item.expired_date_fixed);
            return info.status === selectedFilter;
        });
    }, [filteredInventory, selectedFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredByExpiration.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;

    const paginatedInventory = useMemo(() => {
        return filteredByExpiration.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredByExpiration, startIndex, itemsPerPage]);

    return (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm animate-in fade-in duration-500">
            {/* HEADER SECTION */}
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                <div>
                    <h2 className="text-base font-semibold text-slate-900 tracking-tight">Database Barang</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manajemen data master dan pencetakan QR.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                        onClick={onPrintLocationList}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold py-2 px-4 rounded-md transition-colors shadow-sm"
                    >
                        Cetak Label Lokasi
                    </button>
                    <button
                        onClick={onPrintAllQR}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold py-2 px-4 rounded-md transition-colors shadow-sm"
                    >
                        Cetak Semua QR
                    </button>
                    <button
                        onClick={onAdd}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-[#001e2b] text-xs font-semibold py-2 px-4 rounded-md transition-colors shadow-sm"
                    >
                        Tambah Barang
                    </button>
                </div>
            </div>

            {/* SEARCH & FILTER SECTION */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-4">
                <div className="relative group max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Cari Nama atau PN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium shadow-sm"
                    />
                </div>

                {/* Expiration Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Filter Kadaluarsa:</span>
                    <button
                        onClick={() => handleFilterChange("all")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all duration-200 ${selectedFilter === "all"
                            ? "bg-slate-800 border-slate-800 text-white shadow-sm scale-[1.02]"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                    >
                        <span>Semua</span>
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${selectedFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                            }`}>{filteredInventory.length}</span>
                    </button>
                    {filterOptions.map(opt => {
                        const count = counts[opt.status];
                        const isSelected = selectedFilter === opt.status;
                        return (
                            <button
                                key={opt.status}
                                onClick={() => handleFilterChange(opt.status)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all duration-200 ${isSelected
                                    ? `${opt.color.bg} ${opt.color.text} ${opt.color.border} shadow-sm scale-[1.02] ring-2 ${opt.color.ring}/20`
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${opt.color.dot}`} />
                                <span>{opt.label}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${isSelected ? "bg-white/40" : "bg-slate-100 text-slate-500"
                                    }`}>{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500 text-xs font-medium">Memuat database...</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Item Info</th>
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Part Number</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Batch Number</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Expired Date</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Location</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Stock</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Expiration</th>
                                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedInventory.map((item: InventoryItem) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-semibold text-slate-900 leading-normal break-words">{item.part_name}</p>
                                        <p className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-[150px]">{item.barcode_id}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 leading-normal">{item.part_number || "—"}</td>
                                    <td className="px-4 py-4 text-center text-sm text-slate-600">{item.batch_number || "—"}</td>
                                    <td className="px-4 py-4 text-center text-sm text-slate-600">
                                        {item.expired_date_fixed ? new Date(item.expired_date_fixed).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-200">
                                            {item.location || "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-0.5 rounded text-sm font-semibold tabular-nums border ${Number(item.quantity) <= 5
                                            ? "bg-red-50 text-red-700 border-red-100"
                                            : "bg-slate-50 text-slate-700 border-slate-200"
                                            }`}>{item.quantity}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <ExpirationBadge
                                            expirationDate={item.expired_date_fixed}
                                            showDate={true}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end items-center gap-2">
                                            <button onClick={() => onPrintQR(item)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors" title="Print QR">🖨️</button>
                                            <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors" title="Edit">✏️</button>
                                            <button onClick={() => onDelete(item.id, item.part_name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors" title="Hapus">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredByExpiration.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="text-4xl mb-4 opacity-20">📦</div>
                                        <p className="text-slate-400 font-bold">No item found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* PAGINATION FOOTER */}
            {!isLoading && filteredByExpiration.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                        <span>Tampilkan</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-slate-700 font-semibold"
                        >
                            {[10, 25, 50, 100].map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                        <span>data per halaman</span>
                    </div>

                    <div className="text-slate-600">
                        Menampilkan <span className="font-semibold text-slate-900">{startIndex + 1}</span> sampai{" "}
                        <span className="font-semibold text-slate-900">
                            {Math.min(startIndex + itemsPerPage, filteredByExpiration.length)}
                        </span>{" "}
                        dari <span className="font-semibold text-slate-900">{filteredByExpiration.length}</span> barang
                    </div>

                    <div className="flex items-center gap-1.5">
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
                        {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                            const showPage =
                                totalPages <= 5 ||
                                pageNum === 1 ||
                                pageNum === totalPages ||
                                Math.abs(pageNum - activePage) <= 1;

                            if (showPage) {
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`px-3 py-1.5 border rounded-lg font-semibold transition-all ${activePage === pageNum
                                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            }

                            const showEllipsis =
                                (pageNum === 2 && activePage > 3) ||
                                (pageNum === totalPages - 1 && activePage < totalPages - 2);

                            if (showEllipsis) {
                                return <span key={pageNum} className="px-1.5 py-1 text-slate-400">...</span>;
                            }

                            return null;
                        })}
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
        </div>
    );
};