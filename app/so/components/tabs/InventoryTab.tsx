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
    onPrintAllQR: (items: InventoryItem[]) => void;
    onPrintLocationList: () => void;
}

// SVG Icons — konsisten, skalabel, tanpa emoji
const IconSearch = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
);
const IconPlus = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);
const IconPrint = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12v8H6z" />
    </svg>
);
const IconList = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
);
const IconLink = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 0 0 5.656 0l4-4a4 4 0 1 0-5.656-5.656l-1.1 1.1" />
    </svg>
);
const IconEdit = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const IconTrash = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
);
const IconQR = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 14h2v2h-2zM18 14h3M14 18h1M17 18h4M17 21h3M14 21h1" />
    </svg>
);
const IconChevronLeft = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);
const IconChevronRight = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);
const IconBox = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
);

// Tipe filter dengan konfigurasi warna tersentralisasi
type FilterConfig = {
    status: ExpirationStatus;
    label: string;
    activeClass: string;
    dotClass: string;
    countClass: string;
};

const FILTER_CONFIGS: FilterConfig[] = [
    { status: "expired",  label: "Expired",          activeClass: "bg-red-600 text-white border-red-600",           dotClass: "bg-red-300",     countClass: "bg-red-500/30 text-red-100" },
    { status: "critical", label: "Critical",          activeClass: "bg-red-500 text-white border-red-500",           dotClass: "bg-red-200",     countClass: "bg-red-400/30 text-red-100" },
    { status: "warning",  label: "Warning",           activeClass: "bg-orange-500 text-white border-orange-500",     dotClass: "bg-orange-200",  countClass: "bg-orange-400/30 text-orange-100" },
    { status: "caution",  label: "Caution",           activeClass: "bg-amber-500 text-white border-amber-500",       dotClass: "bg-amber-200",   countClass: "bg-amber-400/30 text-amber-100" },
    { status: "safe",     label: "Safe",              activeClass: "bg-emerald-600 text-white border-emerald-600",   dotClass: "bg-emerald-200", countClass: "bg-emerald-500/30 text-emerald-100" },
    { status: "unknown",  label: "No Expiry",         activeClass: "bg-slate-600 text-white border-slate-600",       dotClass: "bg-slate-300",   countClass: "bg-slate-500/30 text-slate-100" },
];

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
    const [typeFilter, setTypeFilter] = useState<"all" | "unit" | "bulk">("all");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);

    // Reset halaman saat search berubah
    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
    if (searchQuery !== prevSearchQuery) {
        setPrevSearchQuery(searchQuery);
        setCurrentPage(1);
    }

    const handleFilterChange = (filter: ExpirationStatus | "all") => {
        setSelectedFilter(filter);
        setCurrentPage(1);
    };

    const handleTypeFilterChange = (filter: "all" | "unit" | "bulk") => {
        setTypeFilter(filter);
        setCurrentPage(1);
    };

    // Hitung jumlah per status untuk badge filter
    const counts = useMemo(() => {
        const result: Record<ExpirationStatus, number> = {
            expired: 0, critical: 0, warning: 0, caution: 0, safe: 0, unknown: 0,
        };
        filteredInventory.forEach(item => {
            result[getExpirationInfo(item.expired_date_fixed).status]++;
        });
        return result;
    }, [filteredInventory]);

    // Hitung jumlah per type untuk badge filter
    const typeCounts = useMemo(() => ({
        unit: filteredInventory.filter(i => !i.is_bulk).length,
        bulk: filteredInventory.filter(i => i.is_bulk).length,
    }), [filteredInventory]);

    // Filter by type first, then expiration
    const filteredByType = useMemo(() => {
        if (typeFilter === "all") return filteredInventory;
        if (typeFilter === "bulk") return filteredInventory.filter(i => i.is_bulk);
        return filteredInventory.filter(i => !i.is_bulk);
    }, [filteredInventory, typeFilter]);

    const filteredByExpiration = useMemo(() => {
        if (selectedFilter === "all") return filteredByType;
        return filteredByType.filter(item =>
            getExpirationInfo(item.expired_date_fixed).status === selectedFilter
        );
    }, [filteredByType, selectedFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredByExpiration.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const pageStart = (activePage - 1) * itemsPerPage;
    const pageEnd = Math.min(pageStart + itemsPerPage, filteredByExpiration.length);
    const paginatedItems = filteredByExpiration.slice(pageStart, pageEnd);

    // Generate halaman untuk pagination
    const pageNumbers: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
        pageNumbers.push(1);
        if (activePage > 3) pageNumbers.push("ellipsis");
        for (let i = Math.max(2, activePage - 1); i <= Math.min(totalPages - 1, activePage + 1); i++) {
            pageNumbers.push(i);
        }
        if (activePage < totalPages - 2) pageNumbers.push("ellipsis");
        pageNumbers.push(totalPages);
    }

    return (
        <div className="flex flex-col gap-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            {/* ── TOOLBAR ─────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">

                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <IconSearch />
                        </span>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama atau part number..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 transition-all"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <button
                            onClick={onPrintLocationList}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                            title="Print Location List"
                        >
                            <IconList />
                            <span className="hidden sm:inline">Location List</span>
                        </button>
                        <button
                            onClick={() => onPrintAllQR(filteredByType)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                            title={`Print ${typeFilter === "all" ? "All" : typeFilter === "bulk" ? "Bulk" : "Unit"} QR (${filteredByType.length} item)`}
                        >
                            <IconPrint />
                            <span className="hidden sm:inline">
                                Print {typeFilter === "bulk" ? "Bulk" : typeFilter === "unit" ? "Unit" : "All"} QR
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                                    {filteredByType.length}
                                </span>
                            </span>
                        </button>
                        <button
                            onClick={onAdd}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-navy-800 bg-accent hover:bg-accent-dark rounded-lg transition-all active:scale-95"
                        >
                            <IconPlus />
                            Add Item
                        </button>
                    </div>
                </div>
            </div>

            {/* ── FILTER PILLS ─────────────────────────────────────────── */}
            <div className="px-6 py-3 border-b border-slate-100 overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                    {/* ── Type filter group ── */}
                    <button
                        onClick={() => handleTypeFilterChange("all")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 ${
                            typeFilter === "all"
                                ? "bg-navy-800 text-white border-navy-800"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        Semua Tipe
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            typeFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                            {filteredInventory.length}
                        </span>
                    </button>
                    <button
                        onClick={() => handleTypeFilterChange("unit")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 ${
                            typeFilter === "unit"
                                ? "bg-sky-600 text-white border-sky-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${typeFilter === "unit" ? "bg-sky-200" : "bg-slate-300"}`} />
                        Unit / Pieces
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            typeFilter === "unit" ? "bg-sky-500/30 text-sky-100" : "bg-slate-100 text-slate-500"
                        }`}>
                            {typeCounts.unit}
                        </span>
                    </button>
                    <button
                        onClick={() => handleTypeFilterChange("bulk")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 ${
                            typeFilter === "bulk"
                                ? "bg-violet-600 text-white border-violet-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${typeFilter === "bulk" ? "bg-violet-200" : "bg-slate-300"}`} />
                        Bulk / Liters
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            typeFilter === "bulk" ? "bg-violet-500/30 text-violet-100" : "bg-slate-100 text-slate-500"
                        }`}>
                            {typeCounts.bulk}
                        </span>
                    </button>

                    {/* Divider */}
                    <div className="w-px h-4 bg-slate-200 mx-1" />

                    {/* "Semua" pill */}
                    <button
                        onClick={() => handleFilterChange("all")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 ${
                            selectedFilter === "all"
                                ? "bg-navy-800 text-white border-navy-800"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                        Semua
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            selectedFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                            {filteredInventory.length}
                        </span>
                    </button>

                    {FILTER_CONFIGS.map(({ status, label, activeClass, dotClass, countClass }) => {
                        const count = counts[status];
                        const isActive = selectedFilter === status;
                        return (
                            <button
                                key={status}
                                onClick={() => handleFilterChange(status)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-150 ${
                                    isActive
                                        ? activeClass
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                                }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? dotClass : "bg-slate-300"}`} />
                                {label}
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    isActive ? countClass : "bg-slate-100 text-slate-500"
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── TABEL ────────────────────────────────────────────────── */}
            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-navy-800 rounded-full animate-spin" />
                        <p className="text-sm text-slate-400 font-medium">Memuat data inventaris...</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3 w-[30%]">Item</th>
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Part No.</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Batch</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Expiry</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Lokasi</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Stok</th>
                                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                                            <IconBox />
                                            <p className="text-sm font-semibold text-slate-500">
                                                {searchQuery ? `Tidak ada item untuk "${searchQuery}"` : "Belum ada item di inventaris"}
                                            </p>
                                            <p className="text-xs">
                                                {searchQuery ? "Coba kata kunci lain." : "Klik \"Add Item\" untuk mulai menambahkan."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/70 transition-colors group"
                                    >
                                        {/* Item info */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-slate-900 leading-snug line-clamp-2">
                                                    {item.part_name}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                                        item.is_bulk
                                                            ? "bg-violet-100 text-violet-700"
                                                            : "bg-sky-100 text-sky-700"
                                                    }`}>
                                                        {item.is_bulk ? "Bulk" : "Unit"}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                                        {item.uom}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Part Number */}
                                        <td className="px-4 py-4">
                                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                                {item.part_number || <span className="text-slate-300 not-italic">—</span>}
                                            </span>
                                        </td>

                                        {/* Batch */}
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs text-slate-600">
                                                {item.batch_number || <span className="text-slate-300">—</span>}
                                            </span>
                                        </td>

                                        {/* Expiry */}
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex justify-center">
                                                <ExpirationBadge
                                                    expirationDate={item.expired_date_fixed}
                                                    showDate={true}
                                                />
                                            </div>
                                        </td>

                                        {/* Lokasi */}
                                        <td className="px-4 py-4 text-center">
                                            <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                                {item.location || <span className="text-slate-300 font-normal">—</span>}
                                            </span>
                                        </td>

                                        {/* Stok */}
                                        <td className="px-4 py-4 text-center">
                                            <span className="font-bold text-slate-900 tabular-nums">
                                                {item.quantity}
                                            </span>
                                        </td>

                                        {/* Aksi */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {item.document_url && (
                                                    <a
                                                        href={item.document_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="Buka Dokumen"
                                                    >
                                                        <IconLink />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => onPrintQR(item)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                    title="Print QR"
                                                >
                                                    <IconQR />
                                                </button>
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <IconEdit />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(item.id, item.part_name)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* ── PAGINATION FOOTER ────────────────────────────────────── */}
            {!isLoading && filteredByExpiration.length > 0 && (
                <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">

                    {/* Info + items per page */}
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                            Menampilkan{" "}
                            <span className="font-semibold text-slate-700">{pageStart + 1}–{pageEnd}</span>
                            {" "}dari{" "}
                            <span className="font-semibold text-slate-700">{filteredByExpiration.length}</span>
                            {" "}item
                        </span>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1.5">
                            <span>Tampilkan</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800"
                            >
                                {[10, 25, 50, 100].map(val => (
                                    <option key={val} value={val}>{val}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Page buttons */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            disabled={activePage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <IconChevronLeft />
                        </button>

                        {pageNumbers.map((pageNum, idx) => {
                            if (pageNum === "ellipsis") {
                                return <span key={`e-${idx}`} className="px-1.5 text-slate-400 text-xs select-none">…</span>;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`min-w-[32px] h-8 px-2 rounded-lg border text-xs font-semibold transition-colors ${
                                        activePage === pageNum
                                            ? "bg-navy-800 border-navy-800 text-white"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            disabled={activePage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <IconChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
