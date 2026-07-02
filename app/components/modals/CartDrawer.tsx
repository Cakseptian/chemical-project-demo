"use client";
import { useEffect } from "react";
import type { CartItem } from "@/app/types";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    isSubmitting: boolean;
    nomorPegawai: string;
    namaPeminjam: string;
    onUpdateQuantity: (id: number, delta: number) => void;
    onUpdateBulkQty: (id: number, val: string) => void;
    onRemoveFromCart: (id: number) => void;
    onReset: () => void;
    onCheckout: () => void;
    onAddMore: () => void;
}

const IconClose = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconTrash = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);

const IconCamera = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
);

export const CartDrawer = ({
    isOpen, onClose, cart, isSubmitting,
    nomorPegawai, namaPeminjam,
    onUpdateQuantity, onUpdateBulkQty, onRemoveFromCart,
    onReset, onCheckout, onAddMore,
}: CartDrawerProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    const isProfileComplete = nomorPegawai.trim().length > 0 && namaPeminjam.trim().length > 0;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border border-slate-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 bg-[#001e2b] text-white shrink-0 flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-lg tracking-tight">Review Keranjang</h2>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {cart.length} {cart.length === 1 ? "item" : "items"} siap diproses
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-full flex items-center justify-center transition-colors focus:outline-none"
                        aria-label="Tutup"
                    >
                        <IconClose />
                    </button>
                </div>

                {/* Borrower identity — read-only confirmation strip */}
                <div className={`px-6 py-3 border-b flex items-center gap-3 shrink-0 ${isProfileComplete ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
                    {isProfileComplete ? (
                        <>
                            <div className="w-7 h-7 rounded-full bg-[#00ed64]/20 border border-[#00ed64]/30 flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5 text-[#00684a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 truncate">{namaPeminjam}</p>
                                <p className="text-[11px] text-slate-500 font-mono">{nomorPegawai}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <p className="text-xs font-semibold text-amber-700">
                                Lengkapi Employee ID & Nama di halaman utama terlebih dahulu.
                            </p>
                        </>
                    )}
                </div>

                {/* Cart items */}
                <div className="p-5 overflow-y-auto flex-1 bg-slate-50/50 space-y-3" data-lenis-prevent>
                    {cart.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-slate-800 text-sm truncate leading-snug">{item.part_name}</h3>
                                <p className="text-[10px] text-slate-400 font-mono mt-1">
                                    Stok: <span className="font-bold text-slate-700">{item.max_quantity} {item.uom}</span>
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
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, -1)}
                                            className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-black transition-colors text-sm"
                                        >
                                            -
                                        </button>
                                        <span className="w-6 text-center font-bold text-slate-800 text-xs">{item.quantity_to_take}</span>
                                        <button
                                            onClick={() => onUpdateQuantity(item.id, 1)}
                                            className="w-8 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-black transition-colors text-sm"
                                        >
                                            +
                                        </button>
                                    </div>
                                )}
                                <button
                                    onClick={() => onRemoveFromCart(item.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                                    title="Hapus dari keranjang"
                                >
                                    <IconTrash />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Add more button */}
                    <button
                        onClick={onAddMore}
                        className="w-full bg-white border border-dashed border-[#00ed64] hover:border-[#00b545] text-[#00684a] hover:bg-emerald-50/30 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all text-xs focus:outline-none"
                    >
                        <IconCamera />
                        Tambah Barang Lain
                    </button>
                </div>

                {/* Footer actions */}
                <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 shrink-0 flex gap-3">
                    <button
                        onClick={onReset}
                        disabled={isSubmitting}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 py-3 rounded-full text-xs font-semibold transition-all focus:outline-none disabled:opacity-40"
                    >
                        Reset
                    </button>
                    <button
                        onClick={onCheckout}
                        disabled={isSubmitting || !isProfileComplete}
                        className="flex-[2] bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-bold py-3 rounded-full shadow-lg shadow-[#00ed64]/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-xs focus:outline-none"
                    >
                        {isSubmitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#001e2b] border-t-transparent" />
                        ) : (
                            "Checkout Sekarang"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
