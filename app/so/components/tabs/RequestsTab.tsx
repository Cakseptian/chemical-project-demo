// app/so/components/tabs/RequestsTab.tsx
"use client";

import type { ItemRequest } from "../../types";

interface RequestsTabProps {
    requestList: ItemRequest[];
    isLoading: boolean;
    onSelesaikan: (id: number, namaBarang: string) => void;
    onHapus: (id: number) => void;
}

export const RequestsTab = ({ requestList, isLoading, onSelesaikan, onHapus }: RequestsTabProps) => {
    return (
        <div className="bg-white text-slate-800 rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 grid grid-cols-12 gap-x-16 gap-y-6 items-start lg:items-center border-b border-slate-100">
                <div className="col-span-12">
                    <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-normal uppercase">Antrean Request</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Kelola pengajuan stok barang dari karyawan.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-slate-200 border-t-slate-800 rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-400 text-sm font-semibold">Memuat data request...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                <th className="px-8 py-4">Tanggal</th>
                                <th className="px-8 py-4">Info Request</th>
                                <th className="px-8 py-4">Keterangan</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requestList.map((req: ItemRequest) => (
                                <tr key={req.id} className="group transition-colors hover:bg-slate-50/50">
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-slate-950 transition-colors leading-normal">
                                            {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                            {new Date(req.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-sm font-extrabold text-slate-800 group-hover:text-slate-950 transition-colors leading-normal break-words">{req.nama_barang}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-slate-100 text-slate-600 border border-slate-200 py-0.5 px-2 rounded-full text-[10px] font-bold">{req.jumlah} unit</span>
                                            <span className="text-xs text-slate-400 font-medium italic">oleh {req.nama_peminjam}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-xs text-slate-500 italic max-w-xs leading-normal whitespace-pre-wrap break-words">{req.keterangan || "-"}</p>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {req.status === "PENDING" ? (
                                            <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                                                ⏳ PENDING
                                            </span>
                                        ) : (
                                            <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                                ✅ SELESAI
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-end items-center gap-3">
                                            {req.status === "PENDING" && (
                                                <button
                                                    onClick={() => onSelesaikan(req.id, req.nama_barang)}
                                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:border-[#00ed64]/40 hover:bg-[#00ed64]/10 text-slate-600 hover:text-[#00b545] rounded-full transition-all text-xs font-bold"
                                                    title="Tandai Selesai"
                                                >
                                                    ✓ Selesaikan
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onHapus(req.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Hapus Log"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requestList.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="text-4xl mb-4 opacity-30">📥</div>
                                        <p className="text-slate-400 font-bold text-sm">Yeay! Tidak ada antrean request.</p>
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