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

    // Auto-fetch on nomorPegawai change
    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const openReturnModal = async () => {
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
            setShowReturnModal(true);
        } catch (err) {
            console.error("Gagal mengambil data pinjaman:", err);
            alert("❌ Gagal mengambil data pinjaman.");
        } finally {
            setIsFetchingLoans(false);
        }
    };

    const prosesReturn = async (
        loanTransactionId: number,
        inventoryId: number,
        qtyDipinjam: number,
        statusAkhir: "HABIS" | "SISA"
    ) => {
        if (isReturning) return;
        setIsReturning(true);

        try {
            let qtyDikembalikan = 0;
            let qtyHabis = 0;

            if (statusAkhir === "SISA") {
                const inputQty = prompt(
                    `Berapa unit yang Anda kembalikan? (Maksimal: ${qtyDipinjam})`,
                    qtyDipinjam.toString()
                );
                if (!inputQty) {
                    setIsReturning(false);
                    return;
                }
                qtyDikembalikan = parseInt(inputQty);
                if (isNaN(qtyDikembalikan) || qtyDikembalikan < 1 || qtyDikembalikan > qtyDipinjam) {
                    alert(`⚠️ Jumlah tidak valid. Harus antara 1 - ${qtyDipinjam}`);
                    setIsReturning(false);
                    return;
                }
                qtyHabis = qtyDipinjam - qtyDikembalikan;
            } else {
                qtyHabis = qtyDipinjam;
            }

            let returnTxId: number | null = null;
            const loan = activeLoans.find((l) => l.id === loanTransactionId);

            if (qtyDikembalikan > 0) {
                const { data: returnData, error: returnError } = await supabase
                    .from("transactions")
                    .insert([
                        {
                            inventory_id: inventoryId,
                            part_name: loan?.part_name || "",
                            part_number: loan?.part_number || null,
                            nama_peminjam: namaPeminjam || "RETURN",
                            nomor_pegawai: nomorPegawai,
                            jumlah: -qtyDikembalikan,
                            transaction_type: "RETURN",
                        },
                    ])
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
                await supabase
                    .from("inventory")
                    .update({ quantity: newQty, rack_type: "USED" })
                    .eq("id", inventoryId);
            }

            if (qtyHabis > 0) {
                const { error: consError } = await supabase.from("transactions").insert([
                    {
                        inventory_id: inventoryId,
                        part_name: loan?.part_name || "",
                        part_number: loan?.part_number || null,
                        nama_peminjam: namaPeminjam || "CONSUMED",
                        nomor_pegawai: nomorPegawai,
                        jumlah: qtyHabis,
                        transaction_type: "CONSUMED_BULK",
                    },
                ]);
                if (consError) throw consError;
            }

            const { error: updateError } = await supabase
                .from("transactions")
                .update({ is_returned: true, return_transaction_id: returnTxId })
                .eq("id", loanTransactionId);
            if (updateError) throw updateError;

            setActiveLoans((prev) => prev.filter((loan) => loan.id !== loanTransactionId));
            onActivityChange?.();

            let message = "✅ Pengembalian berhasil dicatat!\n\n";
            if (qtyDikembalikan > 0) message += `↩️ ${qtyDikembalikan} unit dikembalikan\n`;
            if (qtyHabis > 0) message += `🗑️ ${qtyHabis} unit habis terpakai\n`;
            alert(message);
        } catch (err) {
            console.error("Gagal memproses pengembalian:", err);
            alert("❌ Gagal memproses pengembalian.");
        } finally {
            setIsReturning(false);
        }
    };

    const quickReturn = (loan: ActiveLoan) => {
        const choice = confirm(
            `Kembalikan item "${loan.part_name}"?\n\nKlik OK jika barang dikembalikan SISA (Utuh).\nKlik BATAL jika barang HABIS terpakai.`
        );
        if (choice) {
            prosesReturn(loan.id, loan.inventory_id, Math.abs(loan.jumlah), "SISA");
        } else {
            const confirmHabis = confirm(
                `Konfirmasi: Tandai "${loan.part_name}" sebagai habis terpakai (dibuang)?`
            );
            if (confirmHabis) {
                prosesReturn(loan.id, loan.inventory_id, Math.abs(loan.jumlah), "HABIS");
            }
        }
    };

    return {
        activeLoans,
        setActiveLoans,
        isFetchingLoans,
        isReturning,
        showReturnModal,
        setShowReturnModal,
        fetchLoans,
        openReturnModal,
        prosesReturn,
        quickReturn,
    };
};