// app/so/components/tabs/ScannerTab.tsx
"use client";

import QRScanner from "@/components/QRScanner";
import type { InventoryItem } from "../../types";

interface ScannerTabProps {
    isScanning: boolean;
    setIsScanning: (val: boolean) => void;
    isLoadingScan: boolean;
    itemData: InventoryItem | null;
    errorMsg: string | null;
    stokFisik: number | "";
    setStokFisik: (val: number | "") => void;
    isSubmitting: boolean;
    handleScanSuccess: (decodedText: string) => void;
    handleUpdateStok: () => void;
    resetScanTampilan: () => void;
}

const IconScan = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
    </svg>
);

const IconAlert = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);

export const ScannerTab = ({
    isScanning,
    setIsScanning,
    isLoadingScan,
    itemData,
    errorMsg,
    stokFisik,
    setStokFisik,
    isSubmitting,
    handleScanSuccess,
    handleUpdateStok,
    resetScanTampilan,
}: ScannerTabProps) => {
    return (
        <div className="w-full max-w-md mx-auto min-h-[calc(100vh-12rem)] flex flex-col justify-center gap-4">

            {/* ── STATE: Idle (belum scan) ─────────────────────────── */}
            {!isScanning && !isLoadingScan && !itemData && !errorMsg && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-5 text-slate-400">
                        <IconScan />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Stock Opname</h3>
                    <p className="text-slate-500 text-sm mb-6">Arahkan kamera ke QR Code barang untuk memulai audit stok fisik.</p>
                    <button type="button"
                        onClick={() => setIsScanning(true)}
                        className="w-full inline-flex items-center justify-center bg-accent hover:bg-accent-dark text-navy-800 font-bold py-3 px-6 rounded-lg transition-colors active:scale-95 text-sm"
                    >
                        Mulai Scanning
                    </button>
                </div>
            )}

            {/* ── STATE: Scanning (kamera aktif) ───────────────────── */}
            {isScanning && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                            </span>
                            <span className="text-sm font-semibold text-slate-700">Scanning in progress...</span>
                        </div>
                    </div>
                    <div className="p-4">
                        <QRScanner onScanSuccess={handleScanSuccess} />
                    </div>
                    <div className="px-4 pb-4">
                        <button type="button"
                            onClick={() => setIsScanning(false)}
                            className="w-full bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-600 font-semibold py-2.5 rounded-lg transition-colors text-sm"
                        >
                            Batalkan Scanning
                        </button>
                    </div>
                </div>
            )}

            {/* ── STATE: Loading (cari data item) ──────────────────── */}
            {isLoadingScan && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-16 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-2 border-slate-200 border-t-navy-800 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400 font-medium">Mencari data item...</p>
                </div>
            )}

            {/* ── STATE: Error ──────────────────────────────────────── */}
            {errorMsg && !isLoadingScan && (
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-5 text-red-400">
                        <IconAlert />
                    </div>
                    <h3 className="text-base font-bold text-red-600 mb-1">Terjadi Kesalahan</h3>
                    <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
                    <button type="button"
                        onClick={resetScanTampilan}
                        className="w-full bg-navy-800 hover:bg-navy-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {/* ── STATE: Item ditemukan (input stok fisik) ──────────── */}
            {itemData && !isLoadingScan && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                    {/* Item header */}
                    <div className="bg-navy-800 px-6 py-5 text-white">
                        <span className="inline-flex items-center px-2 py-0.5 bg-accent/15 text-accent rounded text-[10px] font-bold uppercase tracking-wider mb-3">
                            Audit Item
                        </span>
                        <h2 className="text-lg font-bold leading-snug">{itemData.part_name}</h2>
                        <div className="mt-4 flex items-end justify-between">
                            <div>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Stok Sistem</p>
                                <p className="text-2xl font-bold text-amber-400 tabular-nums">
                                    {itemData.quantity}
                                    <span className="text-sm font-normal text-slate-400 ml-1.5 normal-case tracking-normal">unit</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Lokasi</p>
                                <p className="text-sm font-semibold text-slate-200">{itemData.location || "—"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Input stok fisik */}
                    <div className="p-6">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">
                            Stok Fisik Aktual
                        </label>
                        <input
                            type="number"
                            value={stokFisik}
                            onChange={(e) => setStokFisik(e.target.value ? Number(e.target.value) : "")}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-navy-800 focus:ring-2 focus:ring-navy-800/20 rounded-lg px-4 py-4 text-3xl font-bold text-center text-slate-900 outline-none transition-colors"
                            placeholder="0"
                            autoFocus
                        />
                        <div className="flex gap-3 mt-5">
                            <button type="button"
                                onClick={resetScanTampilan}
                                className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold py-2.5 rounded-lg transition-colors text-sm"
                            >
                                Batal
                            </button>
                            <button type="button"
                                onClick={handleUpdateStok}
                                disabled={isSubmitting}
                                className="flex-1 bg-accent hover:bg-accent-dark disabled:bg-slate-200 disabled:text-slate-400 text-navy-800 font-bold py-2.5 rounded-lg transition-colors active:scale-95 text-sm"
                            >
                                {isSubmitting ? "Menyimpan..." : "Simpan Audit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
