// app/so/components/tabs/HistoryTab.tsx
"use client";

import type { TransactionLog } from "../../types";

interface HistoryTabProps {
    historyList: TransactionLog[];
    isLoading: boolean;
}

export const HistoryTab = ({ historyList, isLoading }: HistoryTabProps) => {
    return (
        <div className="bg-white text-slate-800 rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 grid grid-cols-12 gap-x-16 gap-y-6 items-start lg:items-center border-b border-slate-100">
                <div className="col-span-12">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-normal uppercase">Log Aktivitas</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Pantau pergerakan stok dan penyesuaian audit.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-400 text-sm font-semibold">Memuat histori...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                <th className="px-8 py-4">Waktu & Tanggal</th>
                                <th className="px-8 py-4">User / Peminjam</th>
                                <th className="px-8 py-4">Detail Item</th>
                                <th className="px-8 py-4 text-right">Perubahan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historyList.map((log: TransactionLog) => (
                                <tr key={log.id} className="group transition-colors hover:bg-slate-50/50">
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-slate-950 transition-colors leading-normal">
                                            {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                            {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5">
                                        {log.nama_peminjam === "ADMIN (SO)" ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                                Audit Admin
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-xs font-black text-slate-600 uppercase group-hover:bg-slate-200 transition-colors">
                                                    {log.nama_peminjam?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-extrabold text-slate-800 group-hover:text-slate-950 transition-colors leading-normal break-words">{log.nama_peminjam}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">Employee ID: {log.nomor_pegawai || "—"}</p>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-normal break-words">{log.part_name}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{log.part_number || "No Part Number"}</p>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className={`inline-flex items-center justify-end font-black text-sm ${log.jumlah < 0 ? "text-red-500" : "text-emerald-600"}`}>
                                            {log.jumlah > 0 ? (
                                                <span className="mr-1 opacity-60">▲</span>
                                            ) : (
                                                <span className="mr-1 opacity-60">▼</span>
                                            )}
                                            {Math.abs(log.jumlah)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {historyList.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="text-4xl mb-4 opacity-30">📜</div>
                                        <p className="text-slate-400 font-bold text-sm">Belum ada riwayat aktivitas.</p>
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