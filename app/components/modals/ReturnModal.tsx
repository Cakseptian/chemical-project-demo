"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getRelativeTime } from "@/app/utils/timeUtils";
import { MapPin, ArrowUUpLeft, XCircle, CheckCircle, Package } from "@phosphor-icons/react";
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
        consumedUnitIds: string[],
        returnLocation: string
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
    // Return location selected by user
    returnLocation: string;
};

const defaultCardState = (): CardState => ({
    units: [],
    unitStates: {},
    scanInput: "",
    scanError: null,
    feedback: null,
    allConsumedConfirming: false,
    loadingUnits: false,
    returnLocation: "",
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
    const [availableLocations, setAvailableLocations] = useState<string[]>([]);
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

    // Fetch all available locations from inventory when modal opens
    useEffect(() => {
        if (!isOpen) return;
        supabase
            .from("inventory")
            .select("location")
            .not("location", "is", null)
            .then(({ data }) => {
                if (!data) return;
                const locs = [...new Set(data.map((r: any) => r.location as string).filter(Boolean))].sort();
                setAvailableLocations(locs);
            });
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
                    [loan.id]: {
                        ...defaultCardState(),
                        units,
                        unitStates,
                        loadingUnits: false,
                        returnLocation: loan.location ?? "",
                    },
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
            const result = await onProsesReturn(loan.id, loan.inventory_id, qty, [], [], card.returnLocation);
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
        const result = await onProsesReturn(loan.id, loan.inventory_id, qty, returnedUnitIds, consumedUnitIds, card.returnLocation);
        if (!result.ok) patchCard(loan.id, { feedback: result });
    };

    // Mark all units as consumed (shortcut)
    const handleAllConsumed = async (loan: ActiveLoan) => {
        const card = getCard(loan.id);
        const qty = Math.abs(loan.jumlah);

        patchCard(loan.id, { allConsumedConfirming: false, feedback: null });

        // Old loan: pass both empty arrays
        if (card.units.length === 0) {
            const result = await onProsesReturn(loan.id, loan.inventory_id, qty, [], [], card.returnLocation);
            if (!result.ok) patchCard(loan.id, { feedback: result });
            return;
        }

        // New loan: mark all as consumed then submit
        const newUnitStates: Record<string, UnitState> = {};
        for (const u of card.units) newUnitStates[u] = "consumed";
        const result = await onProsesReturn(loan.id, loan.inventory_id, qty, [], card.units, card.returnLocation);
        if (!result.ok) patchCard(loan.id, { unitStates: newUnitStates, feedback: result });
    };

    const unitRowBg = (state: UnitState) => {
        if (state === "returned") return "bg-emerald-50 border-emerald-200";
        if (state === "consumed") return "bg-red-50 border-red-200";
        return "bg-white border-slate-200";
    };

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 border border-slate-200/60">

                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-white/10 flex justify-between items-center bg-[#001e2b] rounded-t-2xl shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#00ed64]/15 flex items-center justify-center shrink-0">
                            <ArrowUUpLeft weight="bold" className="w-4 h-4 text-[#00ed64]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white text-sm leading-tight">Pengembalian Barang</h2>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                {visibleLoans.length > 0 ? `${visibleLoans.length} item dipinjam` : "Tidak ada pinjaman aktif"}
                            </p>
                        </div>
                    </div>
                    <button type="button"
                        onClick={onClose}
                        aria-label="Tutup modal"
                        className="w-8 h-8 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    >
                        <XCircle weight="fill" className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/50" data-lenis-prevent>
                    {isFetchingLoans ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin w-7 h-7 border-[3px] border-slate-200 border-t-[#00ed64] rounded-full mb-3" />
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Memuat pinjaman...</p>
                        </div>
                    ) : visibleLoans.length > 0 ? (
                        visibleLoans.map((loan) => {
                            const card = getCard(loan.id);
                            const qty = Math.abs(loan.jumlah);
                            const isOldLoan = !loan.unit_id;
                            const resolved = allResolved(card);
                            const processedCount = card.units.filter((u) => card.unitStates[u] !== "pending").length;
                            const totalCount = card.units.length;
                            const monogram = loan.part_name?.substring(0, 2).toUpperCase() || "??";

                            return (
                                <div key={loan.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

                                    {/* Card header */}
                                    <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
                                        <div className="w-9 h-9 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-mono font-bold text-slate-600">{monogram}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-sm leading-snug truncate">{loan.part_name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                {loan.part_number || "—"} · {getRelativeTime(loan.created_at)}
                                            </p>
                                        </div>
                                        <div className="shrink-0 px-2 py-1 rounded-md bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-bold font-mono tabular-nums">
                                            {qty} unit
                                        </div>
                                    </div>

                                    <div className="px-4 py-3 space-y-3">
                                        {/* Inline feedback */}
                                        {card.feedback && (
                                            <div role="alert" className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs font-medium ${card.feedback.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                                                {card.feedback.ok
                                                    ? <CheckCircle weight="fill" className="w-3.5 h-3.5 shrink-0 mt-px" />
                                                    : <XCircle weight="fill" className="w-3.5 h-3.5 shrink-0 mt-px" />
                                                }
                                                <span>{card.feedback.message}</span>
                                            </div>
                                        )}

                                        {/* Return location */}
                                        <div>
                                            <label htmlFor={`loc-${loan.id}`} className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                                                Kembalikan ke
                                            </label>
                                            <div className="relative">
                                                <MapPin weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                                <select
                                                    id={`loc-${loan.id}`}
                                                    value={card.returnLocation}
                                                    onChange={(e) => patchCard(loan.id, { returnLocation: e.target.value })}
                                                    className="w-full pl-8 pr-8 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#00ed64]/40 focus:border-[#00ed64] transition-colors"
                                                >
                                                    <option value="">— Pilih lokasi —</option>
                                                    {loan.location && !availableLocations.includes(loan.location) && (
                                                        <option value={loan.location}>{loan.location} (asal)</option>
                                                    )}
                                                    {availableLocations.map((loc) => (
                                                        <option key={loc} value={loc}>
                                                            {loc}{loc === loan.location ? " (asal)" : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Loading units */}
                                        {card.loadingUnits && (
                                            <div className="flex items-center gap-2 py-1 text-xs text-slate-400">
                                                <div className="animate-spin w-3 h-3 border-2 border-slate-200 border-t-slate-400 rounded-full shrink-0" />
                                                Memuat unit...
                                            </div>
                                        )}

                                        {/* OLD LOAN */}
                                        {!card.loadingUnits && isOldLoan && (
                                            <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                                                <div className="w-0.5 self-stretch rounded-full bg-amber-400 shrink-0" />
                                                <p className="text-xs text-slate-500">
                                                    Pinjaman lama — <span className="font-semibold text-slate-700">{qty} unit</span> akan ditandai habis terpakai sekaligus.
                                                </p>
                                            </div>
                                        )}

                                        {/* NEW LOAN: unit rows */}
                                        {!card.loadingUnits && !isOldLoan && card.units.length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Unit</p>
                                                {card.units.map((uid) => {
                                                    const state = card.unitStates[uid] ?? "pending";
                                                    return (
                                                        <div key={uid} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${unitRowBg(state)}`}>
                                                            <span className="flex-1 text-[10px] font-mono text-slate-500 truncate">
                                                                {uid.substring(0, 8).toUpperCase()}…
                                                            </span>
                                                            {state === "pending" ? (
                                                                <div className="flex gap-1.5 shrink-0">
                                                                    <button type="button"
                                                                        onClick={() => markUnit(loan.id, uid, "returned")}
                                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 transition-colors focus:outline-none"
                                                                    >
                                                                        <ArrowUUpLeft weight="bold" className="w-3 h-3" />
                                                                        Kembali
                                                                    </button>
                                                                    <button type="button"
                                                                        onClick={() => markUnit(loan.id, uid, "consumed")}
                                                                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-colors focus:outline-none"
                                                                    >
                                                                        <XCircle weight="bold" className="w-3 h-3" />
                                                                        Habis
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <span className={`text-[10px] font-bold ${state === "returned" ? "text-emerald-600" : "text-red-500"}`}>
                                                                        {state === "returned" ? "↩ Dikembalikan" : "✕ Habis/Rusak"}
                                                                    </span>
                                                                    <button type="button"
                                                                        onClick={() => markUnit(loan.id, uid, "pending")}
                                                                        className="text-[9px] text-slate-400 hover:text-slate-600 underline transition-colors focus:outline-none"
                                                                    >
                                                                        ubah
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* All consumed shortcut */}
                                        {!card.loadingUnits && !isOldLoan && totalCount > 0 && !resolved && (
                                            card.allConsumedConfirming ? (
                                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                                                    <p className="flex-1 text-[10px] text-red-600 font-medium">Tandai semua unit habis terpakai?</p>
                                                    <div className="flex gap-1.5 shrink-0">
                                                        <button type="button"
                                                            onClick={() => patchCard(loan.id, { allConsumedConfirming: false })}
                                                            className="px-2.5 py-1 text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 rounded-full transition-colors hover:bg-slate-50 focus:outline-none"
                                                        >
                                                            Batal
                                                        </button>
                                                        <button type="button"
                                                            onClick={() => handleAllConsumed(loan)}
                                                            disabled={isReturning}
                                                            className="px-2.5 py-1 text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-full transition-colors disabled:opacity-50 focus:outline-none"
                                                        >
                                                            Ya, semua habis
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button type="button"
                                                    onClick={() => patchCard(loan.id, { allConsumedConfirming: true })}
                                                    className="w-full text-[10px] font-semibold text-slate-400 hover:text-red-500 transition-colors text-center py-0.5 focus:outline-none"
                                                >
                                                    Tandai semua habis terpakai
                                                </button>
                                            )
                                        )}

                                        {/* Progress + Confirm */}
                                        <div className="pt-1 border-t border-slate-100 space-y-2">
                                            {!isOldLoan && totalCount > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-slate-400">
                                                        <span className={`font-bold ${resolved ? "text-emerald-600" : "text-slate-500"}`}>{processedCount}/{totalCount}</span> unit diproses
                                                    </p>
                                                    {resolved && (
                                                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                                            <CheckCircle weight="fill" className="w-3 h-3" />
                                                            Siap dikonfirmasi
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <button type="button"
                                                onClick={() => isOldLoan ? patchCard(loan.id, { allConsumedConfirming: true }) : handleSubmit(loan)}
                                                disabled={isReturning || (!isOldLoan && !resolved)}
                                                className={`w-full py-2.5 rounded-full text-xs font-bold transition-all focus:outline-none flex items-center justify-center gap-2 ${
                                                    isOldLoan || resolved
                                                        ? "bg-[#00ed64] hover:bg-[#00c853] text-[#001e2b] shadow-sm shadow-[#00ed64]/20 active:scale-[0.98]"
                                                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                }`}
                                            >
                                                {isReturning ? (
                                                    <div className="animate-spin w-3.5 h-3.5 border-2 border-[#001e2b]/30 border-t-[#001e2b] rounded-full" />
                                                ) : (
                                                    <>
                                                        <ArrowUUpLeft weight="bold" className="w-3.5 h-3.5" />
                                                        {isOldLoan ? "Proses Pengembalian" : "Konfirmasi Pengembalian"}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-14 text-center">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle weight="thin" className="w-7 h-7 text-emerald-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-700">Semua beres!</p>
                            <p className="text-xs text-slate-400 mt-1">Tidak ada barang yang sedang dipinjam.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

