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
                .select("*")
                .eq("nomor_pegawai", nomorPegawai)
                .eq("transaction_type", "LOAN")
                .eq("is_returned", false)
                .order("created_at", { ascending: false });
            if (!error && data) setActiveLoans(data as ActiveLoan[]);
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
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("nomor_pegawai", nomorPegawai)
                .eq("transaction_type", "LOAN")
                .eq("is_returned", false)
                .order("created_at", { ascending: false });
            if (error) throw error;
            setActiveLoans((data || []) as ActiveLoan[]);
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
     * prosesReturn — no prompt(), no confirm(), no alert().
     * qtyDikembalikan is passed from the modal UI.
     * Returns { ok, message } so the modal can show inline feedback.
     */
    const prosesReturn = async (
        loanTransactionId: number,
        inventoryId: number,
        qtyDipinjam: number,
        statusAkhir: "HABIS" | "SISA",
        qtyDikembalikan: number = 0
    ): Promise<{ ok: boolean; message: string }> => {
        if (isReturning) return { ok: false, message: "Sedang memproses…" };
        setIsReturning(true);

        try {
            let qtyHabis = 0;

            if (statusAkhir === "SISA") {
                qtyHabis = qtyDipinjam - qtyDikembalikan;
            } else {
                // HABIS: all consumed, nothing returned
                qtyHabis = qtyDipinjam;
                qtyDikembalikan = 0;
            }

            let returnTxId: number | null = null;
            const loan = activeLoans.find((l) => l.id === loanTransactionId);

            if (qtyDikembalikan > 0) {
                const { data: returnData, error: returnError } = await supabase
                    .from("transactions")
                    .insert([{
                        inventory_id: inventoryId,
                        part_name: loan?.part_name || "",
                        part_number: loan?.part_number || null,
                        nama_peminjam: namaPeminjam || "RETURN",
                        nomor_pegawai: nomorPegawai,
                        jumlah: -qtyDikembalikan,
                        transaction_type: "RETURN",
                    }])
                    .select("id")
                    .single();
                if (returnError) throw returnError;
                returnTxId = returnData.id;

                const { data: currentInv } = await supabase
                    .from("inventory")
                    .select("quantity")
                    .eq("id", inventoryId)
                    .single();
                const newQty = (Number(currentInv?.quantity || 0) + qtyDikembalikan).toString();
                // ponytail: rack_type not modified on return — rack classification is admin's domain
                await supabase
                    .from("inventory")
                    .update({ quantity: newQty })
                    .eq("id", inventoryId);
            }

            if (qtyHabis > 0) {
                const { error: consError } = await supabase.from("transactions").insert([{
                    inventory_id: inventoryId,
                    part_name: loan?.part_name || "",
                    part_number: loan?.part_number || null,
                    nama_peminjam: namaPeminjam || "CONSUMED",
                    nomor_pegawai: nomorPegawai,
                    jumlah: qtyHabis,
                    transaction_type: "CONSUMED_BULK",
                }]);
                if (consError) throw consError;
            }

            const { error: updateError } = await supabase
                .from("transactions")
                .update({ is_returned: true, return_transaction_id: returnTxId })
                .eq("id", loanTransactionId);
            if (updateError) throw updateError;

            setActiveLoans((prev) => prev.filter((l) => l.id !== loanTransactionId));
            onActivityChange?.();

            const parts: string[] = [];
            if (qtyDikembalikan > 0) parts.push(`${qtyDikembalikan} unit dikembalikan`);
            if (qtyHabis > 0) parts.push(`${qtyHabis} unit habis terpakai`);
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
