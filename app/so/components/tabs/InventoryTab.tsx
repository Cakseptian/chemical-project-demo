// app/so/components/tabs/InventoryTab.tsx
"use client";

import type { InventoryItem } from "../../types";

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

            {/* SEARCH BAR SECTION */}
            <div className="px-6 py-4 border-b border-slate-200">
                <div className="relative group max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Cari Nama atau PN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-medium"
                    />
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
                                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInventory.map((item: InventoryItem) => (
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
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end items-center gap-2">
                                            <button onClick={() => onPrintQR(item)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors" title="Print QR">🖨️</button>
                                            <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors" title="Edit">✏️</button>
                                            <button onClick={() => onDelete(item.id, item.part_name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors" title="Hapus">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInventory.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="text-4xl mb-4 opacity-20">📦</div>
                                        <p className="text-slate-400 font-bold">No item found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};