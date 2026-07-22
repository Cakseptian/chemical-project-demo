"use client";
import { Warning, QrCode, ArrowRight, CheckCircle } from "@phosphor-icons/react";
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
                    type="button"
                    onClick={() => setIsScanning(false)}
                    className="mt-6 w-full bg-slate-100 hover:bg-red-50 text-red-900 hover:text-red-600 font-bold py-3 rounded-full transition-colors"
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
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center animate-in fade-in duration-300 mb-6">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Warning weight="fill" className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-red-600 mb-2">Failed to Read QR Code</h3>
                <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
                <div className="flex gap-3">
                    <button type="button"
                        onClick={() => { setErrorMsg(null); setIsScanning(true); }}
                        className="flex-1 bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] font-black py-3 rounded-full transition-colors shadow-sm"
                    >
                        Retry
                    </button>
                    <button
                        type="button"
                        onClick={() => setErrorMsg(null)}
                        className="flex-1 bg-slate-100 text-red-900 font-bold py-3 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setIsScanning(true)}
            className="w-full bg-[#001e2b] hover:bg-[#00293b] active:bg-[#001520] text-white rounded-2xl p-6 sm:p-8 text-left transition-colors mb-6 group relative overflow-hidden focus:outline-none"
        >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00ed64]/5 rounded-full blur-3xl -mr-12 -mt-12"></div>
            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/15 transition-colors">
                        <QrCode weight="bold" className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight
                        weight="bold"
                        className="w-5 h-5 text-white/40 group-hover:text-white/80 group-hover:translate-x-0.5 transition-colors"
                    />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">Scan to borrow item</h2>
                <p className="text-sm text-white/60 leading-relaxed">
                    Arahkan kamera ke QR Code label barang untuk menambahkannya ke keranjang peminjaman.
                </p>
                <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/10">
                    <CheckCircle weight="fill" className="w-4 h-4 text-[#00ed64]" />
                    <span className="text-xs text-white/50">Self-service QR scanner aktif</span>
                </div>
            </div>
        </button>
    );
};
