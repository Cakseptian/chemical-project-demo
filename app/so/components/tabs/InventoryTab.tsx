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
        <div className="bg-[#001e2b] text-white rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden animate-in fade-in duration-500">
            {/* HEADER SECTION */}
            <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Database Barang</h2>
                    <p className="text-sm text-white/50 font-medium">Manajemen data master dan pencetakan QR.</p>
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <button
                        onClick={onPrintLocationList}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-white/80 border border-white/10 text-sm font-bold py-3 px-5 rounded-xl transition-all shadow-sm"
                    >
                        Cetak Label Lokasi
                    </button>
                    <button
                        onClick={onPrintAllQR}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-white/80 border border-white/10 text-sm font-bold py-3 px-5 rounded-xl transition-all shadow-sm"
                    >
                        Cetak Semua QR
                    </button>
                    <button
                        onClick={onAdd}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] text-sm font-black py-3 px-5 rounded-xl transition-all shadow-lg shadow-[0_0_0_1px_rgba(0,237,100,0.25)]"
                    >
                        + Tambah
                    </button>
                </div>
            </div>

            {/* SEARCH BAR SECTION */}
            <div className="p-6 border-b border-white/5">
                <div className="relative group max-w-md">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00ed64] transition-colors">🔍</span>
                    <input
                        type="text"
                        placeholder="Cari Nama atau PN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] rounded-lg text-base font-medium text-white placeholder:text-white/20 focus:shadow-[0_0_0_2px_rgba(0,237,100,0.25)] outline-none transition-all"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                        <p className="text-white/40 font-medium">Memuat database...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="shadow-[0_1px_0_0_rgba(255,255,255,0.06)] text-white/30 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-4">Item Info</th>
                                <th className="px-8 py-4">Part Number</th>
                                <th className="px-8 py-4 text-center">Batch Number</th>
                                <th className="px-8 py-4 text-center">Expired Date</th>
                                <th className="px-8 py-4 text-center">Location</th>
                                <th className="px-8 py-4 text-center">Stock</th>
                                <th className="px-8 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredInventory.map((item: InventoryItem) => (
                                <tr key={item.id} className="group transition-colors hover:bg-white/[0.02] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                                    <td className="px-8 py-6">
                                        <p className="text-base font-extrabold text-white/90 group-hover:text-white transition-colors leading-normal break-words">{item.part_name}</p>
                                        <p className="text-[10px] font-mono text-white/30 mt-1 truncate max-w-[150px]">{item.barcode_id}</p>
                                    </td>
                                    <td className="px-8 py-6 text-base font-bold text-white/50 leading-normal">{item.part_number || "—"}</td>
                                    <td className="px-8 py-6 text-center text-sm font-medium text-white/50">{item.batch_number || "—"}</td>
                                    <td className="px-8 py-6 text-center text-sm font-medium text-white/50">
                                        {item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="inline-block px-3 py-1 bg-white/5 text-white/60 rounded-lg text-xs font-bold shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                                            {item.location || "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-block min-w-[3rem] py-1 px-3 rounded-lg font-black text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.06)] ${Number(item.quantity) <= 5 ? "bg-red-500/10 text-red-400" : "bg-[#00ed64]/10 text-[#00ed64]"
                                            }`}>{item.quantity}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-end items-center gap-4">
                                            <button onClick={() => onPrintQR(item)} className="p-2 text-white/20 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Print QR">🖨️</button>
                                            <button onClick={() => onEdit(item)} className="p-2 text-white/20 hover:text-amber-400 hover:bg-white/10 rounded-lg transition-all" title="Edit">✏️</button>
                                            <button onClick={() => onDelete(item.id, item.part_name)} className="p-2 text-white/20 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all" title="Hapus">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInventory.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-8 py-20 text-center">
                                        <div className="text-4xl mb-4 opacity-20">📦</div>
                                        <p className="text-white/30 font-bold">No item found.</p>
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