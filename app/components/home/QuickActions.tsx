"use client";

interface QuickActionsProps {
    onReturn: () => void;
    onFindLocation: () => void;
    onRequest: () => void;
}

export const QuickActions = ({ onReturn, onFindLocation, onRequest }: QuickActionsProps) => {
    return (
        <div className="mb-8">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                    onClick={onReturn}
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-5 text-left transition-all group shadow-sm focus:outline-none"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                            </svg>
                        </div>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">Return item</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Kembalikan barang pinjaman (Sisa / Habis)</p>
                </button>

                <button
                    onClick={onFindLocation}
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-5 text-left transition-all group shadow-sm focus:outline-none"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                            </svg>
                        </div>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">Find location</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Cari laci, posisi rak, dan stok barang</p>
                </button>

                <button
                    onClick={onRequest}
                    className="bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-5 text-left transition-all group shadow-sm focus:outline-none"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
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