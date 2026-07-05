"use client";
import { useEffect, useState } from "react";
import { getRelativeTime } from "@/app/utils/timeUtils";
import type { ActiveLoan } from "@/app/types";

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeLoans: ActiveLoan[];
    isFetchingLoans: boolean;
    isReturning: boolean;
    focusedLoanId?: number | null;
    onProsesReturn: (
        loanId: number,
        invId: number,
        qty: number,
        status: "HABIS" | "SISA",
        qtyDikembalikan?: number
    ) => Promise<{ ok: boolean; message: string }>;
}

// ponytail: per-card state — qty input + confirm step + feedback, all local
type CardState = {
    qtyInput: string;
    confirmingHabis: boolean;
    feedback: { ok: boolean; message: string } | null;
};

const defaultCardState = (): CardState => ({
    qtyInput: "",
    confirmingHabis: false,
    feedback: null,
});

export const ReturnModal = ({
    isOpen,
    onClose,
    activeLoans,
    isFetchingLoans,
    isReturning,
    focusedLoanId,
    onProsesReturn,
}: ReturnModalProps) => {
    // ponytail: map of loanId → CardState; initialised lazily
    const [cardStates, setCardStates] = useState<Record<number, CardState>>({});

    const getCard = (id: number): CardState =>
        cardStates[id] ?? defaultCardState();

    const patchCard = (id: number, patch: Partial<CardState>) =>
        setCardStates((prev) => ({
            ...prev,
            [id]: { ...getCard(id), ...patch },
        }));

    // Reset card states when modal opens
    useEffect(() => {
        if (isOpen) setCardStates({});
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    // When opened via quick-return, show only the focused loan
    const visibleLoans = focusedLoanId
        ? activeLoans.filter((l) => l.id === focusedLoanId)
        : activeLoans;

    const handleSisa = async (loan: ActiveLoan) => {
        const card = getCard(loan.id);
        const max = Math.abs(loan.jumlah);
        const qty = parseInt(card.qtyInput);
        if (isNaN(qty) || qty < 1 || qty > max) {
            patchCard(loan.id, {
                feedback: { ok: false, message: `Masukkan jumlah antara 1 – ${max}` },
            });
            return;
        }
        patchCard(loan.id, { feedback: null });
        const result = await onProsesReturn(loan.id, loan.inventory_id, max, "SISA", qty);
        if (!result.ok) patchCard(loan.id, { feedback: result });
        // On success the loan is removed from activeLoans by the hook, card disappears naturally
    };

    const handleHabisConfirm = async (loan: ActiveLoan) => {
        const max = Math.abs(loan.jumlah);
        patchCard(loan.id, { confirmingHabis: false, feedback: null });
        const result = await onProsesReturn(loan.id, loan.inventory_id, max, "HABIS");
        if (!result.ok) patchCard(loan.id, { feedback: result });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 border border-slate-200">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#001e2b] text-white shrink-0">
                    <div>
                        <h2 className="font-extrabold text-xl tracking-tight leading-normal uppercase">Return borrowed item</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pengembalian Barang Pinjaman</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Tutup modal"
                        className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto flex-1 bg-slate-100/30 space-y-3" data-lenis-prevent>
                    {isFetchingLoans ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#00ed64] rounded-full mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat pinjaman...</p>
                        </div>
                    ) : visibleLoans.length > 0 ? (
                        visibleLoans.map((loan) => {
                            const max = Math.abs(loan.jumlah);
                            const card = getCard(loan.id);

                            return (
                                <div key={loan.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                    {/* Loan header */}
                                    <div className="flex justify-between items-start mb-4 gap-2">
                                        <div className="min-w-0 pr-4">
                                            <h3 className="font-bold text-slate-800 leading-snug">{loan.part_name}</h3>
                                            <p className="text-[10px] font-mono text-slate-400 mt-1">
                                                {loan.part_number || "No Part Number"} · {getRelativeTime(loan.created_at)}
                                            </p>
                                        </div>
                                        <div className="shrink-0 px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100 font-mono tabular-nums">
                                            Dipinjam: {max}
                                        </div>
                                    </div>

                                    {/* Inline feedback */}
                                    {card.feedback && (
                                        <div
                                            role="alert"
                                            className={`mb-3 flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold ${card.feedback.ok
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-red-50 text-red-600 border border-red-200"
                                                }`}
                                        >
                                            <span className="mt-px">{card.feedback.ok ? "✓" : "✕"}</span>
                                            <span>{card.feedback.message}</span>
                                        </div>
                                    )}

                                    {/* HABIS confirmation step */}
                                    {card.confirmingHabis ? (
                                        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                                            <p className="text-sm font-semibold text-red-700 mb-3">
                                                Tandai <span className="font-black">{max} unit</span> sebagai habis terpakai?<br />
                                                <span className="text-xs font-normal text-red-500">Stok tidak dikembalikan ke inventori.</span>
                                            </p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => patchCard(loan.id, { confirmingHabis: false })}
                                                    className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg transition-colors hover:bg-slate-50 cursor-pointer focus:outline-none"
                                                >
                                                    Batal
                                                </button>
                                                <button
                                                    onClick={() => handleHabisConfirm(loan)}
                                                    disabled={isReturning}
                                                    className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer focus:outline-none"
                                                >
                                                    Ya, Habis Terpakai
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* SISA section — qty input + return button */}
                                            <div className="mb-3">
                                                <label
                                                    htmlFor={`qty-${loan.id}`}
                                                    className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5"
                                                >
                                                    Jumlah yang dikembalikan (maks. {max})
                                                </label>
                                                <div className="flex gap-2">
                                                    <input
                                                        id={`qty-${loan.id}`}
                                                        type="number"
                                                        min={1}
                                                        max={max}
                                                        value={card.qtyInput}
                                                        onChange={(e) => patchCard(loan.id, { qtyInput: e.target.value, feedback: null })}
                                                        placeholder={`1 – ${max}`}
                                                        className="flex-1 min-w-0 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00ed64]/40 focus:border-[#00ed64] tabular-nums"
                                                    />
                                                    <button
                                                        onClick={() => handleSisa(loan)}
                                                        disabled={isReturning || !card.qtyInput}
                                                        className="px-4 py-2 bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] text-xs font-black rounded-lg transition-colors disabled:opacity-40 cursor-pointer focus:outline-none shrink-0"
                                                    >
                                                        Kembalikan
                                                    </button>
                                                </div>
                                            </div>

                                            {/* HABIS button — triggers confirm step */}
                                            <button
                                                onClick={() => patchCard(loan.id, { confirmingHabis: true, feedback: null })}
                                                disabled={isReturning}
                                                className="w-full py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-40 cursor-pointer focus:outline-none"
                                            >
                                                Habis Terpakai
                                            </button>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </div>
                            <p className="text-slate-500 font-bold text-sm">Tidak ada barang yang sedang Anda pinjam.</p>
                            <p className="text-xs text-slate-400 mt-1">Semua barang sudah dikembalikan!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
