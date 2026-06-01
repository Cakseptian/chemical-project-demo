"use client";
import { getRelativeTime } from "@/app/utils/timeUtils";
import type { TeamActivity } from "@/app/types";

interface TeamFeedProps {
    teamActivities: TeamActivity[];
    isLoadingTeam: boolean;
    onRefresh: () => void;
}

export const TeamFeed = ({ teamActivities, isLoadingTeam, onRefresh }: TeamFeedProps) => {
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-300">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase">Recent from your team</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Aktivitas penyesuaian terbaru di hangar</p>
                </div>
                <button
                    onClick={onRefresh}
                    className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-600"
                    title="Muat Ulang"
                >
                    🔄
                </button>
            </div>

            <div className="divide-y divide-slate-100">
                {isLoadingTeam && teamActivities.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full mx-auto"></div>
                    </div>
                ) : teamActivities.length > 0 ? (
                    teamActivities.map((act) => {
                        const isReturn = act.transaction_type === "RETURN";
                        const isConsumed = act.transaction_type?.includes("CONSUME") || act.transaction_type === "RETURN_HABIS";
                        return (
                            <div key={act.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/40 transition-colors">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border ${isReturn ? "bg-blue-50 border-blue-100 text-blue-600" :
                                    isConsumed ? "bg-red-50 border-red-100 text-red-500" :
                                        "bg-emerald-50 border-emerald-100 text-emerald-600"
                                    }`}>
                                    {isReturn ? (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                        </svg>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        <span className="font-semibold text-slate-800">{act.nama_peminjam}</span>
                                        {isReturn ? " returned " : isConsumed ? " consumed " : " borrowed "}
                                        <span className="font-semibold text-slate-900">{act.part_name}</span>
                                        <span className="text-[10px] text-slate-400 font-mono ml-1.5 bg-slate-100 px-1 py-0.5 rounded">
                                            {Math.abs(act.jumlah)} unit
                                        </span>
                                    </p>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold tracking-tight tabular-nums shrink-0">
                                    {getRelativeTime(act.created_at)}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">Belum ada aktivitas baru dari hangar.</div>
                )}
            </div>
        </div>
    );
};