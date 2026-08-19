"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { parseScannedId } from "@/lib/utils/parseScannedId";
import type { InventoryItem } from "../types";

export const useScanner = (onUpdateSuccess: () => void) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [itemData, setItemData] = useState<InventoryItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stokFisik, setStokFisik] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScanSuccess = async (decodedText: string) => {
    setIsScanning(false);
    setIsLoadingScan(true);
    setErrorMsg(null);
    setItemData(null);
    setStokFisik("");

    let finalId = parseScannedId(decodedText);

    try {
      // Step 1: try per-unit lookup (new QR labels encode inventory_units UUID)
      const { data: unit, error: unitError } = await supabase
        .from("inventory_units")
        .select("id, inventory_id, status")
        .eq("id", finalId)
        .maybeSingle();

      if (unitError) throw unitError;

      if (unit) {
        // Found in inventory_units — fetch the parent inventory item
        const { data: inv, error: invError } = await supabase
          .from("inventory")
          .select("*")
          .eq("id", unit.inventory_id)
          .maybeSingle();
        if (invError) throw invError;
        if (!inv) {
          setErrorMsg("Item tidak ditemukan untuk unit ini.");
          return;
        }
        setItemData(inv);
        return;
      }

      // No unit found — label tidak dikenal
      setErrorMsg(`QR Code tidak dikenal. Cetak ulang label menggunakan sistem baru.`);
    } catch (err) {
      console.error("Scanner error:", err);
      setErrorMsg("Terjadi kesalahan sistem.");
    } finally {
      setIsLoadingScan(false);
    }
  };

  const handleUpdateStok = async () => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
      alert("⚠️ Demo Mode — Update stok tidak tersedia di demo.");
      return;
    }
    if (!itemData) return;
    if (stokFisik === "" || stokFisik < 0) {
      alert("⚠️ Masukkan jumlah stok valid!");
      return;
    }
    setIsSubmitting(true);
    const qtySistem = Number(itemData.quantity);
    const qtyFisikReal = Number(stokFisik);
    const selisih = qtyFisikReal - qtySistem;

    try {
      const { error: errorUpdate } = await supabase
        .from("inventory")
        .update({ quantity: qtyFisikReal.toString() })
        .eq("id", itemData.id);
      if (errorUpdate) throw errorUpdate;

      if (selisih !== 0) {
        await supabase.from("transactions").insert([{
          inventory_id: itemData.id,
          part_name: itemData.part_name,
          part_number: itemData.part_number,
          nama_peminjam: "ADMIN (SO)",
          jumlah: selisih,
          transaction_type: "ADMIN_SO"
        }]);
      }
      alert(`✅ STOCK OPNAME BERHASIL!\nStok ${itemData.part_name} diperbarui menjadi ${qtyFisikReal}.`);
      resetScanTampilan();
      onUpdateSuccess();
    } catch (err) {
      console.error("Error update stok:", err);
      alert("❌ Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetScanTampilan = () => {
    setItemData(null);
    setErrorMsg(null);
    setIsScanning(false);
    setStokFisik("");
  };

  return {
    isScanning,
    setIsScanning,
    isLoadingScan,
    itemData,
    errorMsg,
    stokFisik,
    setStokFisik,
    isSubmitting,
    handleScanSuccess,
    handleUpdateStok,
    resetScanTampilan,
  };
};