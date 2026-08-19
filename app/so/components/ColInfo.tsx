"use client";
// app/so/components/ColInfo.tsx
// Column header tooltip component untuk SBA table di DashboardTab

const COL_INFO: Record<string, { title: string; body: string }> = {
    stock: {
        title: "Stock",
        body: "Jumlah unit fisik yang tersedia di gudang saat ini. Berkurang saat barang dipinjam atau dikonsumsi, bertambah kembali saat dikembalikan.",
    },
    loanFcst: {
        title: "Loan Forecast (SBA)",
        body: "Prediksi permintaan peminjaman per minggu menggunakan metode Syntetos-Boylan Approximation (SBA) — dirancang khusus untuk demand yang jarang terjadi (intermittent). Lebih akurat dari moving average biasa untuk barang yang tidak dipinjam setiap hari.",
    },
    consFcst: {
        title: "Consumption Forecast (Croston)",
        body: "Prediksi demand konsumsi per minggu menggunakan metode Croston, yang memisahkan dua faktor: seberapa sering barang dikonsumsi dan seberapa banyak per kejadian. Khusus untuk barang yang habis terpakai.",
    },
    safety: {
        title: "Safety Stock",
        body: "Buffer stok minimum yang harus selalu tersedia untuk mengantisipasi lonjakan demand atau keterlambatan pengadaan. Dihitung dari variabilitas demand historis × lead time. Jika stok aktual turun ke bawah angka ini, sistem akan memicu alert.",
    },
    rop: {
        title: "Reorder Point (ROP)",
        body: "Titik stok di mana proses pengadaan harus segera dimulai. Formula: ROP = (demand rata-rata × lead time) + safety stock. Jika qty ≤ ROP, tampil alert reorder.",
    },
    params: {
        title: "Parameters (α & Lead Time)",
        body: "Konfigurasi model forecasting per item:\n• Alpha (α): smoothing parameter SBA (0.05–0.50). Makin besar = makin reaktif terhadap demand terbaru.\n• Lead Time: estimasi waktu pengadaan dalam minggu. Makin panjang = safety stock makin besar.",
    },
};

export interface ColInfoProps {
    id: string;
    activeTooltip: string | null;
    setActiveTooltip: (id: string | null) => void;
}

export const ColInfo = ({ id, activeTooltip, setActiveTooltip }: ColInfoProps) => {
    const info = COL_INFO[id];
    if (!info) return null;
    const isOpen = activeTooltip === id;

    return (
        <span className="relative inline-flex ml-1 align-middle">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setActiveTooltip(isOpen ? null : id); }}
                aria-label={`Info tentang ${info.title}`}
                className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-400 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#00ed64]"
            >
                <svg className="w-2 h-2" viewBox="0 0 12 12" fill="currentColor">
                    <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" fill="none" />
                    <text x="6" y="9" textAnchor="middle" fontSize="7" fontWeight="bold" fontFamily="sans-serif">i</text>
                </svg>
            </button>
            {isOpen && (
                <div
                    className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#001e2b] text-white rounded-xl shadow-xl border border-white/10 p-3.5 text-left animate-in fade-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Arrow */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#001e2b] border-l border-t border-white/10 rotate-45" />
                    <p className="text-[11px] font-bold text-[#00ed64] uppercase tracking-wider mb-1.5">{info.title}</p>
                    <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">{info.body}</p>
                </div>
            )}
        </span>
    );
};
