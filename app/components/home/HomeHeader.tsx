"use client";

interface HomeHeaderProps {
    namaPeminjam: string;
}

export const HomeHeader = ({ namaPeminjam }: HomeHeaderProps) => {
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00ed64] rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#001e2b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
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
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Admin</span>
                    </a>
                </div>
            </div>
        </header>
    );
};