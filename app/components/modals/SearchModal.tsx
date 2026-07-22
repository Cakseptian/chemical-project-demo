"use client";
import { useEffect } from "react";
import type { InventoryItemPublic } from "@/app/types";

// SVG Icons — consistent with InventoryTab style
const IconSearch = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
);

const IconPin = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.686-6-10A6 6 0 0 1 18 11c0 4.314-6 10-6 10z" />
        <circle cx="12" cy="11" r="2" fill="currentColor" stroke="none" />
    </svg>
);

const IconClose = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const IconBox = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
);

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    isSearchingDb: boolean;
    filteredItems: InventoryItemPublic[];
}

export const SearchModal = ({
    isOpen,
    onClose,
    searchQuery,
    setSearchQuery,
    isSearchingDb,
    filteredItems,
}: SearchModalProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-300 border border-slate-200">

                {/* ── HEADER ──────────────────────────────────────────── */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Katalog Barang</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Cari posisi rak &amp; ketersediaan stok</p>
                    </div>
                    <button type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
                        aria-label="Tutup"
                    >
                        <IconClose />
                    </button>
                </div>

                {/* ── SEARCH TOOLBAR ──────────────────────────────────── */}
                <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 shrink-0">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <IconSearch />
                        </span>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama barang atau part number..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                            autoFocus
                        />
                    </div>
                </div>

                {/* ── RESULTS LIST ────────────────────────────────────── */}
                <div className="overflow-y-auto flex-1" data-lenis-prevent>
                    {isSearchingDb ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-3">
                            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
                            <p className="text-sm text-slate-400 font-medium">Memuat katalog...</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <IconBox />
                            <p className="text-sm font-semibold text-slate-500">
                                {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : "Ketik untuk mulai mencari"}
                            </p>
                            <p className="text-xs text-slate-400">
                                {searchQuery ? "Coba kata kunci lain atau ajukan request." : "Cari berdasarkan nama barang atau part number."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Item</th>
                                    <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Lokasi</th>
                                    <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Stok</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                                        {/* Item info */}
                                        <td className="px-6 py-3.5">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-slate-900 leading-snug line-clamp-2">
                                                    {item.part_name}
                                                </span>
                                                <span className="font-mono text-[11px] text-slate-400">
                                                    {item.part_number || <span className="text-slate-300">—</span>}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Lokasi */}
                                        <td className="px-4 py-3.5 text-center">
                                            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                <span className="text-slate-400"><IconPin /></span>
                                                <span>{item.location || <span className="text-slate-300 font-normal">—</span>}</span>
                                            </div>
                                        </td>

                                        {/* Stok badge */}
                                        <td className="px-6 py-3.5 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${Number(item.quantity) > 0
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                : "bg-red-50 text-red-600 border border-red-100"
                                                }`}>
                                                {Number(item.quantity) > 0 ? `${item.quantity} Tersedia` : "Kosong"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── FOOTER COUNT ────────────────────────────────────── */}
                {!isSearchingDb && filteredItems.length > 0 && (
                    <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/50 shrink-0">
                        <p className="text-xs text-slate-400">
                            Menampilkan{" "}
                            <span className="font-semibold text-slate-600">{filteredItems.length}</span>{" "}
                            item
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
