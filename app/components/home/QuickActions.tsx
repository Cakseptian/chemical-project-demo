"use client";
import { ArrowUUpLeft, MapPin, Warning } from "@phosphor-icons/react";

interface QuickActionsProps {
    onReturn: () => void;
    onFindLocation: () => void;
    onRequest: () => void;
}

export const QuickActions = ({ onReturn, onFindLocation, onRequest }: QuickActionsProps) => {
    return (
        <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button type="button"
                    onClick={onReturn}
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-5 text-left transition-colors group shadow-sm focus:outline-none active:scale-[0.98]"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <ArrowUUpLeft weight="bold" className="w-5 h-5" />
                        </div>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">Return item</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Kembalikan barang pinjaman (Sisa / Habis)</p>
                </button>

                <button type="button"
                    onClick={onFindLocation}
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-5 text-left transition-colors group shadow-sm focus:outline-none active:scale-[0.98]"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                            <MapPin weight="bold" className="w-5 h-5" />
                        </div>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">Find location</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Cari laci, posisi rak, dan stok barang</p>
                </button>

                <button type="button"
                    onClick={onRequest}
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-5 text-left transition-colors group shadow-sm focus:outline-none active:scale-[0.98]"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                            <Warning weight="bold" className="w-5 h-5" />
                        </div>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">Request item</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Ajukan request jika barang kosong/habis</p>
                </button>
            </div>
        </div>
    );
};
