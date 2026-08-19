// app/so/components/tabs/InventoryTab.tsx
"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { InventoryItem } from "../../types";
import { ExpirationBadge } from "../ExpirationBadge";
import { getExpirationInfo, ExpirationStatus } from "../../utils/expirationUtils";
import { ColumnFilterDropdown } from "../ColumnFilterDropdown";
import {
    IconSearch, IconPlus, IconPrint, IconList, IconLink,
    IconEdit, IconTrash, IconQR, IconChevronLeft, IconChevronRight, IconBox,
} from "../InventoryIcons";

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
    onPrintByPartNo: (partNo: string, items: InventoryItem[]) => void;
    onPrintByLocation: (location: string, items: InventoryItem[]) => void;
    onPrintLocationList: () => void;
}

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
    onPrintByPartNo,
    onPrintByLocation,
    onPrintLocationList,
}: InventoryTabProps) => {
    const [selectedFilter, setSelectedFilter] = useState<ExpirationStatus | "all">("all");
    const [typeFilter, setTypeFilter] = useState<"all" | "unit" | "bulk">("all");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);

    // Print dropdown state
    const [showPrintDropdown, setShowPrintDropdown] = useState(false);
    const printDropdownRef = useRef<HTMLDivElement>(null);

    // Print picker modal state
    const [printPickerMode, setPrintPickerMode] = useState<"partno" | "location" | null>(null);
    const [printPickerSelected, setPrintPickerSelected] = useState<string>("");

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (printDropdownRef.current && !printDropdownRef.current.contains(e.target as Node)) {
                setShowPrintDropdown(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Unique part numbers and locations from filteredByType (computed below, but we need it here)
    // Will be computed after filteredByType is available

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

    // Unique part numbers and locations for print picker
    const uniquePartNumbers = useMemo(() =>
        [...new Set(filteredByType.map(i => i.part_number).filter(Boolean) as string[])].sort()
    , [filteredByType]);

    const uniqueLocations = useMemo(() =>
        [...new Set(filteredByType.map(i => i.location).filter(Boolean) as string[])].sort()
    , [filteredByType]);

    const filteredByExpiration = useMemo(() => {
        if (selectedFilter === "all") return filteredByType;
        return filteredByType.filter(item =>
            getExpirationInfo(item.expired_date_fixed).status === selectedFilter
        );
    }, [filteredByType, selectedFilter]);

    // ── COLUMN FILTERS (Excel-style) ─────────────────────────────────
    const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
    const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);

    const toggleColumnFilter = (col: string, val: string) => {
        setColumnFilters(prev => {
            const current = new Set(prev[col] ?? []);
            if (current.has(val)) current.delete(val);
            else current.add(val);
            return { ...prev, [col]: current };
        });
        setCurrentPage(1);
    };

    const clearColumnFilter = (col: string) => {
        setColumnFilters(prev => { const n = { ...prev }; delete n[col]; return n; });
        setCurrentPage(1);
    };

    const selectAllColumnFilter = (col: string) => {
        setColumnFilters(prev => { const n = { ...prev }; delete n[col]; return n; });
        setCurrentPage(1);
    };

    // Unique values per filterable column (from filteredByExpiration, before column filter)
    const uniqueLocations2 = useMemo(() =>
        [...new Set(filteredByExpiration.map(i => i.location).filter(Boolean) as string[])].sort()
    , [filteredByExpiration]);

    const uniquePartNames = useMemo(() =>
        [...new Set(filteredByExpiration.map(i => i.part_name).filter(Boolean) as string[])].sort()
    , [filteredByExpiration]);

    const uniqueRackTypes = useMemo(() =>
        [...new Set(filteredByExpiration.map(i => i.rack_type).filter(Boolean) as string[])].sort()
    , [filteredByExpiration]);

    // Apply column filters
    const filteredByColumn = useMemo(() => {
        return filteredByExpiration.filter(item => {
            const locFilter = columnFilters["location"];
            if (locFilter && locFilter.size > 0 && !locFilter.has(item.location ?? "")) return false;
            const nameFilter = columnFilters["part_name"];
            if (nameFilter && nameFilter.size > 0 && !nameFilter.has(item.part_name ?? "")) return false;
            const rackFilter = columnFilters["rack_type"];
            if (rackFilter && rackFilter.size > 0 && !rackFilter.has(item.rack_type ?? "")) return false;
            return true;
        });
    }, [filteredByExpiration, columnFilters]);

    const activeColumnFilterCount = Object.values(columnFilters).filter(s => s.size > 0).length;
    type SortKey = "part_name" | "part_number" | "batch_number" | "expired_date_fixed" | "location" | "quantity" | "last_so_at";
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(d => d === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
        setCurrentPage(1);
    };

    const sortedItems = useMemo(() => {
        if (!sortKey) return filteredByColumn;
        return [...filteredByColumn].sort((a, b) => {
            const aVal = a[sortKey] ?? "";
            const bVal = b[sortKey] ?? "";
            const mul = sortDir === "asc" ? 1 : -1;
            // Numeric sort for quantity
            if (sortKey === "quantity") {
                return (Number(aVal) - Number(bVal)) * mul;
            }
            // String sort for everything else
            return String(aVal).localeCompare(String(bVal)) * mul;
        });
    }, [filteredByColumn, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const pageStart = (activePage - 1) * itemsPerPage;
    const pageEnd = Math.min(pageStart + itemsPerPage, sortedItems.length);
    const paginatedItems = sortedItems.slice(pageStart, pageEnd);

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
        <>
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
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 transition-colors"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <button type="button"
                            onClick={onPrintLocationList}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors"
                            title="Print Location List"
                        >
                            <IconList />
                            <span className="hidden sm:inline">Location List</span>
                        </button>
                        {/* Print split button with dropdown */}
                        <div className="relative" ref={printDropdownRef}>
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden">
                                {/* Main print button */}
                                <button type="button"
                                    onClick={() => onPrintAllQR(filteredByType)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors border-r border-slate-200"
                                    title={`Print All QR (${filteredByType.length} item)`}
                                >
                                    <IconPrint />
                                    <span className="hidden sm:inline">
                                        Print QR
                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                                            {filteredByType.length}
                                        </span>
                                    </span>
                                </button>
                                {/* Dropdown arrow */}
                                <button type="button"
                                    onClick={() => setShowPrintDropdown(v => !v)}
                                    className="px-2 py-2 text-slate-500 hover:bg-slate-50 transition-colors"
                                    title="More print options"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Dropdown menu */}
                            {showPrintDropdown && (
                                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                                    <button type="button"
                                        onClick={() => { onPrintAllQR(filteredByType); setShowPrintDropdown(false); }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                                    >
                                        <IconPrint />
                                        Print All QR
                                        <span className="ml-auto text-[10px] text-slate-400 font-normal">{filteredByType.length} item</span>
                                    </button>
                                    <div className="h-px bg-slate-100 mx-3 my-1" />
                                    <button type="button"
                                        onClick={() => { setPrintPickerMode("partno"); setPrintPickerSelected(uniquePartNumbers[0] ?? ""); setShowPrintDropdown(false); }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                                        disabled={uniquePartNumbers.length === 0}
                                    >
                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                        Print per Part Number
                                    </button>
                                    <button type="button"
                                        onClick={() => { setPrintPickerMode("location"); setPrintPickerSelected(uniqueLocations[0] ?? ""); setShowPrintDropdown(false); }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                                        disabled={uniqueLocations.length === 0}
                                    >
                                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Print per Lokasi
                                    </button>
                                </div>
                            )}
                        </div>
                        <button type="button"
                            onClick={onAdd}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-navy-800 bg-accent hover:bg-accent-dark rounded-lg transition-colors active:scale-95"
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
                    <button type="button"
                        onClick={() => handleTypeFilterChange("all")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors duration-150 ${
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
                    <button type="button"
                        onClick={() => handleTypeFilterChange("unit")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors duration-150 ${
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
                    <button type="button"
                        onClick={() => handleTypeFilterChange("bulk")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors duration-150 ${
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
                    <button type="button"
                        onClick={() => handleFilterChange("all")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors duration-150 ${
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
                            <button type="button"
                                key={status}
                                onClick={() => handleFilterChange(status)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors duration-150 ${
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
            <div className="overflow-x-auto overflow-y-visible relative">
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-navy-800 rounded-full animate-spin" />
                        <p className="text-sm text-slate-400 font-medium">Memuat data inventaris...</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                {([
                                    { key: "part_name",         label: "Item",     align: "left",   cls: "px-6 py-3 w-[30%]" },
                                    { key: "part_number",       label: "Part No.", align: "left",   cls: "px-4 py-3" },
                                    { key: "batch_number",      label: "Batch",    align: "center", cls: "px-4 py-3" },
                                    { key: "expired_date_fixed",label: "Expiry",   align: "center", cls: "px-4 py-3" },
                                    { key: "location",          label: "Lokasi",   align: "center", cls: "px-4 py-3" },
                                    { key: "quantity",          label: "Stok",     align: "center", cls: "px-4 py-3" },
                                    { key: "last_so_at",        label: "Last SO",  align: "center", cls: "px-4 py-3" },
                                ] as { key: SortKey; label: string; align: string; cls: string }[]).map(({ key, label, align, cls }) => (
                                    <th key={key}
                                        className={`text-${align} text-[11px] font-semibold uppercase tracking-wider ${cls} cursor-pointer select-none transition-colors group ${
                                            (key === "location" && columnFilters["location"]?.size > 0) ||
                                            (key === "part_name" && columnFilters["part_name"]?.size > 0)
                                                ? "text-[#00ed64] bg-[#00ed64]/5"
                                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                        }`}
                                        onClick={() => handleSort(key)}
                                    >
                                        <span className="inline-flex items-center gap-1">
                                            {label}
                                            {/* Excel filter icon for part_name and location */}
                                            {key === "part_name" && (
                                                <ColumnFilterDropdown
                                                    label={label}
                                                    colKey="part_name"
                                                    options={uniquePartNames}
                                                    selected={columnFilters["part_name"] ?? new Set()}
                                                    onToggle={(v) => toggleColumnFilter("part_name", v)}
                                                    onSelectAll={() => selectAllColumnFilter("part_name")}
                                                    onClear={() => clearColumnFilter("part_name")}
                                                    activeFilter={activeFilterCol}
                                                    setActiveFilter={setActiveFilterCol}
                                                />
                                            )}
                                            {key === "location" && (
                                                <ColumnFilterDropdown
                                                    label={label}
                                                    colKey="location"
                                                    options={uniqueLocations2}
                                                    selected={columnFilters["location"] ?? new Set()}
                                                    onToggle={(v) => toggleColumnFilter("location", v)}
                                                    onSelectAll={() => selectAllColumnFilter("location")}
                                                    onClear={() => clearColumnFilter("location")}
                                                    activeFilter={activeFilterCol}
                                                    setActiveFilter={setActiveFilterCol}
                                                />
                                            )}
                                            <span className="text-slate-300 group-hover:text-slate-400">
                                                {sortKey === key
                                                    ? sortDir === "asc"
                                                        ? <svg className="w-3 h-3 text-navy-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                                        : <svg className="w-3 h-3 text-navy-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                                    : <svg className="w-3 h-3 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M8 15l4 4 4-4" /></svg>
                                                }
                                            </span>
                                        </span>
                                    </th>
                                ))}
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

                                        {/* Last SO */}
                                        <td className="px-4 py-4 text-center">
                                            {item.last_so_at ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                                        {new Date(item.last_so_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 tabular-nums">
                                                        {new Date(item.last_so_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-slate-300 italic">Belum SO</span>
                                            )}
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
                                                <button type="button"
                                                    onClick={() => onPrintQR(item)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                    title="Print QR"
                                                >
                                                    <IconQR />
                                                </button>
                                                <button type="button"
                                                    onClick={() => onEdit(item)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <IconEdit />
                                                </button>
                                                <button type="button"
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

        {/* ── PRINT PICKER MODAL ─────────────────────────────────────── */}
        {printPickerMode && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={() => setPrintPickerMode(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6"
                    onClick={(e) => e.stopPropagation()}>

                    {/* Header */}
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <IconPrint />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-slate-900 font-bold text-base leading-tight">
                                {printPickerMode === "partno" ? "Print per Part Number" : "Print per Lokasi"}
                            </h3>
                            <p className="text-slate-500 text-xs mt-0.5">
                                {printPickerMode === "partno"
                                    ? "Pilih part number untuk dicetak QR-nya"
                                    : "Pilih lokasi untuk dicetak QR semua itemnya"}
                            </p>
                        </div>
                    </div>

                    {/* Select */}
                    <div className="mb-5">
                        <select
                            value={printPickerSelected}
                            onChange={(e) => setPrintPickerSelected(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-800/20 focus:border-navy-800 transition-colors"
                        >
                            {(printPickerMode === "partno" ? uniquePartNumbers : uniqueLocations).map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                        {printPickerSelected && (
                            <p className="text-xs text-slate-400 mt-1.5 px-1">
                                {filteredByType.filter(i =>
                                    printPickerMode === "partno"
                                        ? i.part_number === printPickerSelected
                                        : i.location === printPickerSelected
                                ).length} item akan dicetak
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button type="button"
                            onClick={() => setPrintPickerMode(null)}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                            Batal
                        </button>
                        <button type="button"
                            onClick={() => {
                                if (!printPickerSelected) return;
                                if (printPickerMode === "partno") {
                                    onPrintByPartNo(printPickerSelected, filteredByType);
                                } else {
                                    onPrintByLocation(printPickerSelected, filteredByType);
                                }
                                setPrintPickerMode(null);
                            }}
                            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <IconPrint />
                            Cetak QR
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
    );
};
