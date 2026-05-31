// app/so/components/tabs/DashboardTab.tsx
"use client";

import type { InventoryItem, DashboardStats, SBAAlert } from "../../types";

interface DashboardTabProps {
    inventoryList: InventoryItem[];
    dashboardStats: DashboardStats;
    sbaAlerts: SBAAlert[];
}

export const DashboardTab = ({ inventoryList, dashboardStats, sbaAlerts }: DashboardTabProps) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* 1. STATS ROW */}
            <div className="grid grid-cols-12 gap-x-16 gap-y-6">
                {[
                    { label: "Total Barang", value: inventoryList.length, icon: "📦", color: "text-[#00ed64]", bg: "bg-[#00ed64]/10" },
                    { label: "Stok Menipis", value: dashboardStats.lowStockCount, icon: "⚠️", color: "text-red-400", bg: "bg-red-500/10" },
                    { label: "Pending Req", value: dashboardStats.pendingReqCount, icon: "⏳", color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Total Transaksi", value: dashboardStats.totalBorrowings, icon: "📜", color: "text-green-400", bg: "bg-green-500/10" }
                ].map((stat, idx) => (
                    <div
                        key={idx}
                        className="col-span-12 sm:col-span-6 lg:col-span-3 bg-[#001e2b] p-6 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all flex items-center gap-4 group"
                    >
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center text-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.04)]`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] leading-tight mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-12 gap-x-16 gap-y-6">
                {/* 2. TOP ITEMS CHART */}
                <div className="col-span-12 lg:col-span-6 bg-[#001e2b] p-8 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white/5 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] rounded-xl flex items-center justify-center">🔥</div>
                        <h3 className="text-base font-black text-white uppercase tracking-tight leading-normal">Barang Paling Sering Diambil</h3>
                    </div>
                    <div className="space-y-6">
                        {dashboardStats.topItems.map(([name, count]) => (
                            <div key={name} className="space-y-3 group">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                                    <span className="truncate max-w-[70%]">{name}</span>
                                    <span>{count} Unit</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                                    <div
                                        className="h-full bg-[#00ed64] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,237,100,0.25)]"
                                        style={{ width: `${(count / dashboardStats.maxItemCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {dashboardStats.topItems.length === 0 && (
                            <p className="text-center py-10 text-white/20 font-bold text-sm">Belum ada data pengambilan.</p>
                        )}
                    </div>
                </div>

                {/* 3. TOP USERS CHART */}
                <div className="col-span-12 lg:col-span-6 bg-[#001e2b] p-8 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-all">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[#00ed64]/15 text-[#00ed64] shadow-[0_0_0_1px_rgba(0,237,100,0.25)] rounded-xl flex items-center justify-center">👤</div>
                        <h3 className="text-base font-black text-white uppercase tracking-tight leading-normal">Peminjam Teraktif</h3>
                    </div>
                    <div className="space-y-6">
                        {dashboardStats.topUsers.map(([user, count]) => (
                            <div key={user} className="space-y-3 group">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">
                                    <span className="truncate max-w-[70%]">{user}</span>
                                    <span>{count} Kali</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                                    <div
                                        className="h-full bg-white/80 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                        style={{ width: `${(count / dashboardStats.maxUserCount) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {dashboardStats.topUsers.length === 0 && (
                            <p className="text-center py-10 text-white/20 font-bold text-sm">Belum ada data peminjam.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. SBA FORECAST TABLE */}
            <div className="mt-8 bg-[#001e2b] p-8 rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600/20 text-purple-400 shadow-[0_0_0_1px_rgba(168,85,247,0.2)] rounded-xl flex items-center justify-center">🧠</div>
                        <div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight leading-normal">SBA Smart Forecast</h3>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Syntetos-Boylan Approximation • Decision Support</p>
                        </div>
                    </div>
                    <div className="md:ml-auto flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 bg-white/5 text-white/50 rounded-full text-[10px] font-bold border border-white/10">α = 0.30 default</span>
                        <span className="px-2.5 py-1 bg-white/5 text-white/50 rounded-full text-[10px] font-bold border border-white/10">Bias Correction: 0.85</span>
                        <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-full text-[10px] font-bold border border-purple-500/20">21 weeks analyzed</span>
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="border-b border-white/5 text-white/30 text-[10px] font-black uppercase tracking-widest">
                                <th className="py-4 pr-4">
                                    <div>Nama Item</div>
                                    <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">Activity info</div>
                                </th>
                                <th className="py-4 px-4 text-center">
                                    <div>Stok</div>
                                    <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">Current</div>
                                </th>
                                <th className="py-4 px-4 text-center">
                                    <div>Forecast Loan</div>
                                    <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">unit/minggu</div>
                                </th>
                                <th className="py-4 px-4 text-center">
                                    <div>Forecast Cons</div>
                                    <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">unit/minggu</div>
                                </th>
                                <th className="py-4 px-4 text-center">
                                    <div>Safety Stock</div>
                                    <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">Loan × 1.5</div>
                                </th>
                                <th className="py-4 px-4 text-center">
                                    <div>ROP</div>
                                    <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">Cons×LT+SS</div>
                                </th>
                                <th className="py-4 px-4 text-center">
                                    <div>Params</div>
                                    <div className="text-[8px] font-normal normal-case tracking-normal text-white/20 mt-0.5">α / LT</div>
                                </th>
                                <th className="py-4 pl-4 text-right">Rekomendasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sbaAlerts.slice(0, 10).map((alert) => (
                                <tr key={alert.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 pr-4">
                                        <div className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{alert.part_name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-white/30 font-mono">{alert.positivePeriods}/{alert.dataPoints}w active</span>
                                            {alert.part_number && (
                                                <span className="text-[10px] text-white/20 font-mono truncate max-w-[80px]">{alert.part_number}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`inline-block min-w-[3rem] py-1 px-3 rounded-lg font-black text-sm ${Number(alert.quantity) <= 5 ? "bg-red-500/10 text-red-400" : "bg-[#00ed64]/10 text-[#00ed64]"
                                            }`}>{alert.quantity}</span>
                                    </td>
                                    <td className="py-4 px-4 text-center text-sm font-bold text-blue-400">{alert.sbaLoan}</td>
                                    <td className="py-4 px-4 text-center text-sm font-bold text-purple-400">{alert.sbaCons}</td>
                                    <td className="py-4 px-4 text-center text-sm font-bold text-amber-400">{alert.safetyStock}</td>
                                    <td className="py-4 px-4 text-center text-sm font-bold text-slate-300">{alert.rop}</td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="text-xs font-mono text-white/50">
                                            <span className="text-white/70">{alert.alpha}</span>
                                            <span className="text-white/20">/</span>
                                            <span className="text-white/70">{alert.leadTime}w</span>
                                        </div>
                                    </td>
                                    <td className="py-4 pl-4 text-right">
                                        <span className={`inline-block px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${alert.color}`}>
                                            {alert.status}: {alert.action}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {sbaAlerts.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-20 text-center">
                                        <div className="text-4xl mb-4 opacity-20">📊</div>
                                        <p className="text-white/30 font-bold">Belum ada data untuk forecast</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="mt-6 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                    <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                            <span className="text-white/50">Loan = Barang dipinjam & dikembalikan</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            <span className="text-white/50">Cons = Barang habis dipakai (perlu reorder)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span className="text-white/50">SS = Buffer stok untuk demand variability</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                            <span className="text-white/50">ROP = Titik trigger pembelian ke supplier</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};