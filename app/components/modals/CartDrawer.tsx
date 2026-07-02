"use client";
import type { CartItem } from "@/app/types";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    isSubmitting: boolean;
    nomorPegawai: string;
    setNomorPegawai: (val: string) => void;
    namaPeminjam: string;
    setNamaPeminjam: (val: string) => void;
    onUpdateQuantity: (id: number, delta: number) => void;
    onUpdateBulkQty: (id: number, val: string) => void;
    onRemoveFromCart: (id: number) => void;
    onReset: () => void;
    onCheckout: () => void;
    onAddMore: () => void;
}

export const CartDrawer = ({
    isOpen, onClose, cart, isSubmitting,
    nomorPegawai, setNomorPegawai, namaPeminjam, setNamaPeminjam,
    onUpdateQuantity, onUpdateBulkQty, onRemoveFromCart,
    onReset, onCheckout, onAddMore,
}: CartDrawerProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border border-slate-200">
                <div className="px-6 py-5 border-b border-slate-100 bg-[#001e2b] text-white relative shrink-0 flex items-center justify-between">
                    <div>
                        <h2 className="font-extrabold text-lg tracking-tight">Review Keranjang</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Konfirmasi Ambil Barang</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors text-xl font-light focus:outline-none">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
                    <div className="space-y-3">
                        {cart.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-800 text-sm truncate leading-snug">{item.part_name}</h3>
                                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                                        Sistem: <span className="font-bold text-slate-900">{item.max_quantity} {item.uom}</span>
                                        {item.location ? ` · Rak: ${item.location}` : ""}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {item.is_bulk ? (
                                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden px-2 h-8">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={item.quantity_to_take}
                                                onChange={(e) => onUpdateBulkQty(item.id, e.target.value)}
                                                className="w-14 text-center font-bold text-slate-800 bg-transparent outline-none text-xs"
                                                placeholder="0.0"
                                            />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{item.uom}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden border border-slate-200 h-8 shadow-inner">
                                            <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-black transition-colors">-</button>
                                            <span className="w-6 text-center font-bold text-slate-800 text-xs">{item.quantity_to_take}</span>
                                            <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-black transition-colors">+</button>
                                        </div>
                                    )}
                                    <button onClick={() => onRemoveFromCart(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none" title="Hapus">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onAddMore}
                        className="w-full bg-white border border-dashed border-[#00ed64] hover:border-[#00b545] text-[#00684a] hover:bg-[#e3fcef]/30 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs shadow-sm focus:outline-none"
                    >
                        📷 Tambah Barang Lain
                    </button>

                    <div className="pt-5 border-t border-slate-200 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Employee ID *</label>
                                <input
                                    type="text"
                                    value={nomorPegawai}
                                    onChange={(e) => setNomorPegawai(e.target.value)}
                                    className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00684a] focus:ring-2 focus:ring-[#00ed64]/10 transition-all shadow-sm"
                                    placeholder="Employee ID"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Peminjam *</label>
                                <input
                                    type="text"
                                    value={namaPeminjam}
                                    onChange={(e) => setNamaPeminjam(e.target.value)}
                                    className="w-full h-11 px-4 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#00684a] focus:ring-2 focus:ring-[#00ed64]/10 transition-all shadow-sm"
                                    placeholder="Nama Lengkap"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 shrink-0 flex gap-3">
                    <button
                        onClick={onReset}
                        disabled={isSubmitting}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 py-3.5 rounded-full text-xs font-bold transition-all focus:outline-none"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onCheckout}
                        disabled={isSubmitting}
                        className="flex-[2] bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-3.5 rounded-full shadow-lg shadow-[#00ed64]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-xs focus:outline-none"
                    >
                        {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#001e2b] border-t-transparent"></div>
                        ) : "CHECKOUT SEKARANG"}
                    </button>
                </div>
            </div>
        </div>
    );
};