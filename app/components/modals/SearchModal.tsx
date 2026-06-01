"use client";
import type { InventoryItemPublic } from "@/app/types";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    isSearchingDb: boolean;
    filteredItems: InventoryItemPublic[];
}

export const SearchModal = ({
    isOpen, onClose, searchQuery, setSearchQuery, isSearchingDb, filteredItems,
}: SearchModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-300 border border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-[#001e2b] text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="font-extrabold text-xl tracking-tight leading-normal uppercase">Katalog Barang</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cari Posisi Rak & Stok</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors text-xl font-light focus:outline-none">✕</button>
                </div>

                <div className="p-5 bg-slate-50 shrink-0 border-b border-slate-200">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 text-lg">🔍</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 focus:border-[#00ed64] rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-800 transition-all outline-none shadow-sm focus:ring-4 focus:ring-[#00ed64]/10"
                            placeholder="Ketik nama barang atau part number..."
                            autoFocus
                        />
                    </div>
                </div>

                <div className="p-5 overflow-y-auto flex-1 bg-slate-100/30">
                    {isSearchingDb ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#00ed64] rounded-full mb-4"></div>
                            <p className="text-xs font-bold uppercase tracking-widest">Memuat Katalog...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow">
                                        <div className="flex justify-between items-start mb-3 gap-2">
                                            <div className="min-w-0 pr-4">
                                                <h3 className="font-bold text-slate-800 leading-snug">{item.part_name}</h3>
                                                <p className="text-[10px] font-mono text-slate-400 mt-1">{item.part_number || "No Part Number"}</p>
                                            </div>
                                            <div className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${Number(item.quantity) > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                                                }`}>
                                                {Number(item.quantity) > 0 ? `${item.quantity} Tersedia` : "Kosong"}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3 border border-slate-100">
                                            <span className="text-lg">📍</span>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lokasi Laci / Rak</p>
                                                <p className="text-sm font-extrabold text-slate-800 mt-0.5">{item.location || "Belum Ditentukan"}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <div className="text-4xl mb-4 opacity-50">🤷‍♂️</div>
                                    <p className="text-slate-500 font-bold text-sm">Barang tidak ditemukan.</p>
                                    <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau ajukan request.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};