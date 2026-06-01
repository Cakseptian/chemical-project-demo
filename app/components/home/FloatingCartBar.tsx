"use client";

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
                    onClick={onOpen}
                    className="w-full bg-[#00ed64] hover:bg-[#00b545] active:bg-[#00b545] text-[#001e2b] rounded-xl p-4 flex items-center justify-between shadow-lg shadow-[#00ed64]/20 transition-all group focus:outline-none"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-[#001e2b] rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-[#00ed64]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                            </div>
                            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500 border-2 border-white text-white text-[10px] font-black rounded-full flex items-center justify-center tabular-nums shadow-sm animate-pulse">
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
                        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    );
};