// app/so/components/tabs/RequestsTab.tsx
"use client";

import type { ItemRequest } from "../../types";

interface RequestsTabProps {
    requestList: ItemRequest[];
    isLoading: boolean;
    onSelesaikan: (id: number, namaBarang: string) => void;
    onHapus: (id: number) => void;
}

const IconCheck = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
);

const IconTrash = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
);

const IconInbox = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661z" />
    </svg>
);

export const RequestsTab = ({ requestList, isLoading, onSelesaikan, onHapus }: RequestsTabProps) => {
    return (
        <div className="flex flex-col gap-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            {/* ── HEADER ──────────────────────────────────────────────── */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Antrean Request</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kelola pengajuan stok barang dari karyawan.</p>
            </div>

            {/* ── TABEL ────────────────────────────────────────────────── */}
            <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="py-24 flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-navy-800 rounded-full animate-spin" />
                        <p className="text-sm text-slate-400 font-medium">Memuat data request...</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Tanggal</th>
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Info Request</th>
                                <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Keterangan</th>
                                <th className="text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                                <th className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requestList.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                                            <IconInbox />
                                            <p className="text-sm font-semibold text-slate-500">Tidak ada antrean request</p>
                                            <p className="text-xs">Semua pengajuan stok dari karyawan akan muncul di sini.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                requestList.map((req: ItemRequest) => (
                                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors group">

                                        {/* Tanggal */}
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-800 leading-snug">
                                                {new Date(req.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                {new Date(req.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </td>

                                        {/* Info Request */}
                                        <td className="px-4 py-4">
                                            <p className="font-semibold text-slate-800 leading-snug">{req.nama_barang}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="bg-slate-100 text-slate-600 border border-slate-200 py-0.5 px-2 rounded text-[11px] font-semibold">
                                                    {req.jumlah} unit
                                                </span>
                                                <span className="text-[11px] text-slate-400">oleh {req.nama_peminjam}</span>
                                            </div>
                                        </td>

                                        {/* Keterangan */}
                                        <td className="px-4 py-4 max-w-xs">
                                            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap break-words">
                                                {req.keterangan || <span className="text-slate-300 not-italic">—</span>}
                                            </p>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-4 text-center">
                                            {req.status === "PENDING" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-semibold">
                                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-semibold">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                                    Selesai
                                                </span>
                                            )}
                                        </td>

                                        {/* Aksi */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                {req.status === "PENDING" && (
                                                    <button type="button"
                                                        onClick={() => onSelesaikan(req.id, req.nama_barang)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 rounded-lg transition-colors"
                                                        title="Tandai Selesai"
                                                    >
                                                        <IconCheck />
                                                        Selesaikan
                                                    </button>
                                                )}
                                                <button type="button"
                                                    onClick={() => onHapus(req.id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Hapus"
                                                >
                                                    <IconTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
