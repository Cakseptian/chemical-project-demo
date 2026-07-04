// app/so/components/tabs/HistoryTab.tsx
"use client";

import type { TransactionLog } from "../../types";

interface HistoryTabProps {
    historyList: TransactionLog[];
    isLoading: boolean;
}

const IconArrowUp = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);

const IconArrowDown = () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7" />
    </svg>
);

const IconScroll = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
    </svg>
);

// Label dan warna per tipe transaksi
const TX_TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    LOAN:          { label: "Dipinjam",   bg: "bg-sky-100",     text: "text-sky-700" },
    RETURN:        { label: "Dikembalikan", bg: "bg-emerald-100", text: "text-emerald-700" },
    CONSUMED_BULK: { label: "Terpakai",   bg: "bg-violet-100",  text: "text-violet-700" },
    RETURN_HABIS:  { label: "Habis",      bg: "bg-orange-100",  text: "text-orange-700" },
    LOST:          { label: "Hilang",     bg: "bg-red-100",     text: "text-red-700" },
    ADMIN_SO:      { label: "Stock Opname", bg: "bg-amber-100", text: "text-amber-700" },
};

export const HistoryTab = ({ historyList, isLoading }: HistoryTabProps) => {
    return (
        <div className="flex flex-col gap-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            {/* ── HEADER ──────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Log Aktivitas</h2>
                <p className="text-xs text-slate-500 mt-0.5">Pantau pergerakan stok dan penyesuaian audit.</p>
            </div>

            {/* ── TABEL ────────────────────────────────────────────────── */}
            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-navy-800 rounded-full animate-spin" />
                        <p className="text-sm text-slate-400 font-medium">Memuat histori...</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Waktu</th>
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Pengguna</th>
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Item</th>
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Tipe</th>
                                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Delta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historyList.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                                            <IconScroll />
                                            <p className="text-sm font-semibold text-slate-500">Belum ada riwayat aktivitas</p>
                                            <p className="text-xs">Transaksi akan muncul di sini setelah pertama kali terjadi.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                historyList.map((log: TransactionLog) => {
                                    const txConfig = TX_TYPE_CONFIG[log.transaction_type] ?? { label: log.transaction_type, bg: "bg-slate-100", text: "text-slate-600" };
                                    const isPositive = log.jumlah > 0;

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors group">

                                            {/* Waktu */}
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800 leading-snug">
                                                    {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                    {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </td>

                                            {/* Pengguna */}
                                            <td className="px-4 py-4">
                                                {log.nama_peminjam === "ADMIN (SO)" ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-semibold">
                                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                                        Audit Admin
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-600 uppercase shrink-0">
                                                            {log.nama_peminjam?.charAt(0) || "?"}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-800 leading-snug">{log.nama_peminjam}</p>
                                                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{log.nomor_pegawai || "—"}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Item */}
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-slate-800 leading-snug">{log.part_name}</p>
                                                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{log.part_number || "—"}</p>
                                            </td>

                                            {/* Tipe transaksi */}
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${txConfig.bg} ${txConfig.text}`}>
                                                    {txConfig.label}
                                                </span>
                                            </td>

                                            {/* Delta */}
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center justify-end gap-1 font-bold tabular-nums text-sm ${
                                                    isPositive ? "text-emerald-600" : "text-red-500"
                                                }`}>
                                                    {isPositive ? <IconArrowUp /> : <IconArrowDown />}
                                                    {Math.abs(log.jumlah)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
