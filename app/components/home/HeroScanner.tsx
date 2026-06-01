"use client";
import QRScanner from "@/components/QRScanner";

interface HeroScannerProps {
    isScanning: boolean;
    setIsScanning: (val: boolean) => void;
    isLoading: boolean;
    errorMsg: string | null;
    setErrorMsg: (val: string | null) => void;
    onScanSuccess: (text: string) => void;
}

export const HeroScanner = ({
    isScanning, setIsScanning, isLoading, errorMsg, setErrorMsg, onScanSuccess,
}: HeroScannerProps) => {
    if (isScanning) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 text-center animate-in zoom-in-95 duration-300 mb-6">
                <div className="mb-4 flex items-center justify-center gap-2 text-slate-500 font-medium">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-slate-500 font-semibold">Scanning in progress...</span>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-inner border border-slate-100 max-w-sm mx-auto">
                    <QRScanner onScanSuccess={onScanSuccess} />
                </div>
                <button
                    onClick={() => setIsScanning(false)}
                    className="mt-6 w-full bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold py-3 rounded-xl transition-all"
                >
                    Cancel Scanning
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="bg-white p-16 rounded-2xl shadow-lg border border-slate-200 text-center animate-in fade-in duration-300 mb-6">
                <div className="animate-spin w-10 h-10 border-4 border-[#00ed64] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-500 font-bold text-sm">Searching inventory data...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center animate-in shake duration-500 mb-6">
                <div className="text-5xl mb-4">⚠️</div>
                <h3 className="text-lg font-bold text-red-600 mb-2">Failed to Read QR Code</h3>
                <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setErrorMsg(null); setIsScanning(true); }}
                        className="flex-1 bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-3 rounded-xl transition-all shadow-sm"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => setErrorMsg(null)}
                        className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsScanning(true)}
            className="w-full bg-[#001e2b] hover:bg-[#00293b] active:bg-[#001520] text-white rounded-2xl p-6 sm:p-8 text-left transition-all mb-6 group relative overflow-hidden focus:outline-none"
        >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00ed64]/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
                        </svg>
                    </div>
                    <svg className="w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">Scan to borrow item</h2>
                <p className="text-sm text-white/60 leading-relaxed">
                    Arahkan kamera ke QR Code label barang untuk menambahkannya ke keranjang peminjaman.
                </p>
                <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/10">
                    <div className="flex -space-x-1">
                        <div className="w-5 h-5 bg-[#00ed64] rounded-full border-2 border-navy-800 flex items-center justify-center">
                            <svg className="w-3 h-3 text-[#001e2b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <div className="w-5 h-5 bg-white/20 rounded-full border-2 border-navy-800"></div>
                        <div className="w-5 h-5 bg-white/20 rounded-full border-2 border-navy-800"></div>
                    </div>
                    <span className="text-xs text-white/50">Real-time self-service QR scanner active</span>
                </div>
            </div>
        </button>
    );
};