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
        <div className="bg-[#001e2b] text-white rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 grid grid-cols-12 gap-x-16 gap-y-6 items-start lg:items-center">
                <div className="col-span-12">
                    <h2 className="text-base font-black tracking-tight leading-normal">Antrean Request</h2>
                    <p className="text-sm text-white/50 font-medium leading-normal">Kelola pengajuan stok barang dari karyawan.</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                        <p className="text-white/40 font-medium">Memuat data request...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="shadow-[0_1px_0_0_rgba(255,255,255,0.06)] text-white/30 text-[10px] font-black uppercase tracking-widest">
                                <th className="px-8 py-4">Tanggal</th>
                                <th className="px-8 py-4">Info Request</th>
                                <th className="px-8 py-4">Keterangan</th>
                                <th className="px-8 py-4 text-center">Status</th>
                                <th className="px-8 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {requestList.map((req: ItemRequest) => (
                                <tr key={req.id} className="group transition-colors hover:bg-white/[0.02] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                                    <td className="px-8 py-6">
                                        <p className="text-base font-bold text-white/90 group-hover:text-white transition-colors leading-normal">
                                            {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-[10px] text-white/30 font-medium uppercase mt-0.5">
                                            {new Date(req.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-base font-extrabold text-white/90 group-hover:text-white transition-colors leading-normal break-words">{req.nama_barang}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="bg-white/5 text-white/60 shadow-[0_0_0_1px_rgba(255,255,255,0.06)] py-0.5 px-2 rounded-full text-[10px] font-black">{req.jumlah} unit</span>
                                            <span className="text-xs text-white/30 font-medium italic">oleh {req.nama_peminjam}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-sm text-white/50 italic max-w-xs leading-normal whitespace-pre-wrap break-words">{req.keterangan || "-"}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        {req.status === "PENDING" ? (
                                            <span className="inline-block px-3 py-1 bg-amber-500/10 shadow-[0_0_0_1px_rgba(245,158,11,0.2)] text-amber-400 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                                                ⏳ PENDING
                                            </span>
                                        ) : (
                                            <span className="inline-block px-3 py-1 bg-[#00ed64]/10 shadow-[0_0_0_1px_rgba(0,237,100,0.25)] text-[#00ed64] rounded-full text-[10px] font-black uppercase tracking-wider">
                                                ✅ SELESAI
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-end items-center gap-3">
                                            {req.status === "PENDING" && (
                                                <button
                                                    onClick={() => onSelesaikan(req.id, req.nama_barang)}
                                                    className="px-3 py-1.5 bg-transparent hover:bg-[#00ed64]/10 text-white/40 hover:text-[#00ed64] shadow-[0_0_0_1px_rgba(255,255,255,0.06)] rounded-full transition-all text-xs font-bold border border-white/10"
                                                    title="Tandai Selesai"
                                                >
                                                    ✓ Selesaikan
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onHapus(req.id)}
                                                className="p-2 text-white/20 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
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
                                        <div className="text-4xl mb-4 opacity-20">📥</div>
                                        <p className="text-white/30 font-bold">Yeay! Tidak ada antrean request.</p>
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