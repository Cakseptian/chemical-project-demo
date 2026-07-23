"use client";
import { useEffect, useState, useRef } from "react";
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
        returnedUnitIds: string[],
        consumedUnitIds: string[]
    ) => Promise<{ ok: boolean; message: string }>;
}

// Per-unit state within a loan card
type UnitState = "pending" | "returned" | "consumed";

// Per-card state: map of unit_id → state + scan status
type CardState = {
    // For new loans: unit IDs fetched from inventory_units
    units: string[];
    unitStates: Record<string, UnitState>;
    // Scanner state
    scanInput: string;
    scanError: string | null;
    feedback: { ok: boolean; message: string } | null;
    allConsumedConfirming: boolean;
    // Loading state for unit fetch
    loadingUnits: boolean;
};

const defaultCardState = (): CardState => ({
    units: [],
    unitStates: {},
    scanInput: "",
    scanError: null,
    feedback: null,
    allConsumedConfirming: false,
    loadingUnits: false,
});

// Fetch the unit IDs belonging to a LOAN transaction
const fetchUnitsForLoan = async (unitId: string | null | undefined, inventoryId: number, qty: number): Promise<string[]> => {
    // New loan: single unit per LOAN transaction row
    if (unitId) return [unitId];
    // Old loan: no unit_id — return empty so we show the legacy fallback
    return [];
};

