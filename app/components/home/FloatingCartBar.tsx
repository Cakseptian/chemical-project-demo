"use client";
import { ShoppingCart, ArrowRight } from "@phosphor-icons/react";

interface FloatingCartBarProps {
    cartLength: number;
    onOpen: () => void;
}

export const FloatingCartBar = ({ cartLength, onOpen }: FloatingCartBarProps) => {
    if (cartLength === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-30 animate-in slide-in-from-bottom duration-300">
            <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none"></div>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-4">
                <button
                    type="button"
                    onClick={onOpen}
                    className="w-full bg-[#00ed64] hover:bg-[#00b545] active:bg-[#00b545] text-[#001e2b] rounded-xl p-4 flex items-center justify-between shadow-lg shadow-[#00ed64]/20 transition-colors group focus:outline-none"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-[#001e2b] rounded-lg flex items-center justify-center">
                                <ShoppingCart weight="bold" className="w-5 h-5 text-[#00ed64]" />
                            </div>
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 border-2 border-white text-white text-[10px] font-black rounded-full flex items-center justify-center tabular-nums shadow-sm">
                                {cartLength}
                            </span>
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-extrabold leading-tight">{cartLength} item dalam keranjang</p>
                            <p className="text-xs text-[#001e2b]/60 leading-tight mt-0.5">Tekan untuk review & checkout</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-xs font-bold uppercase tracking-wider">Review</span>
                        <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </button>
            </div>
        </div>
    );
};
