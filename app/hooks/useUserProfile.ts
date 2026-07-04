"use client";
import { useState, useEffect } from "react";

export const useUserProfile = () => {
    const [namaPeminjam, setNamaPeminjamState] = useState("");
    const [nomorPegawai, setNomorPegawaiState] = useState("");

    // Load from localStorage on mount
    useEffect(() => {
        const savedName = localStorage.getItem("gmf_nama");
        const savedId = localStorage.getItem("gmf_id");
        if (savedName) setNamaPeminjamState(savedName);
        if (savedId) setNomorPegawaiState(savedId);
    }, []);

    // Auto-save on every change
    const setNamaPeminjam = (val: string) => {
        setNamaPeminjamState(val);
        localStorage.setItem("gmf_nama", val);
    };

    const setNomorPegawai = (val: string) => {
        setNomorPegawaiState(val);
        localStorage.setItem("gmf_id", val);
    };

    const saveProfile = () => {
        localStorage.setItem("gmf_nama", namaPeminjam);
        localStorage.setItem("gmf_id", nomorPegawai);
    };

    const clearProfile = () => {
        setNamaPeminjamState("");
        setNomorPegawaiState("");
        localStorage.removeItem("gmf_nama");
        localStorage.removeItem("gmf_id");
    };

    const isProfileComplete = namaPeminjam.trim().length > 0 && nomorPegawai.trim().length > 0;

    return {
        namaPeminjam,
        setNamaPeminjam,
        nomorPegawai,
        setNomorPegawai,
        saveProfile,
        clearProfile,
        isProfileComplete,
    };
};
