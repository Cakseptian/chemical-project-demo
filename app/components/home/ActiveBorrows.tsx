"use client";
import { getRelativeTime } from "@/app/utils/timeUtils";
import type { ActiveLoan } from "@/app/types";

interface ActiveBorrowsProps {
    activeLoans: ActiveLoan[];
    nomorPegawai: string;
    onManageAll: () => void;
    onQuickReturn: (loan: ActiveLoan) => void;
}

export const ActiveBorrows = ({ activeLoans, nomorPegawai, onManageAll, onQuickReturn }: ActiveBorrowsProps) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6 animate-in fade-in duration-300">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase">Your active borrows</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Barang yang saat ini sedang Anda bawa</p>
                </div>
                <button
                    onClick={onManageAll}
                    disabled={!nomorPegawai.trim()}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Kelola Semua ({activeLoans.length}) →
                </button>
            </div>

            <div className="divide-y divide-slate-100">
                {activeLoans.length > 0 ? (
                    activeLoans.map((loan) => (
                        <div key={loan.id} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                                        {loan.part_name?.substring(0, 2).toUpperCase() || "??"}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-900 truncate leading-normal">{loan.part_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-slate-600 font-bold tabular-nums">{Math.abs(loan.jumlah)} unit</span>
                                        <span className="text-xs text-slate-300">·</span>
                                        <span className="text-xs text-slate-400 font-medium">{getRelativeTime(loan.created_at)}</span>
                                        {loan.part_number && (
                                            <>
                                                <span className="text-xs text-slate-300">·</span>
                                                <span className="text-xs text-slate-400 font-mono">{loan.part_number}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onQuickReturn(loan)}
                                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 active:bg-blue-200 rounded-lg transition-all"
                                >
                                    Return
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-5 py-8 text-center text-slate-400">
                        <div className="text-3xl mb-2 opacity-50">📦</div>
                        <p className="text-xs font-bold text-slate-500">Tidak ada pinjaman aktif.</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Masukkan Employee ID Anda untuk sinkronisasi otomatis.</p>
                    </div>
                )}
            </div>
        </div>
    );
};