export const ReturnModal = ({
    isOpen,
    onClose,
    activeLoans,
    isFetchingLoans,
    isReturning,
    focusedLoanId,
    onProsesReturn,
}: ReturnModalProps) => {
    const [cardStates, setCardStates] = useState<Record<number, CardState>>({});
    const scanInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const getCard = (id: number): CardState => cardStates[id] ?? defaultCardState();

    const patchCard = (id: number, patch: Partial<CardState>) =>
        setCardStates((prev) => ({
            ...prev,
            [id]: { ...getCard(id), ...patch },
        }));

    // Reset and load unit data when modal opens
    useEffect(() => {
        if (!isOpen) return;
        setCardStates({});
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    // Load units for visible loans once they're available
    useEffect(() => {
        if (!isOpen || isFetchingLoans) return;
        const visibleLoans = focusedLoanId
            ? activeLoans.filter((l) => l.id === focusedLoanId)
            : activeLoans;

        for (const loan of visibleLoans) {
            setCardStates((prev) => {
                if (prev[loan.id]) return prev; // already loaded
                return {
                    ...prev,
                    [loan.id]: { ...defaultCardState(), loadingUnits: true },
                };
            });
            fetchUnitsForLoan(loan.unit_id, loan.inventory_id, Math.abs(loan.jumlah)).then((units) => {
                const unitStates: Record<string, UnitState> = {};
                for (const u of units) unitStates[u] = "pending";
                setCardStates((prev) => ({
                    ...prev,
                    [loan.id]: { ...defaultCardState(), units, unitStates, loadingUnits: false },
                }));
            });
        }
    }, [isOpen, isFetchingLoans, activeLoans, focusedLoanId]);

    if (!isOpen) return null;

    const visibleLoans = focusedLoanId
        ? activeLoans.filter((l) => l.id === focusedLoanId)
        : activeLoans;

    // Handle scan input for a unit
    const handleScan = (loan: ActiveLoan, scannedValue: string) => {
        const card = getCard(loan.id);
        const clean = scannedValue.trim();

        if (!card.units.includes(clean)) {
            patchCard(loan.id, { scanInput: "", scanError: `Unit "${clean}" tidak ada dalam pinjaman ini.` });
            return;
        }
        if (card.unitStates[clean] !== "pending") {
            patchCard(loan.id, { scanInput: "", scanError: "Unit ini sudah diproses." });
            return;
        }
        const newUnitStates = { ...card.unitStates, [clean]: "returned" as UnitState };
        patchCard(loan.id, { unitStates: newUnitStates, scanInput: "", scanError: null });
    };

    const markUnit = (loanId: number, unitId: string, state: UnitState) => {
        const card = getCard(loanId);
        patchCard(loanId, {
            unitStates: { ...card.unitStates, [unitId]: state },
            scanError: null,
        });
    };

    // Check if all units in a card are resolved
    const allResolved = (card: CardState): boolean =>
        card.units.length > 0 && card.units.every((u) => card.unitStates[u] !== "pending");

    // Submit return for a loan card
    const handleSubmit = async (loan: ActiveLoan) => {
        const card = getCard(loan.id);
        const qty = Math.abs(loan.jumlah);

        // Old loan path (no units) — hard cutover: all consumed
        if (card.units.length === 0) {
            patchCard(loan.id, { feedback: null });
            const result = await onProsesReturn(loan.id, loan.inventory_id, qty, [], []);
            if (!result.ok) patchCard(loan.id, { feedback: result });
            return;
        }

        if (!allResolved(card)) {
            patchCard(loan.id, { feedback: { ok: false, message: "Semua unit harus diproses terlebih dahulu." } });
            return;
        }

        const returnedUnitIds = card.units.filter((u) => card.unitStates[u] === "returned");
        const consumedUnitIds = card.units.filter((u) => card.unitStates[u] === "consumed");

        patchCard(loan.id, { feedback: null });
        const result = await onProsesReturn(loan.id, loan.inventory_id, qty, returnedUnitIds, consumedUnitIds);
        if (!result.ok) patchCard(loan.id, { feedback: result });
    };

    // Mark all units as consumed (shortcut)
    const handleAllConsumed = async (loan: ActiveLoan) => {
        const card = getCard(loan.id);
        const qty = Math.abs(loan.jumlah);

        patchCard(loan.id, { allConsumedConfirming: false, feedback: null });

        // Old loan: pass both empty arrays
        if (card.units.length === 0) {
            const result = await onProsesReturn(loan.id, loan.inventory_id, qty, [], []);
            if (!result.ok) patchCard(loan.id, { feedback: result });
            return;
        }

        // New loan: mark all as consumed then submit
        const newUnitStates: Record<string, UnitState> = {};
        for (const u of card.units) newUnitStates[u] = "consumed";
        const result = await onProsesReturn(loan.id, loan.inventory_id, qty, [], card.units);
        if (!result.ok) patchCard(loan.id, { unitStates: newUnitStates, feedback: result });
    };

    const unitStatusColor = (state: UnitState) => {
        if (state === "returned") return "bg-emerald-50 border-emerald-200 text-emerald-700";
        if (state === "consumed") return "bg-red-50 border-red-200 text-red-600";
        return "bg-slate-50 border-slate-200 text-slate-500";
    };

    const unitStatusLabel = (state: UnitState) => {
        if (state === "returned") return "↩ Kembali";
        if (state === "consumed") return "✕ Habis";
        return "Pending";
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
                    <button type="button"
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
                            const card = getCard(loan.id);
                            const qty = Math.abs(loan.jumlah);
                            const isOldLoan = !loan.unit_id; // pre-migration loan: no unit_id
                            const resolved = allResolved(card);
                            const pendingCount = card.units.filter((u) => card.unitStates[u] === "pending").length;

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
                                            {qty} unit
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

                                    {/* Loading units */}
                                    {card.loadingUnits && (
                                        <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                                            <div className="animate-spin w-3 h-3 border-2 border-slate-200 border-t-slate-400 rounded-full" />
                                            Memuat data unit...
                                        </div>
                                    )}

                                    {/* OLD LOAN: hard cutover — show only "All Consumed" */}
                                    {!card.loadingUnits && isOldLoan && (
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-3">
                                            <p className="text-xs font-semibold text-amber-700 mb-3">
                                                Pinjaman lama — tidak ada data unit individual.<br />
                                                <span className="font-normal text-amber-600">Semua {qty} unit akan ditandai habis terpakai.</span>
                                            </p>
                                            {card.allConsumedConfirming ? (
                                                <div className="flex gap-2">
                                                    <button type="button"
                                                        onClick={() => patchCard(loan.id, { allConsumedConfirming: false })}
                                                        className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg transition-colors hover:bg-slate-50 cursor-pointer focus:outline-none"
                                                    >
                                                        Batal
                                                    </button>
                                                    <button type="button"
                                                        onClick={() => handleAllConsumed(loan)}
                                                        disabled={isReturning}
                                                        className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer focus:outline-none"
                                                    >
                                                        Ya, Habis Terpakai
                                                    </button>
                                                </div>
                                            ) : (
                                                <button type="button"
                                                    onClick={() => patchCard(loan.id, { allConsumedConfirming: true })}
                                                    disabled={isReturning}
                                                    className="w-full py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer focus:outline-none"
                                                >
                                                    Semua Habis Terpakai
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* NEW LOAN: scan-driven per-unit flow */}
                                    {!card.loadingUnits && !isOldLoan && (
                                        <>
                                            {/* Unit list */}
                                            {card.units.length > 0 && (
                                                <div className="mb-3 space-y-1.5">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                                        Status Unit ({card.units.length - pendingCount}/{card.units.length} selesai)
                                                    </p>
                                                    {card.units.map((uid) => {
                                                        const state = card.unitStates[uid] ?? "pending";
                                                        return (
                                                            <div key={uid} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${unitStatusColor(state)}`}>
                                                                <span className="flex-1 truncate">{uid.slice(0, 20)}…</span>
                                                                <span className="font-bold shrink-0">{unitStatusLabel(state)}</span>
                                                                {state === "pending" && (
                                                                    <button type="button"
                                                                        onClick={() => markUnit(loan.id, uid, "consumed")}
                                                                        className="shrink-0 px-2 py-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 cursor-pointer focus:outline-none"
                                                                        title="Tandai habis"
                                                                    >
                                                                        Habis
                                                                    </button>
                                                                )}
                                                                {state !== "pending" && (
                                                                    <button type="button"
                                                                        onClick={() => markUnit(loan.id, uid, "pending")}
                                                                        className="shrink-0 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 cursor-pointer focus:outline-none"
                                                                        title="Batalkan"
                                                                    >
                                                                        Batal
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Scan area */}
                                            {pendingCount > 0 && (
                                                <div className="mb-3">
                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                                                        Scan unit untuk kembalikan ({pendingCount} tersisa)
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            ref={(el) => { scanInputRefs.current[loan.id] = el; }}
                                                            type="text"
                                                            value={card.scanInput}
                                                            onChange={(e) => patchCard(loan.id, { scanInput: e.target.value, scanError: null })}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" && card.scanInput.trim()) {
                                                                    handleScan(loan, card.scanInput.trim());
                                                                }
                                                            }}
                                                            placeholder="Scan atau ketik Unit ID..."
                                                            className="flex-1 min-w-0 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00ed64]/40 focus:border-[#00ed64]"
                                                            autoComplete="off"
                                                        />
                                                        <button type="button"
                                                            onClick={() => card.scanInput.trim() && handleScan(loan, card.scanInput.trim())}
                                                            disabled={!card.scanInput.trim()}
                                                            className="px-3 py-2 bg-[#00ed64] hover:bg-[#00b545] text-[#001e2b] text-xs font-black rounded-lg transition-colors disabled:opacity-40 cursor-pointer focus:outline-none shrink-0"
                                                        >
                                                            OK
                                                        </button>
                                                    </div>
                                                    {card.scanError && (
                                                        <p className="mt-1.5 text-[10px] text-red-600 font-semibold">{card.scanError}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Submit / All Consumed */}
                                            <div className="flex gap-2">
                                                {resolved && (
                                                    <button type="button"
                                                        onClick={() => handleSubmit(loan)}
                                                        disabled={isReturning}
                                                        className="flex-1 py-2 text-xs font-black text-[#001e2b] bg-[#00ed64] hover:bg-[#00b545] rounded-lg transition-colors disabled:opacity-40 cursor-pointer focus:outline-none"
                                                    >
                                                        Konfirmasi Pengembalian
                                                    </button>
                                                )}
                                                {card.allConsumedConfirming ? (
                                                    <div className="flex-1 flex gap-2">
                                                        <button type="button"
                                                            onClick={() => patchCard(loan.id, { allConsumedConfirming: false })}
                                                            className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer focus:outline-none"
                                                        >
                                                            Batal
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => handleAllConsumed(loan)}
                                                            disabled={isReturning}
                                                            className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer focus:outline-none"
                                                        >
                                                            Ya, Habis Semua
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button type="button"
                                                        onClick={() => patchCard(loan.id, { allConsumedConfirming: true })}
                                                        disabled={isReturning}
                                                        className={`py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-40 cursor-pointer focus:outline-none ${resolved ? "px-4" : "flex-1"}`}
                                                    >
                                                        Semua Habis
                                                    </button>
                                                )}
                                            </div>
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
