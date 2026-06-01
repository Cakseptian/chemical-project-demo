"use client";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { RequestFormData, RequestErrors } from "../types";

export const useRequest = () => {
    const [showReqModal, setShowReqModal] = useState(false);
    const [reqData, setReqData] = useState<RequestFormData>({
        nama: "",
        barang: "",
        jumlah: "",
        keterangan: "",
    });
    const [isSubmittingReq, setIsSubmittingReq] = useState(false);
    const [errors, setErrors] = useState<RequestErrors>({
        nama: null,
        barang: null,
        jumlah: null,
    });
    const namaInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!showReqModal) return;
        const timer = setTimeout(() => namaInputRef.current?.focus(), 150);
        return () => clearTimeout(timer);
    }, [showReqModal]);

    const handleCloseReqModal = () => {
        setShowReqModal(false);
        setErrors({ nama: null, barang: null, jumlah: null });
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: RequestErrors = { nama: null, barang: null, jumlah: null };
        let hasError = false;

        if (!reqData.nama.trim()) {
            newErrors.nama = "Nama wajib diisi";
            hasError = true;
        }
        if (!reqData.barang.trim()) {
            newErrors.barang = "Nama barang wajib diisi";
            hasError = true;
        }
        if (!reqData.jumlah || Number(reqData.jumlah) < 1) {
            newErrors.jumlah = "Jumlah minimal 1";
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        setIsSubmittingReq(true);
        try {
            const { error } = await supabase.from("item_requests").insert([
                {
                    nama_peminjam: reqData.nama,
                    nama_barang: reqData.barang,
                    jumlah: Number(reqData.jumlah),
                    keterangan: reqData.keterangan || "-",
                },
            ]);
            if (error) throw error;
            alert("✅ Request berhasil dicatat sistem!");
            handleCloseReqModal();
            setReqData({ nama: "", barang: "", jumlah: "", keterangan: "" });
        } catch (err) {
            console.error("Gagal mengirim request:", err);
            alert("❌ Gagal mengirim request. Coba lagi.");
        } finally {
            setIsSubmittingReq(false);
        }
    };

    return {
        showReqModal,
        setShowReqModal,
        reqData,
        setReqData,
        isSubmittingReq,
        errors,
        setErrors,
        namaInputRef,
        handleCloseReqModal,
        handleSubmitRequest,
    };
};