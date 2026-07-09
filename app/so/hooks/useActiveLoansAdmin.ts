"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ActiveLoanAdmin } from "../types";

const STALE_DAYS_THRESHOLD = 7;

const msPerDay = 1000 * 60 * 60 * 24;

// ponytail: compute days_out client-side — no DB function needed
const daysOut = (createdAt: string): number =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / msPerDay);

export const useActiveLoansAdmin = () => {
    const [loans, setLoans] = useState<ActiveLoanAdmin[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchActiveLoans = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select("id, inventory_id, unit_id, part_name, part_number, nama_peminjam, nomor_pegawai, jumlah, created_at")
                .eq("transaction_type", "LOAN")
                .eq("is_returned", false)
                .order("created_at", { ascending: true });

            if (error) throw error;

            const rows: ActiveLoanAdmin[] = (data ?? []).map((row) => ({
                transaction_id: row.id,
                inventory_id: row.inventory_id,
                unit_id: row.unit_id ?? null,
                part_name: row.part_name,
                part_number: row.part_number ?? null,
                nama_peminjam: row.nama_peminjam,
                nomor_pegawai: row.nomor_pegawai ?? null,
                jumlah: row.jumlah,
                created_at: row.created_at,
                days_out: daysOut(row.created_at),
            }));

            setLoans(rows);
        } catch (err) {
            console.error("Gagal memuat active loans admin:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActiveLoans();
    }, [fetchActiveLoans]);

    // Group by worker: nomor_pegawai → { name, loans[] }
    const byWorker = loans.reduce((acc, loan) => {
        const key = loan.nomor_pegawai ?? loan.nama_peminjam;
        if (!acc[key]) {
            acc[key] = { nama: loan.nama_peminjam, nomor: loan.nomor_pegawai, loans: [] };
        }
        acc[key].loans.push(loan);
        return acc;
    }, {} as Record<string, { nama: string; nomor: string | null; loans: ActiveLoanAdmin[] }>);

    // Group by item: part_name → loans[]
    const byItem = loans.reduce((acc, loan) => {
        const key = loan.part_name;
        if (!acc[key]) acc[key] = [];
        acc[key].push(loan);
        return acc;
    }, {} as Record<string, ActiveLoanAdmin[]>);

    const staleThreshold = STALE_DAYS_THRESHOLD;

    return {
        loans,
        byWorker,
        byItem,
        isLoading,
        staleThreshold,
        refresh: fetchActiveLoans,
    };
};
