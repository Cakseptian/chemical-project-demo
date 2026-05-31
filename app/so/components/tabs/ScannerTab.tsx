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
        <div className="w-full max-w-md mx-auto min-h-[calc(100vh-12rem)] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!isScanning && !isLoadingScan && !itemData && !errorMsg && (
                <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 text-center group">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-4xl">📷</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Start Stock Opname</h3>
                    <p className="text-slate-500 text-sm mb-8">Point camera at QR Code to perform physical inventory audit.</p>
                    <button
                        onClick={() => setIsScanning(true)}
                        className="w-full bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-4 px-6 rounded-full shadow-[0_0_0_1px_rgba(0,237,100,0.25)] transition-all active:scale-95"
                    >
                        Start Scanning
                    </button>
                </div>
            )}
            {isScanning && (
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200 text-center animate-in zoom-in-95 duration-300">
                    <div className="mb-4 flex items-center justify-center gap-2 text-slate-500 font-medium">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-slate-500 font-medium">Scanning in progress...</span>
                    </div>
                    <QRScanner onScanSuccess={handleScanSuccess} />
                    <button
                        onClick={() => setIsScanning(false)}
                        className="mt-6 w-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold py-3 rounded-xl transition-colors"
                    >
                        Cancel Scanning
                    </button>
                </div>
            )}
            {isLoadingScan && (
                <div className="bg-white p-20 rounded-3xl shadow-xl border border-slate-200 text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-[#00ed64] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500 font-bold">Searching for item data...</p>
                </div>
            )}
            {errorMsg && !isLoadingScan && (
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-red-100 text-center animate-in shake duration-500">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-lg font-bold text-red-600 mb-2">Error Encountered</h3>
                    <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
                    <button
                        onClick={resetScanTampilan}
                        className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
            {itemData && !isLoadingScan && (
                <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-200 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                    <div className="bg-[#001e2b] p-8 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ed64]/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                        <span className="inline-block px-3 py-1 bg-[#00ed64]/15 text-[#00ed64] rounded-full text-[10px] font-black uppercase tracking-widest mb-3">Audit Item</span>
                        <h2 className="text-2xl font-black">{itemData.part_name}</h2>
                        <div className="mt-6 flex items-end justify-between">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Stok Sistem</p>
                                <p className="text-3xl font-black text-amber-400">{itemData.quantity} <span className="text-sm font-medium text-slate-400 uppercase tracking-normal">unit</span></p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Lokasi</p>
                                <p className="text-lg font-bold text-slate-200">{itemData.location || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50/50">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Input Stok Fisik Aktual</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={stokFisik}
                                onChange={(e) => setStokFisik(e.target.value ? Number(e.target.value) : "")}
                                className="w-full bg-white border-2 border-slate-200 focus:border-[#00ed64] rounded-2xl p-6 text-3xl font-black text-center text-slate-900 transition-all outline-none shadow-sm"
                                placeholder="0"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={resetScanTampilan}
                                className="flex-1 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 py-4 rounded-2xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStok}
                                disabled={isSubmitting}
                                className="flex-1 bg-[#00ed64] hover:bg-[#00b545] disabled:bg-slate-300 text-[#001e2b] py-4 rounded-full font-black shadow-lg shadow-[0_0_0_1px_rgba(0,237,100,0.25)] transition-all active:scale-95"
                            >
                                {isSubmitting ? "Updating..." : "Adjust"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};