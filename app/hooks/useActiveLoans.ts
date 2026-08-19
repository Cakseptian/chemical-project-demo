"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ActiveLoan } from "../types";

export const useActiveLoans = (
    nomorPegawai: string,
    namaPeminjam: string,
    onActivityChange?: () => void
) => {
    const [activeLoans, setActiveLoans] = useState<ActiveLoan[]>([]);
    const [isFetchingLoans, setIsFetchingLoans] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    // ponytail: single focused loan for quick-return flow; null = show all loans
    const [focusedLoanId, setFocusedLoanId] = useState<number | null>(null);

    const fetchLoans = useCallback(async () => {
        if (!nomorPegawai.trim()) {
            setActiveLoans([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select("*, inventory(location)")
                .eq("nomor_pegawai", nomorPegawai)
                .eq("transaction_type", "LOAN")
                .eq("is_returned", false)
                .order("created_at", { ascending: false });
            if (!error && data) {
                // Flatten joined location ke field top-level
                const loans = data.map((row: any) => ({
                    ...row,
                    location: row.inventory?.location ?? null,
                }));
                setActiveLoans(loans as ActiveLoan[]);
            }
        } catch (err) {
            console.error("Gagal memuat pinjaman:", err);
        }
    }, [nomorPegawai]);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const openReturnModal = async (loan?: ActiveLoan) => {
        if (!nomorPegawai.trim()) {
            alert("⚠️ Silakan masukkan Employee ID terlebih dahulu!");
            return;
        }
        setIsFetchingLoans(true);
        try {
            await fetchLoans();
            // ponytail: focus a single loan when called from quick-return button
            setFocusedLoanId(loan?.id ?? null);
            setShowReturnModal(true);
        } catch (err) {
            console.error("Gagal mengambil data pinjaman:", err);
        } finally {
            setIsFetchingLoans(false);
        }
    };

    /**
     * prosesReturn — scan-driven unit-level return.
     *
     * For new loans (unit_id present on the LOAN transaction):
     *   returnedUnitIds  — units physically scanned back → status 'available', qty +1, RETURN tx
     *   consumedUnitIds  — units tapped "Gone" → status 'consumed', CONSUMED_BULK tx, no qty change
     *
     * For old loans (unit_id is null, pre-migration):
     *   hard cutover — pass returnedUnitIds=[], consumedUnitIds=[] to mark all as consumed (one-tap).
     *   The modal handles the "All Consumed" shortcut by calling with both arrays empty.
     *
     * Returns { ok, message } for inline modal feedback.
     */
    const prosesReturn = async (
        loanTransactionId: number,
        inventoryId: number,
        qtyDipinjam: number,
        returnedUnitIds: string[],
        consumedUnitIds: string[],
        returnLocation: string
    ): Promise<{ ok: boolean; message: string }> => {
        if (isReturning) return { ok: false, message: "Sedang memproses…" };
        setIsReturning(true);

        try {
            const loan = activeLoans.find((l) => l.id === loanTransactionId);
            const baseTx = {
                inventory_id: inventoryId,
                part_name: loan?.part_name || "",
                part_number: loan?.part_number || null,
                nama_peminjam: namaPeminjam || "",
                nomor_pegawai: nomorPegawai,
            };

            // Handle returned units
            if (returnedUnitIds.length > 0) {
                const { error: returnError } = await supabase.from("transactions").insert(
                    returnedUnitIds.map((uid) => ({
                        ...baseTx,
                        jumlah: -1,
                        transaction_type: "RETURN",
                        unit_id: uid,
                        return_location: returnLocation || null,
                    }))
                );
                if (returnError) throw returnError;

                // Add qty back to inventory for each returned unit
                const { data: currentInv } = await supabase
                    .from("inventory")
                    .select("quantity")
                    .eq("id", inventoryId)
                    .single();
                const newQty = (Number(currentInv?.quantity || 0) + returnedUnitIds.length).toString();
                await supabase.from("inventory").update({ quantity: newQty }).eq("id", inventoryId);

                // Mark units as available
                await supabase
                    .from("inventory_units")
                    .update({ status: "available" })
                    .in("id", returnedUnitIds);
            }

            // Handle consumed units
            const effectiveConsumedCount = loan?.unit_id
                ? consumedUnitIds.length
                : qtyDipinjam; // old loan — full qty consumed

            if (effectiveConsumedCount > 0) {
                const consumedRows = consumedUnitIds.length > 0
                    ? consumedUnitIds.map((uid) => ({
                        ...baseTx,
                        jumlah: 1,
                        transaction_type: "CONSUMED_BULK",
                        unit_id: uid,
                    }))
                    : [{
                        // ponytail: old loan fallback — one aggregate CONSUMED_BULK row
                        ...baseTx,
                        jumlah: effectiveConsumedCount,
                        transaction_type: "CONSUMED_BULK",
                        unit_id: null,
                    }];

                const { error: consError } = await supabase.from("transactions").insert(consumedRows);
                if (consError) throw consError;

                // Mark units as consumed (only for new loans with unit IDs)
                if (consumedUnitIds.length > 0) {
                    await supabase
                        .from("inventory_units")
                        .update({ status: "consumed" })
                        .in("id", consumedUnitIds);
                }
            }

            // Mark original LOAN as returned
            const { error: updateError } = await supabase
                .from("transactions")
                .update({ is_returned: true })
                .eq("id", loanTransactionId);
            if (updateError) throw updateError;

            setActiveLoans((prev) => prev.filter((l) => l.id !== loanTransactionId));
            onActivityChange?.();

            const parts: string[] = [];
            if (returnedUnitIds.length > 0) parts.push(`${returnedUnitIds.length} unit dikembalikan`);
            if (effectiveConsumedCount > 0) parts.push(`${effectiveConsumedCount} unit habis terpakai`);
            return { ok: true, message: parts.join(" · ") || "Pengembalian dicatat." };
        } catch (err) {
            console.error("Gagal memproses pengembalian:", err);
            return { ok: false, message: "Gagal memproses pengembalian. Coba lagi." };
        } finally {
            setIsReturning(false);
        }
    };

    // ponytail: quickReturn now opens the modal pre-focused on this loan — no confirm() dialogs
    const quickReturn = (loan: ActiveLoan) => {
        openReturnModal(loan);
    };

    return {
        activeLoans,
        setActiveLoans,
        isFetchingLoans,
        isReturning,
        showReturnModal,
        setShowReturnModal,
        focusedLoanId,
        setFocusedLoanId,
        fetchLoans,
        openReturnModal,
        prosesReturn,
        quickReturn,
    };
};
