"use client";
import { getRelativeTime } from "@/app/utils/timeUtils";
import type { ActiveLoan } from "@/app/types";

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeLoans: ActiveLoan[];
    isFetchingLoans: boolean;
    isReturning: boolean;
    onProsesReturn: (loanId: number, invId: number, qty: number, status: "HABIS" | "SISA") => void;
}

export const ReturnModal = ({
    isOpen, onClose, activeLoans, isFetchingLoans, isReturning, onProsesReturn,
}: ReturnModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#001e2b] text-white shrink-0">
                    <div>
                        <h2 className="font-extrabold text-xl tracking-tight leading-normal uppercase">Return borrowed item</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pengembalian Barang Pinjaman</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors text-xl font-light focus:outline-none">✕</button>
                </div>

                <div className="p-5 overflow-y-auto flex-1 bg-slate-100/30">
                    {isFetchingLoans ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#00ed64] rounded-full mb-4"></div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat pinjaman...</p>
                        </div>
                    ) : activeLoans.length > 0 ? (
                        <div className="space-y-3">
                            {activeLoans.map((loan) => (
                                <div key={loan.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow">
                                    <div className="flex justify-between items-start mb-3 gap-2">
                                        <div className="min-w-0 pr-4">
                                            <h3 className="font-bold text-slate-800 leading-snug">{loan.part_name}</h3>
                                            <p className="text-[10px] font-mono text-slate-400 mt-1">
                                                {loan.part_number || "No Part Number"} · {getRelativeTime(loan.created_at)}
                                            </p>
                                        </div>
                                        <div className="shrink-0 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100 font-mono tabular-nums">
                                            Dipinjam: {Math.abs(loan.jumlah)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <button
                                            onClick={() => onProsesReturn(loan.id, loan.inventory_id, Math.abs(loan.jumlah), "SISA")}
                                            disabled={isReturning}
                                            className="w-full bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-2.5 rounded-xl transition-all text-xs disabled:opacity-50 shadow-sm focus:outline-none"
                                        >
                                            KEMBALIKAN (SISA)
                                        </button>
                                        <button
                                            onClick={() => onProsesReturn(loan.id, loan.inventory_id, Math.abs(loan.jumlah), "HABIS")}
                                            disabled={isReturning}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl transition-all text-xs disabled:opacity-50 focus:outline-none"
                                        >
                                            HABIS PAKAI (HABIS)
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="text-4xl mb-4 opacity-50">🎉</div>
                            <p className="text-slate-500 font-bold text-sm">Tidak ada barang yang sedang Anda pinjam.</p>
                            <p className="text-xs text-slate-400 mt-1">Semua barang sudah dikembalikan!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};