"use client";
import { useState, useEffect } from "react";

export const useUserProfile = () => {
    const [namaPeminjam, setNamaPeminjam] = useState("");
    const [nomorPegawai, setNomorPegawai] = useState("");

    useEffect(() => {
        const savedName = localStorage.getItem("gmf_nama");
        const savedId = localStorage.getItem("gmf_id");
        if (savedName) setNamaPeminjam(savedName);
        if (savedId) setNomorPegawai(savedId);
    }, []);

    const saveProfile = () => {
        localStorage.setItem("gmf_nama", namaPeminjam);
        localStorage.setItem("gmf_id", nomorPegawai);
    };

    return {
        namaPeminjam,
        setNamaPeminjam,
        nomorPegawai,
        setNomorPegawai,
        saveProfile,
    };
};