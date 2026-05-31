// app/so/components/tabs/HistoryTab.tsx
"use client";

import type { TransactionLog } from "../../types";

interface HistoryTabProps {
    historyList: TransactionLog[];
    isLoading: boolean;
}

export const HistoryTab = ({ historyList, isLoading }: HistoryTabProps) => {
    return (
        <div className="bg-[#001e2b] text-white rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 grid grid-cols-12 gap-x-16 gap-y-6 items-start lg:items-center">
                <div className="col-span-12">
                    <h2 className="text-base font-black tracking-tight leading-normal">Log Aktivitas</h2>
                    <p className="text-sm text-white/50 font-medium leading-normal">Pantau pergerakan stok dan penyesuaian audit.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                        <p className="text-white/40 font-medium">Memuat histori...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="shadow-[0_1px_0_0_rgba(255,255,255,0.06)] text-white/30 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-4">Waktu & Tanggal</th>
                                <th className="px-8 py-4">User / Peminjam</th>
                                <th className="px-8 py-4">Detail Item</th>
                                <th className="px-8 py-4 text-right">Perubahan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {historyList.map((log: TransactionLog) => (
                                <tr key={log.id} className="group transition-colors hover:bg-white/[0.02] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                                    <td className="px-8 py-6">
                                        <p className="text-base font-bold text-white/90 group-hover:text-white transition-colors leading-normal">
                                            {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] text-white/30 font-medium uppercase mt-0.5">
                                            {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        {log.nama_peminjam === "ADMIN (SO)" ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider shadow-[0_0_0_1px_rgba(251,191,36,0.2)]">
                                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                                Audit Admin
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] rounded-lg flex items-center justify-center text-xs font-black text-white/40 uppercase group-hover:text-white/60 transition-colors">
                                                    {log.nama_peminjam?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-base font-extrabold text-white/90 group-hover:text-white transition-colors leading-normal break-words">{log.nama_peminjam}</p>
                                                    <p className="text-[10px] font-mono text-white/30 mt-0.5">Employee ID: {log.nomor_pegawai || "—"}</p>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-base font-bold text-white/70 group-hover:text-white transition-colors leading-normal break-words">{log.part_name}</p>
                                        <p className="text-[10px] text-white/30 mt-0.5 font-mono">{log.part_number || "No Part Number"}</p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className={`inline-flex items-center justify-end font-black text-sm ${log.jumlah < 0 ? "text-red-400" : "text-green-400"}`}>
                                            {log.jumlah > 0 ? (
                                                <span className="mr-1 opacity-50">▲</span>
                                            ) : (
                                                <span className="mr-1 opacity-50">▼</span>
                                            )}
                                            {Math.abs(log.jumlah)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {historyList.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="text-4xl mb-4 opacity-20">📜</div>
                                        <p className="text-white/30 font-bold">Belum ada riwayat aktivitas.</p>
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