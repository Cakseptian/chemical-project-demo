"use client";
import { Gear, Package } from "@phosphor-icons/react";

interface HomeHeaderProps {
    namaPeminjam: string;
}

export const HomeHeader = ({ namaPeminjam }: HomeHeaderProps) => {
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00ed64] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package weight="bold" className="w-4 h-4 text-[#001e2b]" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 tracking-tight leading-tight">GMF Inventory</p>
                        <p className="text-[10px] font-medium text-slate-500 tracking-wide leading-tight">Self-Service</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {namaPeminjam.trim() && (
                        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                            <div className="w-5 h-5 bg-[#001e2b] rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-[9px] font-bold text-white uppercase">
                                    {namaPeminjam.substring(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[100px]">
                                {namaPeminjam}
                            </span>
                        </div>
                    )}

                    <a
                        href="/so"
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                    >
                        <Gear weight="bold" className="w-3.5 h-3.5" />
                        <span>Admin</span>
                    </a>
                </div>
            </div>
        </header>
    );
};
