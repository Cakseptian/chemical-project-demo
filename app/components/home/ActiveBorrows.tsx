"use client";
import { getRelativeTime } from "@/app/utils/timeUtils";
import type { ActiveLoan } from "@/app/types";

interface ActiveBorrowsProps {
    activeLoans: ActiveLoan[];
    nomorPegawai: string;
    onManageAll: () => void;
    onQuickReturn: (loan: ActiveLoan) => void;
}

const IconPackage = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

const IconReturn = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

export const ActiveBorrows = ({ activeLoans, nomorPegawai, onManageAll, onQuickReturn }: ActiveBorrowsProps) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mb-6">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Active Borrows</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Barang yang saat ini sedang Anda bawa</p>
                </div>
                <button
                    onClick={onManageAll}
                    disabled={!nomorPegawai.trim()}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                >
                    Kelola ({activeLoans.length})
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>

            <div className="divide-y divide-slate-100">
                {activeLoans.length > 0 ? (
                    activeLoans.map((loan) => (
                        <div key={loan.id} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                            <div className="flex items-center gap-3">
                                {/* Item monogram */}
                                <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-[10px] font-mono font-bold text-slate-600 uppercase">
                                        {loan.part_name?.substring(0, 2).toUpperCase() || "??"}
                                    </span>
                                </div>

                                {/* Item info */}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-slate-900 truncate leading-normal">{loan.part_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                        <span className="text-xs text-slate-700 font-semibold tabular-nums">{Math.abs(loan.jumlah)} unit</span>
                                        <span className="text-slate-300 text-xs">·</span>
                                        <span className="text-xs text-slate-400">{getRelativeTime(loan.created_at)}</span>
                                        {loan.part_number && (
                                            <>
                                                <span className="text-slate-300 text-xs">·</span>
                                                <span className="text-xs text-slate-400 font-mono">{loan.part_number}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Return button — prominent */}
                                <button
                                    type="button"
                                    onClick={() => onQuickReturn(loan)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#00684a] bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 rounded-lg transition-all shrink-0"
                                >
                                    <IconReturn />
                                    Return
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-5 py-10 flex flex-col items-center justify-center gap-2 text-slate-400">
                        <IconPackage />
                        <p className="text-sm font-semibold text-slate-500 mt-1">Tidak ada pinjaman aktif</p>
                        <p className="text-xs text-slate-400 text-center max-w-[220px]">
                            {nomorPegawai.trim()
                                ? "Semua barang sudah dikembalikan."
                                : "Masukkan Employee ID untuk sinkronisasi otomatis."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
