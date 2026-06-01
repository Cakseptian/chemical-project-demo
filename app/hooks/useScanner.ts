"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CartItem } from "../types";

export const useScanner = (addToCart: (item: Omit<CartItem, "quantity_to_take"> & { quantity_to_take?: number | string }) => void) => {
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleScanSuccess = async (decodedText: string) => {
        setIsScanning(false);
        setIsLoading(true);
        setErrorMsg(null);

        let finalBarcodeId = decodedText;

        try {
            if (decodedText.startsWith("http")) {
                const urlObj = new URL(decodedText);
                finalBarcodeId = urlObj.searchParams.get("scan") || decodedText;
            } else if (decodedText.includes("?scan=")) {
                finalBarcodeId = decodedText.split("?scan=")[1];
            }
        } catch {
            if (decodedText.includes("?scan=")) {
                finalBarcodeId = decodedText.split("?scan=")[1];
            }
        }

        finalBarcodeId = decodeURIComponent(finalBarcodeId);
        finalBarcodeId = finalBarcodeId.replace(/[^a-zA-Z0-9-]/g, "");

        try {
            const { data, error } = await supabase
                .from("inventory")
                .select("*")
                .eq("barcode_id", finalBarcodeId)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                setErrorMsg(`Item tidak ditemukan. (ID Terbaca: "${finalBarcodeId}")`);
                return;
            }

            addToCart({
                id: data.id,
                part_name: data.part_name,
                part_number: data.part_number,
                location: data.location,
                max_quantity: Number(data.quantity),
                barcode_id: data.barcode_id,
                is_bulk: data.is_bulk || false,
                uom: data.uom || "Pieces",
            });
        } catch (err) {
            console.error("System error:", err);
            setErrorMsg("Terjadi kesalahan sistem saat menghubungi database.");
        } finally {
            setIsLoading(false);
        }
    };

    // URL param scanner
    useEffect(() => {
        const timer = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const scannedBarcodeId = params.get("scan");
            if (scannedBarcodeId) {
                let cleanId = decodeURIComponent(scannedBarcodeId);
                cleanId = cleanId.replace(/[^a-zA-Z0-9-]/g, "");
                handleScanSuccess(cleanId);
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }, 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        isScanning,
        setIsScanning,
        isLoading,
        errorMsg,
        setErrorMsg,
        handleScanSuccess,
    };
};