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

        let finalId = decodedText;

        try {
            if (decodedText.startsWith("http")) {
                const urlObj = new URL(decodedText);
                finalId = urlObj.searchParams.get("scan") || decodedText;
            } else if (decodedText.includes("?scan=")) {
                finalId = decodedText.split("?scan=")[1];
            }
        } catch {
            if (decodedText.includes("?scan=")) {
                finalId = decodedText.split("?scan=")[1];
            }
        }

        finalId = decodeURIComponent(finalId).replace(/[^a-zA-Z0-9-]/g, "");

        try {
            // ponytail: try unit lookup first; fall back to barcode_id for old labels
            const { data: unit, error: unitError } = await supabase
                .from("inventory_units")
                .select("id, inventory_id, status")
                .eq("id", finalId)
                .maybeSingle();

            if (unitError) throw unitError;

            if (unit) {
                if (unit.status !== "available") {
                    setErrorMsg(`Unit ini sedang dipinjam atau sudah dikonsumsi. (ID: "${finalId}")`);
                    return;
                }
                const { data: inv, error: invError } = await supabase
                    .from("inventory")
                    .select("*")
                    .eq("id", unit.inventory_id)
                    .maybeSingle();
                if (invError) throw invError;
                if (!inv) {
                    setErrorMsg(`Item tidak ditemukan untuk unit ini. (ID: "${finalId}")`);
                    return;
                }
                addToCart({
                    id: inv.id,
                    part_name: inv.part_name,
                    part_number: inv.part_number,
                    location: inv.location,
                    max_quantity: Number(inv.quantity),
                    barcode_id: inv.barcode_id,
                    is_bulk: inv.is_bulk || false,
                    uom: inv.uom || "Pieces",
                    unit_id: unit.id,
                });
                return;
            }

            // Fallback: old barcode_id label
            const { data: invByBarcode, error: barcodeError } = await supabase
                .from("inventory")
                .select("*")
                .eq("barcode_id", finalId)
                .maybeSingle();

            if (barcodeError) throw barcodeError;
            if (!invByBarcode) {
                setErrorMsg(`Item tidak ditemukan. (ID Terbaca: "${finalId}")`);
                return;
            }

            addToCart({
                id: invByBarcode.id,
                part_name: invByBarcode.part_name,
                part_number: invByBarcode.part_number,
                location: invByBarcode.location,
                max_quantity: Number(invByBarcode.quantity),
                barcode_id: invByBarcode.barcode_id,
                is_bulk: invByBarcode.is_bulk || false,
                uom: invByBarcode.uom || "Pieces",
                // ponytail: no unit_id for old labels — checkout handles this gracefully
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
            const scannedId = params.get("scan");
            if (scannedId) {
                let cleanId = decodeURIComponent(scannedId).replace(/[^a-zA-Z0-9-]/g, "");
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
